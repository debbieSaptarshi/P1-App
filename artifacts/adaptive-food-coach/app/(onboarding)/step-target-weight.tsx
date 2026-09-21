import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { Goal } from '@/types';
import { colors } from '@/constants/tokens';
import { useAppStore } from '@/hooks/useAppStore';
import { OnboardingShell } from './_components/OnboardingShell';
import { OnboardingRuler } from './_components/OnboardingRuler';
import { progressFor, ROUTE_TO_INDEX } from './_components/progress';

const MIN_KG = 40;
const MAX_KG = 180;

const GOAL_LABEL: Record<string, string> = {
  lose_weight: 'Lose Weight',
  maintain_weight: 'Maintain Weight',
  gain_muscle: 'Gain Weight',
};

function clampKg(value: number) {
  return Number(Math.max(MIN_KG, Math.min(MAX_KG, value)).toFixed(1));
}

export default function StepTargetWeightScreen() {
  const router = useRouter();
  const { actions, state } = useAppStore();
  const current =
    typeof state.onboarding.answers.weight === 'number' ? (state.onboarding.answers.weight as number) : 72;
  const goals = Array.isArray(state.onboarding.answers.goals) ? (state.onboarding.answers.goals as Goal[]) : [];
  const goalLabel = GOAL_LABEL[goals[0] ?? ''] ?? 'Lose Weight';
  const initial =
    typeof state.onboarding.answers.targetWeight === 'number'
      ? clampKg(state.onboarding.answers.targetWeight as number)
      : clampKg(current);
  const [target, setTarget] = useState(initial);

  const handleContinue = async () => {
    await actions.advanceOnboarding(ROUTE_TO_INDEX['step-barriers'], { targetWeight: target });
    router.push('/(onboarding)/step-barriers');
  };

  return (
    <OnboardingShell
      progress={progressFor('step-target-weight')}
      title="What is your desired weight?"
      subtitle={null}
      onContinue={handleContinue}
      bodyCentered
      flush
    >
      <View style={styles.center}>
        <Text style={styles.kicker}>{goalLabel}</Text>
        <View style={styles.valueBlock}>
          <Text style={styles.value}>{target.toFixed(1)}</Text>
          <Text style={styles.value}>Kg</Text>
        </View>
        <OnboardingRuler min={MIN_KG} max={MAX_KG} value={target} onChange={setTarget} />
      </View>
    </OnboardingShell>
  );
}

const styles = StyleSheet.create({
  center: { alignItems: 'center', gap: 16, width: '100%' },
  kicker: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    lineHeight: 20,
    color: colors.textMuted,
    textAlign: 'center',
  },
  valueBlock: { alignItems: 'center' },
  value: {
    fontFamily: 'Inter_500Medium',
    fontSize: 40,
    lineHeight: 48,
    color: colors.textPrimary,
    textAlign: 'center',
  },
});
