import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { RulerPicker } from '@/components/ui';
import { StepHeader } from './_components/StepHeader';
import { colors, radii, spacing } from '@/constants/tokens';
import { useAppStore } from '@/hooks/useAppStore';

const TOTAL_STEPS = 10;
const STEP_NUM = 5;
const MIN = 40;
const MAX = 180;
const DEFAULT = 70;

export default function StepTargetWeightScreen() {
  const router = useRouter();
  const { actions, state } = useAppStore();
  const initial =
    typeof state.onboarding.answers.targetWeight === 'number'
      ? (state.onboarding.answers.targetWeight as number)
      : typeof state.onboarding.answers.weight === 'number'
        ? (state.onboarding.answers.weight as number) - 3
        : DEFAULT;
  const [target, setTarget] = useState<number>(clamp(initial, MIN, MAX));

  const current =
    typeof state.onboarding.answers.weight === 'number'
      ? (state.onboarding.answers.weight as number)
      : 75;

  const delta = useMemo(() => Number((target - current).toFixed(1)), [target, current]);

  const continueHint =
    delta === 0
      ? 'Maintaining your current weight — perfect for sustainable habits.'
      : delta < 0
        ? `Lose ${Math.abs(delta).toFixed(1)} kg gradually over time.`
        : `Gain ${delta.toFixed(1)} kg with a smart surplus plan.`;

  const handleContinue = async () => {
    await actions.advanceOnboarding(5, { targetWeight: target });
    router.push('/(onboarding)/step-dob');
  };

  return (
    <StepHeader
      stepNum={STEP_NUM}
      totalSteps={TOTAL_STEPS}
      kicker="GOAL"
      title="What's your target weight?"
      subtitle="We design a daily calorie target and pace that adapts to your progress."
      onContinue={handleContinue}
    >
      <View style={styles.card}>
        <View style={styles.cardSummary}>
          <View style={styles.summaryCol}>
            <Text style={styles.summaryLabel}>Current</Text>
            <Text style={styles.summaryValue}>{current.toFixed(0)} kg</Text>
          </View>
          <View style={styles.summaryArrow}>
            <Feather name="arrow-right" size={18} color={colors.textMuted} />
          </View>
          <View style={[styles.summaryCol, styles.summaryColTarget]}>
            <Text style={styles.summaryLabel}>Target</Text>
            <Text style={styles.summaryValue}>{target.toFixed(0)} kg</Text>
          </View>
        </View>
        <RulerPicker
          min={MIN}
          max={MAX}
          step={1}
          unit="kg"
          value={target}
          onChange={setTarget}
        />
        <View style={styles.scaleRow}>
          <Text style={styles.scaleEdge}>{MIN} kg</Text>
          <Text style={styles.scaleEdge}>{MAX} kg</Text>
        </View>
      </View>

      <View style={styles.note}>
        <Feather name="info" size={14} color={colors.primary} />
        <Text style={styles.noteText}>{continueHint}</Text>
      </View>
    </StepHeader>
  );
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: radii.lg,
    padding: spacing.lg,
    marginTop: spacing.md,
    marginBottom: spacing.lg,
  },
  cardSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  summaryCol: {
    flex: 1,
    alignItems: 'center',
  },
  summaryColTarget: {
    backgroundColor: colors.primarySoft,
    paddingVertical: spacing.sm,
    borderRadius: radii.md,
    marginLeft: spacing.sm,
  },
  summaryLabel: {
    fontFamily: 'Inter_500Medium',
    fontSize: 11,
    color: colors.textMuted,
    letterSpacing: 1,
    marginBottom: 2,
  },
  summaryValue: {
    fontFamily: 'Inter_700Bold',
    fontSize: 18,
    color: colors.textPrimary,
    letterSpacing: -0.2,
  },
  summaryArrow: {
    paddingHorizontal: spacing.xs,
  },
  scaleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.xs,
  },
  scaleEdge: {
    fontFamily: 'Inter_500Medium',
    fontSize: 12,
    color: colors.textMuted,
  },
  note: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    padding: spacing.md,
    borderRadius: radii.md,
    backgroundColor: colors.primarySoft,
  },
  noteText: {
    flex: 1,
    fontFamily: 'Inter_500Medium',
    fontSize: 13,
    lineHeight: 19,
    color: colors.textPrimary,
  },
});
