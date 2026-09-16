import { Stack } from 'expo-router';
import React from 'react';

/**
 * Stack host for the profile editor series.
 *
 * All screens in this group share the same chrome:
 * - hidden native header (each screen draws its own Header)
 * - standard `headerBackTitle: 'Back'` so iOS shows the friendly label
 */
export default function ProfileEditLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        headerBackTitle: 'Back',
        animation: 'slide_from_right',
      }}
    />
  );
}
