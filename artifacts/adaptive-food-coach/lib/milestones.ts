import { seedMilestones } from '@/hooks/seedContent';
import { localDate } from '@/services/dates';
import type { DailyFoodLog, MilestoneBadge } from '@/types';

export function streakFromLogs(logs: DailyFoodLog[]) {
  const logged = new Set(
    logs.filter((log) => log.entries.length > 0).map((log) => log.date),
  );
  if (logged.size === 0) return { current: 0, longest: 0, startedOn: null as string | null };

  const today = localDate();
  const yesterday = localDate(new Date(Date.now() - 86400000));
  let cursor = logged.has(today) ? today : yesterday;
  const lastDay = cursor;
  let current = 0;
  while (logged.has(cursor)) {
    current += 1;
    const [y, m, d] = cursor.split('-').map(Number);
    cursor = localDate(new Date(y, m - 1, d - 1));
  }

  const sorted = [...logged].sort();
  let longest = 1;
  let run = 1;
  for (let i = 1; i < sorted.length; i += 1) {
    const prev = new Date(`${sorted[i - 1]}T00:00:00`);
    const next = new Date(`${sorted[i]}T00:00:00`);
    const diff = (next.getTime() - prev.getTime()) / 86400000;
    run = diff === 1 ? run + 1 : 1;
    if (run > longest) longest = run;
  }

  return {
    current,
    longest: Math.max(longest, current),
    startedOn: current > 0 ? shiftDate(lastDay, -(current - 1)) : null,
  };
}

export function mergeMilestoneCatalog(live: MilestoneBadge[]): MilestoneBadge[] {
  const byId = new Map(live.map((item) => [item.id, item]));
  return seedMilestones.map((seed) => {
    const existing = byId.get(seed.id);
    if (!existing) return seed;
    return {
      ...seed,
      ...existing,
      face: seed.face,
      title: seed.title,
      description: seed.description,
    };
  });
}

export function formatStartedOn(isoDate: string | null | undefined) {
  if (!isoDate) return null;
  const date = isoDate.includes('T') ? new Date(isoDate) : new Date(`${isoDate}T00:00:00`);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

export function featuredEarnedBadges(catalog: MilestoneBadge[], ids?: string[], limit = 3) {
  const byId = new Map(catalog.map((badge) => [badge.id, badge]));
  const preferred = ids?.length ? ids : ['ms_1', 'ms_17', 'ms_36'];
  const fromIds = preferred
    .map((id) => byId.get(id))
    .filter((badge): badge is MilestoneBadge => Boolean(badge));
  if (fromIds.length >= limit) {
    return fromIds.slice(0, limit).map((badge) => ({ ...badge, unlocked: true }));
  }

  const unlocked = catalog.filter((badge) => badge.unlocked);
  const merged: MilestoneBadge[] = [];
  const seen = new Set<string>();
  for (const badge of [...fromIds, ...unlocked]) {
    if (seen.has(badge.id)) continue;
    seen.add(badge.id);
    merged.push({ ...badge, unlocked: true });
    if (merged.length >= limit) break;
  }
  return merged;
}

export function shareCaption(dayStreak: number, startedLabel: string | null) {
  return `${dayStreak} Day Streak${startedLabel ? ` · Started on ${startedLabel}` : ''} on Adaptive Food Coach`;
}

export function badgeShareCaption(badge: MilestoneBadge, unlockedLabel: string | null) {
  if (badge.unlocked && unlockedLabel) {
    return `I unlocked ${badge.title} (${badge.description}) on ${unlockedLabel} on Adaptive Food Coach`;
  }
  return `Working toward ${badge.title} · ${badge.description} on Adaptive Food Coach`;
}

export function encouragementFor(badge: MilestoneBadge) {
  switch (badge.category) {
    case 'streak':
      return "You're laying the foundation. Bite by bite.";
    case 'nutrition':
      return 'Small plates. Big progress.';
    case 'exercise':
      return 'Show up. Sweat. Repeat.';
    case 'community':
      return 'Wins are better shared.';
  }
}

function shiftDate(isoDate: string, days: number) {
  const [y, m, d] = isoDate.split('-').map(Number);
  return localDate(new Date(y, m - 1, d + days));
}
