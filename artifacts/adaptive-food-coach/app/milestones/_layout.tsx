import React from 'react';
import { Stack } from 'expo-router';

/**
 * Stack layout for the milestone catalog and detail/share flows.
 * The progress tab on the (tabs) router pushes /milestones/* into this stack.
 */
export default function MilestonesLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerBackTitle: 'Back',
        headerTitleStyle: {
          fontFamily: 'Inter_700Bold',
        },
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          title: 'Milestones',
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="badge/[badgeId]"
        options={{
          title: 'Badge',
          presentation: 'card',
        }}
      />
      <Stack.Screen
        name="share/[badgeId]"
        options={{
          title: 'Share',
          presentation: 'modal',
          animation: 'slide_from_bottom',
        }}
      />
    </Stack>
  );
}
