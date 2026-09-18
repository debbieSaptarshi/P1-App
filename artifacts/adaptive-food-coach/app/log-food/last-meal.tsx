import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Stack, useRouter } from 'expo-router';
import { CircleIconButton } from '@/components/meals/CircleIconButton';
import { LastMealCard } from '@/components/meals/LastMealCard';
import { LAST_MEALS } from '@/constants/lastMeals';
import { colors, spacing } from '@/constants/tokens';

const iconBack = require('@/assets/images/nutrition/icon-back.svg');

/**
 * Last Meal list — every recently logged (or family-added) dish.
 *
 * Opened from Home “See All”. Tapping a card opens the dish nutrition
 * template for that meal.
 */
export default function LastMealListScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.root}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={[styles.header, { paddingTop: insets.top + spacing.xs }]}>
        <CircleIconButton
          source={iconBack}
          accessibilityLabel="Back"
          testID="last-meal-back"
          onPress={() => router.back()}
        />
        <Text style={styles.title}>Last  Meal</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
      >
        {LAST_MEALS.map((dish) => (
          <View key={dish.id} style={styles.item}>
            {dish.addedBy ? <Text style={styles.addedBy}>{dish.addedBy}</Text> : null}
            <LastMealCard
              dish={dish}
              onPress={() => router.push(`/log-food/dish/${dish.id}`)}
            />
          </View>
        ))}
      </ScrollView>
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
  title: {
    flex: 1,
    textAlign: 'center',
    fontFamily: 'Inter_500Medium',
    fontSize: 16,
    lineHeight: 22,
    letterSpacing: -0.18,
    color: colors.textPrimary,
  },
  headerSpacer: {
    width: 40,
    height: 40,
  },
  list: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: spacing.md,
  },
  item: {
    gap: spacing.md,
  },
  addedBy: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    lineHeight: 20,
    letterSpacing: -0.16,
    color: '#475569',
  },
});
