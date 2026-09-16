import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { WheelPicker } from '@/components/ui';
import { StepHeader } from './_components/StepHeader';
import { colors, radii, spacing } from '@/constants/tokens';
import { useAppStore } from '@/hooks/useAppStore';

const TOTAL_STEPS = 10;
const STEP_NUM = 6;

const DAYS = Array.from({ length: 31 }, (_, i) => String(i + 1).padStart(2, '0'));
const MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];
const YEARS = (() => {
  const thisYear = new Date().getFullYear();
  const start = thisYear - 80;
  const end = thisYear - 14;
  return Array.from({ length: end - start + 1 }, (_, i) => String(end - i));
})();

function isoDateFromParts(year: string, month: string, day: string): string {
  const monthIndex = MONTHS.indexOf(month) + 1;
  const monthPadded = String(monthIndex).padStart(2, '0');
  return `${year}-${monthPadded}-${day}`;
}

export default function StepDobScreen() {
  const router = useRouter();
  const { actions, state } = useAppStore();

  const stored = typeof state.onboarding.answers.dob === 'string'
    ? (state.onboarding.answers.dob as string)
    : '1995-01-01';
  const [parts, setParts] =
    useState<{ year: string; month: string; day: string }>(() => parseIso(stored));

  const { year, month, day } = parts;
  const iso = useMemo(() => isoDateFromParts(year, month, day), [year, month, day]);
  const age = useMemo(() => computeAge(iso), [iso]);

  const handleContinue = async () => {
    await actions.advanceOnboarding(6, { dob: iso });
    router.push('/(onboarding)/step-goals');
  };

  return (
    <StepHeader
      stepNum={STEP_NUM}
      totalSteps={TOTAL_STEPS}
      kicker="ABOUT YOU"
      title="When's your birthday?"
      subtitle="Age helps us shape rest-day cues and recovery recommendations."
      onContinue={handleContinue}
    >
      <View style={styles.card}>
        <Text style={styles.label}>Day</Text>
        <View style={styles.wheelRow}>
          <View style={styles.wheelCol}>
            <WheelPicker
              values={DAYS}
              value={day}
              onChange={(v) => setParts((p) => ({ ...p, day: v }))}
              itemHeight={40}
              visibleItemCount={5}
            />
          </View>
          <View style={styles.wheelCol}>
            <Text style={styles.label}>Month</Text>
            <WheelPicker
              values={MONTHS}
              value={month}
              onChange={(v) => setParts((p) => ({ ...p, month: v }))}
              itemHeight={40}
              visibleItemCount={5}
            />
          </View>
          <View style={styles.wheelCol}>
            <Text style={styles.label}>Year</Text>
            <WheelPicker
              values={YEARS}
              value={year}
              onChange={(v) => setParts((p) => ({ ...p, year: v }))}
              itemHeight={40}
              visibleItemCount={5}
            />
          </View>
        </View>

        <View style={styles.previewRow}>
          <Feather name="gift" size={14} color={colors.primary} />
          <Text style={styles.previewText}>{formatPretty(iso)} · {age} years old</Text>
        </View>
      </View>
    </StepHeader>
  );
}

function parseIso(iso: string): { year: string; month: string; day: string } {
  const [y, m, d] = iso.split('-');
  const monthIdx = Math.max(0, Math.min(MONTHS.length - 1, parseInt(m, 10) - 1));
  return {
    year: y,
    month: MONTHS[monthIdx] ?? 'Jan',
    day: d,
  };
}

function computeAge(iso: string): number {
  const today = new Date();
  const [y, m, d] = iso.split('-').map(Number);
  const birth = new Date(y, m - 1, d);
  let age = today.getFullYear() - birth.getFullYear();
  const mDiff = today.getMonth() - birth.getMonth();
  if (mDiff < 0 || (mDiff === 0 && today.getDate() < birth.getDate())) {
    age -= 1;
  }
  return Math.max(0, age);
}

function formatPretty(iso: string): string {
  const [y, m, d] = iso.split('-');
  return `${MONTHS[parseInt(m, 10) - 1]} ${parseInt(d, 10)}, ${y}`;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: radii.lg,
    padding: spacing.lg,
    marginTop: spacing.md,
  },
  wheelRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  wheelCol: {
    flex: 1,
    alignItems: 'center',
  },
  label: {
    fontFamily: 'Inter_500Medium',
    fontSize: 11,
    color: colors.textMuted,
    letterSpacing: 1.2,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  previewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingTop: spacing.md,
    marginTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  previewText: {
    flex: 1,
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
    color: colors.textPrimary,
  },
});
