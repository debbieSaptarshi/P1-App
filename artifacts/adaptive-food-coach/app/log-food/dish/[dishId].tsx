import { Redirect } from 'expo-router';
import { demoMode } from '@/services/supabase';
import { localDate } from '@/services/dates';
import React, { useCallback, useState } from 'react';
import {
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Image as ExpoImage } from 'expo-image';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { CircleIconButton } from '@/components/meals/CircleIconButton';
import { IngredientFlower } from '@/components/meals/IngredientFlower';
import { ModalSheet, ProgressBar } from '@/components/ui';
import { dishToFoodItem, getLastMealDish } from '@/constants/lastMeals';
import { colors, radii, spacing } from '@/constants/tokens';
import { useAppStore } from '@/hooks/useAppStore';

const iconBack = require('@/assets/images/nutrition/icon-back.svg');
const iconShare = require('@/assets/images/nutrition/icon-share.svg');
const iconMore = require('@/assets/images/nutrition/icon-more.svg');
const iconAdd = require('@/assets/images/nutrition/icon-add.svg');
const iconSparkle = require('@/assets/images/nutrition/icon-sparkle.svg');

/**
 * Dish nutrition template.
 *
 * Used whenever the user opens a particular meal — from the Last Meal
 * list or the Home carousel. Layout stays the same; copy, macros,
 * composition petals, and ingredients swap with `dishId`.
 */
function DishNutritionScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ dishId?: string }>();
  const { actions } = useAppStore();
  const [moreOpen, setMoreOpen] = useState(false);

  const dish = getLastMealDish(params.dishId);

  const handleShare = useCallback(async () => {
    Haptics.selectionAsync();
    await Share.share({
      message: `${dish.name} · ${dish.calories} Kcal · Health score ${dish.healthScore}/10`,
    });
  }, [dish]);

  const handleSave = useCallback(() => {
    const today = localDate();
    actions.logFood({
      date: today,
      mealType: 'lunch',
      food: dishToFoodItem(dish),
      quantity: 1,
    });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    router.replace('/(tabs)');
  }, [actions, dish, router]);

  return (
    <View style={styles.root}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={[styles.header, { paddingTop: insets.top + spacing.xs }]}>
        <View style={styles.headerCluster}>
          <CircleIconButton
            source={iconBack}
            accessibilityLabel="Back"
            testID="dish-back"
            onPress={() => router.back()}
          />
          <View style={styles.headerGhost} />
        </View>
        <Text style={styles.headerTitle}>Nutrition</Text>
        <View style={styles.headerCluster}>
          <CircleIconButton
            source={iconShare}
            accessibilityLabel="Share meal"
            testID="dish-share"
            onPress={handleShare}
          />
          <CircleIconButton
            source={iconMore}
            accessibilityLabel="More actions"
            testID="dish-more"
            onPress={() => setMoreOpen(true)}
          />
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 96 }]}
        showsVerticalScrollIndicator={false}
      >
        <IngredientFlower dish={dish} />

        <View style={styles.body}>
          <Text style={styles.dishTitle}>
            {dish.titleLine1}
            {dish.titleLine2 ? `\n${dish.titleLine2}` : ''}
          </Text>

          <View style={styles.statStack}>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>🔥 Calories</Text>
              <Text style={styles.statValue}>{dish.calories}</Text>
            </View>

            <View style={styles.statRow}>
              <MacroCard label="🥚 Protein" value={dish.protein} unit="g" />
              <MacroCard label="🍞 Carbs" value={dish.carbs} unit="g" />
              <MacroCard label="🥑 Fats" value={dish.fat} unit="g" />
            </View>
            <View style={styles.statRow}>
              <MacroCard label="🍎 Fiber" value={dish.fiber.toFixed(1)} unit="g" />
              <MacroCard label="🍧 Sugar" value={dish.sugar.toFixed(1)} unit="g" />
              <MacroCard label="🍚 Sodium" value={dish.sodium} unit="mg" />
            </View>

            <View style={styles.healthCard} testID="dish-health-score">
              <View style={styles.healthRow}>
                <Text style={styles.healthLabel}>Health Score</Text>
                <Text style={styles.healthValue}>{dish.healthScore}/10</Text>
              </View>
              <ProgressBar
                progress={dish.healthScore / 10}
                backgroundColor="#1E293B"
                color={colors.primary}
                height={14}
              />
            </View>
          </View>
        </View>

        <View style={styles.ingredientsHeader}>
          <Text style={styles.ingredientsTitle}>Ingredients</Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Add more ingredients"
            testID="dish-add-more"
            onPress={() => router.push('/log-food/add-custom')}
            style={({ pressed }) => [styles.addMore, pressed && styles.pressed]}
          >
            <View style={styles.addIconBox}>
              <ExpoImage source={iconAdd} style={styles.addIcon} contentFit="contain" />
            </View>
            <Text style={styles.addMoreLabel}>Add More</Text>
          </Pressable>
        </View>

        <View style={styles.ingredientList}>
          {dish.ingredients.map((item) => (
            <View key={item.id} style={styles.ingredientRow} testID={`dish-ingredient-${item.id}`}>
              <Text style={styles.ingredientName}>{item.name}</Text>
              <Text style={styles.ingredientCals}>🔥 {item.calories} cal</Text>
              <Text style={styles.ingredientGrams}>{item.grams}g</Text>
            </View>
          ))}
        </View>
      </ScrollView>

      <LinearGradient
        colors={['rgba(255,255,255,0.06)', colors.card]}
        style={[styles.footer, { paddingBottom: insets.bottom + spacing.sm }]}
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Fix issue"
          testID="dish-fix-issue"
          onPress={() => router.push('/log-food/meal-builder')}
          style={({ pressed }) => [styles.fixButton, pressed && styles.pressed]}
        >
          <View style={styles.sparkleBox}>
            <ExpoImage source={iconSparkle} style={styles.sparkleIcon} contentFit="contain" />
          </View>
          <Text style={styles.fixLabel}>Fix Issue</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Save log"
          testID="dish-save-log"
          onPress={handleSave}
          style={({ pressed }) => [styles.saveButton, pressed && styles.pressed]}
        >
          <Text style={styles.saveLabel}>Save Log</Text>
        </Pressable>
      </LinearGradient>

      <ModalSheet
        visible={moreOpen}
        onClose={() => setMoreOpen(false)}
        title="Meal actions"
      >
        <Pressable
          accessibilityRole="button"
          testID="dish-more-edit"
          onPress={() => {
            setMoreOpen(false);
            router.push('/log-food/meal-builder');
          }}
          style={({ pressed }) => [styles.sheetRow, pressed && styles.pressed]}
        >
          <Text style={styles.sheetLabel}>Edit ingredients</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          testID="dish-more-log-food"
          onPress={() => {
            setMoreOpen(false);
            router.push('/log-food');
          }}
          style={({ pressed }) => [styles.sheetRow, pressed && styles.pressed]}
        >
          <Text style={styles.sheetLabel}>Open food database</Text>
        </Pressable>
      </ModalSheet>
    </View>
  );
}

