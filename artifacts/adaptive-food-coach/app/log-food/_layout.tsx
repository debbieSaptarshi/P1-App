import React from 'react';
import { Stack } from 'expo-router';
import { colors } from '@/constants/tokens';

/**
 * Layout for the food-logging sub-tree.
 *
 * Hosts the search home, add-custom food, meal-builder, saved list,
 * and the entry-detail/[entryId] screen. Each screen renders its
 * own header via the shared `Header` primitive.
 */
export default function LogFoodLayout() {
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
