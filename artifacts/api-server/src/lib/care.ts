import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
import { admin, dbError } from './supabase';
import { HttpError } from './errors';
import type { BootstrapHousehold, CreateFoodEvent, MemberProfileInput } from '@workspace/backend-contracts';

export function inviteCode() {
  return randomBytes(4).toString('hex').toUpperCase();
}

export function toWaId(phone: string) {
  return phone.replace(/^\+/, '').replace(/\D/g, '');
}

export function toE164(input: string) {
  const digits = input.replace(/\D/g, '');
  if (digits.length < 8 || digits.length > 15) throw new HttpError(400, 'INVALID_PHONE', 'Use an international phone number.');
  return `+${digits}`;
}

type MemberRow = {
  id: string;
  household_id: string;
  auth_user_id: string | null;
  display_name: string;
  relationship: string;
  age_band: string | null;
  is_self: boolean;
};

type HouseholdRow = { id: string; name: string; invite_code: string; created_by: string | null };

export async function memberForUser(userId: string) {
  const { data, error } = await admin().from('members').select('*').eq('auth_user_id', userId).maybeSingle();
  dbError(error);
  return data as MemberRow | null;
}

export async function membershipForUser(userId: string) {
  const { data, error } = await admin().from('household_memberships').select('*').eq('user_id', userId).maybeSingle();
  dbError(error);
  return data as { household_id: string; user_id: string; role: string } | null;
}

export async function requireMember(userId: string) {
  const member = await memberForUser(userId);
  if (!member) throw new HttpError(404, 'HOUSEHOLD_REQUIRED', 'Finish household setup first.');
  return member;
}

export async function isNutritionistFor(userId: string, householdId: string) {
  const { data, error } = await admin()
    .from('nutritionist_assignments')
    .select('household_id')
    .eq('nutritionist_user_id', userId)
    .eq('household_id', householdId)
    .maybeSingle();
  dbError(error);
  return Boolean(data);
}

export async function requireHouseholdAccess(userId: string, householdId: string) {
  const membership = await membershipForUser(userId);
  if (membership?.household_id === householdId) return { kind: 'member' as const, membership };
  if (await isNutritionistFor(userId, householdId)) return { kind: 'nutritionist' as const };
  throw new HttpError(403, 'FORBIDDEN', 'You do not have access to this household.');
}

export async function canLogFor(actor: MemberRow, subjectId: string) {
  if (actor.id === subjectId) return true;
  const { data, error } = await admin()
    .from('proxy_permissions')
    .select('granted')
    .eq('actor_member_id', actor.id)
    .eq('subject_member_id', subjectId)
    .eq('granted', true)
    .maybeSingle();
  dbError(error);
  return Boolean(data);
}

export async function requireCanLog(userId: string, subjectId: string) {
  const actor = await requireMember(userId);
  const { data: subject, error } = await admin().from('members').select('*').eq('id', subjectId).maybeSingle();
  dbError(error);
  if (!subject) throw new HttpError(404, 'NOT_FOUND', 'That person was not found.');
  if (subject.household_id !== actor.household_id) throw new HttpError(403, 'FORBIDDEN', 'You can only log for people in your household.');
  if (!(await canLogFor(actor, subjectId))) {
    throw new HttpError(403, 'PROXY_DENIED', 'You do not have permission to log for this person.');
  }
  return { actor, subject: subject as MemberRow };
}

export async function householdMembers(householdId: string) {
  const { data, error } = await admin().from('members').select('*').eq('household_id', householdId).order('created_at');
  dbError(error);
  return (data ?? []) as MemberRow[];
}

async function grantAllProxy(householdId: string, members: MemberRow[]) {
  const rows = [];
  for (const actor of members) {
    for (const subject of members) {
      if (actor.id === subject.id) continue;
      rows.push({
        household_id: householdId,
        actor_member_id: actor.id,
        subject_member_id: subject.id,
        granted: true,
      });
    }
  }
  if (!rows.length) return;
  const { error } = await admin().from('proxy_permissions').upsert(rows, { onConflict: 'actor_member_id,subject_member_id' });
  dbError(error);
}

