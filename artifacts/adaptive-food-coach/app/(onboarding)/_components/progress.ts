export const ONBOARDING_FLOW = [
  'step-gender',
  'step-workout',
  'step-height',
  'step-dob',
  'step-goals',
  'step-target-weight',
  'step-barriers',
  'step-diet',
  'step-accomplish',
  'generating-plan',
  'complete',
] as const;

export type OnboardingRoute = (typeof ONBOARDING_FLOW)[number];

export const ROUTE_TO_INDEX: Record<string, number> = Object.fromEntries(
  ONBOARDING_FLOW.map((route, index) => [route, index]),
);

export function progressFor(route: string) {
  const index = ROUTE_TO_INDEX[route];
  if (index == null) return 0;
  return (index + 1) / ONBOARDING_FLOW.length;
}

export function indexToRoute(index: number): OnboardingRoute | null {
  return ONBOARDING_FLOW[index] ?? null;
}

export const ONBOARDING_ROUTE_SET = new Set<string>([
  'welcome',
  'step-weight',
  ...ONBOARDING_FLOW,
]);
