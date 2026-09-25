export type WhoFor = 'self' | 'family' | 'caregiver';
export type FamilyRelationship = 'spouse' | 'parent' | 'child' | 'sibling' | 'other';
export type AgeBand = 'child' | 'teen' | 'adult' | 'older_adult';

export interface HouseholdDraftMember {
  name: string;
  relationship: FamilyRelationship;
  ageBand: AgeBand;
}

export interface CareMember {
  id: string;
  displayName: string;
  relationship: string;
  isSelf?: boolean;
  authUserId?: string | null;
}

export interface CareHouseholdState {
  householdId?: string;
  inviteCode?: string;
  members: CareMember[];
  selectedMemberId?: string;
  actorMemberId?: string | null;
}

export function parseHouseholdDraft(raw: unknown): HouseholdDraftMember[] {
  if (typeof raw !== 'string' || !raw) return [];
  try {
    const parsed = JSON.parse(raw) as HouseholdDraftMember[];
    return Array.isArray(parsed) ? parsed.filter((row) => row?.name) : [];
  } catch {
    return [];
  }
}

export function parseAllergies(raw: unknown): string[] {
  if (Array.isArray(raw)) return raw.filter((item): item is string => typeof item === 'string');
  if (typeof raw === 'string' && raw) return raw.split(',').map((item) => item.trim()).filter(Boolean);
  return [];
}
