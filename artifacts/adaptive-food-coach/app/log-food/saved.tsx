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
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Button, Header, ModalSheet } from '@/components/ui';
import { colors, radii, spacing } from '@/constants/tokens';
import { useAppStore } from '@/hooks/useAppStore';
import type { FoodItem, MealRecipe, MealType, SavedFood } from '@/types';

interface CustomMacroPayload {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  sodium: number;
  servingSize?: string;
  brand?: string;
}

const QUICK_LOG_MEALS: { id: MealType; label: string }[] = [
  { id: 'breakfast', label: 'Breakfast' },
  { id: 'lunch', label: 'Lunch' },
  { id: 'dinner', label: 'Dinner' },
  { id: 'snack', label: 'Snack' },
];

/**
 * Saved foods and meal recipes list.
 *
 * Combines the user's `savedFoods` (saved/bookmarked recipes, including
 * custom-food records we encode with macros inside `notes`) and the
 * user's saved `mealRecipes`. Long-press deletes (with confirmation);
 * tap to quick-log a saved entry.
 */
export default function SavedFoodsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { state, actions } = useAppStore();
  const [pendingLog, setPendingLog] = useState<SavedFood | MealRecipe | null>(null);
  const [selectedMeal, setSelectedMeal] = useState<MealType>('lunch');

  const customFoodItems = useMemo<SavedFood[]>(
    () => state.savedFoods.filter((s) => s.name && s.ingredients.length <= 1),
    [state.savedFoods],
  );
  const compositeItems = useMemo<SavedFood[]>(
    () => state.savedFoods.filter((s) => s.ingredients.length > 1),
    [state.savedFoods],
  );

  const handleDeleteSaved = useCallback(
    (id: string, title: string) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      Alert.alert(
        'Delete saved food?',
        `Remove "${title}" from your saved favorites. This action can't be undone.`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: () => {
              actions.deleteSavedFood(id);
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            },
          },
        ],
      );
    },
    [actions],
  );

  const handleRowPress = useCallback(
    (item: SavedFood) => {
      Haptics.selectionAsync();
      const food = savedFoodToFoodItem(item);
      if (!food) {
        Alert.alert(
          'Cannot log this item',
          'This saved entry is a composite recipe. Try logging from a meal builder instead.',
        );
        return;
      }
      setPendingLog(item);
    },
    [],
  );

  const handleConfirmLog = useCallback(() => {
    if (!pendingLog) return;
    const food = savedFoodToFoodItem(pendingLog as SavedFood);
    if (!food) return;
    const today = localDate();
    actions.logFood({
      date: today,
      mealType: selectedMeal,
      food,
      quantity: 1,
    });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setPendingLog(null);
  }, [actions, pendingLog, selectedMeal]);

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <Header
        title="Saved foods"
        subtitle={`${customFoodItems.length} custom · ${state.mealRecipes.length} recipes`}
        rightIcon="plus-circle"
        onRightPress={() => router.push('/log-food/add-custom')}
      />

      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingBottom: insets.bottom + 120 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionEyebrow}>Custom foods</Text>
          <Text style={styles.sectionHint}>Long press to delete</Text>
        </View>

        {customFoodItems.length === 0 ? (
          <View style={styles.empty}>
            <Feather name="bookmark" size={22} color={colors.textMuted} />
            <Text style={styles.emptyTitle}>No custom foods yet</Text>
            <Text style={styles.emptyBody}>
              Tap &quot;Create new&quot; above to add one.
            </Text>
            <Button
              title="Create custom food"
              leadingIcon="plus"
              variant="outline"
              onPress={() => router.push('/log-food/add-custom')}
              testID="saved-add-first"
            />
          </View>
        ) : (
          <View style={styles.list}>
            {customFoodItems.map((item) => (
              <SavedRow
                key={item.id}
                title={item.name}
                subtitle={subtitleFor(item)}
                accent="#1570EF"
                calories={item.calories}
                onPress={() => handleRowPress(item)}
                onLongPress={() => handleDeleteSaved(item.id, item.name)}
                testID={`saved-custom-${item.id}`}
              />
            ))}
          </View>
        )}

        <View style={[styles.sectionHeader, { marginTop: spacing.lg }]}>
          <Text style={styles.sectionEyebrow}>Meal recipes</Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Build a new recipe"
            testID="saved-build-recipe"
            onPress={() => router.push('/log-food/meal-builder')}
            style={({ pressed }) => pressed && styles.pressed}
          >
            <Text style={styles.buildAction}>Build new</Text>
          </Pressable>
        </View>

        {state.mealRecipes.length === 0 ? (
          <View style={styles.empty}>
            <Feather name="layers" size={22} color={colors.textMuted} />
            <Text style={styles.emptyTitle}>No meal recipes yet</Text>
            <Text style={styles.emptyBody}>
              Combine a few foods into a reusable meal.
            </Text>
          </View>
        ) : (
          <View style={styles.list}>
            {state.mealRecipes.map((recipe) => (
              <SavedRow
                key={recipe.id}
                title={recipe.name}
                subtitle={`${recipe.servings} serving${recipe.servings === 1 ? '' : 's'} · P ${recipe.totalProtein}g · C ${recipe.totalCarbs}g · F ${recipe.totalFat}g`}
                accent="#7C3AED"
                calories={recipe.totalCalories}
                onPress={() => {
                  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                  Alert.alert(
                    recipe.name,
                    `Logged ${recipe.totalCalories} kcal · ${recipe.servings} serving for today's lunch.`,
                    [{ text: 'Great' }],
                  );
                }}
                onLongPress={() => {
                  Alert.alert(
                    'Delete recipe?',
                    `Remove "${recipe.name}".`,
                    [
                      { text: 'Cancel', style: 'cancel' },
                      {
                        text: 'Delete',
                        style: 'destructive',
                        onPress: () => actions.saveMealRecipe(recipe),
                      },
                    ],
                  );
                }}
                testID={`saved-recipe-${recipe.id}`}
              />
            ))}
          </View>
        )}

        {compositeItems.length > 0 ? (
          <>
            <View style={[styles.sectionHeader, { marginTop: spacing.lg }]}>
              <Text style={styles.sectionEyebrow}>Favorites</Text>
            </View>
            <View style={styles.list}>
              {compositeItems.map((item) => (
                <SavedRow
                  key={item.id}
                  title={item.name}
                  subtitle={item.notes ?? `${item.ingredients.length} ingredients`}
                  accent="#FF6A1A"
                  calories={item.calories}
                  onPress={() => handleRowPress(item)}
                  onLongPress={() => handleDeleteSaved(item.id, item.name)}
                  testID={`saved-fav-${item.id}`}
                />
              ))}
            </View>
          </>
        ) : null}
      </ScrollView>

      <ModalSheet
        visible={!!pendingLog}
        title={pendingLog?.name ?? ''}
        onClose={() => setPendingLog(null)}
        height="60%"
      >
        {pendingLog ? (
          <View style={styles.modalBody}>
            <Text style={styles.modalSub}>Choose which meal to log this to</Text>
            <View style={styles.modalMeals}>
              {QUICK_LOG_MEALS.map((m) => (
                <Pressable
                  key={m.id}
                  accessibilityRole="button"
                  accessibilityLabel={`Log for ${m.label}`}
                  accessibilityState={{ selected: selectedMeal === m.id }}
                  testID={`saved-modal-meal-${m.id}`}
                  onPress={() => {
                    Haptics.selectionAsync();
                    setSelectedMeal(m.id);
                  }}
                  style={({ pressed }) => [
                    styles.modalMealChip,
                    selectedMeal === m.id && styles.modalMealChipActive,
                    pressed && styles.pressed,
                  ]}
                >
                  <Text
                    style={[
                      styles.modalMealLabel,
                      selectedMeal === m.id && styles.modalMealLabelActive,
                    ]}
                  >
                    {m.label}
                  </Text>
                </Pressable>
              ))}
            </View>
            <Button
              title="Log to today's diary"
              leadingIcon="check"
              variant="primary"
              onPress={handleConfirmLog}
              testID="saved-modal-confirm"
            />
          </View>
        ) : null}
      </ModalSheet>
    </View>
  );
}

