import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { Button, Header, ProgressBar } from '@/components/ui';
import { colors, radii, spacing } from '@/constants/tokens';
import type { Gender } from '@/types';
import { useAppStore } from '@/hooks/useAppStore';

const TOTAL_STEPS = 10;
const STEP_NUM = 1;

const OPTIONS: { value: Gender; label: string; icon: keyof typeof Feather.glyphMap }[] = [
  { value: 'female', label: 'Female', icon: 'user' },
  { value: 'male', label: 'Male', icon: 'user' },
  { value: 'other', label: 'Other', icon: 'users' },
  { value: 'prefer_not_to_say', label: 'Prefer not to say', icon: 'minus-circle' },
];

export default function StepGenderScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { actions, state } = useAppStore();
  const [selected, setSelected] = useState<Gender | null>(
    (state.onboarding.answers.gender as Gender | undefined) ?? null,
  );

  const canContinue = selected !== null;

  const handleContinue = async () => {
    if (!selected) return;
    await actions.advanceOnboarding(1, { gender: selected });
    router.push('/(onboarding)/step-workout');
  };

  return (
    <View style={styles.flex}>
      <View style={{ paddingTop: insets.top }}>
        <Header subtitle={`Step ${STEP_NUM} of ${TOTAL_STEPS}`} />
      </View>
      <View style={styles.progressWrap}>
        <ProgressBar progress={STEP_NUM / TOTAL_STEPS} />
      </View>

      <View style={styles.body}>
        <Text style={styles.kicker}>A BIT ABOUT YOU</Text>
        <Text style={styles.title}>What&apos;s your gender?</Text>
        <Text style={styles.subtitle}>
          We use this to personalize calorie targets and macro ratios. You can update it any time.
        </Text>

        <View style={styles.optionsGrid}>
          {OPTIONS.map((opt) => {
            const active = selected === opt.value;
            return (
              <Pressable
                key={opt.value}
                accessibilityRole="radio"
                accessibilityState={{ selected: active }}
                testID={`gender-option-${opt.value}`}
                onPress={() => setSelected(opt.value)}
                style={({ pressed }) => [
                  styles.optionCard,
                  active && styles.optionCardActive,
                  pressed && styles.optionCardPressed,
                ]}
              >
                <View
                  style={[
                    styles.optionIcon,
                    { backgroundColor: active ? colors.primary : colors.primarySoft },
                  ]}
                >
                  <Feather
                    name={opt.icon}
                    size={20}
                    color={active ? colors.textInverse : colors.primary}
                  />
                </View>
                <View style={styles.optionText}>
                  <Text style={[styles.optionLabel, active && styles.optionLabelActive]}>
                    {opt.label}
                  </Text>
                </View>
                <Feather
                  name={active ? 'check-circle' : 'circle'}
                  size={20}
                  color={active ? colors.primary : colors.textMuted}
                />
              </Pressable>
            );
          })}
        </View>
      </View>

      <View style={[styles.footer, { paddingBottom: insets.bottom + spacing.md }]}>
        <Button
          title="Continue"
          onPress={handleContinue}
          disabled={!canContinue}
          trailingIcon="arrow-right"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  progressWrap: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
  },
  body: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
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
    fontSize: 26,
    lineHeight: 32,
    color: colors.textPrimary,
    letterSpacing: -0.4,
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    lineHeight: 21,
    color: colors.textMuted,
    marginBottom: spacing.xl,
  },
  optionsGrid: {
    gap: spacing.sm,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.card,
    borderRadius: radii.lg,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  optionCardActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft,
  },
  optionCardPressed: {
    opacity: 0.92,
  },
  optionIcon: {
    width: 40,
    height: 40,
    borderRadius: radii.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionText: {
    flex: 1,
  },
  optionLabel: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 15,
    color: colors.textPrimary,
  },
  optionLabelActive: {
    color: colors.primary,
  },
  footer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
  },
});