async function upsertWhatsapp(memberId: string, phone: string, defaultSubjectId?: string) {
  const e164 = phone.startsWith('+') ? phone : toE164(phone);
  const waId = toWaId(e164);
  const { error } = await admin().from('whatsapp_identities').upsert(
    { wa_id: waId, phone_e164: e164, member_id: memberId, default_subject_member_id: defaultSubjectId ?? memberId },
    { onConflict: 'wa_id' },
  );
  dbError(error);
}

async function saveProfile(memberId: string, profile?: MemberProfileInput, whoFor?: string, proxyConsent?: boolean) {
  if (!profile && !whoFor && proxyConsent == null) return;
  const { error } = await admin().from('member_profiles').upsert({
    member_id: memberId,
    gender: profile?.gender ?? null,
    date_of_birth: profile?.dateOfBirth ?? null,
    height_cm: profile?.heightCm ?? null,
    weight_kg: profile?.weightKg ?? null,
    target_weight_kg: profile?.targetWeightKg ?? null,
    workout_frequency: profile?.workoutFrequency ?? null,
    goals: profile?.goals ?? [],
    diet_pattern: profile?.dietPattern ?? null,
    allergies: profile?.allergies ?? [],
    who_for: profile?.whoFor ?? whoFor ?? null,
    proxy_consent: profile?.proxyConsent ?? proxyConsent ?? false,
    updated_at: new Date().toISOString(),
  });
  dbError(error);
}

async function assignNutritionist(householdId: string, code?: string) {
  if (!code) return null;
  const { data, error } = await admin().from('nutritionist_profiles').select('*').eq('invite_code', code).maybeSingle();
  dbError(error);
  if (!data) throw new HttpError(404, 'NUTRITIONIST_NOT_FOUND', 'That nutritionist invite code is not valid.');
  const assigned = await admin().from('nutritionist_assignments').upsert(
    { nutritionist_user_id: data.user_id, household_id: householdId },
    { onConflict: 'nutritionist_user_id,household_id' },
  );
  dbError(assigned.error);
  return data as { user_id: string; display_name: string; invite_code: string };
}

export async function householdSnapshot(householdId: string) {
  const { data: household, error } = await admin().from('households').select('*').eq('id', householdId).single();
  dbError(error);
  const members = await householdMembers(householdId);
  const { data: proxies, error: proxyError } = await admin().from('proxy_permissions').select('*').eq('household_id', householdId);
  dbError(proxyError);
  const { data: phones, error: phoneError } = await admin().from('whatsapp_identities').select('*').in('member_id', members.map((m) => m.id).concat(['00000000-0000-0000-0000-000000000000']));
  dbError(phoneError);
  const { data: assignment, error: assignError } = await admin()
    .from('nutritionist_assignments')
    .select('nutritionist_user_id, consented_at, nutritionist_profiles(display_name, invite_code)')
    .eq('household_id', householdId)
    .maybeSingle();
  dbError(assignError);
  return {
    household: household as HouseholdRow,
    members: members.map((m) => ({
      id: m.id,
      displayName: m.display_name,
      relationship: m.relationship,
      ageBand: m.age_band,
      isSelf: m.is_self,
      authUserId: m.auth_user_id,
      whatsapp: (phones ?? []).filter((p: { member_id: string }) => p.member_id === m.id).map((p: { phone_e164: string; wa_id: string; default_subject_member_id: string | null }) => ({
        phone: p.phone_e164,
        waId: p.wa_id,
        defaultSubjectMemberId: p.default_subject_member_id,
      })),
    })),
    proxies: (proxies ?? []).map((p: { actor_member_id: string; subject_member_id: string; granted: boolean }) => ({
      actorMemberId: p.actor_member_id,
      subjectMemberId: p.subject_member_id,
      granted: p.granted,
    })),
    nutritionist: assignment
      ? {
          userId: assignment.nutritionist_user_id,
          displayName: (assignment as { nutritionist_profiles?: { display_name?: string } }).nutritionist_profiles?.display_name,
        }
      : null,
  };
}

