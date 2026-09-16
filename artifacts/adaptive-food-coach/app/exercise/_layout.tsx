import React from 'react';
import { Stack } from 'expo-router';
import { colors } from '@/constants/tokens';

/**
 * Layout for the exercise sub-tree. Hosts the activity picker,
 * active GPS run screen, and voice/text exercise describer.
 */
export default function ExerciseLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
        animation: 'slide_from_right',
      }}
    />
  );
}