function SavedRow({
  title,
  subtitle,
  accent,
  calories,
  onPress,
  onLongPress,
  testID,
}: {
  title: string;
  subtitle: string;
  accent: string;
  calories: number;
  onPress: () => void;
  onLongPress: () => void;
  testID?: string;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Log ${title}`}
      testID={testID}
      onPress={onPress}
      onLongPress={onLongPress}
      delayLongPress={350}
      style={({ pressed }) => [
        styles.savedRow,
        pressed && styles.pressed,
      ]}
    >
      <View style={[styles.savedBadge, { backgroundColor: `${accent}1A` }]}>
        <Feather name="bookmark" size={16} color={accent} />
      </View>
      <View style={styles.savedRowText}>
        <Text style={styles.savedRowTitle}>{title}</Text>
        <Text style={styles.savedRowSubtitle}>{subtitle}</Text>
      </View>
      <View style={[styles.savedRowCal, { backgroundColor: `${accent}1A` }]}>
        <Text style={[styles.savedRowCalValue, { color: accent }]}>{Math.round(calories)}</Text>
        <Text style={[styles.savedRowCalUnit, { color: accent }]}>kcal</Text>
      </View>
    </Pressable>
  );
}

function subtitleFor(item: SavedFood): string {
  const macros = parseMacros(item.notes);
  if (!macros) return `Saved ${timeSince(item.createdAt)}`;
  const parts: string[] = [];
  if (macros.brand) parts.push(macros.brand);
  if (macros.servingSize) parts.push(macros.servingSize);
  parts.push(`P ${macros.protein}g`);
  parts.push(`C ${macros.carbs}g`);
  parts.push(`F ${macros.fat}g`);
  return parts.join(' · ');
}

function parseMacros(notes: string | undefined): CustomMacroPayload | null {
  if (!notes) return null;
  try {
    const parsed = JSON.parse(notes) as CustomMacroPayload;
    if (typeof parsed.calories === 'number') return parsed;
  } catch {
    return null;
  }
  return null;
}

function savedFoodToFoodItem(item: SavedFood): FoodItem | null {
  const macros = parseMacros(item.notes);
  if (!macros) return null;
  const id = item.ingredients[0]?.foodId ?? item.id;
  return {
    id,
    name: item.name,
    servingSize: macros.servingSize ?? '1 serving',
    calories: macros.calories,
    protein: macros.protein,
    carbs: macros.carbs,
    fat: macros.fat,
    fiber: macros.fiber,
    sodium: macros.sodium,
    brand: macros.brand,
  };
}

function timeSince(iso: string): string {
  const created = new Date(iso).getTime();
  const diffDays = Math.max(0, Math.round((Date.now() - created) / 86_400_000));
  if (diffDays === 0) return 'today';
  if (diffDays === 1) return 'yesterday';
  return `${diffDays}d ago`;
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
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  sectionEyebrow: {
    fontFamily: 'Inter_700Bold',
    fontSize: 13,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  sectionHint: {
    fontFamily: 'Inter_500Medium',
    fontSize: 11,
    color: colors.textMuted,
  },
  buildAction: {
    fontFamily: 'Inter_500Medium',
    fontSize: 12,
    color: colors.primary,
  },
  empty: {
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.lg,
    backgroundColor: colors.card,
    borderRadius: radii.md,
  },
  emptyTitle: {
    fontFamily: 'Inter_700Bold',
    fontSize: 16,
    color: colors.textPrimary,
    marginTop: spacing.xs,
  },
  emptyBody: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    color: colors.textMuted,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  list: {
    gap: spacing.xs,
  },
  savedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    gap: spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 1,
  },
  savedBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  savedRowText: {
    flex: 1,
  },
  savedRowTitle: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
    color: colors.textPrimary,
  },
  savedRowSubtitle: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  savedRowCal: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: radii.sm,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 56,
  },
  savedRowCalValue: {
    fontFamily: 'Inter_700Bold',
    fontSize: 16,
  },
  savedRowCalUnit: {
    fontFamily: 'Inter_500Medium',
    fontSize: 10,
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
  modalMeals: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  modalMealChip: {
    paddingVertical: 10,
    paddingHorizontal: spacing.md,
    borderRadius: radii.pill,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  modalMealChipActive: {
    backgroundColor: colors.darkSurface,
    borderColor: colors.darkSurface,
  },
  modalMealLabel: {
    fontFamily: 'Inter_500Medium',
    fontSize: 13,
    color: colors.textPrimary,
  },
  modalMealLabelActive: {
    color: '#FFFFFF',
  },
  pressed: { opacity: 0.6 },
});
