import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { View } from 'react-native';
import type { Gender } from '@/types';
import { useAppStore } from '@/hooks/useAppStore';
import {
  GenderFemaleIcon,
  GenderMaleIcon,
  GenderOtherIcon,
} from '@/components/icons/OnboardingIcons';
import { OnboardingShell } from './_components/OnboardingShell';
import { SelectRow } from './_components/SelectRow';
import { progressFor, ROUTE_TO_INDEX } from './_components/progress';

const OPTIONS: {
  value: Gender;
  label: string;
  Icon: typeof GenderMaleIcon;
}[] = [
  { value: 'male', label: 'Male', Icon: GenderMaleIcon },
  { value: 'female', label: 'Female', Icon: GenderFemaleIcon },
  { value: 'other', label: 'Other', Icon: GenderOtherIcon },
];

export default function StepGenderScreen() {
  const router = useRouter();
  const { actions, state } = useAppStore();
  const [selected, setSelected] = useState<Gender | null>(
    (state.onboarding.answers.gender as Gender | undefined) ?? null,
  );

  const handleContinue = async () => {
    if (!selected) return;
    const gender = selected;
    await actions.advanceOnboarding(ROUTE_TO_INDEX['step-workout'], { gender });
    router.push('/(onboarding)/step-workout');
  };

  return (
    <OnboardingShell
      progress={progressFor('step-gender')}
      title="Choose your gender"
      subtitle="This will be used to calibrate your custom plan"
      continueDisabled={selected == null}
      onContinue={handleContinue}
      bodyCentered
    >
      <View style={{ gap: 8 }}>
        {OPTIONS.map((opt) => {
          const on = selected === opt.value;
          const Icon = opt.Icon;
          return (
            <SelectRow
              key={opt.value}
              label={opt.label}
              icon={<Icon size={18} color={on ? '#FFFFFF' : '#0F172A'} />}
              selected={on}
              onPress={() => setSelected(opt.value)}
              testID={`gender-option-${opt.value}`}
              align="start"
            />
          );
        })}
      </View>
    </OnboardingShell>
  );
}
