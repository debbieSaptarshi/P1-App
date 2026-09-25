import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '@/constants/tokens';
import { useAppStore } from '@/hooks/useAppStore';
import { OnboardingShell } from './_components/OnboardingShell';
import { OnboardingWheel } from './_components/OnboardingWheel';
import { continueToNextStep } from './_components/navigate';
import { progressFor } from './_components/progress';

const HEIGHTS_CM = Array.from({ length: 71 }, (_, i) => 140 + i);
const WEIGHTS_KG = Array.from({ length: 141 }, (_, i) => 40 + i);
const HEIGHTS_IN = Array.from({ length: 29 }, (_, i) => 55 + i);
const WEIGHTS_LB = Array.from({ length: 310 }, (_, i) => 88 + i);
const WHEEL_WIDTH = 101;
const CM_PER_INCH = 2.54;
const LB_PER_KG = 2.20462;
const DEFAULT_HEIGHT_CM = 165;
const DEFAULT_WEIGHT_KG = 70;

function cmToInches(cm: number) {
  return Math.round(cm / CM_PER_INCH);
}

function inchesToCm(inches: number) {
  return Math.round(inches * CM_PER_INCH);
}

function kgToLb(kg: number) {
  return Math.round(kg * LB_PER_KG);
}

function lbToKg(lb: number) {
  return Math.round(lb / LB_PER_KG);
}

function formatFtIn(totalInches: number) {
  const ft = Math.floor(totalInches / 12);
  const inch = totalInches % 12;
  return `${ft}'${inch}"`;
}

function parseFtIn(label: string) {
  const match = label.match(/^(\d+)'(\d+)"$/);
  if (!match) return cmToInches(DEFAULT_HEIGHT_CM);
  return Number(match[1]) * 12 + Number(match[2]);
}

function storedNumber(value: unknown, fallback: number) {
  return typeof value === 'number' ? value : fallback;
}

export default function StepHeightScreen() {
  const router = useRouter();
  const { actions, state } = useAppStore();
  const [metric, setMetric] = useState(true);
  const [height, setHeight] = useState(() =>
    storedNumber(state.onboarding.answers.height, DEFAULT_HEIGHT_CM),
  );
  const [weight, setWeight] = useState(() =>
    storedNumber(state.onboarding.answers.weight, DEFAULT_WEIGHT_KG),
  );

  const heightValues = useMemo(
    () => (metric ? HEIGHTS_CM.map((cm) => `${cm} cm`) : HEIGHTS_IN.map(formatFtIn)),
    [metric],
  );
  const weightValues = useMemo(
    () => (metric ? WEIGHTS_KG.map((kg) => `${kg} Kg`) : WEIGHTS_LB.map((lb) => `${lb} lb`)),
    [metric],
  );

  const heightValue = metric ? `${height} cm` : formatFtIn(cmToInches(height));
  const weightValue = metric ? `${weight} Kg` : `${kgToLb(weight)} lb`;

  const handleHeightChange = (value: string) => {
    setHeight(metric ? parseInt(value, 10) : inchesToCm(parseFtIn(value)));
  };

  const handleWeightChange = (value: string) => {
    const n = parseInt(value, 10);
    setWeight(metric ? n : lbToKg(n));
  };

  const handleContinue = async () => {
    await continueToNextStep(router, actions, 'step-height', { height, weight });
  };

  return (
    <OnboardingShell
      progress={progressFor('step-height')}
      title="Height and Weight"
      subtitle="This will be used to calibrate your custom plan"
      onContinue={handleContinue}
      bodyCentered
      flush
    >
      <View style={styles.stack}>
        <View style={styles.unitRow}>
          <Pressable onPress={() => setMetric(false)} hitSlop={8}>
            <Text style={styles.unitLabel}>Imperial</Text>
          </Pressable>
          <Pressable
            accessibilityRole="switch"
            accessibilityLabel="Use metric units"
            accessibilityState={{ checked: metric }}
            onPress={() => setMetric((on) => !on)}
            style={[styles.toggle, metric ? styles.toggleOn : styles.toggleOff]}
          >
            <View style={styles.knob} />
          </Pressable>
          <Pressable onPress={() => setMetric(true)} hitSlop={8}>
            <Text style={styles.unitLabel}>Metric</Text>
          </Pressable>
        </View>
        <View style={styles.columns}>
          <View style={styles.column}>
            <Text style={styles.colLabel}>Height</Text>
            <OnboardingWheel
              values={heightValues}
              value={heightValues.includes(heightValue) ? heightValue : heightValues[0] ?? ''}
              onChange={handleHeightChange}
              width={WHEEL_WIDTH}
            />
          </View>
          <View style={styles.column}>
            <Text style={styles.colLabel}>Weight</Text>
            <OnboardingWheel
              values={weightValues}
              value={weightValues.includes(weightValue) ? weightValue : weightValues[0] ?? ''}
              onChange={handleWeightChange}
              width={WHEEL_WIDTH}
            />
          </View>
        </View>
      </View>
    </OnboardingShell>
  );
}

const styles = StyleSheet.create({
  stack: {
    alignItems: 'center',
    gap: 16,
    paddingHorizontal: 20,
  },
  unitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  unitLabel: {
    width: 60,
    fontFamily: 'Inter_500Medium',
    fontSize: 16,
    lineHeight: 22,
    letterSpacing: -0.18,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  toggle: {
    width: 36,
    height: 24,
    borderRadius: 12,
    padding: 4,
    justifyContent: 'center',
  },
  toggleOn: {
    backgroundColor: colors.primary,
    alignItems: 'flex-end',
  },
  toggleOff: {
    backgroundColor: colors.background,
    alignItems: 'flex-start',
  },
  knob: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: colors.card,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.16,
    shadowRadius: 1.5,
    elevation: 2,
  },
  columns: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 16,
    width: '100%',
  },
  column: {
    flex: 1,
    alignItems: 'center',
    gap: 16,
  },
  colLabel: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    lineHeight: 20,
    letterSpacing: -0.16,
    color: colors.textPrimary,
    textAlign: 'center',
    width: '100%',
  },
});
