/**
 * Helpers for the public group-member profile route.
 * Keep ids URL-safe and stable across posts, leaderboard, and the signed-in user.
 */

export function profileIdFromName(name: string): string {
  const slug = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return slug || 'member';
}

export function groupProfileHref(userId: string): `/group/profile/${string}` {
  return `/group/profile/${userId}`;
}

export function nameFromProfileId(userId: string): string {
  return decodeURIComponent(userId)
    .replace(/^name:/, '')
    .replace(/[-_]+/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
}
