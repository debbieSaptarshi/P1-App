import { Stack } from 'expo-router';
import React from 'react';

/**
 * Stack host for accountability-group screens.
 *
 * Members, challenges, leaderboard, and feed posts share the same
 * slide-from-right transition and hidden native header (each screen
 * renders its own `Header`).
 */
export default function GroupLayout() {
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
