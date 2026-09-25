import { useRouter } from 'expo-router';
import type { OnboardingState } from '@/types';
import type { appStoreActions } from '@/hooks/useAppStore';
import { indexToRoute, ROUTE_TO_INDEX, type OnboardingRoute } from './progress';
import { suppressOnboardingGuard } from './onboarding-guard';

type Actions = Pick<typeof appStoreActions, 'advanceOnboarding'>;
type OnboardingRouter = ReturnType<typeof useRouter>;

/** Save answers, bump step index, and move forward without leaving stale stack entries. */
export function continueToNextStep(
  router: OnboardingRouter,
  actions: Actions,
  currentRoute: OnboardingRoute,
  answers: OnboardingState['answers'],
) {
  const nextIndex = ROUTE_TO_INDEX[currentRoute] + 1;
  const nextRoute = indexToRoute(nextIndex);
  if (!nextRoute) return;

  actions.advanceOnboarding(nextIndex, answers);
  suppressOnboardingGuard();
  router.replace(`/(onboarding)/${nextRoute}`);
}
