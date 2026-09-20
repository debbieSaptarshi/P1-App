import { localDate } from '@/services/dates';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, radii, spacing } from '@/constants/tokens';
import { Button, Card, Header, RulerPicker } from '@/components/ui';
import { useAppStore, appStoreActions } from '@/hooks/useAppStore';

/**
 * Edit screen for the current weight entry.
 *
 * Uses the shared `RulerPicker` (40..180 kg) and saves both an updated
 * `profile.currentWeightKg` and a new `WeightEntry` for the trend line.
 */
export default function WeightEditScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { state } = useAppStore();
  const [value, setValue] = useState<number>(state.profile.currentWeightKg);

  const save = () => {
    appStoreActions.updateProfile({
      currentWeightKg: value,
      updatedAt: new Date().toISOString(),
    });
    appStoreActions.addWeight({
      date: localDate(),
      weightKg: value,
      note: 'manual edit',
    });
    router.back();
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <Header
        title="Current Weight"
        subtitle="Used for calorie targets"
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
          <Text style={styles.label}>Today</Text>
          <View style={styles.row}>
            <Text style={styles.value}>{value.toFixed(1)}</Text>
            <Text style={styles.unit}>kg</Text>
          </View>
          <RulerPicker
            min={40}
            max={180}
            step={0.5}
            value={value}
            unit="kg"
            onChange={setValue}
          />
        </Card>

        <Card style={styles.helperCard}>
          <Text style={styles.helperTitle}>Why we ask</Text>
          <Text style={styles.helperBody}>
            We use your weight to compute daily calorie and protein targets.
            Aim to weigh in at the same time of day, ideally first thing in the
            morning before eating.
          </Text>
        </Card>

        <Button
          title="Save Weight"
          onPress={save}
          leadingIcon="check"
          style={styles.saveCta}
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  label: {
    fontFamily: 'Inter_500Medium',
    fontSize: 12,
    color: colors.textMuted,
    marginBottom: spacing.xxs,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: spacing.xs,
  },
  value: {
    fontFamily: 'Inter_700Bold',
    fontSize: 44,
    color: colors.textPrimary,
    letterSpacing: -1,
  },
  unit: {
    fontFamily: 'Inter_500Medium',
    fontSize: 16,
    color: colors.textMuted,
  },
  helperCard: { marginTop: spacing.md, gap: spacing.xs },
  helperTitle: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 15,
    color: colors.textPrimary,
  },
  helperBody: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    color: colors.textMuted,
    lineHeight: 19,
  },
  saveCta: {
    marginTop: spacing.xl,
    borderRadius: radii.xl,
  },
});
