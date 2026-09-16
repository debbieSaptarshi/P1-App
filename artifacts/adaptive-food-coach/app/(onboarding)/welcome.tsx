import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { Button } from '@/components/ui';
import { colors, radii, spacing } from '@/constants/tokens';
import { useAppStore } from '@/hooks/useAppStore';

/**
 * Pre-step ceremony for the personalization quiz. Calls
 * `actions.startOnboarding()` to reset the persisted answer map and step
 * counter, then transitions to the first quiz screen.
 */
export default function WelcomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { actions } = useAppStore();

  const [submitting, setSubmitting] = useState(false);

  const handleStart = async () => {
    if (submitting) return;
    setSubmitting(true);
    try {
      await actions.startOnboarding();
      router.replace('/(onboarding)/step-gender');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScrollView
      style={styles.flex}
      contentContainerStyle={[
        styles.scroll,
        { paddingTop: insets.top + spacing.md, paddingBottom: insets.bottom + spacing.xl },
      ]}
      showsVerticalScrollIndicator={false}
    >
      <Animated.View entering={FadeInUp.duration(500)} style={styles.hero}>
        <View style={styles.crest}>
          <Feather name="zap" size={28} color={colors.textInverse} />
        </View>
        <Text style={styles.kicker}>PERSONALIZED FOR YOU</Text>
        <Text style={styles.title}>Build your adaptive plan</Text>
        <Text style={styles.subtitle}>
          Answer 10 quick questions and we&apos;ll craft a meal, workout and habit plan that adapts
          with you every day.
        </Text>
      </Animated.View>

      <View style={styles.bullets}>
        {bullets.map((bullet, idx) => (
          <Animated.View
            key={bullet.title}
            entering={FadeInDown.duration(420).delay(280 + idx * 90)}
            style={styles.bulletRow}
          >
            <View style={styles.bulletIcon}>
              <Feather name={bullet.icon as any} size={18} color={colors.primary} />
            </View>
            <View style={styles.bulletText}>
              <Text style={styles.bulletTitle}>{bullet.title}</Text>
              <Text style={styles.bulletDesc}>{bullet.desc}</Text>
            </View>
          </Animated.View>
        ))}
      </View>

      <View style={styles.footer}>
        <Button
          title={submitting ? 'Starting…' : "Let's Start"}
          onPress={handleStart}
          loading={submitting}
          trailingIcon="arrow-right"
        />
        <Text style={styles.footnote}>
          Takes about 90 seconds · your answers stay private to your account
        </Text>
      </View>
    </ScrollView>
  );
}

const bullets = [
  {
    icon: 'heart',
    title: 'Smart meal guidance',
    desc: 'Plate recommendations tuned to your goals, schedule and biometrics.',
  },
  {
    icon: 'activity',
    title: 'Adaptive workouts',
    desc: 'Daily activity targets that flex with recovery and energy levels.',
  },
  {
    icon: 'target',
    title: 'Habit nudges',
    desc: 'Tiny actions that compound into long-term, sustainable change.',
  },
];

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: spacing.lg,
  },
  hero: {
    alignItems: 'flex-start',
    paddingTop: spacing.xl,
    marginBottom: spacing.xxl,
  },
  crest: {
    width: 56,
    height: 56,
    borderRadius: radii.md,
    backgroundColor: colors.darkSurface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  kicker: {
    fontFamily: 'Inter_500Medium',
    fontSize: 11,
    color: colors.primary,
    letterSpacing: 1.4,
    marginBottom: spacing.xs,
  },
  title: {
    fontFamily: 'Inter_700Bold',
    fontSize: 32,
    lineHeight: 38,
    color: colors.textPrimary,
    letterSpacing: -0.8,
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontFamily: 'Inter_400Regular',
    fontSize: 15,
    lineHeight: 22,
    color: colors.textMuted,
  },
  bullets: {
    gap: spacing.md,
    marginBottom: spacing.xxl,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    paddingVertical: spacing.xs,
  },
  bulletIcon: {
    width: 40,
    height: 40,
    borderRadius: radii.lg,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bulletText: {
    flex: 1,
  },
  bulletTitle: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 15,
    color: colors.textPrimary,
    marginBottom: 2,
  },
  bulletDesc: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    lineHeight: 19,
    color: colors.textMuted,
  },
  footer: {
    gap: spacing.sm,
    marginTop: 'auto',
  },
  footnote: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    textAlign: 'center',
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
});
