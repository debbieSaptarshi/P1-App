import React, { useCallback, useMemo, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Button, Header } from '@/components/ui';
import { colors, radii, spacing } from '@/constants/tokens';
import { useAppStore } from '@/hooks/useAppStore';
import type { FoodItem, MealRecipe } from '@/types';

interface BuilderItem {
  foodId: string;
  name: string;
  servingSize: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  quantity: number;
}

const QUANTITY_STEP = 0.5;

/**
 * Meal-builder screen.
 *
 * Lets the user build a saved meal recipe out of multiple database
 * foods. Each row has a quantity stepper; the totals card updates in
 * real time. Saving creates a `MealRecipe` entry via the store action.
 */
export default function MealBuilderScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { state, searchFood, actions } = useAppStore();
  const [recipeName, setRecipeName] = useState('');
  const [items, setItems] = useState<BuilderItem[]>([]);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerQuery, setPickerQuery] = useState('');

  const totals = useMemo(() => {
    let calories = 0;
    let protein = 0;
    let carbs = 0;
    let fat = 0;
    for (const i of items) {
      calories += i.calories * i.quantity;
      protein += i.protein * i.quantity;
      carbs += i.carbs * i.quantity;
      fat += i.fat * i.quantity;
    }
    return {
      calories: Math.round(calories),
      protein: Math.round(protein * 10) / 10,
      carbs: Math.round(carbs * 10) / 10,
      fat: Math.round(fat * 10) / 10,
    };
  }, [items]);

  const servings = estimatesServings(totals.calories);

  const matchOptions = useMemo(() => {
    return searchFood(pickerQuery).slice(0, 12);
  }, [searchFood, pickerQuery]);

  const addFood = useCallback(
    (food: FoodItem) => {
      Haptics.selectionAsync();
      setItems((prev) => {
        if (prev.some((i) => i.foodId === food.id)) {
          return prev.map((i) =>
            i.foodId === food.id ? { ...i, quantity: +(i.quantity + QUANTITY_STEP).toFixed(1) } : i,
          );
        }
        return [
          ...prev,
          {
            foodId: food.id,
            name: food.name,
            servingSize: food.servingSize,
            calories: food.calories,
            protein: food.protein,
            carbs: food.carbs,
            fat: food.fat,
            quantity: 1,
          },
        ];
      });
      setPickerQuery('');
      setPickerOpen(false);
    },
    [],
  );

  const adjustItem = useCallback((foodId: string, delta: number) => {
    setItems((prev) =>
      prev
        .map((i) =>
          i.foodId === foodId
            ? { ...i, quantity: Math.max(0.5, +(i.quantity + delta).toFixed(1)) }
            : i,
        ),
    );
  }, []);

  const removeItem = useCallback((foodId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setItems((prev) => prev.filter((i) => i.foodId !== foodId));
  }, []);

  const canSave = items.length > 0 && recipeName.trim().length >= 2;

  const handleSave = useCallback(() => {
    if (!canSave) return;
    const id = `rcp_${Date.now()}`;
    const recipe: MealRecipe = {
      id,
      name: recipeName.trim(),
      servings: servings || 1,
      ingredients: state.foodDatabase.filter((f) => items.some((i) => i.foodId === f.id)),
      totalCalories: totals.calories,
      totalProtein: totals.protein,
      totalCarbs: totals.carbs,
      totalFat: totals.fat,
      createdAt: new Date().toISOString(),
    };
    actions.saveMealRecipe(recipe);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    router.replace('/log-food?tab=saved');
  }, [actions, canSave, items, recipeName, router, servings, state.foodDatabase, totals]);

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <Header
        title="Meal builder"
        subtitle="Combine foods into a saved recipe"
      />

      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingBottom: insets.bottom + 160 },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <TextInput
          value={recipeName}
          onChangeText={setRecipeName}
          placeholder="Recipe name (e.g. Power breakfast)"
          placeholderTextColor={colors.textPlaceholder}
          style={styles.recipeInput}
          autoCapitalize="words"
          accessibilityLabel="Recipe name input"
          testID="mealbuilder-name"
        />

        <View style={styles.totalsCard}>
          <Text style={styles.totalsLabel}>Recipe total</Text>
          <Text style={styles.totalsCalories}>{totals.calories}</Text>
          <Text style={styles.totalsSub}>kcal · ≈ {servings} serving{servings === 1 ? '' : 's'}</Text>

          <View style={styles.totalsMacroRow}>
            <MacroPill label="Protein" value={`${totals.protein} g`} accent="#1570EF" />
            <MacroPill label="Carbs" value={`${totals.carbs} g`} accent="#4ADE80" />
            <MacroPill label="Fat" value={`${totals.fat} g`} accent="#FF6A1A" />
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Ingredients</Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Add ingredient"
              testID="mealbuilder-add-ingredient"
              onPress={() => {
                Haptics.selectionAsync();
                setPickerOpen((v) => !v);
              }}
              style={({ pressed }) => [
                styles.addBtn,
                pressed && styles.pressed,
              ]}
            >
              <Feather name="plus" size={14} color={colors.primary} />
              <Text style={styles.addBtnLabel}>Add</Text>
            </Pressable>
          </View>

          {items.length === 0 ? (
            <View style={styles.empty}>
              <Feather name="layers" size={22} color={colors.textMuted} />
              <Text style={styles.emptyTitle}>No ingredients yet</Text>
              <Text style={styles.emptyBody}>
                Add foods to compose a recipe. We&apos;ll update the totals live.
              </Text>
            </View>
          ) : (
            <View style={styles.list}>
              {items.map((item) => (
                <View key={item.foodId} style={styles.row} testID={`mealbuilder-row-${item.foodId}`}>
                  <View style={styles.rowInfo}>
                    <Text style={styles.rowName}>{item.name}</Text>
                    <Text style={styles.rowMeta}>
                      {item.servingSize} · {Math.round(item.calories)} kcal /serving
                    </Text>
                  </View>
                  <View style={styles.rowControls}>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={`Decrease ${item.name}`}
                      testID={`mealbuilder-dec-${item.foodId}`}
                      onPress={() => adjustItem(item.foodId, -QUANTITY_STEP)}
                      style={({ pressed }) => [styles.stepBtn, pressed && styles.pressed]}
                    >
                      <Feather name="minus" size={14} color={colors.textPrimary} />
                    </Pressable>
                    <Text style={styles.qtyText}>{item.quantity.toFixed(1)}</Text>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={`Increase ${item.name}`}
                      testID={`mealbuilder-inc-${item.foodId}`}
                      onPress={() => adjustItem(item.foodId, QUANTITY_STEP)}
                      style={({ pressed }) => [styles.stepBtn, pressed && styles.pressed]}
                    >
                      <Feather name="plus" size={14} color={colors.textPrimary} />
                    </Pressable>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={`Remove ${item.name}`}
                      testID={`mealbuilder-remove-${item.foodId}`}
                      onPress={() => removeItem(item.foodId)}
                      style={({ pressed }) => [styles.removeBtn, pressed && styles.pressed]}
                    >
                      <Feather name="trash-2" size={14} color={colors.accentRed} />
                    </Pressable>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>

        {pickerOpen ? (
          <View style={styles.picker}>
            <View style={styles.pickerSearchRow}>
              <Feather name="search" size={16} color={colors.textMuted} />
              <TextInput
                value={pickerQuery}
                onChangeText={setPickerQuery}
                placeholder="Search the database"
                placeholderTextColor={colors.textPlaceholder}
                style={styles.pickerInput}
                autoCorrect={false}
                testID="mealbuilder-picker-input"
              />
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Close picker"
                onPress={() => setPickerOpen(false)}
                style={({ pressed }) => pressed && styles.pressed}
              >
                <Feather name="x" size={16} color={colors.textMuted} />
              </Pressable>
            </View>
            {matchOptions.map((food) => {
              const existing = items.some((i) => i.foodId === food.id);
              return (
                <Pressable
                  key={food.id}
                  accessibilityRole="button"
                  accessibilityLabel={`Add ${food.name}`}
                  accessibilityState={{ disabled: existing }}
                  onPress={() => addFood(food)}
                  style={({ pressed }) => [
                    styles.pickerRow,
                    pressed && styles.pressed,
                  ]}
                >
                  <View style={styles.foodRowBadge}>
                    <Feather name="package" size={14} color={colors.primary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.pickerRowName}>{food.name}</Text>
                    <Text style={styles.pickerRowMeta}>
                      {food.servingSize} · {Math.round(food.calories)} kcal
                    </Text>
                  </View>
                  <Feather
                    name={existing ? 'check' : 'plus'}
                    size={16}
                    color={existing ? colors.accentGreen : colors.primary}
                  />
                </Pressable>
              );
            })}
            {matchOptions.length === 0 ? (
              <Text style={styles.pickerEmpty}>
                No matching foods. Try a different keyword.
              </Text>
            ) : null}
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
          title="Save meal recipe"
          leadingIcon="bookmark"
          variant="primary"
          disabled={!canSave}
          onPress={handleSave}
          testID="mealbuilder-save"
        />
      </View>
    </View>
  );
}

function MacroPill({ label, value, accent }: { label: string; value: string; accent: string }) {
  return (
    <View style={styles.macroPill}>
      <View style={[styles.macroDot, { backgroundColor: accent }]} />
      <Text style={styles.macroPillLabel}>{label}</Text>
      <Text style={styles.macroPillValue}>{value}</Text>
    </View>
  );
}

function estimatesServings(calories: number): number {
  if (calories <= 0) return 0;
  if (calories < 400) return 1;
  if (calories < 900) return 2;
  return Math.max(1, Math.round(calories / 450));
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
  recipeInput: {
    fontFamily: 'Inter_700Bold',
    fontSize: 22,
    color: colors.textPrimary,
    backgroundColor: colors.card,
    borderRadius: radii.md,
    height: 56,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
  },
  totalsCard: {
    backgroundColor: colors.darkSurface,
    borderRadius: radii.xl,
    padding: spacing.lg,
  },
  totalsLabel: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 13,
    color: 'rgba(255,255,255,0.7)',
  },
  totalsCalories: {
    fontFamily: 'Inter_700Bold',
    fontSize: 56,
    color: '#FFFFFF',
    letterSpacing: -1,
    marginTop: 4,
  },
  totalsSub: {
    fontFamily: 'Inter_500Medium',
    fontSize: 13,
    color: 'rgba(255,255,255,0.6)',
    marginTop: 2,
    marginBottom: spacing.sm,
  },
  totalsMacroRow: {
    flexDirection: 'row',
    gap: spacing.xs,
    flexWrap: 'wrap',
  },
  macroPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.10)',
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: radii.pill,
    gap: 6,
  },
  macroDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  macroPillLabel: {
    fontFamily: 'Inter_500Medium',
    fontSize: 11,
    color: 'rgba(255,255,255,0.65)',
  },
  macroPillValue: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 12,
    color: '#FFFFFF',
  },
  section: {
    marginTop: spacing.lg,
    backgroundColor: colors.card,
    borderRadius: radii.xl,
    padding: spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  sectionTitle: {
    fontFamily: 'Inter_700Bold',
    fontSize: 16,
    color: colors.textPrimary,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: radii.pill,
    backgroundColor: colors.primarySoft,
  },
  addBtnLabel: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 12,
    color: colors.primary,
  },
  empty: {
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.lg,
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
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: radii.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  rowInfo: {
    flex: 1,
  },
  rowName: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
    color: colors.textPrimary,
  },
  rowMeta: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  rowControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  stepBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  qtyText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 14,
    color: colors.textPrimary,
    minWidth: 28,
    textAlign: 'center',
  },
  removeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 59, 48, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  picker: {
    marginTop: spacing.md,
    backgroundColor: colors.card,
    borderRadius: radii.xl,
    padding: spacing.md,
  },
  pickerSearchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: radii.sm,
    paddingHorizontal: spacing.sm,
    height: 40,
    gap: spacing.xs,
  },
  pickerInput: {
    flex: 1,
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: colors.textPrimary,
  },
  pickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
  },
  foodRowBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(21,112,239,0.10)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pickerRowName: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 13,
    color: colors.textPrimary,
  },
  pickerRowMeta: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: colors.textMuted,
  },
  pickerEmpty: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    color: colors.textMuted,
    paddingVertical: spacing.sm,
    textAlign: 'center',
  },
  footer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    backgroundColor: colors.card,
    borderTopLeftRadius: radii.xl,
    borderTopRightRadius: radii.xl,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 8,
  },
  pressed: { opacity: 0.7 },
});
