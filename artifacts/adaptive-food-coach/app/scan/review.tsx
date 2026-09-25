import React, { useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Button, Header } from '@/components/ui';
import { scanDraft, setScanDraft } from '@/services/ai';
import { appStoreActions } from '@/hooks/useAppStore';
import { foodSchema } from '@workspace/backend-contracts';
import { groundMeal, type FoodContext } from '@workspace/campus-food';
import type { MealType, FoodItem } from '@/types';
import { errorMessage } from '@/services/api';
import { colors, radii, spacing } from '@/constants/tokens';

const CONTEXTS: { id: FoodContext; label: string }[] = [
  { id: 'mess', label: 'Mess' },
  { id: 'canteen', label: 'Canteen' },
  { id: 'home', label: 'Home' },
  { id: 'restaurant', label: 'Restaurant' },
  { id: 'delivery', label: 'Delivery' },
];
const OIL: { tsp: number; label: string }[] = [
  { tsp: 0, label: 'None' },
  { tsp: 1, label: '1 tsp' },
  { tsp: 2, label: '2 tsp' },
];

export default function ReviewScan() {
  const router = useRouter();
  const [draft] = useState(scanDraft);
  const detected = draft?.foods ?? [];
  const [mealType, setMealType] = useState<MealType>('lunch');
  const [context, setContext] = useState<FoodContext | undefined>(draft?.contextGuess);
  const [extraOilTsp, setExtraOilTsp] = useState<number | undefined>();
  const [portionScale, setPortionScale] = useState(1);
  const [portionConfirmed, setPortionConfirmed] = useState(false);
  const [busy, setBusy] = useState(false);

  const meal = useMemo(
    () => groundMeal(detected, { context, extraOilTsp, portionScale, portionConfirmed }),
    [detected, context, extraOilTsp, portionScale, portionConfirmed],
  );

  const foods: FoodItem[] = meal.foods.map((food, index) => ({
    ...detected[index],
    ...food,
    id: detected[index]?.id ?? food.name,
    image: detected[index]?.image,
    source: food.matchMethod === 'catalog' ? 'catalog' : detected[index]?.source ?? 'ai',
    analysisId: detected[index]?.analysisId,
    warnings: meal.warnings,
  }));

  const save = async () => {
    if (busy) return;
    setBusy(true);
    try {
      foods.forEach((food) => foodSchema.parse(food));
      const date = new Date();
      const localDate = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
      await appStoreActions.logFoods(foods.map((food) => ({ food, quantity: 1 })), mealType, localDate);
      setScanDraft(null);
      router.replace('/(tabs)');
    } catch (error) {
      Alert.alert('Check your food details', errorMessage(error));
    } finally {
      setBusy(false);
    }
  };

  const nudgePortion = (delta: number) => {
    setPortionConfirmed(true);
    setPortionScale((value) => Math.min(2.5, Math.max(0.5, Math.round((value + delta) * 4) / 4)));
  };

  return (
    <SafeAreaView style={styles.root}>
      <Header title="Review estimate" />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.lede}>
          {draft?.notes || 'Confirm place, portion, and extra oil. The calorie is a range, not a lab measurement.'}
        </Text>

        <View style={styles.hero}>
          <Text style={styles.rangeLabel}>Estimated energy</Text>
          <Text style={styles.rangeValue}>
            {meal.caloriesLow}–{meal.caloriesHigh} kcal
          </Text>
          <Text style={styles.mid}>Logging {meal.calories} kcal mid-estimate</Text>
          <Text style={styles.macros}>
            P {Math.round(meal.protein)}g · C {Math.round(meal.carbs)}g · F {Math.round(meal.fat)}g
          </Text>
        </View>

        <Text style={styles.section}>Where was this?</Text>
        <View style={styles.chips}>
          {CONTEXTS.map((item) => (
            <Chip key={item.id} label={item.label} selected={context === item.id} onPress={() => setContext(item.id)} />
          ))}
        </View>

        <Text style={styles.section}>Portion vs what we saw</Text>
        <View style={styles.portionRow}>
          <Pressable onPress={() => nudgePortion(-0.25)} style={styles.stepper} accessibilityLabel="Smaller portion">
            <Text style={styles.stepperText}>−</Text>
          </Pressable>
          <Text style={styles.portionValue}>{portionScale.toFixed(2).replace(/\.00$/, '').replace(/0$/, '')}×</Text>
          <Pressable onPress={() => nudgePortion(0.25)} style={styles.stepper} accessibilityLabel="Larger portion">
            <Text style={styles.stepperText}>+</Text>
          </Pressable>
        </View>

        <Text style={styles.section}>Extra oil or ghee</Text>
        <View style={styles.chips}>
          {OIL.map((item) => (
            <Chip
              key={item.tsp}
              label={item.label}
              selected={extraOilTsp === item.tsp}
              onPress={() => setExtraOilTsp(item.tsp)}
            />
          ))}
        </View>

        {meal.warnings.map((warning) => (
          <Text key={warning} style={styles.warning}>{warning}</Text>
        ))}
        {meal.assumptions.slice(0, 4).map((line) => (
          <Text key={line} style={styles.assumption}>{line}</Text>
        ))}

        {foods.map((food) => (
          <View key={food.id} style={styles.card}>
            <Text style={styles.foodName}>{food.name}</Text>
            <Text style={styles.foodMeta}>
              {food.servingSize}
              {food.matchMethod === 'catalog' ? ' · catalog' : ' · visual estimate'}
            </Text>
            <Text style={styles.foodMeta}>
              {food.caloriesLow ?? food.calories}–{food.caloriesHigh ?? food.calories} kcal · P {food.protein}g · C {food.carbs}g · F {food.fat}g
            </Text>
          </View>
        ))}

        <View style={styles.chips}>
          {(['breakfast', 'lunch', 'dinner', 'snack'] as const).map((type) => (
            <Chip key={type} label={type} selected={mealType === type} onPress={() => setMealType(type)} />
          ))}
        </View>
        <Button title="Confirm and log food" loading={busy} disabled={!foods.length || busy} onPress={() => void save()} />
      </ScrollView>
    </SafeAreaView>
  );
}

