import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import type { WorkoutFrequency } from '@/types';
import { Chip } from './_components/Chip';
import { StepHeader } from './_components/StepHeader';
import { colors, radii, spacing } from '@/constants/tokens';
import { useAppStore } from '@/hooks/useAppStore';

const TOTAL_STEPS = 10;
const STEP_NUM = 2;

const FREQUENCIES: {
  value: WorkoutFrequency;
  label: string;
  hint: string;
  icon: keyof typeof Feather.glyphMap;
}[] = [
  { value: 'never', label: 'Never', hint: 'Mostly sitting day-to-day', icon: 'watch' },
  { value: 'rarely', label: 'Rarely', hint: 'A walk or two per month', icon: 'cloud-drizzle' },
  { value: '1_2_per_week', label: '1–2 / wk', hint: 'Light and easy', icon: 'navigation' },
  { value: '3_4_per_week', label: '3–4 / wk', hint: 'Steady habit', icon: 'zap' },
  { value: '5_plus_per_week', label: '5+ / wk', hint: 'Athlete-level discipline', icon: 'award' },
];

function hintFor(value: WorkoutFrequency | null): string {
  if (!value) return 'Pick the closest match — your plan will flex with you.';
  return FREQUENCIES.find((f) => f.value === value)?.hint ?? '';
}

export default function StepWorkoutScreen() {
  const router = useRouter();
  const { actions, state } = useAppStore();
  const [selected, setSelected] = useState<WorkoutFrequency | null>(
    (state.onboarding.answers.workout as WorkoutFrequency | undefined) ?? null,
  );

  const continueEnabled = selected !== null;

  const handleContinue = async () => {
    if (!selected) return;
    await actions.advanceOnboarding(2, { workout: selected });
    router.push('/(onboarding)/step-height');
  };

  return (
    <StepHeader
      stepNum={STEP_NUM}
      totalSteps={TOTAL_STEPS}
      kicker="ACTIVITY"
      title="How often do you work out?"
      subtitle="Pick the option closest to your usual week — we'll calibrate your plan from there."
      onContinue={handleContinue}
      continueDisabled={!continueEnabled}
    >
      <ScrollView
        style={styles.list}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      >
        {FREQUENCIES.map((f) => (
          <Chip
            key={f.value}
            label={f.label}
            selected={selected === f.value}
            onPress={() => setSelected(f.value)}
            leadingIcon={f.icon}
            testID={`workout-option-${f.value}`}
          />
        ))}

        <View style={styles.note}>
          <View style={styles.noteBadge}>
            <Feather name="info" size={16} color={colors.primary} />
          </View>
          <Text style={styles.noteText}>{hintFor(selected)}</Text>
        </View>
      </ScrollView>
    </StepHeader>
  );
}

const styles = StyleSheet.create({
  list: { flex: 1 },
  listContent: {
    gap: spacing.sm,
    paddingBottom: spacing.xl,
  },
  note: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.md,
    padding: spacing.md,
    borderRadius: radii.md,
    backgroundColor: colors.primarySoft,
  },
  noteBadge: {
    width: 36,
    height: 36,
    borderRadius: radii.lg,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noteText: {
    flex: 1,
    fontFamily: 'Inter_500Medium',
    fontSize: 13,
    lineHeight: 19,
    color: colors.textPrimary,
  },
});