export async function snapshotForUser(userId: string) {
  const membership = await membershipForUser(userId);
  if (!membership) return { household: null, members: [], proxies: [], nutritionist: null, actorMemberId: null };
  const snap = await householdSnapshot(membership.household_id);
  const actor = snap.members.find((m) => m.authUserId === userId) ?? null;
  return { ...snap, actorMemberId: actor?.id ?? null };
}

export async function bootstrapHousehold(userId: string, input: BootstrapHousehold) {
  const existing = await membershipForUser(userId);
  if (existing) {
    if (input.nutritionistCode) await assignNutritionist(existing.household_id, input.nutritionistCode);
    const actor = await requireMember(userId);
    await saveProfile(actor.id, input.profile, input.whoFor, input.proxyAll);
    return { ...await householdSnapshot(existing.household_id), actorMemberId: actor.id };
  }
  const name = input.householdName?.trim() || input.selfName?.trim() || 'Family';
  const { data: household, error } = await admin()
    .from('households')
    .insert({ name, invite_code: inviteCode(), created_by: userId })
    .select('*')
    .single();
  dbError(error);
  const householdId = household.id as string;
  const { data: self, error: selfError } = await admin()
    .from('members')
    .insert({
      household_id: householdId,
      auth_user_id: userId,
      display_name: input.selfName?.trim() || 'You',
      relationship: 'self',
      age_band: 'adult',
      is_self: true,
    })
    .select('*')
    .single();
  dbError(selfError);
  const membership = await admin().from('household_memberships').insert({ household_id: householdId, user_id: userId, role: 'owner' });
  dbError(membership.error);
  const extra = [];
  for (const member of input.members) {
    const { data, error: memberError } = await admin()
      .from('members')
      .insert({
        household_id: householdId,
        display_name: member.displayName,
        relationship: member.relationship,
        age_band: member.ageBand ?? 'adult',
        is_self: false,
      })
      .select('*')
      .single();
    dbError(memberError);
    extra.push(data as MemberRow);
    if (member.whatsappPhone) await upsertWhatsapp(data.id, member.whatsappPhone, data.id);
  }
  const all = [self as MemberRow, ...extra];
  if (input.proxyAll && all.length > 1) await grantAllProxy(householdId, all);
  if (input.whatsappPhone) await upsertWhatsapp(self.id, input.whatsappPhone, extra.length === 1 && input.whoFor === 'caregiver' ? extra[0].id : self.id);
  for (const extraPhone of input.extraWhatsapp) {
    const target = extra[extraPhone.memberIndex];
    if (target) await upsertWhatsapp(target.id, extraPhone.phone, target.id);
  }
  await saveProfile(self.id, input.profile, input.whoFor, input.proxyAll);
  await assignNutritionist(householdId, input.nutritionistCode);
  const snap = await householdSnapshot(householdId);
  return { ...snap, actorMemberId: self.id };
}

export async function joinHousehold(userId: string, code: string) {
  const existing = await membershipForUser(userId);
  if (existing) throw new HttpError(409, 'ALREADY_IN_HOUSEHOLD', 'You already belong to a household.');
  const { data: household, error } = await admin().from('households').select('*').eq('invite_code', code).maybeSingle();
  dbError(error);
  if (!household) throw new HttpError(404, 'NOT_FOUND', 'That household invite code is not valid.');
  const { data: member, error: memberError } = await admin()
    .from('members')
    .insert({
      household_id: household.id,
      auth_user_id: userId,
      display_name: 'Member',
      relationship: 'other',
      age_band: 'adult',
      is_self: false,
    })
    .select('*')
    .single();
  dbError(memberError);
  const membership = await admin().from('household_memberships').insert({ household_id: household.id, user_id: userId, role: 'member' });
  dbError(membership.error);
  const members = await householdMembers(household.id);
  await grantAllProxy(household.id, members);
  return { ...await householdSnapshot(household.id), actorMemberId: member.id };
}

