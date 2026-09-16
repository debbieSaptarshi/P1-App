import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { RulerPicker } from '@/components/ui';
import { StepHeader } from './_components/StepHeader';
import { colors, radii, spacing } from '@/constants/tokens';
import { useAppStore } from '@/hooks/useAppStore';

const TOTAL_STEPS = 10;
const STEP_NUM = 3;
const MIN = 140;
const MAX = 210;
const DEFAULT = 170;

export default function StepHeightScreen() {
  const router = useRouter();
  const { actions, state } = useAppStore();
  const initial =
    typeof state.onboarding.answers.height === 'number'
      ? (state.onboarding.answers.height as number)
      : DEFAULT;
  const [height, setHeight] = useState<number>(initial);

  const handleContinue = async () => {
    await actions.advanceOnboarding(3, { height });
    router.push('/(onboarding)/step-weight');
  };

  return (
    <StepHeader
      stepNum={STEP_NUM}
      totalSteps={TOTAL_STEPS}
      kicker="BIOMETRICS"
      title="How tall are you?"
      subtitle="Used alongside weight to compute your base calorie target."
      onContinue={handleContinue}
    >
      <View style={styles.card}>
        <Text style={styles.guidance}>Tap the level or use the buttons to fine-tune.</Text>
        <RulerPicker
          min={MIN}
          max={MAX}
          step={1}
          unit="cm"
          value={height}
          onChange={setHeight}
        />
        <View style={styles.scaleRow}>
          <Text style={styles.scaleEdge}>{MIN} cm</Text>
          <Text style={styles.scaleEdge}>{MAX} cm</Text>
        </View>
      </View>

      <View style={styles.bullets}>
        <BulletRow icon="lock" text="Your data stays private to your account." />
        <BulletRow icon="trending-up" text="Calorie and macro targets update as you log." />
        <BulletRow icon="refresh-cw" text="Re-take this anytime from profile settings." />
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
