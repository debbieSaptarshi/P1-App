import { Stack, useRouter, useSegments } from 'expo-router';
import React, { useEffect, useMemo } from 'react';
import { colors } from '@/constants/tokens';
import { useAppStore } from '@/hooks/useAppStore';

/**
 * Mirrors the route name to the onboarding stepIndex stored in the global
 * store. Used by the group layout to enforce that the user progresses (or
 * rewinds) only via the in-app quiz contact surface, not by URL guessing.
 */
const ROUTE_TO_INDEX: Record<string, number> = {
  'step-gender': 0,
  'step-workout': 1,
  'step-height': 2,
  'step-weight': 3,
  'step-target-weight': 4,
  'step-dob': 5,
  'step-goals': 6,
  'step-diet': 7,
  'generating-plan': 9,
  complete: 9,
};

/**
 * Group layout for the 10-step personalization quiz. The store's
 * `onboarding.stepIndex` is the source of truth; if the user lands on a
 * screen whose index is past their current step, we redirect them back to
 * the un-started flow.
 *
 * The welcome and generating-plan screens are not gated by stepIndex.
 */
export default function OnboardingLayout() {
  const segments = useSegments();
  const router = useRouter();
  const { state } = useAppStore();

  const routeSegment = useMemo(() => {
    const last = segments[segments.length - 1] as string | undefined;
    return last ?? null;
  }, [segments]);

  const expectedIndex = routeSegment ? ROUTE_TO_INDEX[routeSegment] : null;

  useEffect(() => {
    if (!routeSegment || routeSegment === 'welcome' || routeSegment === 'generating-plan') {
      return;
    }
    if (expectedIndex == null) return;

    // Prevent skipping forward. If the store says the user is at step N but
    // they're trying to render a screen for a higher step M, send them back
    // to step N.
    if (state.onboarding.stepIndex < expectedIndex) {
      const target = indexToRoute(state.onboarding.stepIndex);
      if (target && target !== routeSegment) {
        router.replace(`/(onboarding)/${target}` as any);
      }
    }
  }, [expectedIndex, routeSegment, state.onboarding.stepIndex, router]);

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen name="welcome" />
      <Stack.Screen name="step-gender" />
      <Stack.Screen name="step-workout" />
      <Stack.Screen name="step-height" />
      <Stack.Screen name="step-weight" />
      <Stack.Screen name="step-target-weight" />
      <Stack.Screen name="step-dob" />
      <Stack.Screen name="step-goals" />
      <Stack.Screen name="step-diet" />
      <Stack.Screen name="generating-plan" />
      <Stack.Screen name="complete" />
    </Stack>
  );
}

function indexToRoute(index: number): string | null {
  switch (index) {
    case 0:
      return 'step-gender';
    case 1:
      return 'step-workout';
    case 2:
      return 'step-height';
    case 3:
      return 'step-weight';
    case 4:
      return 'step-target-weight';
    case 5:
      return 'step-dob';
    case 6:
      return 'step-goals';
    case 7:
      return 'step-diet';
    case 8:
      // The allergies/freeform step is rendered inside step-diet.tsx so
      // route there if the store ever sits on index 8.
      return 'step-diet';
    case 9:
      return 'complete';
    default:
      return null;
  }
}
