import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing, radii } from '@/constants/tokens';
import { Button, Card, Header, WheelPicker } from '@/components/ui';
import { useAppStore, appStoreActions } from '@/hooks/useAppStore';

const DAYS = Array.from({ length: 31 }, (_, i) => String(i + 1).padStart(2, '0'));
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: 100 }, (_, i) => String(CURRENT_YEAR - i));

/**
 * Edit screen for date of birth. Uses three stacked `WheelPicker` columns
 * (day, month, year) and composes them into a single ISO date string.
 */
export default function DobEditScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { state } = useAppStore();
  const initial = useMemo(() => parseIsoDate(state.profile.dateOfBirth), [state.profile.dateOfBirth]);
  const [day, setDay] = useState<string>(initial.day);
  const [month, setMonth] = useState<string>(initial.month);
  const [year, setYear] = useState<string>(initial.year);

  const iso = useMemo(() => composeIso(year, month, day), [year, month, day]);
  const isValid = useMemo(() => Number.isFinite(Date.parse(iso)), [iso]);

  const save = () => {
    if (!isValid) return;
    appStoreActions.updateProfile({
      dateOfBirth: iso,
      updatedAt: new Date().toISOString(),
    });
    router.back();
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <Header
        title="Date of Birth"
        subtitle="Used for age-adjusted nutrition targets"
        rightIcon="check"
        onRightPress={save}
      />
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: spacing.lg,
          paddingBottom: insets.bottom + spacing.xxxl,
        }}
        showsVerticalScrollIndicator={false}
      >
        <Card>
          <Text style={styles.previewLabel}>Selected</Text>
          <Text style={styles.previewValue}>{formatPretty(iso)}</Text>
          {!isValid && (
            <Text style={styles.warning}>That date is not valid — adjust to continue.</Text>
          )}
          <View style={styles.wheelRow}>
            <View style={styles.wheelColumn}>
              <Text style={styles.columnLabel}>Day</Text>
              <WheelPicker
                values={DAYS}
                value={day}
                onChange={setDay}
                itemHeight={40}
                visibleItemCount={5}
              />
            </View>
            <View style={styles.wheelColumn}>
              <Text style={styles.columnLabel}>Month</Text>
              <WheelPicker
                values={MONTHS}
                value={month}
                onChange={setMonth}
                itemHeight={40}
                visibleItemCount={5}
              />
            </View>
            <View style={styles.wheelColumn}>
              <Text style={styles.columnLabel}>Year</Text>
              <WheelPicker
                values={YEARS}
                value={year}
                onChange={setYear}
                itemHeight={40}
                visibleItemCount={5}
              />
            </View>
          </View>
          <View style={styles.shortcuts}>
            <ShortcutChip label="Today" onPress={() => applyToday(setDay, setMonth, setYear)} />
            <ShortcutChip label="Clear" onPress={() => { setDay('01'); setMonth('January'); setYear(String(CURRENT_YEAR - 30)); }} />
          </View>
        </Card>

        <Button
          title="Save Date of Birth"
          onPress={save}
          leadingIcon="check"
          disabled={!isValid}
          style={styles.saveCta}
        />
      </ScrollView>
    </View>
  );
}

function parseIsoDate(iso: string): { day: string; month: string; year: string } {
  if (!iso || Number.isNaN(Date.parse(iso))) {
    const fallback = new Date();
    return {
      day: String(fallback.getDate()).padStart(2, '0'),
      month: MONTHS[fallback.getMonth()],
      year: String(fallback.getFullYear()),
    };
  }
  const d = new Date(iso);
  return {
    day: String(d.getDate()).padStart(2, '0'),
    month: MONTHS[d.getMonth()],
    year: String(d.getFullYear()),
  };
}

function applyToday(
  setDay: (v: string) => void,
  setMonth: (v: string) => void,
  setYear: (v: string) => void,
) {
  const d = new Date();
  setDay(String(d.getDate()).padStart(2, '0'));
  setMonth(MONTHS[d.getMonth()]);
  setYear(String(d.getFullYear()));
}

function composeIso(year: string, month: string, day: string): string {
  const monthIdx = MONTHS.indexOf(month);
  if (monthIdx < 0) return '';
  return `${year}-${String(monthIdx + 1).padStart(2, '0')}-${day}`;
}

function formatPretty(iso: string): string {
  if (!iso || Number.isNaN(Date.parse(iso))) return '—';
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, {
    weekday: 'short',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function ShortcutChip({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      testID={`dob-shortcut-${label.toLowerCase()}`}
      style={({ pressed }) => [styles.chip, pressed && styles.chipPressed]}
    >
      <Text style={styles.chipLabel}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  previewLabel: {
    fontFamily: 'Inter_500Medium',
    fontSize: 12,
    color: colors.textMuted,
    marginBottom: spacing.xxs,
  },
  previewValue: {
    fontFamily: 'Inter_700Bold',
    fontSize: 22,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  warning: {
    fontFamily: 'Inter_500Medium',
    fontSize: 12,
    color: colors.accentRed,
    marginBottom: spacing.xs,
  },
  wheelRow: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  wheelColumn: {
    flex: 1,
  },
  columnLabel: {
    fontFamily: 'Inter_500Medium',
    fontSize: 11,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    textAlign: 'center',
    marginBottom: spacing.xxs,
  },
  shortcuts: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginTop: spacing.sm,
  },
  chip: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: radii.pill,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipPressed: { opacity: 0.7 },
  chipLabel: {
    fontFamily: 'Inter_500Medium',
    fontSize: 12,
    color: colors.textPrimary,
  },
  saveCta: { marginTop: spacing.xl },
});
