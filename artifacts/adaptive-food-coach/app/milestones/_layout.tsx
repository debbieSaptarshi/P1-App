import React from 'react';
import { Stack } from 'expo-router';

export default function MilestonesLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen
        name="badge/[badgeId]"
        options={{
          presentation: 'card',
        }}
      />
      <Stack.Screen
        name="share/[badgeId]"
        options={{
          presentation: 'transparentModal',
          animation: 'slide_from_bottom',
          contentStyle: { backgroundColor: 'transparent' },
        }}
      />
    </Stack>
  );
}
