import React, { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { CircularSaucer } from '@/components/meals/CircularSaucer';
import { MEAL_EMOJI, MEAL_LABELS, MEAL_ORDER } from '@/constants/homeLayouts';
import { remainingFor, resolveProgram, type ProgramDefinition } from '@/constants/programs';
import { colors, radii, spacing } from '@/constants/tokens';
import { useAppStore } from '@/hooks/useAppStore';
import type { FoodLogEntry, MealType } from '@/types';

export function JournalHome({
  selectedIso,
  program: programProp,
}: {
  selectedIso: string;
  program?: ProgramDefinition;
}) {
  const router = useRouter();
  const { foodLogForDate, state } = useAppStore();
  const program = programProp ?? resolveProgram(state.preferences.programId);
  const log = foodLogForDate(selectedIso);
  const goals = state.profile.nutrientGoals;
  const totals = {
    caloriesLeft: Math.max(0, goals.calories - log.totals.calories),
    calorieGoal: goals.calories,
    calorieProgress: goals.calories ? (log.totals.calories / goals.calories) * 100 : 0,
    proteinLeft: Math.max(0, goals.protein - log.totals.protein),
    proteinGoal: goals.protein,
    proteinProgress: goals.protein ? (log.totals.protein / goals.protein) * 100 : 0,
    carbsLeft: Math.max(0, goals.carbs - log.totals.carbs),
    carbGoal: goals.carbs,
    carbProgress: goals.carbs ? (log.totals.carbs / goals.carbs) * 100 : 0,
    fatLeft: Math.max(0, goals.fat - log.totals.fat),
    fatGoal: goals.fat,
    fatProgress: goals.fat ? (log.totals.fat / goals.fat) * 100 : 0,
    fiberLeft: Math.max(0, goals.fiber - log.totals.fiber),
    fiberGoal: goals.fiber,
    fiberProgress: goals.fiber ? (log.totals.fiber / goals.fiber) * 100 : 0,
  };
  const primary = remainingFor(program.heroMetric, totals);
  const secondary = remainingFor(program.macroCards[0] ?? program.heroMetric, totals);

  const grouped = useMemo(() => {
    const buckets: Record<MealType, FoodLogEntry[]> = {
      breakfast: [],
      lunch: [],
      dinner: [],
      snack: [],
    };
    for (const entry of log.entries) buckets[entry.mealType].push(entry);
    return buckets;
  }, [log.entries]);

  const mealCount = log.entries.length;

  const openLog = () => {
    Haptics.selectionAsync();
    router.push('/log-food');
  };

  return (
    <View style={styles.root}>
      <Animated.View entering={FadeInDown.duration(400).delay(200)} style={styles.summary}>
        <View>
          <Text style={styles.summaryKicker}>Today’s plate</Text>
          <Text style={styles.summaryTitle}>
            {mealCount === 0 ? 'Nothing logged yet' : `${mealCount} meal${mealCount === 1 ? '' : 's'} logged`}
          </Text>
        </View>
        <View style={styles.needRow}>
          <NeedChip
            label={`${primary.label.replace(' Left', '')} still needed`}
            value={`${Math.round(primary.left)}${primary.unit ? ` ${primary.unit}` : ''}`}
          />
          <NeedChip
            label={`${secondary.label.replace(' Left', '')} still needed`}
            value={`${Math.round(secondary.left)}${secondary.unit ? ` ${secondary.unit}` : ''}`}
          />
        </View>
      </Animated.View>

      {MEAL_ORDER.map((mealType, index) => {
        const entries = grouped[mealType];
        return (
          <Animated.View
            key={mealType}
            entering={FadeInDown.duration(400).delay(240 + index * 40)}
            style={styles.slot}
          >
            <View style={styles.slotHeader}>
              <Text style={styles.slotTitle}>
                {MEAL_EMOJI[mealType]}  {MEAL_LABELS[mealType]}
              </Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Log ${MEAL_LABELS[mealType]}`}
                testID={`journal-log-${mealType}`}
                onPress={openLog}
                style={({ pressed }) => pressed && styles.pressed}
              >
                <Text style={styles.slotAction}>Add</Text>
              </Pressable>
            </View>
            {entries.length === 0 ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Log ${MEAL_LABELS[mealType]}`}
                onPress={openLog}
                style={({ pressed }) => [styles.emptyCard, pressed && styles.pressed]}
              >
                <Feather name="plus" size={18} color={colors.textMuted} />
                <Text style={styles.emptyText}>Log {MEAL_LABELS[mealType].toLowerCase()}</Text>
              </Pressable>
            ) : (
              entries.map((entry) => (
                <Pressable
                  key={entry.id}
                  accessibilityRole="button"
                  accessibilityLabel={entry.food.name}
                  testID={`journal-entry-${entry.id}`}
                  onPress={() => {
                    Haptics.selectionAsync();
                    router.push(`/log-food/detail/${entry.id}`);
                  }}
                  style={({ pressed }) => [styles.entryCard, pressed && styles.pressed]}
                >
                  {entry.food.image ? (
                    <CircularSaucer source={{ uri: entry.food.image }} size={56} />
                  ) : (
                    <View style={styles.emojiPlate}>
                      <Text style={styles.emojiOverlay}>{MEAL_EMOJI[entry.mealType]}</Text>
                    </View>
                  )}
                  <View style={styles.entryBody}>
                    <Text style={styles.entryName} numberOfLines={1}>
                      {entry.food.name}
                    </Text>
                    <Text style={styles.entryMeta}>
                      {Math.round(entry.food.protein * entry.quantity)} g protein
                      {entry.food.fiber != null
                        ? ` · ${Math.round((entry.food.fiber ?? 0) * entry.quantity)} g fiber`
                        : ''}
                    </Text>
                  </View>
                  <Feather name="chevron-right" size={18} color={colors.textMuted} />
                </Pressable>
              ))
            )}
          </Animated.View>
        );
      })}

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Scan a meal photo"
        testID="journal-scan"
        onPress={() => {
          Haptics.selectionAsync();
          router.push('/scan/food-camera');
        }}
        style={({ pressed }) => [styles.scanCta, pressed && styles.pressed]}
      >
        <Feather name="camera" size={18} color={colors.textInverse} />
        <Text style={styles.scanCtaText}>Log with a photo</Text>
      </Pressable>
    </View>
  );
}

