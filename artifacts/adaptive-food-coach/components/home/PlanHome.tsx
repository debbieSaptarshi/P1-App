import React, { useMemo } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { demoMode } from '@/services/supabase';
import { LAST_MEALS } from '@/constants/lastMeals';
import { MEAL_EMOJI, MEAL_LABELS, suggestedMealType } from '@/constants/homeLayouts';
import { remainingFor, resolveProgram, type ProgramDefinition } from '@/constants/programs';
import { colors, radii, spacing } from '@/constants/tokens';
import { useAppStore } from '@/hooks/useAppStore';
import { CircularSaucer } from '@/components/meals/CircularSaucer';

export function PlanHome({
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
  const nextType = useMemo(
    () => suggestedMealType(log.entries.map((entry) => entry.mealType)),
    [log.entries],
  );
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
  const ideas = demoMode
    ? LAST_MEALS.slice(0, 3)
    : state.mealRecipes.slice(0, 3).map((recipe) => ({
        id: recipe.id,
        name: recipe.name,
        calories: recipe.totalCalories,
        protein: recipe.totalProtein,
        image: undefined as undefined,
      }));
  const hero = ideas[0];

  return (
    <View style={styles.root}>
      <Animated.View entering={FadeInDown.duration(400).delay(200)} style={styles.hero}>
        <Text style={styles.heroKicker}>Eat next</Text>
        <Text style={styles.heroTitle}>
          {MEAL_EMOJI[nextType]}  {MEAL_LABELS[nextType]}
        </Text>
        <Text style={styles.heroHint}>
          {program.focusHint}
        </Text>
        {hero ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Suggested ${hero.name}`}
            testID="plan-hero-meal"
            onPress={() => {
              Haptics.selectionAsync();
              if (demoMode && 'image' in hero && hero.image) {
                router.push(`/log-food/dish/${hero.id}`);
                return;
              }
              router.push('/log-food');
            }}
            style={({ pressed }) => [styles.heroMeal, pressed && styles.pressed]}
          >
            {'image' in hero && hero.image ? (
              <CircularSaucer source={hero.image} size={64} />
            ) : (
              <View style={styles.heroEmoji}>
                <Text style={styles.heroEmojiText}>{MEAL_EMOJI[nextType]}</Text>
              </View>
            )}
            <View style={styles.heroMealText}>
              <Text style={styles.heroMealName} numberOfLines={2}>
                {hero.name}
              </Text>
              <Text style={styles.heroMealMeta}>
                {Math.round(hero.protein)} g protein
                {hero.calories ? ` · ${Math.round(hero.calories)} kcal` : ''}
              </Text>
            </View>
            <Feather name="chevron-right" size={18} color="#94A3B8" />
          </Pressable>
        ) : (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Ask the coach for a meal idea"
            onPress={() => router.push('/coach')}
            style={({ pressed }) => [styles.heroMeal, pressed && styles.pressed]}
          >
            <Text style={styles.heroMealName}>Ask the coach for a meal idea</Text>
          </Pressable>
        )}
      </Animated.View>

      <Animated.View entering={FadeInDown.duration(400).delay(260)} style={styles.needRow}>
        <NeedCard
          label={`${primary.label.replace(' Left', '')} still needed`}
          value={`${Math.round(primary.left)}${primary.unit ? ` ${primary.unit}` : ''}`}
        />
        <NeedCard
          label={`${secondary.label.replace(' Left', '')} still needed`}
          value={`${Math.round(secondary.left)}${secondary.unit ? ` ${secondary.unit}` : ''}`}
        />
      </Animated.View>

      <Animated.View entering={FadeInDown.duration(400).delay(300)}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Meal ideas</Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Ask coach"
            testID="plan-ask-coach"
            onPress={() => {
              Haptics.selectionAsync();
              router.push('/coach');
            }}
            style={({ pressed }) => pressed && styles.pressed}
          >
            <Text style={styles.seeAll}>Ask coach</Text>
          </Pressable>
        </View>
        {ideas.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>Save a meal idea from the coach to see it here.</Text>
          </View>
        ) : (
          ideas.map((idea) => (
            <Pressable
              key={idea.id}
              accessibilityRole="button"
              accessibilityLabel={idea.name}
              testID={`plan-idea-${idea.id}`}
              onPress={() => {
                Haptics.selectionAsync();
                if (demoMode && 'image' in idea && idea.image) {
                  router.push(`/log-food/dish/${idea.id}`);
                  return;
                }
                router.push('/log-food');
              }}
              style={({ pressed }) => [styles.ideaCard, pressed && styles.pressed]}
            >
              {'image' in idea && idea.image ? (
                <Image source={idea.image} style={styles.ideaImage} />
              ) : (
                <View style={styles.ideaEmoji}>
                  <Text style={styles.heroEmojiText}>{MEAL_EMOJI[nextType]}</Text>
                </View>
              )}
              <View style={styles.ideaBody}>
                <Text style={styles.ideaName} numberOfLines={2}>
                  {idea.name}
                </Text>
                <Text style={styles.ideaMeta}>{Math.round(idea.protein)} g protein</Text>
              </View>
              <Feather name="plus" size={18} color={colors.textPrimary} />
            </Pressable>
          ))
        )}
      </Animated.View>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Log this meal"
        testID="plan-log-meal"
        onPress={() => {
          Haptics.selectionAsync();
          router.push('/log-food');
        }}
        style={({ pressed }) => [styles.logCta, pressed && styles.pressed]}
      >
        <Feather name="plus" size={18} color={colors.textInverse} />
        <Text style={styles.logCtaText}>Log {MEAL_LABELS[nextType].toLowerCase()}</Text>
      </Pressable>
    </View>
  );
}

function NeedCard({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.needCard}>
      <Text style={styles.needValue}>{value}</Text>
      <Text style={styles.needLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: 16, marginBottom: 8 },
  hero: {
    backgroundColor: colors.darkSurface,
    borderRadius: radii.xl,
    padding: 18,
    gap: 12,
  },
  heroKicker: {
    color: '#94A3B8',
    fontSize: 13,
    fontFamily: 'Inter_500Medium',
  },
  heroTitle: {
    color: colors.textInverse,
    fontSize: 28,
    fontFamily: 'Inter_700Bold',
    letterSpacing: -0.5,
  },
  heroHint: {
    color: '#CBD5E1',
    fontSize: 13,
    lineHeight: 18,
    fontFamily: 'Inter_400Regular',
  },
  heroMeal: {
    backgroundColor: '#1E293B',
    borderRadius: 18,
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  heroEmoji: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#0F172A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroEmojiText: { fontSize: 28 },
  heroMealText: { flex: 1, minWidth: 0, gap: 2 },
  heroMealName: {
    color: colors.textInverse,
    fontFamily: 'Inter_600SemiBold',
    fontSize: 16,
  },
  heroMealMeta: {
    color: '#94A3B8',
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
  },
  needRow: { flexDirection: 'row', gap: 8 },
  needCard: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: radii.xl,
    padding: 16,
    minHeight: 88,
    justifyContent: 'center',
    gap: 4,
  },
  needValue: {
    fontFamily: 'Inter_700Bold',
    fontSize: 22,
    color: colors.textPrimary,
  },
  needLabel: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: colors.textMuted,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  sectionTitle: {
    fontFamily: 'Inter_700Bold',
    fontSize: 20,
    color: colors.textPrimary,
    letterSpacing: -0.4,
  },
  seeAll: {
    fontFamily: 'Inter_500Medium',
    fontSize: 12,
    color: colors.textMuted,
  },
  ideaCard: {
    backgroundColor: colors.card,
    borderRadius: radii.xl,
    padding: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: 8,
  },
  ideaImage: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  ideaEmoji: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.formFill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ideaBody: { flex: 1, minWidth: 0, gap: 2 },
  ideaName: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 15,
    color: colors.textPrimary,
  },
  ideaMeta: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: colors.textMuted,
  },
  emptyCard: {
    backgroundColor: colors.card,
    borderRadius: radii.xl,
    padding: 16,
  },
  emptyText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: colors.textMuted,
  },
  logCta: {
    height: 52,
    borderRadius: radii.xl,
    backgroundColor: colors.darkSurface,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 4,
  },
  logCtaText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 15,
    color: colors.textInverse,
  },
  pressed: { opacity: 0.72 },
});
