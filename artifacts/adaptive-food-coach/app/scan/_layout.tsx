import React from 'react';
import { Stack } from 'expo-router';
import { colors } from '@/constants/tokens';

/**
 * Layout for the Scanner sub-tree.
 *
 * Hosts the food-camera, barcode, label, and result/[foodId] screens.
 * Each screen renders its own translucent header via the shared
 * `Header` UI primitive, so the navigator keeps `headerShown: false`.
 */
export default function ScanLayout() {
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
