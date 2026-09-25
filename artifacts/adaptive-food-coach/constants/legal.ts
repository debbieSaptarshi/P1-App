import { Linking } from 'react-native';

export const MIN_AGE_YEARS = 18;
export const BUNDLE_ID = 'com.sevenlabs.adaptivefoodcoach';
export const SUPPORT_EMAIL =
  process.env.EXPO_PUBLIC_SUPPORT_EMAIL?.trim() || 'support@sevenlabs.app';

function apiOrigin(): string {
  return (process.env.EXPO_PUBLIC_API_URL ?? '').replace(/\/$/, '');
}

function resolveUrl(override: string | undefined, path: string): string {
  const explicit = override?.trim();
  if (explicit) return explicit;
  const origin = apiOrigin();
  return origin ? `${origin}${path}` : '';
}

export const legalUrls = {
  privacy: resolveUrl(process.env.EXPO_PUBLIC_PRIVACY_URL, '/legal/privacy'),
  terms: resolveUrl(process.env.EXPO_PUBLIC_TERMS_URL, '/legal/terms'),
  deletion: resolveUrl(process.env.EXPO_PUBLIC_DELETION_URL, '/legal/delete-account'),
  support: process.env.EXPO_PUBLIC_SUPPORT_URL?.trim() || `mailto:${SUPPORT_EMAIL}`,
};

export const facebookLoginEnabled =
  process.env.EXPO_PUBLIC_ENABLE_FACEBOOK === 'true';

export function ageFromIsoDate(iso: string, now = new Date()): number {
  const [year, month, day] = iso.split('-').map(Number);
  if (!year || !month || !day) return 0;
  let age = now.getFullYear() - year;
  const monthDiff = now.getMonth() + 1 - month;
  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < day)) age -= 1;
  return age;
}

export function isOldEnough(iso: string, now = new Date()): boolean {
  return ageFromIsoDate(iso, now) >= MIN_AGE_YEARS;
}

export async function openLegalUrl(url: string): Promise<void> {
  if (!url) return;
  await Linking.openURL(url);
}
