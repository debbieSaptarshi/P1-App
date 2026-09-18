import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radii, spacing } from '@/constants/tokens';
import type { LastMealDish } from '@/constants/lastMeals';

export function LastMealCard({
  dish,
  onPress,
}: {
  dish: LastMealDish;
  onPress: () => void;
}) {
  const pending = dish.verification.status === 'pending';

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${dish.name}, ${dish.calories} kilocalories`}
      testID={`last-meal-card-${dish.id}`}
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      <View style={styles.thumbWrap}>
        <Image source={dish.image} style={styles.thumb} resizeMode="cover" />
      </View>
      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={2}>
          {dish.name}
        </Text>
        <View style={styles.calorieMeta}>
          <Text style={styles.calorieCaption}>🔥 Calories</Text>
          <Text style={[styles.verify, pending && styles.verifyPending]} numberOfLines={1}>
            {dish.verification.label}
          </Text>
        </View>
        <Text style={styles.calories}>
          {dish.calories} <Text style={styles.kcal}>Kcal</Text>
        </Text>
        <View style={styles.macros}>
          <Macro emoji="🥚" value={dish.protein} />
          <Macro emoji="🍞" value={dish.carbs} />
          <Macro emoji="🥑" value={dish.fat} />
        </View>
      </View>
    </Pressable>
  );
}

function Macro({ emoji, value }: { emoji: string; value: number }) {
  return (
    <View style={styles.macro}>
      <Text style={styles.macroEmoji}>{emoji}</Text>
      <Text style={styles.macroValue}>{value}</Text>
      <Text style={styles.macroUnit}>g</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: radii.xl,
    padding: spacing.xs,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    width: '100%',
  },
  pressed: { opacity: 0.92 },
  thumbWrap: {
    width: 84,
    height: 84,
    overflow: 'visible',
  },
  thumb: {
    position: 'absolute',
    width: 112,
    height: 112,
    left: -14,
    top: 0,
  },
  info: {
    flex: 1,
    gap: 4,
    minWidth: 0,
  },
  name: {
    fontFamily: 'Inter_500Medium',
    fontSize: 16,
    lineHeight: 22,
    letterSpacing: -0.18,
    color: colors.textPrimary,
  },
  calorieMeta: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: spacing.xs,
  },
  calorieCaption: {
    fontFamily: 'Inter_400Regular',
    fontSize: 10,
    lineHeight: 12,
    color: colors.textMuted,
  },
  verify: {
    fontFamily: 'Inter_400Regular',
    fontSize: 10,
    lineHeight: 12,
    color: '#475569',
    flexShrink: 1,
    textAlign: 'right',
  },
  verifyPending: {
    color: '#B91C1C',
  },
  calories: {
    fontFamily: 'Inter_500Medium',
    fontSize: 16,
    lineHeight: 22,
    letterSpacing: -0.18,
    color: colors.textPrimary,
  },
  kcal: {
    color: colors.textMuted,
  },
  macros: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  macro: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  macroEmoji: {
    fontSize: 12,
    lineHeight: 16,
  },
  macroValue: {
    fontFamily: 'Inter_500Medium',
    fontSize: 14,
    lineHeight: 20,
    letterSpacing: -0.16,
    color: colors.textPrimary,
  },
  macroUnit: {
    fontFamily: 'Inter_400Regular',
    fontSize: 10,
    lineHeight: 12,
    color: colors.textMuted,
  },
});
