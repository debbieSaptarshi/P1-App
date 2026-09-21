import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { BrandMarkIcon } from '@/components/icons/OnboardingIcons';
import { colors } from '@/constants/tokens';
import { useAppStore } from '@/hooks/useAppStore';

export default function WelcomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { actions } = useAppStore();
  const [submitting, setSubmitting] = useState(false);

  const handleStart = async () => {
    if (submitting) return;
    setSubmitting(true);
    try {
      router.push('/(onboarding)/step-gender');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSignIn = async () => {
    if (submitting) return;
    setSubmitting(true);
    try {
      await actions.reset();
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
        <Text style={styles.title}>Tracking calories just got a lot easier!</Text>
      </View>
      <View style={styles.footer}>
        <Pressable
          accessibilityRole="button"
          onPress={() => void handleStart()}
          style={({ pressed }) => [styles.cta, pressed && styles.pressed]}
        >
          <Text style={styles.ctaLabel}>{submitting ? 'Starting…' : 'Get Started'}</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          onPress={() => void handleSignIn()}
          style={({ pressed }) => [styles.secondary, pressed && styles.pressed]}
        >
          <Text style={styles.secondaryMuted}>Already have an account?</Text>
          <Text style={styles.secondaryAction}> Sign in</Text>
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
