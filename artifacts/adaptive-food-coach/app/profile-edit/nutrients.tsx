import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing } from '@/constants/tokens';
import { Button, Card, Header, RulerPicker } from '@/components/ui';
import { useAppStore, appStoreActions } from '@/hooks/useAppStore';
import type { NutrientGoals } from '@/types';

interface NutrientConfig {
  key: keyof NutrientGoals;
  label: string;
  unit: string;
  min: number;
  max: number;
  step: number;
  helper: string;
}

const NUTRIENT_CONFIG: NutrientConfig[] = [
  { key: 'calories', label: 'Calories', unit: 'kcal', min: 1200, max: 4000, step: 50, helper: 'Daily energy target.' },
  { key: 'protein', label: 'Protein', unit: 'g', min: 40, max: 250, step: 5, helper: 'Supports muscle preservation.' },
  { key: 'carbs', label: 'Carbs', unit: 'g', min: 30, max: 500, step: 5, helper: 'Fuel for movement and focus.' },
  { key: 'fat', label: 'Fat', unit: 'g', min: 20, max: 180, step: 5, helper: 'Healthy fats, satiety, hormones.' },
  { key: 'fiber', label: 'Fiber', unit: 'g', min: 10, max: 60, step: 1, helper: 'Keeps things moving.' },
  { key: 'sodium', label: 'Sodium', unit: 'mg', min: 800, max: 4500, step: 50, helper: 'Watch for bloating.' },
  { key: 'waterMl', label: 'Water', unit: 'ml', min: 1000, max: 5000, step: 100, helper: 'Total fluid intake for the day.' },
];

/**
 * Edit screen for every nutrient target on `profile.nutrientGoals`.
 *
 * Each row pairs a `RulerPicker` with a Card so the user can tune one
 * nutrient at a time without losing context. The full `nutrientGoals`
 * object is persisted in a single update on save.
 */
export default function NutrientsEditScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { state } = useAppStore();
  const [draft, setDraft] = useState<NutrientGoals>(state.profile.nutrientGoals);

  const updateDraft = (key: keyof NutrientGoals, next: number) => {
    setDraft((prev) => ({ ...prev, [key]: next }));
  };

  const save = () => {
    appStoreActions.updateProfile({
      nutrientGoals: draft,
      dailyStepGoal: state.profile.dailyStepGoal,
      updatedAt: new Date().toISOString(),
    });
    router.back();
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <Header
        title="Daily Nutrient Goals"
        subtitle="Tune one row at a time"
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
        {NUTRIENT_CONFIG.map((config) => (
          <NutrientRow
            key={config.key}
            config={config}
            value={draft[config.key]}
            onChange={(v) => updateDraft(config.key, v)}
          />
        ))}

        <Button title="Save Goals" onPress={save} leadingIcon="check" style={styles.saveCta} />
      </ScrollView>
    </View>
  );
}

interface NutrientRowProps {
  config: NutrientConfig;
  value: number;
  onChange: (next: number) => void;
}

function NutrientRow({ config, value, onChange }: NutrientRowProps) {
  return (
    <Card style={styles.row}>
      <View style={styles.rowHeader}>
        <Text style={styles.label}>{config.label}</Text>
        <Text style={styles.value}>
          {value.toLocaleString()}
          <Text style={styles.unit}> {config.unit}</Text>
        </Text>
      </View>
      <RulerPicker
        min={config.min}
        max={config.max}
        step={config.step}
        value={value}
        unit={config.unit}
        onChange={onChange}
      />
      <Text style={styles.helper}>{config.helper}</Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  row: { marginBottom: spacing.md },
  rowHeader: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    marginBottom: spacing.xxs,
  },
  label: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 13,
    color: colors.textMuted,
  },
  value: {
    fontFamily: 'Inter_700Bold',
    fontSize: 24,
    color: colors.textPrimary,
    letterSpacing: -0.5,
  },
  unit: {
    fontFamily: 'Inter_500Medium',
    fontSize: 13,
    color: colors.textMuted,
  },
  helper: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
  saveCta: { marginTop: spacing.md },
});
