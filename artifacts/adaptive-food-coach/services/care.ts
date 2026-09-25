import { api } from './api';
import { parseAllergies, parseHouseholdDraft } from '@/lib/careOnboarding';
import type { CareHouseholdState, CareMember } from '@/lib/careOnboarding';
import type { OnboardingState } from '@/types';

export async function fetchHousehold() {
  return api<{ household: { id: string; invite_code?: string; inviteCode?: string } | null; members: CareMember[]; actorMemberId: string | null }>('/care/household');
}

export async function bootstrapFromOnboarding(answers: OnboardingState['answers'], selfName: string) {
  const members = parseHouseholdDraft(answers.householdJson);
  const extraWhatsapp = typeof answers.whatsappExtra === 'string' && answers.whatsappExtra
    ? JSON.parse(answers.whatsappExtra) as { phone: string; memberIndex: number }[]
    : [];
  const nutritionistCode = typeof answers.nutritionistCode === 'string' && /^[A-Z0-9]{6,12}$/.test(answers.nutritionistCode)
    ? answers.nutritionistCode
    : undefined;
  const whatsappPhone = typeof answers.whatsappPhone === 'string' && answers.whatsappPhone.startsWith('+')
    ? answers.whatsappPhone
    : undefined;
  const remote = await api<{
    household: { id: string };
    members: CareMember[];
    actorMemberId?: string;
  }>('/care/household', {
    method: 'POST',
    body: {
      whoFor: answers.whoFor ?? 'self',
      selfName: selfName || 'You',
      householdName: selfName ? `${selfName}'s household` : 'Family',
      members: members.map((member) => ({
        displayName: member.name,
        relationship: member.relationship,
        ageBand: member.ageBand,
      })),
      proxyAll: answers.proxyAll !== 'no',
      whatsappPhone,
      extraWhatsapp,
      nutritionistCode,
      profile: {
        gender: typeof answers.gender === 'string' ? answers.gender : undefined,
        dateOfBirth: typeof answers.dob === 'string' ? answers.dob : undefined,
        heightCm: typeof answers.height === 'number' ? answers.height : undefined,
        weightKg: typeof answers.weight === 'number' ? answers.weight : undefined,
        targetWeightKg: typeof answers.targetWeight === 'number' ? answers.targetWeight : undefined,
        workoutFrequency: typeof answers.workout === 'string' ? answers.workout : undefined,
        goals: Array.isArray(answers.goals) ? answers.goals : undefined,
        dietPattern: typeof answers.diet === 'string' ? answers.diet : undefined,
        allergies: parseAllergies(answers.allergies),
        whoFor: typeof answers.whoFor === 'string' ? answers.whoFor : undefined,
        proxyConsent: answers.proxyAll !== 'no',
      },
    },
  });
  return {
    householdId: remote.household?.id,
    members: remote.members ?? [],
    actorMemberId: remote.actorMemberId,
    selectedMemberId: remote.actorMemberId ?? remote.members?.find((m) => m.isSelf)?.id,
  };
}

export async function createCareFoodEvent(input: {
  subjectMemberId: string;
  mealSlot?: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  caption?: string;
  foodName?: string;
  localDate?: string;
  context?: 'home' | 'restaurant' | 'unknown' | 'mess' | 'canteen' | 'delivery';
}) {
  return api('/care/food-events', { method: 'POST', body: input });
}
