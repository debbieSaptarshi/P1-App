import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { View } from 'react-native';
import type { DietPattern } from '@/types';
import {
  DietClassicIcon,
  DietPescatarianIcon,
  DietVegetarianIcon,
  DietVeganIcon,
} from '@/components/icons/OnboardingIcons';
import { useAppStore } from '@/hooks/useAppStore';
import { OnboardingShell } from './_components/OnboardingShell';
import { SelectRow } from './_components/SelectRow';
import { continueToNextStep } from './_components/navigate';
import { progressFor } from './_components/progress';

const OPTIONS: {
  value: DietPattern;
  label: string;
  Icon: typeof DietClassicIcon;
}[] = [
  { value: 'omnivore', label: 'Classic', Icon: DietClassicIcon },
  { value: 'pescatarian', label: 'Pescatarian', Icon: DietPescatarianIcon },
  { value: 'vegetarian', label: 'Vegetarian', Icon: DietVegetarianIcon },
  { value: 'vegan', label: 'Vegan', Icon: DietVeganIcon },
];

export default function StepDietScreen() {
  const router = useRouter();
  const { actions, state } = useAppStore();
  const [diet, setDiet] = useState<DietPattern | null>(
    (state.onboarding.answers.diet as DietPattern | undefined) ?? null,
  );

  const handleContinue = async () => {
    if (!diet) return;
    await continueToNextStep(router, actions, 'step-diet', { diet });
  };

  return (
    <OnboardingShell
      progress={progressFor('step-diet')}
      title="Do you follow a specific diet?"
      subtitle={null}
      continueDisabled={diet == null}
      onContinue={handleContinue}
    >
      <View style={{ gap: 8 }}>
        {OPTIONS.map((opt) => (
          <SelectRow
            key={opt.value}
            label={opt.label}
            icon={<opt.Icon size={18} color="#0F172A" />}
            iconBadge
            selected={diet === opt.value}
            onPress={() => setDiet(opt.value)}
            testID={`diet-${opt.value}`}
          />
        ))}
      </View>
    </OnboardingShell>
  );
}
