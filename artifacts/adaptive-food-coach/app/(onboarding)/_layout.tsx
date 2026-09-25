import { Stack, useRouter, useSegments } from 'expo-router';
import React, { useEffect, useMemo } from 'react';
import { colors } from '@/constants/tokens';
import { useAppStore } from '@/hooks/useAppStore';
import { isOnboardingGuardSuppressed } from './_components/onboarding-guard';
import { ROUTE_TO_INDEX, indexToRoute } from './_components/progress';

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
    if (
      !routeSegment ||
      routeSegment === 'welcome' ||
      routeSegment === 'generating-plan' ||
      routeSegment === 'complete'
    ) {
      return;
    }
    if (expectedIndex == null) return;
    if (isOnboardingGuardSuppressed()) return;
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
      <Stack.Screen name="step-dob" />
      <Stack.Screen name="step-goals" />
      <Stack.Screen name="step-target-weight" />
      <Stack.Screen name="step-barriers" />
      <Stack.Screen name="step-diet" />
      <Stack.Screen name="step-accomplish" />
      <Stack.Screen name="generating-plan" />
      <Stack.Screen name="complete" />
    </Stack>
  );
}