function Chip({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={[styles.chip, selected && styles.chipOn]} accessibilityRole="button" accessibilityState={{ selected }}>
      <Text style={[styles.chipText, selected && styles.chipTextOn]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, gap: spacing.md, paddingBottom: 40 },
  lede: { fontFamily: 'Inter_400Regular', fontSize: 15, lineHeight: 22, color: colors.textMuted },
  hero: { backgroundColor: colors.card, borderRadius: radii.lg, padding: spacing.lg, gap: 4 },
  rangeLabel: { fontFamily: 'Inter_500Medium', fontSize: 12, color: colors.textMuted },
  rangeValue: { fontFamily: 'Inter_700Bold', fontSize: 28, color: colors.textPrimary },
  mid: { fontFamily: 'Inter_400Regular', fontSize: 15, color: colors.textPrimary },
  macros: { fontFamily: 'Inter_500Medium', fontSize: 12, color: colors.textMuted },
  section: { fontFamily: 'Inter_700Bold', fontSize: 16, color: colors.textPrimary, marginTop: 8 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: radii.pill, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border },
  chipOn: { backgroundColor: colors.textPrimary, borderColor: colors.textPrimary },
  chipText: { fontFamily: 'Inter_500Medium', fontSize: 12, color: colors.textPrimary },
  chipTextOn: { color: colors.textInverse },
  portionRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  stepper: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.card, alignItems: 'center', justifyContent: 'center' },
  stepperText: { fontSize: 22, color: colors.textPrimary },
  portionValue: { fontFamily: 'Inter_600SemiBold', fontSize: 20, color: colors.textPrimary, minWidth: 64, textAlign: 'center' },
  warning: { color: '#915900', fontFamily: 'Inter_500Medium', fontSize: 12 },
  assumption: { fontFamily: 'Inter_400Regular', fontSize: 12, color: colors.textMuted },
  card: { backgroundColor: colors.card, borderRadius: radii.lg, padding: spacing.md, gap: 4 },
  foodName: { fontFamily: 'Inter_700Bold', fontSize: 16, color: colors.textPrimary },
  foodMeta: { fontFamily: 'Inter_500Medium', fontSize: 12, color: colors.textMuted },
});