export async function replaceProxies(userId: string, pairs: { actorMemberId: string; subjectMemberId: string; granted: boolean }[]) {
  const actor = await requireMember(userId);
  const membership = await membershipForUser(userId);
  if (membership?.role !== 'owner') throw new HttpError(403, 'FORBIDDEN', 'Only the household owner can change who logs for whom.');
  const members = await householdMembers(actor.household_id);
  const ids = new Set(members.map((m) => m.id));
  for (const pair of pairs) {
    if (!ids.has(pair.actorMemberId) || !ids.has(pair.subjectMemberId) || pair.actorMemberId === pair.subjectMemberId) {
      throw new HttpError(400, 'INVALID_PROXY', 'Proxy rules must stay inside the household.');
    }
  }
  const { error: delError } = await admin().from('proxy_permissions').delete().eq('household_id', actor.household_id);
  dbError(delError);
  if (pairs.length) {
    const { error } = await admin().from('proxy_permissions').insert(
      pairs.map((p) => ({
        household_id: actor.household_id,
        actor_member_id: p.actorMemberId,
        subject_member_id: p.subjectMemberId,
        granted: p.granted,
      })),
    );
    dbError(error);
  }
  return householdSnapshot(actor.household_id);
}

export async function createFoodEvent(userId: string, input: CreateFoodEvent, channel: 'app' | 'nutritionist' = 'app') {
  let actor: MemberRow;
  let subject: MemberRow;
  if (channel === 'nutritionist') {
    const { data, error } = await admin().from('members').select('*').eq('id', input.subjectMemberId).maybeSingle();
    dbError(error);
    if (!data) throw new HttpError(404, 'NOT_FOUND', 'That person was not found.');
    subject = data as MemberRow;
    if (!(await isNutritionistFor(userId, subject.household_id))) {
      throw new HttpError(403, 'FORBIDDEN', 'You are not assigned to this household.');
    }
    actor = subject;
  } else {
    const access = await requireCanLog(userId, input.subjectMemberId);
    actor = access.actor;
    subject = access.subject;
  }
  const localDate = input.localDate ?? new Date().toISOString().slice(0, 10);
  const { data, error } = await admin()
    .from('food_events')
    .insert({
      household_id: subject.household_id,
      subject_member_id: subject.id,
      logged_by_member_id: actor.id,
      channel,
      local_date: localDate,
      meal_slot: input.mealSlot ?? null,
      caption: input.caption ?? input.foodName ?? null,
      context: input.context ?? null,
      media_path: input.mediaPath ?? null,
      media_type: input.mediaType ?? null,
      review_status: 'received',
    })
    .select('*')
    .single();
  dbError(error);
  return mapFoodEvent(data, actor, subject);
}

function mapFoodEvent(row: Record<string, unknown>, actor?: MemberRow | { display_name: string; id: string }, subject?: MemberRow | { display_name: string; id: string }) {
  return {
    id: row.id,
    householdId: row.household_id,
    subjectMemberId: row.subject_member_id,
    loggedByMemberId: row.logged_by_member_id,
    subjectName: subject?.display_name,
    loggedByName: actor?.display_name,
    channel: row.channel,
    capturedAt: row.captured_at,
    localDate: row.local_date,
    mealSlot: row.meal_slot,
    caption: row.caption,
    context: row.context,
    mediaPath: row.media_path,
    mediaType: row.media_type,
    reviewStatus: row.review_status,
    signals: row.signals,
  };
}

