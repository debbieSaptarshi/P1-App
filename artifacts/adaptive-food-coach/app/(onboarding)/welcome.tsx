import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { BrandMarkIcon } from '@/components/icons/OnboardingIcons';
import { colors } from '@/constants/tokens';
import { suppressOnboardingGuard } from './_components/onboarding-guard';
import { appStoreActions, useAppStore } from '@/hooks/useAppStore';

export default function WelcomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { state } = useAppStore();
  const [submitting, setSubmitting] = useState(false);

  const firstName = state.profile.name.trim().split(' ')[0];
  const headline = firstName
    ? `${firstName}, let's build your plan`
    : 'Tracking calories just got a lot easier!';

  const handleStart = async () => {
    if (submitting) return;
    setSubmitting(true);
    try {
      void appStoreActions.startOnboarding();
      suppressOnboardingGuard();
      router.replace('/(onboarding)/step-gender');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSignOut = async () => {
    if (submitting) return;
    setSubmitting(true);
    try {
      await appStoreActions.reset();
      router.replace('/(auth)/sign-in');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={[styles.flex, { paddingTop: insets.top, paddingBottom: insets.bottom + 12 }]}>
      <StatusBar style="dark" />
      <View style={styles.hero}>
        <BrandMarkIcon size={80} />
        <Text style={styles.title}>{headline}</Text>
        {state.profile.email ? (
          <Text style={styles.account}>Signed in as {state.profile.email}</Text>
        ) : null}
      </View>
      <View style={styles.footer}>
        <Pressable
          accessibilityRole="button"
          onPress={() => void handleStart()}
          style={({ pressed }) => [styles.cta, pressed && styles.pressed]}
        >
          <Text style={styles.ctaLabel}>{submitting ? 'Starting…' : 'Set up my plan'}</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          onPress={() => void handleSignOut()}
          style={({ pressed }) => [styles.secondary, pressed && styles.pressed]}
        >
          <Text style={styles.secondaryMuted}>Wrong account?</Text>
          <Text style={styles.secondaryAction}> Sign out</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  hero: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    gap: 16,
  },
  title: {
    fontFamily: 'Inter_500Medium',
    fontSize: 32,
    lineHeight: 38,
    letterSpacing: -0.2,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  account: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    lineHeight: 20,
    color: colors.textMuted,
    textAlign: 'center',
  },
  footer: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 8,
  },
  cta: {
    minHeight: 46,
    borderRadius: 999,
    backgroundColor: colors.darkSurface,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  ctaLabel: {
    fontFamily: 'Inter_500Medium',
    fontSize: 16,
    lineHeight: 22,
    letterSpacing: -0.18,
    color: colors.textInverse,
  },
  secondary: {
    minHeight: 46,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    paddingVertical: 12,
  },
  secondaryMuted: {
    fontFamily: 'Inter_500Medium',
    fontSize: 16,
    lineHeight: 22,
    letterSpacing: -0.18,
    color: colors.textMuted,
  },
  secondaryAction: {
    fontFamily: 'Inter_500Medium',
    fontSize: 16,
    lineHeight: 22,
    letterSpacing: -0.18,
    color: colors.textPrimary,
  },
  pressed: { opacity: 0.85 },
});
