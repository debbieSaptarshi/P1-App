import { indexToRoute } from '@/app/(onboarding)/_components/progress';
import type { OnboardingState } from '@/types';

export type AuthIntent = 'signup' | 'signin' | 'recovery';

/** Auth screens that must finish before AuthGate redirects away. */
export const AUTH_FLOW_SCREENS = new Set([
  'forgot-password',
  'verify-otp',
  'update-password',
  'reset-success',
]);

export const AUTH_ENTRY_SCREENS = new Set(['sign-in', 'register', 'splash', 'intro']);

let pendingAuthIntent: AuthIntent | null = null;

/** Call before sign-up, social auth, or OTP verify so AuthGate knows where to go next. */
export function setAuthIntent(intent: AuthIntent) {
  pendingAuthIntent = intent;
}

export function peekAuthIntent(): AuthIntent {
  return pendingAuthIntent ?? 'signin';
}

export function consumeAuthIntent(): AuthIntent {
  const intent = pendingAuthIntent ?? 'signin';
  pendingAuthIntent = null;
  return intent;
}

export function resolvePostAuthRoute(onboarding: OnboardingState, intent: AuthIntent): string {
  if (onboarding.complete) return '/(tabs)';
  if (intent === 'recovery') return '/(auth)/update-password';
  if (intent === 'signup') return '/(onboarding)/welcome';

  const resume = indexToRoute(onboarding.stepIndex);
  if (resume && onboarding.stepIndex > 0) {
    return `/(onboarding)/${resume}`;
  }
  return '/(onboarding)/welcome';
}

export function isCurrentRoute(parts: string[], href: string): boolean {
  const target = href.split('/').filter(Boolean);
  return target.length === parts.length && target.every((segment, index) => segment === parts[index]);
}
