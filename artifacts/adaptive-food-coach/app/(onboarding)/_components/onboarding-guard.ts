/** Briefly skip the anti-skip layout guard after intentional forward navigation. */
let suppressUntil = 0;

export function suppressOnboardingGuard(ms = 600) {
  suppressUntil = Date.now() + ms;
}

export function isOnboardingGuardSuppressed() {
  return Date.now() < suppressUntil;
}
