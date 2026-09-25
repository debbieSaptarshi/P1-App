import { Stack } from 'expo-router';
import React from 'react';

/** Stack host for programme detail and the "find your plan" test. */
export default function ProgramsLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        headerBackTitle: 'Back',
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="[programId]" />
      <Stack.Screen name="test" options={{ animation: 'slide_from_bottom', gestureEnabled: false }} />
    </Stack>
  );
}