function MacroCard({
  label,
  value,
  unit,
}: {
  label: string;
  value: number | string;
  unit: string;
}) {
  return (
    <View style={styles.macroCard}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.macroValue}>
        {value} <Text style={styles.macroUnit}>{unit}</Text>
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xs,
  },
  headerCluster: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  headerGhost: {
    width: 40,
    height: 40,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontFamily: 'Inter_500Medium',
    fontSize: 16,
    lineHeight: 22,
    letterSpacing: -0.18,
    color: colors.textPrimary,
  },
  scroll: {
    gap: 0,
  },
  body: {
    padding: spacing.lg,
    gap: spacing.md,
  },
  dishTitle: {
    fontFamily: 'Inter_500Medium',
    fontSize: 32,
    lineHeight: 38,
    letterSpacing: -0.2,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  statStack: {
    gap: spacing.xs,
  },
  statCard: {
    backgroundColor: colors.card,
    borderRadius: radii.xl,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  statRow: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  macroCard: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: radii.xl,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    minWidth: 0,
  },
  statLabel: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: -0.12,
    color: colors.textPrimary,
    marginBottom: 4,
  },
  statValue: {
    fontFamily: 'Inter_500Medium',
    fontSize: 24,
    lineHeight: 30,
    letterSpacing: -0.15,
    color: colors.textPrimary,
  },
  macroValue: {
    fontFamily: 'Inter_500Medium',
    fontSize: 24,
    lineHeight: 30,
    letterSpacing: -0.15,
    color: colors.textPrimary,
  },
  macroUnit: {
    fontFamily: 'Inter_400Regular',
    fontSize: 10,
    lineHeight: 12,
    color: colors.textMuted,
  },
  healthCard: {
    backgroundColor: colors.darkSurface,
    borderRadius: radii.xl,
    padding: spacing.md,
    gap: spacing.md,
  },
  healthRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  healthLabel: {
    fontFamily: 'Inter_500Medium',
    fontSize: 16,
    lineHeight: 22,
    letterSpacing: -0.18,
    color: colors.textInverse,
    flex: 1,
  },
  healthValue: {
    fontFamily: 'Inter_500Medium',
    fontSize: 16,
    lineHeight: 22,
    letterSpacing: -0.18,
    color: colors.textInverse,
    textAlign: 'right',
    flex: 1,
  },
  ingredientsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  ingredientsTitle: {
    flex: 1,
    fontFamily: 'Inter_500Medium',
    fontSize: 16,
    lineHeight: 22,
    letterSpacing: -0.18,
    color: colors.textPrimary,
  },
  addMore: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  addIconBox: {
    width: 16,
    height: 16,
  },
  addIcon: {
    width: 16,
    height: 16,
  },
  addMoreLabel: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: -0.12,
    color: colors.textPrimary,
  },
  ingredientList: {
    paddingHorizontal: spacing.lg,
    gap: spacing.xs,
  },
  ingredientRow: {
    backgroundColor: colors.card,
    borderRadius: radii.xl,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  ingredientName: {
    fontFamily: 'Inter_500Medium',
    fontSize: 14,
    lineHeight: 20,
    letterSpacing: -0.16,
    color: colors.textPrimary,
  },
  ingredientCals: {
    flex: 1,
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: -0.12,
    color: colors.textMuted,
  },
  ingredientGrams: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: -0.12,
    color: colors.textMuted,
  },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    gap: spacing.xs,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
  },
  fixButton: {
    flex: 1,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.background,
    borderRadius: radii.pill,
    padding: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  sparkleBox: {
    width: 22,
    height: 22,
  },
  sparkleIcon: {
    width: 22,
    height: 22,
  },
  fixLabel: {
    fontFamily: 'Inter_500Medium',
    fontSize: 16,
    lineHeight: 22,
    letterSpacing: -0.18,
    color: colors.textPrimary,
  },
  saveButton: {
    flex: 1,
    backgroundColor: colors.darkSurface,
    borderRadius: radii.pill,
    padding: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveLabel: {
    fontFamily: 'Inter_500Medium',
    fontSize: 16,
    lineHeight: 22,
    letterSpacing: -0.18,
    color: colors.textInverse,
  },
  pressed: { opacity: 0.85 },
  sheetRow: {
    paddingVertical: spacing.md,
  },
  sheetLabel: {
    fontFamily: 'Inter_500Medium',
    fontSize: 16,
    color: colors.textPrimary,
  },
});

export default function DishRoute(){ return demoMode ? <DishNutritionScreen/> : <Redirect href="/log-food"/>; }