export async function latestFoodEventForMember(memberId: string) {
  const { data, error } = await admin()
    .from('food_events')
    .select('*')
    .eq('logged_by_member_id', memberId)
    .order('captured_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  dbError(error);
  return data as Record<string, unknown> | null;
}

export async function applyFoodEventCorrection(eventId: string, patch: { context?: string; extraOilTsp?: number }) {
  const existing = await admin().from('food_events').select('signals').eq('id', eventId).maybeSingle();
  dbError(existing.error);
  const prior = existing.data?.signals && typeof existing.data.signals === 'object' && !Array.isArray(existing.data.signals)
    ? existing.data.signals as Record<string, unknown>
    : {};
  const signals = patch.extraOilTsp === undefined ? prior : { ...prior, extraOilTsp: patch.extraOilTsp };
  const update: Record<string, unknown> = { signals };
  if (patch.context) update.context = patch.context;
  const { error } = await admin().from('food_events').update(update).eq('id', eventId);
  dbError(error);
}

export async function listFoodEvents(householdId: string, date?: string, subjectMemberId?: string) {
  let query = admin().from('food_events').select('*').eq('household_id', householdId).order('captured_at', { ascending: false });
  if (date) query = query.eq('local_date', date);
  if (subjectMemberId) query = query.eq('subject_member_id', subjectMemberId);
  const { data, error } = await query.limit(200);
  dbError(error);
  const members = await householdMembers(householdId);
  const byId = new Map(members.map((m) => [m.id, m]));
  return (data ?? []).map((row) => mapFoodEvent(row, byId.get(row.logged_by_member_id as string), byId.get(row.subject_member_id as string)));
}

export async function addFoodEventNote(userId: string, householdId: string, body: string, foodEventId?: string, localDate?: string) {
  await requireHouseholdAccess(userId, householdId);
  if (!foodEventId && !localDate) throw new HttpError(400, 'NOTE_TARGET', 'Attach the note to a meal or a day.');
  const { data, error } = await admin()
    .from('food_event_notes')
    .insert({
      household_id: householdId,
      food_event_id: foodEventId ?? null,
      local_date: localDate ?? null,
      author_user_id: userId,
      body,
    })
    .select('*')
    .single();
  dbError(error);
  return data;
}

export function mapFoodEventNote(row: Record<string, unknown>) {
  return {
    id: row.id,
    householdId: row.household_id,
    foodEventId: row.food_event_id,
    localDate: row.local_date,
    authorUserId: row.author_user_id,
    body: row.body,
    createdAt: row.created_at,
  };
}

type FoodEventRow = {
  id: string;
  household_id: string;
  local_date: string;
  review_status: string;
};

export async function requireNutritionistFoodEvent(userId: string, eventId: string) {
  const { data, error } = await admin().from('food_events').select('*').eq('id', eventId).maybeSingle();
  dbError(error);
  if (!data) throw new HttpError(404, 'NOT_FOUND', 'That meal was not found.');
  const event = data as FoodEventRow;
  if (!(await isNutritionistFor(userId, event.household_id))) {
    throw new HttpError(403, 'FORBIDDEN', 'You are not assigned to this household.');
  }
  return event;
}

export async function setFoodEventReviewStatus(eventId: string, status: 'received' | 'needs_subject' | 'reviewed' | 'flagged') {
  const { error } = await admin().from('food_events').update({ review_status: status }).eq('id', eventId);
  dbError(error);
}

export async function listNotes(householdId: string, date?: string) {
  let query = admin().from('food_event_notes').select('*').eq('household_id', householdId).order('created_at', { ascending: false });
  if (date) query = query.eq('local_date', date);
  const { data, error } = await query.limit(100);
  dbError(error);
  return data ?? [];
}

export async function nutritionistHouseholds(userId: string, date = new Date().toISOString().slice(0, 10)) {
  const { data: profile, error: profileError } = await admin().from('nutritionist_profiles').select('*').eq('user_id', userId).maybeSingle();
  dbError(profileError);
  if (!profile) throw new HttpError(403, 'NOT_NUTRITIONIST', 'Create a nutritionist profile first.');
  const { data, error } = await admin()
    .from('nutritionist_assignments')
    .select('household_id, consented_at, households(id, name, invite_code)')
    .eq('nutritionist_user_id', userId);
  dbError(error);
  const households = [];
  for (const row of data ?? []) {
    const householdId = row.household_id as string;
    const members = await householdMembers(householdId);
    const { count, error: countError } = await admin()
      .from('food_events')
      .select('id', { count: 'exact', head: true })
      .eq('household_id', householdId)
      .eq('local_date', date);
    dbError(countError);
    const { count: pendingCount, error: pendingError } = await admin()
      .from('food_events')
      .select('id', { count: 'exact', head: true })
      .eq('household_id', householdId)
      .eq('review_status', 'needs_subject');
    dbError(pendingError);
    households.push({
      id: householdId,
      name: (row as { households?: { name?: string; invite_code?: string } }).households?.name ?? 'Household',
      inviteCode: (row as { households?: { invite_code?: string } }).households?.invite_code,
      members: members.map((m) => ({ id: m.id, displayName: m.display_name, relationship: m.relationship })),
      mealsToday: count ?? 0,
      needsSubject: pendingCount ?? 0,
    });
  }
  return { profile, households };
}

export async function nutritionistQueue(userId: string, date: string) {
  const { profile, households } = await nutritionistHouseholds(userId, date);
  const eventLists = await Promise.all(households.map((household) => listFoodEvents(household.id, date)));
  const events = eventLists.flat();
  const weekday = new Date(`${date}T00:00:00.000Z`).getUTCDay();
  return {
    date,
    profile,
    households,
    needsYou: events.filter((event) => event.reviewStatus === 'needs_subject'),
    newMeals: events.filter((event) => event.reviewStatus !== 'needs_subject'),
    quiet: households
      .filter((household) => household.mealsToday === 0)
      .map((household) => ({
        householdId: household.id,
        householdName: household.name,
        members: household.members,
      })),
    reviewsDue: weekday === 0 || weekday === 6,
  };
}

export async function upsertNutritionistProfile(userId: string, displayName: string) {
  const existing = await admin().from('nutritionist_profiles').select('*').eq('user_id', userId).maybeSingle();
  dbError(existing.error);
  if (existing.data) {
    const { data, error } = await admin().from('nutritionist_profiles').update({ display_name: displayName }).eq('user_id', userId).select('*').single();
    dbError(error);
    return data;
  }
  const { data, error } = await admin()
    .from('nutritionist_profiles')
    .insert({ user_id: userId, display_name: displayName, invite_code: inviteCode() })
    .select('*')
    .single();
  dbError(error);
  return data;
}

export async function identityByWaId(waId: string) {
  const { data, error } = await admin().from('whatsapp_identities').select('*').eq('wa_id', waId).maybeSingle();
  dbError(error);
  return data as { wa_id: string; phone_e164: string; member_id: string; default_subject_member_id: string | null } | null;
}

export async function createWhatsappFoodEvent(input: {
  actorMemberId: string;
  subjectMemberId: string;
  caption?: string;
  mediaPath?: string;
  mediaType?: string;
  waMessageId: string;
}) {
  const { data: actor, error: actorError } = await admin().from('members').select('*').eq('id', input.actorMemberId).maybeSingle();
  dbError(actorError);
  const { data: subject, error: subjectError } = await admin().from('members').select('*').eq('id', input.subjectMemberId).maybeSingle();
  dbError(subjectError);
  if (!actor || !subject) throw new HttpError(404, 'NOT_FOUND', 'That person was not found.');
  if (actor.household_id !== subject.household_id) throw new HttpError(403, 'FORBIDDEN', 'Household mismatch.');
  if (actor.id !== subject.id) {
    const { data: proxy, error: proxyError } = await admin()
      .from('proxy_permissions')
      .select('granted')
      .eq('actor_member_id', actor.id)
      .eq('subject_member_id', subject.id)
      .eq('granted', true)
      .maybeSingle();
    dbError(proxyError);
    if (!proxy) throw new HttpError(403, 'PROXY_DENIED', 'This number cannot log for that person.');
  }
  const { data: event, error } = await admin()
    .from('food_events')
    .insert({
      household_id: subject.household_id,
      subject_member_id: subject.id,
      logged_by_member_id: actor.id,
      channel: 'whatsapp',
      local_date: new Date().toISOString().slice(0, 10),
      caption: input.caption ?? null,
      media_path: input.mediaPath ?? null,
      media_type: input.mediaType ?? null,
      review_status: 'received',
    })
    .select('*')
    .single();
  dbError(error);
  await admin().from('whatsapp_messages').upsert({ wa_message_id: input.waMessageId, food_event_id: event.id });
  return { event, actor: actor as MemberRow, subject: subject as MemberRow };
}

export async function savePendingWhatsapp(input: {
  waId: string;
  memberId: string;
  mediaId?: string;
  caption?: string;
  mediaPath?: string;
  mediaType?: string;
  waMessageId: string;
}) {
  const { data, error } = await admin()
    .from('whatsapp_pending')
    .insert({
      wa_id: input.waId,
      member_id: input.memberId,
      media_id: input.mediaId ?? null,
      caption: input.caption ?? null,
      media_path: input.mediaPath ?? null,
      media_type: input.mediaType ?? null,
    })
    .select('*')
    .single();
  dbError(error);
  await admin().from('whatsapp_messages').upsert({ wa_message_id: input.waMessageId, pending_id: data.id });
  return data;
}

export async function latestPending(waId: string) {
  const { data, error } = await admin().from('whatsapp_pending').select('*').eq('wa_id', waId).order('created_at', { ascending: false }).limit(1).maybeSingle();
  dbError(error);
  return data as {
    id: string;
    wa_id: string;
    member_id: string;
    media_id: string | null;
    caption: string | null;
    media_path: string | null;
    media_type: string | null;
  } | null;
}

export async function consumePending(id: string) {
  const { error } = await admin().from('whatsapp_pending').delete().eq('id', id);
  dbError(error);
}

export async function seenWhatsappMessage(id: string) {
  const { data, error } = await admin().from('whatsapp_messages').select('wa_message_id').eq('wa_message_id', id).maybeSingle();
  dbError(error);
  return Boolean(data);
}

export function verifyWhatsappSignature(rawBody: Buffer, header: string | undefined, secret: string) {
  if (!header?.startsWith('sha256=')) return false;
  const expected = createHmac('sha256', secret).update(rawBody).digest('hex');
  const actual = header.slice('sha256='.length);
  const a = Buffer.from(expected, 'utf8');
  const b = Buffer.from(actual, 'utf8');
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function sendWhatsapp(to: string, payload: Record<string, unknown>) {
  const token = process.env.WHATSAPP_TOKEN;
  const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const version = process.env.WHATSAPP_API_VERSION ?? 'v21.0';
  if (!token || !phoneId) return;
  await fetch(`https://graph.facebook.com/${version}/${phoneId}/messages`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ messaging_product: 'whatsapp', to, ...payload }),
  });
}

export async function downloadWhatsappMedia(mediaId: string) {
  const token = process.env.WHATSAPP_TOKEN;
  const version = process.env.WHATSAPP_API_VERSION ?? 'v21.0';
  if (!token) return null;
  const meta = await fetch(`https://graph.facebook.com/${version}/${mediaId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!meta.ok) return null;
  const info = await meta.json() as { url?: string; mime_type?: string };
  if (!info.url) return null;
  const file = await fetch(info.url, { headers: { Authorization: `Bearer ${token}` } });
  if (!file.ok) return null;
  const buffer = Buffer.from(await file.arrayBuffer());
  const path = `whatsapp/${mediaId}`;
  const { error } = await admin().storage.from('meal-media').upload(path, buffer, {
    contentType: info.mime_type ?? 'image/jpeg',
    upsert: true,
  });
  if (error) return { path: `whatsapp:${mediaId}`, mediaType: info.mime_type };
  return { path, mediaType: info.mime_type };
}
