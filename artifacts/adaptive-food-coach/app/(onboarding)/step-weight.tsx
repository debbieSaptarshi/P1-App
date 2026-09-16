import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { RulerPicker } from '@/components/ui';
import { StepHeader } from './_components/StepHeader';
import { colors, radii, spacing } from '@/constants/tokens';
import { useAppStore } from '@/hooks/useAppStore';

const TOTAL_STEPS = 10;
const STEP_NUM = 4;
const MIN = 40;
const MAX = 180;
const DEFAULT = 75;

export default function StepWeightScreen() {
  const router = useRouter();
  const { actions, state } = useAppStore();
  const initial =
    typeof state.onboarding.answers.weight === 'number'
      ? (state.onboarding.answers.weight as number)
      : DEFAULT;
  const [weight, setWeight] = useState<number>(initial);

  const handleContinue = async () => {
    await actions.advanceOnboarding(4, { weight });
    router.push('/(onboarding)/step-target-weight');
  };

  return (
    <StepHeader
      stepNum={STEP_NUM}
      totalSteps={TOTAL_STEPS}
      kicker="BIOMETRICS"
      title="How much do you weigh?"
      subtitle="We'll use this to set your daily energy target and macro split."
      onContinue={handleContinue}
    >
      <View style={styles.card}>
        <Text style={styles.guidance}>Adjust until it matches your most recent weigh-in.</Text>
        <RulerPicker
          min={MIN}
          max={MAX}
          step={1}
          unit="kg"
          value={weight}
          onChange={setWeight}
        />
        <View style={styles.scaleRow}>
          <Text style={styles.scaleEdge}>{MIN} kg</Text>
          <Text style={styles.scaleEdge}>{MAX} kg</Text>
        </View>
      </View>

      <View style={styles.bullets}>
        <BulletRow icon="activity" text="Track weight trends, not noise." />
        <BulletRow icon="shield" text="Adaptive Coach never shares your data." />
      </View>
    </StepHeader>
  );
}

function BulletRow({
  icon,
  text,
}: {
  icon: keyof typeof Feather.glyphMap;
  text: string;
}) {
  return (
    <View style={styles.bulletRow}>
      <View style={styles.bulletBadge}>
        <Feather name={icon} size={14} color={colors.primary} />
      </View>
      <Text style={styles.bulletText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: radii.lg,
    padding: spacing.lg,
    marginTop: spacing.md,
    marginBottom: spacing.lg,
  },
  guidance: {
    fontFamily: 'Inter_500Medium',
    fontSize: 13,
    color: colors.textMuted,
    marginBottom: spacing.sm,
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
  bullets: {
    gap: spacing.sm,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  bulletBadge: {
    width: 28,
    height: 28,
    borderRadius: radii.pill,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bulletText: {
    flex: 1,
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    color: colors.textMuted,
  },
});
