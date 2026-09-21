import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { View } from 'react-native';
import {
  GoalBodyIcon,
  GoalEnergyIcon,
  GoalHealthierIcon,
  GoalMotivatedIcon,
} from '@/components/icons/OnboardingIcons';
import { useAppStore } from '@/hooks/useAppStore';
import { OnboardingShell } from './_components/OnboardingShell';
import { SelectRow } from './_components/SelectRow';
import { progressFor, ROUTE_TO_INDEX } from './_components/progress';

const OPTIONS: {
  value: string;
  label: string;
  Icon: typeof GoalHealthierIcon;
}[] = [
  { value: 'healthier', label: 'Eat and live healthier', Icon: GoalHealthierIcon },
  { value: 'energy', label: 'Boost my energy and mood', Icon: GoalEnergyIcon },
  { value: 'consistent', label: 'Stay motivated and consistent', Icon: GoalMotivatedIcon },
  { value: 'body', label: 'Feel better about my body', Icon: GoalBodyIcon },
];

export default function StepAccomplishScreen() {
  const router = useRouter();
  const { actions, state } = useAppStore();
  const persisted = Array.isArray(state.onboarding.answers.accomplish)
    ? (state.onboarding.answers.accomplish as string[])
    : [];
  const [selected, setSelected] = useState<string[]>(persisted);

  const toggle = (value: string) => {
    setSelected((prev) => (prev.includes(value) ? prev.filter((item) => item !== value) : [...prev, value]));
  };

  const handleContinue = async () => {
    if (selected.length === 0) return;
    await actions.advanceOnboarding(ROUTE_TO_INDEX['generating-plan'], { accomplish: selected });
    router.push('/(onboarding)/generating-plan');
  };

  return (
    <OnboardingShell
      progress={progressFor('step-accomplish')}
      title="What would you like to accomplish?"
      subtitle={null}
      continueDisabled={selected.length === 0}
      onContinue={handleContinue}
    >
      <View style={{ gap: 8 }}>
        {OPTIONS.map((opt) => (
          <SelectRow
            key={opt.value}
            label={opt.label}
            icon={<opt.Icon size={18} color="#0F172A" />}
            iconBadge
            selected={selected.includes(opt.value)}
            onPress={() => toggle(opt.value)}
          />
        ))}
      </View>
    </OnboardingShell>
  );
}
