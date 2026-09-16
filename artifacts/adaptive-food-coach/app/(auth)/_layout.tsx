import { Stack } from 'expo-router';
import React from 'react';
import { colors } from '@/constants/tokens';

/**
 * Group layout for the authentication flow: sign-in, register, forgot-password,
 * verify-otp, reset-success. Renders without individual screen headers so each
 * screen can use the shared `Header` primitive with the Figma back arrow.
 */
export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen name="sign-in" />
      <Stack.Screen name="register" />
      <Stack.Screen name="forgot-password" />
      <Stack.Screen name="verify-otp" />
      <Stack.Screen name="reset-success" />
    </Stack>
  );
}
