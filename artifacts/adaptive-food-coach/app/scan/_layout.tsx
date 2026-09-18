import React from 'react';
import { Stack } from 'expo-router';

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
        contentStyle: { backgroundColor: '#000000' },
        animation: 'slide_from_right',
      }}
    />
  );
}