function NeedChip({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.needChip}>
      <Text style={styles.needValue}>{value}</Text>
      <Text style={styles.needLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: 16, marginBottom: 8 },
  summary: {
    backgroundColor: colors.darkSurface,
    borderRadius: radii.xl,
    padding: 18,
    gap: 16,
  },
  summaryKicker: {
    color: '#94A3B8',
    fontSize: 13,
    fontFamily: 'Inter_500Medium',
  },
  summaryTitle: {
    color: colors.textInverse,
    fontSize: 22,
    fontFamily: 'Inter_700Bold',
    letterSpacing: -0.4,
    marginTop: 4,
  },
  needRow: { flexDirection: 'row', gap: 8 },
  needChip: {
    flex: 1,
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 12,
    gap: 2,
  },
  needValue: {
    color: colors.textInverse,
    fontFamily: 'Inter_600SemiBold',
    fontSize: 16,
  },
  needLabel: {
    color: '#94A3B8',
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
  },
  slot: { gap: 8 },
  slotHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
  },
  slotTitle: {
    fontFamily: 'Inter_700Bold',
    fontSize: 16,
    color: colors.textPrimary,
  },
  slotAction: {
    fontFamily: 'Inter_500Medium',
    fontSize: 13,
    color: colors.textMuted,
  },
  emptyCard: {
    minHeight: 64,
    borderRadius: radii.xl,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderStyle: 'dashed',
    backgroundColor: colors.card,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  emptyText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 14,
    color: colors.textMuted,
  },
  entryCard: {
    backgroundColor: colors.card,
    borderRadius: radii.xl,
    padding: spacing.xs,
    paddingRight: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  emojiPlate: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.formFill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emojiOverlay: {
    fontSize: 22,
  },
  entryBody: { flex: 1, minWidth: 0, gap: 2 },
  entryName: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 15,
    color: colors.textPrimary,
  },
  entryMeta: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: colors.textMuted,
  },
  scanCta: {
    height: 52,
    borderRadius: radii.xl,
    backgroundColor: colors.darkSurface,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 4,
  },
  scanCtaText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 15,
    color: colors.textInverse,
  },
  pressed: { opacity: 0.72 },
});
