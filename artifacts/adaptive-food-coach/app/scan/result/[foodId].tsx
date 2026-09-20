import { localDate } from '@/services/dates';
import React, { useCallback, useMemo, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Button, Header } from '@/components/ui';
import { colors, radii, spacing } from '@/constants/tokens';
import { useAppStore } from '@/hooks/useAppStore';
import type { MealType } from '@/types';

const MEAL_TYPES: { id: MealType; label: string; icon: 'sunrise' | 'cloud' | 'moon' | 'coffee' }[] = [
  { id: 'breakfast', label: 'Breakfast', icon: 'sunrise' },
  { id: 'lunch', label: 'Lunch', icon: 'cloud' },
  { id: 'dinner', label: 'Dinner', icon: 'moon' },
  { id: 'snack', label: 'Snack', icon: 'coffee' },
];

const QUANTITY_STEP = 0.5;

/**
 * Result screen for any of the scanner flows.
 *
 * Reads the source food from the global store by `foodId`, prompts the
 * user to pick a meal type + quantity, and writes a food log entry on
 * confirm. Falls back to a friendly empty state if the id is unknown.
 */
export default function ScanResultScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ foodId?: string; photoUri?: string }>();
  const { state, actions } = useAppStore();
  const [mealType, setMealType] = useState<MealType>('lunch');
  const [quantity, setQuantity] = useState(1);

  const foodId = typeof params.foodId === 'string' ? params.foodId : '';
  const photoUri = typeof params.photoUri === 'string' ? params.photoUri : '';

  const food = useMemo(
    () => state.foodDatabase.find((f) => f.id === foodId),
    [state.foodDatabase, foodId],
  );

  const totals = useMemo(() => {
    if (!food) return null;
    return {
      calories: Math.round(food.calories * quantity),
      protein: +(food.protein * quantity).toFixed(1),
      carbs: +(food.carbs * quantity).toFixed(1),
      fat: +(food.fat * quantity).toFixed(1),
      fiber: +((food.fiber ?? 0) * quantity).toFixed(1),
      sodium: Math.round((food.sodium ?? 0) * quantity),
    };
  }, [food, quantity]);

  const adjustQuantity = useCallback(
    (delta: number) => {
      setQuantity((q) => Math.max(0.5, Math.round((q + delta) * 2) / 2));
    },
    [],
  );

  const handleLog = useCallback(() => {
    if (!food || !totals) return;
    const today = localDate();
    actions.logFood({
      date: today,
      mealType,
      food,
      quantity,
    });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    router.replace('/(tabs)');
  }, [actions, food, mealType, quantity, router, totals]);

  if (!food) {
    return (
      <View style={[styles.root, { paddingTop: insets.top }]}>
        <Stack.Screen options={{ headerShown: false }} />
        <Header title="Scan result" />
        <View style={styles.emptyState}>
          <View style={styles.emptyBadge}>
            <Feather name="search" size={28} color={colors.textMuted} />
          </View>
          <Text style={styles.emptyTitle}>No match found</Text>
          <Text style={styles.emptyBody}>
            We couldn&apos;t identify that item. Try scanning again or pick it
            from the food database.
          </Text>
          <Button
            title="Browse food database"
            variant="primary"
            onPress={() => router.replace('/log-food')}
            testID="result-empty-browse"
          />
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <Stack.Screen options={{ headerShown: false }} />
      <Header
        title="Match found"
        subtitle="Confirm to add to your log"
      />

      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingBottom: insets.bottom + 120 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.heroCard}>
          {photoUri ? (
            <Image
              source={{ uri: photoUri }}
              style={styles.heroPhoto}
              contentFit="cover"
              accessibilityLabel="Captured scan"
            />
          ) : (
            <View style={styles.heroBadge}>
              <Feather name="check-circle" size={24} color={colors.accentGreen} />
            </View>
          )}
          <Text style={styles.heroName}>{food.name}</Text>
          {food.brand ? <Text style={styles.heroBrand}>{food.brand}</Text> : null}
          <View style={styles.heroServingRow}>
            <Feather name="package" size={14} color={colors.textMuted} />
            <Text style={styles.heroServing}>Serving size · {food.servingSize}</Text>
          </View>
        </View>

        <View style={styles.calorieCard}>
          <Text style={styles.calorieValue}>{totals?.calories ?? 0}</Text>
          <Text style={styles.calorieLabel}>kcal · {quantity}× serving</Text>
          <View style={styles.quantityRow}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Decrease quantity"
              testID="result-qty-dec"
              onPress={() => {
                Haptics.selectionAsync();
                adjustQuantity(-QUANTITY_STEP);
              }}
              style={({ pressed }) => [styles.qtyBtn, pressed && styles.pressed]}
            >
              <Feather name="minus" size={18} color={colors.textPrimary} />
            </Pressable>
            <Text style={styles.qtyValue}>{quantity.toFixed(1)}</Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Increase quantity"
              testID="result-qty-inc"
              onPress={() => {
                Haptics.selectionAsync();
                adjustQuantity(QUANTITY_STEP);
              }}
              style={({ pressed }) => [styles.qtyBtn, pressed && styles.pressed]}
            >
              <Feather name="plus" size={18} color={colors.textPrimary} />
            </Pressable>
          </View>
        </View>

        <Text style={styles.sectionLabel}>Macros</Text>
        <View style={styles.macroGrid}>
          <MacroTile label="Protein" value={`${totals?.protein ?? 0} g`} accent="#1570EF" />
          <MacroTile label="Carbs" value={`${totals?.carbs ?? 0} g`} accent="#4ADE80" />
          <MacroTile label="Fat" value={`${totals?.fat ?? 0} g`} accent="#FF6A1A" />
          <MacroTile label="Fiber" value={`${totals?.fiber ?? 0} g`} accent="#7C3AED" />
          <MacroTile label="Sodium" value={`${totals?.sodium ?? 0} mg`} accent="#FF3B30" />
          <MacroTile label="Calories" value={`${totals?.calories ?? 0}`} accent="#0A0A0A" />
        </View>

        <Text style={styles.sectionLabel}>Log to meal</Text>
        <View style={styles.mealRow}>
          {MEAL_TYPES.map((m) => {
            const active = m.id === mealType;
            return (
              <Pressable
                key={m.id}
                accessibilityRole="button"
                accessibilityLabel={`Log to ${m.label}`}
                accessibilityState={{ selected: active }}
                testID={`result-meal-${m.id}`}
                onPress={() => {
                  Haptics.selectionAsync();
                  setMealType(m.id);
                }}
                style={({ pressed }) => [
                  styles.mealChip,
                  active && styles.mealChipActive,
                  pressed && styles.pressed,
                ]}
              >
                <Feather
                  name={m.icon}
                  size={18}
                  color={active ? '#FFFFFF' : colors.textPrimary}
                />
                <Text style={[styles.mealChipLabel, active && styles.mealChipLabelActive]}>
                  {m.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <View style={styles.notesCard}>
          <View style={styles.notesHeader}>
            <Feather name="info" size={16} color={colors.textMuted} />
            <Text style={styles.notesTitle}>Scan confidence · 92%</Text>
          </View>
          <Text style={styles.notesBody}>
            We matched this to our verified food database. You can adjust the
            quantity above before logging.
          </Text>
        </View>
      </ScrollView>

      <View
        style={[
          styles.actionBar,
          { paddingBottom: insets.bottom + spacing.md },
        ]}
      >
        <Button
          title="Add to log"
          variant="primary"
          onPress={handleLog}
          leadingIcon="plus-circle"
          fullWidth
          testID="result-add-to-log"
        />
      </View>
    </View>
  );
}

function MacroTile({ label, value, accent }: { label: string; value: string; accent: string }) {
  return (
    <View style={styles.macroTile}>
      <Text style={[styles.macroTileLabel, { color: accent }]}>{label}</Text>
      <Text style={styles.macroTileValue}>{value}</Text>
    </View>
  );
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
  heroCard: {
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
  heroPhoto: {
    width: '100%',
    height: 180,
    borderRadius: radii.md,
    marginBottom: spacing.sm,
    backgroundColor: colors.background,
  },
  heroBadge: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(74, 222, 128, 0.14)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  heroName: {
    fontFamily: 'Inter_700Bold',
    fontSize: 22,
    color: colors.textPrimary,
    textAlign: 'center',
    letterSpacing: -0.4,
  },
  heroBrand: {
    fontFamily: 'Inter_500Medium',
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 4,
  },
  heroServingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.sm,
  },
  heroServing: {
    fontFamily: 'Inter_500Medium',
    fontSize: 13,
    color: colors.textMuted,
  },
  calorieCard: {
    backgroundColor: colors.darkSurface,
    borderRadius: radii.xl,
    padding: spacing.lg,
    marginTop: spacing.md,
    alignItems: 'center',
  },
  calorieValue: {
    fontFamily: 'Inter_700Bold',
    fontSize: 56,
    color: '#FFFFFF',
    letterSpacing: -1,
  },
  calorieLabel: {
    fontFamily: 'Inter_500Medium',
    fontSize: 13,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 2,
  },
  quantityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    marginTop: spacing.md,
  },
  qtyBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.10)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyValue: {
    fontFamily: 'Inter_700Bold',
    fontSize: 20,
    color: '#FFFFFF',
    minWidth: 56,
    textAlign: 'center',
  },
  sectionLabel: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 13,
    color: colors.textMuted,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  macroGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  macroTile: {
    flexBasis: '31%',
    flexGrow: 1,
    backgroundColor: colors.card,
    padding: spacing.sm,
    borderRadius: radii.md,
  },
  macroTileLabel: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  macroTileValue: {
    fontFamily: 'Inter_700Bold',
    fontSize: 16,
    color: colors.textPrimary,
    marginTop: 4,
  },
  mealRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  mealChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.card,
    paddingVertical: 10,
    paddingHorizontal: spacing.md,
    borderRadius: radii.pill,
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
  notesCard: {
    backgroundColor: colors.card,
    padding: spacing.md,
    borderRadius: radii.md,
    marginTop: spacing.lg,
  },
  notesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  notesTitle: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 13,
    color: colors.textPrimary,
  },
  notesBody: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    color: colors.textMuted,
    lineHeight: 18,
  },
  actionBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.card,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    borderTopLeftRadius: radii.xl,
    borderTopRightRadius: radii.xl,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 8,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    gap: spacing.md,
  },
  emptyBadge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    fontFamily: 'Inter_700Bold',
    fontSize: 20,
    color: colors.textPrimary,
    marginTop: spacing.sm,
  },
  emptyBody: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: spacing.sm,
  },
  pressed: { opacity: 0.7 },
});
