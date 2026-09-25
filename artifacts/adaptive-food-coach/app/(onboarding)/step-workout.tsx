import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { View } from 'react-native';
import type { WorkoutFrequency } from '@/types';
import {
  WorkoutHeavyIcon,
  WorkoutLightIcon,
  WorkoutMidIcon,
} from '@/components/icons/OnboardingIcons';
import { useAppStore } from '@/hooks/useAppStore';
import { OnboardingShell } from './_components/OnboardingShell';
import { SelectRow } from './_components/SelectRow';
import { continueToNextStep } from './_components/navigate';
import { progressFor } from './_components/progress';

const OPTIONS: {
  value: WorkoutFrequency;
  label: string;
  hint: string;
  Icon: typeof WorkoutLightIcon;
}[] = [
  { value: '1_2_per_week', label: '0-2', hint: 'Workout now and then', Icon: WorkoutLightIcon },
  { value: '3_4_per_week', label: '3-5', hint: 'A few workouts per week', Icon: WorkoutMidIcon },
  { value: '5_plus_per_week', label: '6+', hint: 'Dedicated athlete', Icon: WorkoutHeavyIcon },
];

export default function StepWorkoutScreen() {
  const router = useRouter();
  const { actions, state } = useAppStore();
  const [selected, setSelected] = useState<WorkoutFrequency | null>(
    (state.onboarding.answers.workout as WorkoutFrequency | undefined) ?? null,
  );

  const handleContinue = async () => {
    if (!selected) return;
    await continueToNextStep(router, actions, 'step-workout', { workout: selected });
  };

  return (
    <OnboardingShell
      progress={progressFor('step-workout')}
      title="How many workout do you do per week?"
      subtitle="This will be used to calibrate your custom plan"
      continueDisabled={selected == null}
      onContinue={handleContinue}
    >
      <View style={{ gap: 8 }}>
        {OPTIONS.map((opt) => {
          const on = selected === opt.value;
          return (
            <SelectRow
              key={opt.value}
              label={opt.label}
              hint={opt.hint}
              icon={<opt.Icon size={18} color={on ? '#FFFFFF' : '#0F172A'} />}
              selected={on}
              onPress={() => setSelected(opt.value)}
              testID={`workout-option-${opt.value}`}
            />
          );
        })}
      </View>
    </OnboardingShell>
  );
}
