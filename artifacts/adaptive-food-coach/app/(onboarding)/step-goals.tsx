import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { View } from 'react-native';
import type { Goal } from '@/types';
import { useAppStore } from '@/hooks/useAppStore';
import { OnboardingShell } from './_components/OnboardingShell';
import { SelectRow } from './_components/SelectRow';
import { progressFor, ROUTE_TO_INDEX } from './_components/progress';

const OPTIONS: { value: Goal; label: string }[] = [
  { value: 'lose_weight', label: 'Lose Weight' },
  { value: 'maintain_weight', label: 'Maintain Weight' },
  { value: 'gain_muscle', label: 'Gain Weight' },
];

export default function StepGoalsScreen() {
  const router = useRouter();
  const { actions, state } = useAppStore();
  const persisted = Array.isArray(state.onboarding.answers.goals)
    ? (state.onboarding.answers.goals as Goal[])
    : [];
  const initial = OPTIONS.some((opt) => opt.value === persisted[0]) ? persisted[0]! : null;
  const [selected, setSelected] = useState<Goal | null>(initial);

  const handleContinue = async () => {
    if (!selected) return;
    await actions.advanceOnboarding(ROUTE_TO_INDEX['step-target-weight'], { goals: [selected] });
    router.push('/(onboarding)/step-target-weight');
  };

  return (
    <OnboardingShell
      progress={progressFor('step-goals')}
      title="What is your goal?"
      subtitle="This will be used to calibrate your custom plan"
      continueDisabled={selected == null}
      onContinue={handleContinue}
    >
      <View style={{ gap: 8 }}>
        {OPTIONS.map((opt) => (
          <SelectRow
            key={opt.value}
            label={opt.label}
            selected={selected === opt.value}
            onPress={() => setSelected(opt.value)}
            testID={`goal-${opt.value}`}
          />
        ))}
      </View>
    </OnboardingShell>
  );
}
