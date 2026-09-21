import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ScrollView } from 'react-native';
import {
  BarrierConsistencyIcon,
  BarrierEatingIcon,
  BarrierInspirationIcon,
  BarrierScheduleIcon,
  BarrierSupportIcon,
} from '@/components/icons/OnboardingIcons';
import { useAppStore } from '@/hooks/useAppStore';
import { OnboardingShell } from './_components/OnboardingShell';
import { SelectRow } from './_components/SelectRow';
import { progressFor, ROUTE_TO_INDEX } from './_components/progress';

const OPTIONS: {
  value: string;
  label: string;
  Icon: typeof BarrierConsistencyIcon;
}[] = [
  { value: 'consistency', label: 'Lack of consistency', Icon: BarrierConsistencyIcon },
  { value: 'eating', label: 'Unhealty eating habits', Icon: BarrierEatingIcon },
  { value: 'support', label: 'Lack of support', Icon: BarrierSupportIcon },
  { value: 'schedule', label: 'Busy Schedule', Icon: BarrierScheduleIcon },
  { value: 'inspiration', label: 'Lack of meal inspiration', Icon: BarrierInspirationIcon },
];

export default function StepBarriersScreen() {
  const router = useRouter();
  const { actions, state } = useAppStore();
  const persisted = Array.isArray(state.onboarding.answers.barriers)
    ? (state.onboarding.answers.barriers as string[])
    : [];
  const [selected, setSelected] = useState<string[]>(persisted);

  const toggle = (value: string) => {
    setSelected((prev) => (prev.includes(value) ? prev.filter((item) => item !== value) : [...prev, value]));
  };

  const handleContinue = async () => {
    if (selected.length === 0) return;
    await actions.advanceOnboarding(ROUTE_TO_INDEX['step-diet'], { barriers: selected });
    router.push('/(onboarding)/step-diet');
  };

  return (
    <OnboardingShell
      progress={progressFor('step-barriers')}
      title="What's stopping you from reaching your goals?"
      subtitle={null}
      continueDisabled={selected.length === 0}
      onContinue={handleContinue}
    >
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingBottom: 16 }}>
        {OPTIONS.map((opt) => {
          const on = selected.includes(opt.value);
          return (
            <SelectRow
              key={opt.value}
              label={opt.label}
              icon={<opt.Icon size={18} color="#0F172A" />}
              iconBadge
              selected={on}
              onPress={() => toggle(opt.value)}
            />
          );
        })}
      </ScrollView>
    </OnboardingShell>
  );
}
