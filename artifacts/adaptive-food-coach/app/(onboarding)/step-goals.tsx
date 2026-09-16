import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import type { Goal } from '@/types';
import { Chip } from './_components/Chip';
import { StepHeader } from './_components/StepHeader';
import { colors, radii, spacing } from '@/constants/tokens';
import { useAppStore } from '@/hooks/useAppStore';

const TOTAL_STEPS = 10;
const STEP_NUM = 7;

const GOALS: { value: Goal; label: string; icon: keyof typeof Feather.glyphMap }[] = [
  { value: 'lose_weight', label: 'Lose weight', icon: 'trending-down' },
  { value: 'maintain_weight', label: 'Maintain weight', icon: 'minus' },
  { value: 'gain_muscle', label: 'Gain muscle', icon: 'plus-circle' },
  { value: 'improve_health', label: 'Improve health', icon: 'heart' },
  { value: 'manage_condition', label: 'Manage a condition', icon: 'activity' },
];

export default function StepGoalsScreen() {
  const router = useRouter();
  const { actions, state } = useAppStore();
  const persisted = Array.isArray(state.onboarding.answers.goals)
    ? (state.onboarding.answers.goals as Goal[])
    : [];
  const [selected, setSelected] = useState<Goal[]>(persisted);

  const toggle = (value: Goal) => {
    setSelected((prev) =>
      prev.includes(value) ? prev.filter((p) => p !== value) : [...prev, value],
    );
  };

  const continueEnabled = selected.length > 0;

  const handleContinue = async () => {
    if (!continueEnabled) return;
    await actions.advanceOnboarding(7, { goals: selected });
    router.push('/(onboarding)/step-diet');
  };

  return (
    <StepHeader
      stepNum={STEP_NUM}
      totalSteps={TOTAL_STEPS}
      kicker="GOALS"
      title="What are your goals?"
      subtitle="Pick one or more — we'll blend them into a single adaptive plan."
      onContinue={handleContinue}
      continueDisabled={!continueEnabled}
    >
      <ScrollView
        style={styles.list}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      >
        {GOALS.map((goal) => (
          <Chip
            key={goal.value}
            label={goal.label}
            selected={selected.includes(goal.value)}
            onPress={() => toggle(goal.value)}
            leadingIcon={goal.icon}
            testID={`goal-${goal.value}`}
          />
        ))}

        <View style={styles.summary}>
          <View style={styles.summaryBadge}>
            <Feather name="check" size={14} color={colors.textInverse} />
          </View>
          <Text style={styles.summaryText}>
            {selected.length === 0
              ? 'Tap any goal above to start building your blend.'
              : `${selected.length} goal${selected.length === 1 ? '' : 's'} selected — continue to fine-tune.`}
          </Text>
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
  summary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radii.md,
    backgroundColor: colors.primarySoft,
    marginTop: spacing.md,
  },
  summaryBadge: {
    width: 28,
    height: 28,
    borderRadius: radii.pill,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryText: {
    flex: 1,
    fontFamily: 'Inter_500Medium',
    fontSize: 13,
    lineHeight: 19,
    color: colors.textPrimary,
  },
});
