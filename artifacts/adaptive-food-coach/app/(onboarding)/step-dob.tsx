import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useAppStore } from '@/hooks/useAppStore';
import { OnboardingShell } from './_components/OnboardingShell';
import { OnboardingWheel } from './_components/OnboardingWheel';
import { progressFor, ROUTE_TO_INDEX } from './_components/progress';

const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];
const YEARS = Array.from({ length: 2015 - 1950 + 1 }, (_, i) => String(1950 + i));
const DEFAULT_ISO = '1990-01-26';

function daysInMonth(year: string, month: string) {
  const monthIndex = MONTHS.indexOf(month);
  const y = Number(year);
  if (monthIndex < 0 || !Number.isFinite(y)) return 31;
  return new Date(y, monthIndex + 1, 0).getDate();
}

function clampDay(year: string, month: string, day: string) {
  const max = daysInMonth(year, month);
  const n = Math.min(Math.max(1, Number(day) || 1), max);
  return String(n);
}

function isoDateFromParts(year: string, month: string, day: string): string {
  const safeDay = clampDay(year, month, day);
  return `${year}-${String(MONTHS.indexOf(month) + 1).padStart(2, '0')}-${safeDay.padStart(2, '0')}`;
}

function parseIso(iso: string) {
  const [rawYear = '1990', rawMonth = '01', rawDay = '26'] = iso.split('-');
  const year = YEARS.includes(rawYear) ? rawYear : '1990';
  const month = MONTHS[Number(rawMonth) - 1] ?? 'January';
  return { year, month, day: clampDay(year, month, String(Number(rawDay))) };
}

export default function StepDobScreen() {
  const router = useRouter();
  const { actions, state } = useAppStore();
  const stored = typeof state.onboarding.answers.dob === 'string' ? state.onboarding.answers.dob : DEFAULT_ISO;
  const [parts, setParts] = useState(() => parseIso(stored));
  const days = useMemo(
    () => Array.from({ length: daysInMonth(parts.year, parts.month) }, (_, i) => String(i + 1)),
    [parts.year, parts.month],
  );
  const iso = useMemo(() => isoDateFromParts(parts.year, parts.month, parts.day), [parts]);

  const handleContinue = async () => {
    await actions.advanceOnboarding(ROUTE_TO_INDEX['step-goals'], { dob: iso });
    router.push('/(onboarding)/step-goals');
  };

  return (
    <OnboardingShell
      progress={progressFor('step-dob')}
      title="When were you born?"
      subtitle="This will be used to calibrate your custom plan"
      onContinue={handleContinue}
      bodyCentered
      flush
    >
      <View style={styles.row}>
        <OnboardingWheel
          values={MONTHS}
          value={parts.month}
          onChange={(month) => setParts((p) => ({ ...p, month, day: clampDay(p.year, month, p.day) }))}
          width={113}
        />
        <OnboardingWheel
          values={days}
          value={parts.day}
          onChange={(day) => setParts((p) => ({ ...p, day: clampDay(p.year, p.month, day) }))}
          width={101}
        />
        <OnboardingWheel
          values={YEARS}
          value={parts.year}
          onChange={(year) => setParts((p) => ({ ...p, year, day: clampDay(year, p.month, p.day) }))}
          width={101}
        />
      </View>
    </OnboardingShell>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'center', gap: 16, alignItems: 'center' },
});
