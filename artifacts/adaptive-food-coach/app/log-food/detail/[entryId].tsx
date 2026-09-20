import { localDate } from '@/services/dates';
import React, { useCallback, useMemo, useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Button, Header, ModalSheet } from '@/components/ui';
import { colors, radii, spacing } from '@/constants/tokens';
import { useAppStore } from '@/hooks/useAppStore';
import type { FoodItem, FoodLogEntry, MealType } from '@/types';
import { MEAL_LABELS, findFoodLogEntry } from '../_helpers';

const QUANTITY_STEP = 0.25;
const MEAL_OPTIONS: MealType[] = ['breakfast', 'lunch', 'dinner', 'snack'];

/**
 * Detail / edit screen for a single food-log entry.
 *
 * Reads the entry by id across all `foodLogs` days, allows editing
 * the quantity (re-logs as a new entry, since the store does not
 * expose an in-place update), reassigning the meal type, or deleting
 * the entry entirely.
 */
export default function FoodLogDetailScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ entryId?: string }>();
  const { state, actions } = useAppStore();
  const [mealSheetOpen, setMealSheetOpen] = useState(false);
  const [quantity, setQuantity] = useState<number | null>(null);
  const [mealType, setMealType] = useState<MealType | null>(null);

  const entryId = typeof params.entryId === 'string' ? params.entryId : '';

  const lookup = useMemo(() => {
    return findFoodLogEntry(state.foodLogs, entryId);
  }, [state.foodLogs, entryId]);

  const entry: FoodLogEntry | null = lookup
    ? lookup.daily.entries[lookup.entryIndex]
    : null;

  // Sync local edit state when the entry id changes.
  const effectiveQuantity = quantity ?? entry?.quantity ?? 0;
  const effectiveMeal = mealType ?? entry?.mealType ?? 'lunch';

  const totals = useMemo(() => {
    if (!entry) return null;
    return {
      calories: Math.round(entry.food.calories * effectiveQuantity),
      protein: +(entry.food.protein * effectiveQuantity).toFixed(1),
      carbs: +(entry.food.carbs * effectiveQuantity).toFixed(1),
      fat: +(entry.food.fat * effectiveQuantity).toFixed(1),
    };
  }, [entry, effectiveQuantity]);

  const adjustQuantity = useCallback(
    (delta: number) => {
      setQuantity((q) => {
        const base = q ?? entry?.quantity ?? 0;
        return Math.max(0.25, +(base + delta).toFixed(2));
      });
    },
    [entry],
  );

  const handleSaveEdits = useCallback(() => {
    if (!entry) return;
    // The store does not provide update-in-place for entries; we
    // delete the original and re-add the edited one with the same date.
    actions.deleteFoodLog(entry.date, entry.id);
    actions.logFood({
      date: entry.date,
      mealType: effectiveMeal,
      food: entry.food,
      quantity: effectiveQuantity,
    });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setQuantity(null);
    setMealType(null);
    router.back();
  }, [actions, effectiveMeal, effectiveQuantity, entry, router]);

  const handleDelete = useCallback(() => {
    if (!entry) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert(
      'Delete entry?',
      `Remove this ${entry.food.name} entry from your food log.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            actions.deleteFoodLog(entry.date, entry.id);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            router.back();
          },
        },
      ],
    );
  }, [actions, entry, router]);

  if (!entry) {
    return (
      <View style={[styles.root, { paddingTop: insets.top }]}>
        <Stack.Screen options={{ headerShown: false }} />
        <Header title="Entry" />
        <View style={styles.empty}>
          <Feather name="alert-circle" size={28} color={colors.textMuted} />
          <Text style={styles.emptyTitle}>Entry not found</Text>
          <Text style={styles.emptyBody}>
            It may have been removed already. Return to today&apos;s diary to
            continue.
          </Text>
          <Button
            title="Back to log"
            variant="primary"
            onPress={() => router.replace('/log-food')}
            testID="detail-back"
          />
        </View>
      </View>
    );
  }

  const isEdited = quantity !== null || mealType !== null;

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <Stack.Screen options={{ headerShown: false }} />
      <Header
        title={MEAL_LABELS[entry.mealType]}
        subtitle={formatDate(entry.date)}
        rightIcon="trash-2"
        onRightPress={handleDelete}
      />

      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingBottom: insets.bottom + 160 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.hero}>
          <View style={styles.heroBadge}>
            <Feather name="package" size={20} color={colors.primary} />
          </View>
          <Text style={styles.heroName}>{entry.food.name}</Text>
          {entry.food.brand ? (
            <Text style={styles.heroBrand}>{entry.food.brand}</Text>
          ) : null}
          <Text style={styles.heroMeta}>
            {entry.food.servingSize} · Logged at {formatTime(entry.loggedAt)}
          </Text>
          <View style={styles.heroMacroRow}>
            <HeroMacro label="Calories" value={`${totals?.calories ?? 0}`} />
            <HeroMacro label="Protein" value={`${totals?.protein ?? 0} g`} />
            <HeroMacro label="Carbs" value={`${totals?.carbs ?? 0} g`} />
            <HeroMacro label="Fat" value={`${totals?.fat ?? 0} g`} />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quantity</Text>
          <View style={styles.qtyRow}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Decrease quantity"
              testID="detail-qty-dec"
              onPress={() => {
                Haptics.selectionAsync();
                adjustQuantity(-QUANTITY_STEP);
              }}
              style={({ pressed }) => [styles.stepBtn, pressed && styles.pressed]}
            >
              <Feather name="minus" size={16} color={colors.textPrimary} />
            </Pressable>
            <View style={styles.qtyValueBox}>
              <Text style={styles.qtyValue}>{effectiveQuantity.toFixed(2)}</Text>
              <Text style={styles.qtyUnit}>× serving</Text>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Increase quantity"
              testID="detail-qty-inc"
              onPress={() => {
                Haptics.selectionAsync();
                adjustQuantity(QUANTITY_STEP);
              }}
              style={({ pressed }) => [styles.stepBtn, pressed && styles.pressed]}
            >
              <Feather name="plus" size={16} color={colors.textPrimary} />
            </Pressable>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Meal</Text>
          <View style={styles.mealRow}>
            {MEAL_OPTIONS.map((m) => (
              <Pressable
                key={m}
                accessibilityRole="button"
                accessibilityLabel={`Move to ${MEAL_LABELS[m]}`}
                accessibilityState={{ selected: effectiveMeal === m }}
                testID={`detail-meal-${m}`}
                onPress={() => {
                  Haptics.selectionAsync();
                  setMealType(m);
                }}
                style={({ pressed }) => [
                  styles.mealChip,
                  effectiveMeal === m && styles.mealChipActive,
                  pressed && styles.pressed,
                ]}
              >
                <Feather
                  name={iconForMeal(m)}
                  size={14}
                  color={effectiveMeal === m ? '#FFFFFF' : colors.textPrimary}
                />
                <Text style={[styles.mealChipLabel, effectiveMeal === m && styles.mealChipLabelActive]}>
                  {MEAL_LABELS[m]}
                </Text>
              </Pressable>
            ))}
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Open meal move sheet"
            testID="detail-meal-sheet"
            onPress={() => setMealSheetOpen(true)}
            style={({ pressed }) => [styles.helperLink, pressed && styles.pressed]}
          >
            <Feather name="repeat" size={14} color={colors.primary} />
            <Text style={styles.helperLinkText}>Move to another day</Text>
          </Pressable>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Original macros</Text>
          <View style={styles.macroList}>
            <MacroRow label="Calories" value={`${entry.food.calories} kcal`} />
            <MacroRow label="Protein" value={`${entry.food.protein} g`} />
            <MacroRow label="Carbs" value={`${entry.food.carbs} g`} />
            <MacroRow label="Fat" value={`${entry.food.fat} g`} />
            {entry.food.fiber != null ? (
              <MacroRow label="Fiber" value={`${entry.food.fiber} g`} />
            ) : null}
            {entry.food.sodium != null ? (
              <MacroRow label="Sodium" value={`${entry.food.sodium} mg`} />
            ) : null}
          </View>
        </View>

        {isEdited ? (
          <View style={styles.dirtyBadge}>
            <Feather name="info" size={14} color={colors.textMuted} />
            <Text style={styles.dirtyText}>
              You have unsaved edits. Save to apply.
            </Text>
          </View>
        ) : null}
      </ScrollView>

      <View
        style={[
          styles.footer,
          { paddingBottom: insets.bottom + spacing.md },
        ]}
      >
        <Button
          title="Cancel"
          variant="outline"
          onPress={() => {
            setQuantity(null);
            setMealType(null);
            router.back();
          }}
          testID="detail-cancel"
          fullWidth={false}
        />
        <Button
          title="Save changes"
          variant="primary"
          leadingIcon="check"
          onPress={handleSaveEdits}
          disabled={!isEdited}
          testID="detail-save"
        />
      </View>

      <ModalSheet
        visible={mealSheetOpen}
        title="Move to day"
        onClose={() => setMealSheetOpen(false)}
        height="55%"
      >
        <View style={styles.modalBody}>
          <Text style={styles.modalSub}>
            Re-assign this entry to a different day in the recent past.
          </Text>
          <View style={styles.dayList}>
            {recentDays(7).map((iso) => (
              <Pressable
                key={iso}
                accessibilityRole="button"
                accessibilityLabel={`Move to ${formatDate(iso)}`}
                testID={`detail-day-${iso}`}
                onPress={() => {
                  actions.deleteFoodLog(entry.date, entry.id);
                  actions.logFood({
                    date: iso,
                    mealType: effectiveMeal,
                    food: entry.food,
                    quantity: effectiveQuantity,
                  });
                  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                  setMealSheetOpen(false);
                  router.back();
                }}
                style={({ pressed }) => [styles.dayRow, pressed && styles.pressed]}
              >
                <Feather
                  name="calendar"
                  size={16}
                  color={iso === entry.date ? colors.primary : colors.textMuted}
                />
                <Text
                  style={[
                    styles.dayRowText,
                    iso === entry.date && styles.dayRowTextActive,
                  ]}
                >
                  {formatDate(iso)}
                </Text>
                {iso === entry.date ? (
                  <Text style={styles.dayRowMark}>Current</Text>
                ) : null}
              </Pressable>
            ))}
          </View>
        </View>
      </ModalSheet>
    </View>
  );
}

function HeroMacro({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.heroMacro}>
      <Text style={styles.heroMacroValue}>{value}</Text>
      <Text style={styles.heroMacroLabel}>{label}</Text>
    </View>
  );
}

function MacroRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.macroRow}>
      <Text style={styles.macroRowLabel}>{label}</Text>
      <Text style={styles.macroRowValue}>{value}</Text>
    </View>
  );
}

function iconForMeal(m: MealType): 'sunrise' | 'cloud' | 'moon' | 'coffee' {
  switch (m) {
    case 'breakfast':
      return 'sunrise';
    case 'lunch':
      return 'cloud';
    case 'dinner':
      return 'moon';
    case 'snack':
      return 'coffee';
  }
}

function formatDate(iso: string): string {
  const today = localDate();
  if (iso === today) return 'Today';
  const d = new Date(`${iso}T00:00:00`);
  return d.toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  });
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  });
}

function recentDays(count: number): string[] {
  const out: string[] = [];
  for (let i = 0; i < count; i++) {
    const d = new Date(Date.now() - i * 86_400_000);
    out.push(d.toISOString().slice(0, 10));
  }
  return out;
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scroll: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  hero: {
    backgroundColor: colors.card,
    borderRadius: radii.xl,
    padding: spacing.lg,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 2,
  },
  heroBadge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(21,112,239,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  heroName: {
    fontFamily: 'Inter_700Bold',
    fontSize: 22,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  heroBrand: {
    fontFamily: 'Inter_500Medium',
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 4,
  },
  heroMeta: {
    fontFamily: 'Inter_500Medium',
    fontSize: 12,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
  heroMacroRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: spacing.md,
    gap: spacing.sm,
    justifyContent: 'center',
  },
  heroMacro: {
    flexBasis: '40%',
    backgroundColor: colors.background,
    borderRadius: radii.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    alignItems: 'center',
  },
  heroMacroValue: {
    fontFamily: 'Inter_700Bold',
    fontSize: 18,
    color: colors.textPrimary,
  },
  heroMacroLabel: {
    fontFamily: 'Inter_500Medium',
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  section: {
    backgroundColor: colors.card,
    borderRadius: radii.xl,
    padding: spacing.lg,
    marginTop: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 2,
  },
  sectionTitle: {
    fontFamily: 'Inter_700Bold',
    fontSize: 14,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  qtyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  stepBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.input,
  },
  qtyValueBox: {
    alignItems: 'center',
  },
  qtyValue: {
    fontFamily: 'Inter_700Bold',
    fontSize: 28,
    color: colors.textPrimary,
    letterSpacing: -0.5,
  },
  qtyUnit: {
    fontFamily: 'Inter_500Medium',
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  mealRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  mealChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: 10,
    paddingHorizontal: spacing.md,
    borderRadius: radii.pill,
    backgroundColor: colors.background,
  },
  mealChipActive: {
    backgroundColor: colors.darkSurface,
  },
  mealChipLabel: {
    fontFamily: 'Inter_500Medium',
    fontSize: 13,
    color: colors.textPrimary,
  },
  mealChipLabelActive: {
    color: '#FFFFFF',
  },
  helperLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.md,
    alignSelf: 'flex-start',
    paddingVertical: 4,
    paddingHorizontal: spacing.xs,
  },
  helperLinkText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 13,
    color: colors.primary,
  },
  macroList: {
    gap: spacing.xs,
  },
  macroRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.background,
    borderRadius: radii.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
  },
  macroRowLabel: {
    fontFamily: 'Inter_500Medium',
    fontSize: 13,
    color: colors.textMuted,
  },
  macroRowValue: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 13,
    color: colors.textPrimary,
  },
  dirtyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.sm,
    backgroundColor: colors.background,
    alignSelf: 'flex-start',
    marginTop: spacing.sm,
  },
  dirtyText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 12,
    color: colors.textMuted,
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    gap: spacing.md,
  },
  emptyTitle: {
    fontFamily: 'Inter_700Bold',
    fontSize: 20,
    color: colors.textPrimary,
  },
  emptyBody: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: colors.textMuted,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  footer: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.card,
    borderTopLeftRadius: radii.xl,
    borderTopRightRadius: radii.xl,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 8,
  },
  modalBody: {
    gap: spacing.md,
    paddingVertical: spacing.sm,
  },
  modalSub: {
    fontFamily: 'Inter_500Medium',
    fontSize: 13,
    color: colors.textMuted,
  },
  dayList: {
    gap: spacing.xs,
  },
  dayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: radii.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    gap: spacing.sm,
  },
  dayRowText: {
    flex: 1,
    fontFamily: 'Inter_500Medium',
    fontSize: 14,
    color: colors.textPrimary,
  },
  dayRowTextActive: {
    color: colors.primary,
  },
  dayRowMark: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 11,
    color: colors.primary,
  },
  pressed: { opacity: 0.7 },
});

// Note: this file imports `_helpers` to look up entry-by-id, share
// food-category helpers, and re-use the meal label mapping.
// Recipe/In-progress edits are saved by delete+relog; the store
// doesn't expose canonical in-place FoodLogEntry updates.
