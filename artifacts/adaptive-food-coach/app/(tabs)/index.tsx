import { demoMode } from '@/services/supabase';
import { recentMeals } from '@/services/recent-meals';
import { localDate } from '@/services/dates';
import React, { useMemo, useState } from 'react';
import {
  Dimensions,
  Image,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { useAppStore } from '@/hooks/useAppStore';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import Svg, { Circle, Path } from 'react-native-svg';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { LAST_MEALS, type LastMealDish } from '@/constants/lastMeals';
import { CircularSaucer } from '@/components/meals/CircularSaucer';
import { JournalHome } from '@/components/home/JournalHome';
import { PlanHome } from '@/components/home/PlanHome';
import { ProgramDashboard, ProgramFocusCard } from '@/components/home/ProgramDashboard';
import { resolveProgramHome } from '@/constants/programs';

const { width } = Dimensions.get('window');
const MEAL_CARD_WIDTH = 250;
const MEAL_CARD_GAP = 16;
const DASHBOARD_SIDE_INSET = 20;
const PAGE_WIDTH = width;
const WATER_STEP_ML = 50;
const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;



function isoDate(date: Date): string {
  return localDate(date);
}

function currentWeekDays() {
  const start = new Date();
  start.setHours(12, 0, 0, 0);
  start.setDate(start.getDate() - start.getDay());
  return WEEKDAY_LABELS.map((day, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    return {
      day,
      num: String(date.getDate()),
      iso: isoDate(date),
    };
  });
}

function greetingForNow(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good Morning';
  if (hour < 17) return 'Good Afternoon';
  return 'Good Evening';
}

function remaining(goal: number, consumed: number): number {
  return Math.max(0, goal - consumed);
}

function progressPct(consumed: number, goal: number): number {
  if (goal <= 0) return 0;
  return Math.max(0, Math.min(100, (consumed / goal) * 100));
}

function formatSteps(value: number): string {
  if (value >= 1000) return (value / 1000).toFixed(3);
  return value.toLocaleString();
}

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const router = useRouter();
  const { state, streakDays, foodLogForDate, actions } = useAppStore();
  const profile = state.profile;
  const { program, layout: homeLayout } = resolveProgramHome({
    programId: state.preferences.programId,
    layoutOverride: state.preferences.homeLayout,
  });
  const loggedMeals = demoMode ? LAST_MEALS : recentMeals(state.foodLogs);
  const meals = loggedMeals.length > 0 ? loggedMeals : LAST_MEALS.slice(0, 3);
  const sampleMeal = loggedMeals.length === 0;
  const days = useMemo(() => currentWeekDays(), []);
  const todayIso = isoDate(new Date());

  const [selectedIso, setSelectedIso] = useState(todayIso);
  const [activeMeal, setActiveMeal] = useState(0);
  const [activePage, setActivePage] = useState(0);

  const selectedLog = foodLogForDate(selectedIso);

  const dashboardMetrics = useMemo(() => {
    const totals = selectedLog.totals;
    const goals = profile.nutrientGoals;
    const fiberLeft = Math.max(0, goals.fiber - totals.fiber);
    const sugarLeft = 0; // Sugar is not tracked by the nutrition contract.
    const sodiumLeft = Math.max(0, goals.sodium - totals.sodium);
    const fiberProgress = progressPct(totals.fiber, goals.fiber);
    const sugarProgress = 0;
    const sodiumProgress = progressPct(totals.sodium, goals.sodium);
    const caloriesLeft = Math.round(remaining(goals.calories, totals.calories));
    const proteinLeft = remaining(goals.protein, totals.protein);
    const carbsLeft = remaining(goals.carbs, totals.carbs);
    const fatLeft = remaining(goals.fat, totals.fat);
    const calorieProgress = progressPct(totals.calories, goals.calories);
    const carbProgress = progressPct(totals.carbs, goals.carbs);
    const proteinProgress = progressPct(totals.protein, goals.protein);
    const fatProgress = progressPct(totals.fat, goals.fat);
    const healthScore = Math.max(
      0,
      Math.min(
        10,
        Math.round((calorieProgress + carbProgress + proteinProgress + fiberProgress) / 40),
      ),
    );
    const caloriesBurned = state.exerciseLogs
      .filter((entry) => entry.date === selectedIso)
      .reduce((sum, entry) => sum + entry.caloriesBurned, 0);
    const steps = state.steps.find(s => s.date === selectedIso)?.count ?? 0;
    const stepsProgress = progressPct(steps, profile.dailyStepGoal);
    const burnProgress = progressPct(caloriesBurned, 500);
    const advice =
      calorieProgress < 50
        ? 'Your log is still filling in. Add meals and water to see your progress.'
        : 'These totals reflect your logged meals. Ask the coach for ideas that fit your preferences.';
    return {
      caloriesLeft,
      calorieGoal: goals.calories,
      calorieProgress,
      proteinLeft,
      proteinGoal: goals.protein,
      carbsLeft,
      carbGoal: goals.carbs,
      fatLeft,
      fatGoal: goals.fat,
      proteinProgress,
      carbProgress,
      fatProgress,
      fiberLeft,
      fiberGoal: goals.fiber,
      sugarLeft,
      sodiumLeft,
      fiberProgress,
      sugarProgress,
      sodiumProgress,
      healthScore,
      advice,
      steps,
      stepsProgress,
      caloriesBurned,
      burnProgress,
      waterMl: selectedLog.waterMl ?? 0,
      waterGoalMl: goals.waterMl,
    };
  }, [profile, selectedIso, selectedLog, state.exerciseLogs, state.steps]);

  const remainingTotals = {
    caloriesLeft: dashboardMetrics.caloriesLeft,
    calorieGoal: dashboardMetrics.calorieGoal,
    calorieProgress: dashboardMetrics.calorieProgress,
    proteinLeft: dashboardMetrics.proteinLeft,
    proteinGoal: dashboardMetrics.proteinGoal,
    proteinProgress: dashboardMetrics.proteinProgress,
    carbsLeft: dashboardMetrics.carbsLeft,
    carbGoal: dashboardMetrics.carbGoal,
    carbProgress: dashboardMetrics.carbProgress,
    fatLeft: dashboardMetrics.fatLeft,
    fatGoal: dashboardMetrics.fatGoal,
    fatProgress: dashboardMetrics.fatProgress,
    fiberLeft: dashboardMetrics.fiberLeft,
    fiberGoal: dashboardMetrics.fiberGoal,
    fiberProgress: dashboardMetrics.fiberProgress,
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: insets.top + 16, paddingBottom: 72 + (insets.bottom || 16) }
        ]}
        showsVerticalScrollIndicator={false}
        style={styles.pageScroll}
      >
        {/* Header */}
        <Animated.View entering={FadeInDown.duration(400).delay(100)} style={styles.header}>
          <View style={styles.headerLeft}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Open profile"
              testID="open-profile"
              onPress={() => {
                Haptics.selectionAsync();
                router.push('/profile');
              }}
              style={({ pressed }) => pressed && styles.pressed}
            >
              <Image
                source={require('@/assets/images/roasted-chicken.png')}
                style={styles.avatar}
                accessibilityLabel="User profile"
              />
            </Pressable>
            <View style={styles.headerTextContainer}>
              <Text style={[styles.greeting, { color: colors.mutedForeground }]}>{greetingForNow()}</Text>
              <Text style={[styles.name, { color: colors.foreground }]}>{profile.name}</Text>
              {program.id !== 'general' ? (
                <Text style={styles.programLabel}>{program.title}</Text>
              ) : null}
            </View>
          </View>
          <View style={styles.headerActions}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Personalise your home"
              testID="personalise-home"
              onPress={() => {
                Haptics.selectionAsync();
                router.push('/profile-edit/home');
              }}
              style={({ pressed }) => [styles.personaliseBtn, pressed && styles.pressed]}
            >
              <Feather name="sliders" size={18} color={colors.foreground} />
            </Pressable>
            <View style={styles.streakPill}>
              <Feather name="award" size={19} color={colors.foreground} />
              <Text style={[styles.streakText, { color: colors.foreground }]}>{streakDays}</Text>
            </View>
          </View>
        </Animated.View>

        {/* Date Strip */}
        <Animated.View entering={FadeInDown.duration(400).delay(150)} style={styles.dateStrip}>
          {days.map((item) => (
            (() => {
              const selected = selectedIso === item.iso;
              const isToday = item.iso === todayIso;
              return (
            <Pressable
              key={item.iso}
              style={({ pressed }) => [
                styles.dateItem,
                (selected || isToday) && styles.dateItemDark,
                selected && styles.dateItemSelected,
                pressed && styles.pressed,
              ]}
              onPress={() => {
                setSelectedIso(item.iso);
                Haptics.selectionAsync();
              }}
              accessibilityRole="button"
              accessibilityLabel={`${item.day} ${item.num}`}
              accessibilityState={{ selected }}
              testID={`date-${item.iso}`}
            >
              <Text style={[
                styles.dateDay,
                { color: selected || isToday ? colors.primaryForeground : colors.mutedForeground }
              ]}>{item.day}</Text>
              <Text style={[
                styles.dateNum,
                { color: selected || isToday ? colors.primaryForeground : colors.mutedForeground }
              ]}>{item.num}</Text>
            </Pressable>
              );
            })()
          ))}
        </Animated.View>

        <ProgramFocusCard program={program} />

        {homeLayout !== 'overview' ? (
          <View style={{ marginBottom: 16 }}>
            <ProgramDashboard program={program} totals={remainingTotals} />
          </View>
        ) : null}

        {homeLayout === 'journal' ? <JournalHome selectedIso={selectedIso} program={program} /> : null}
        {homeLayout === 'plan' ? <PlanHome selectedIso={selectedIso} program={program} /> : null}

        {homeLayout === 'overview' ? (
        <React.Fragment>
        <Animated.View entering={FadeInDown.duration(400).delay(200)} style={styles.pagerWrapper}>
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            style={styles.pagerScroll}
            decelerationRate="fast"
            scrollEventThrottle={16}
            onMomentumScrollEnd={(event: NativeSyntheticEvent<NativeScrollEvent>) => {
              const next = Math.round(event.nativeEvent.contentOffset.x / PAGE_WIDTH);
              setActivePage(Math.max(0, Math.min(next, 2)));
              Haptics.selectionAsync();
            }}
            testID="dashboard-pager"
          >
            {/* Page 1: Program remaining cards */}
            <View style={styles.pagerPage} testID="dashboard-page-calories">
              <ProgramDashboard
                program={program}
                totals={remainingTotals}
              />
            </View>

            {/* Page 2: Fiber / Sugar / Sodium + Health Score */}
            <View style={[styles.pagerPage, styles.pagerPageStack]} testID="dashboard-page-health-score">
              <View style={styles.macrosRow}>
                <NutrientMiniCard
                  value={`${Math.round(dashboardMetrics.fiberLeft)}`}
                  unit="g"
                  label="Fiber Left"
                  progress={dashboardMetrics.fiberProgress}
                  emoji="🍎"
                />
                <NutrientMiniCard
                  value="—"
                  unit="g"
                  label="Sugar (not tracked)"
                  progress={dashboardMetrics.sugarProgress}
                  emoji="🍧"
                />
                <NutrientMiniCard
                  value={`${Math.round(dashboardMetrics.sodiumLeft)}`}
                  unit="mg"
                  label="Sodium Left"
                  progress={dashboardMetrics.sodiumProgress}
                  emoji="🍚"
                />
              </View>
              <HealthScoreCard
                score={dashboardMetrics.healthScore}
                outOf={10}
                advice={dashboardMetrics.advice}
              />
            </View>

            {/* Page 3: Steps / Burn + Water */}
            <View style={[styles.pagerPage, styles.pagerPageStack]} testID="dashboard-page-workout">
              <View style={styles.macrosRow}>
                <ActivityMiniCard
                  label="Steps"
                  value={formatSteps(dashboardMetrics.steps)}
                  progress={dashboardMetrics.stepsProgress}
                  emoji="👣"
                  largeRing
                />
                <ActivityMiniCard
                  label="Calorie Burned"
                  value={`${dashboardMetrics.caloriesBurned}`}
                  unit="Kcal"
                  progress={dashboardMetrics.burnProgress}
                  emoji="🔥"
                  largeRing
                />
              </View>
              <WaterIntakeCard
                valueMl={dashboardMetrics.waterMl}
                goalMl={dashboardMetrics.waterGoalMl}
                onChange={(next) => {
                  void actions.setWaterIntake(selectedIso, next);
                }}
              />
            </View>
          </ScrollView>

          <View style={styles.pagination} accessibilityLabel={`Page ${activePage + 1} of 3`}>
            {[0, 1, 2].map((index) => (
              <View
                key={index}
                style={[
                  styles.paginationDot,
                  index === activePage ? styles.paginationDotActive : styles.paginationDotInactive,
                ]}
              />
            ))}
          </View>
        </Animated.View>

        {/* Meals Section */}
        <Animated.View entering={FadeInDown.duration(400).delay(300)} style={styles.mealsSection}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Last Meal</Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="See all meals"
              testID="see-all-meals"
              onPress={() => router.push('/log-food/last-meal')}
              style={({ pressed }) => pressed && styles.pressed}
            >
              <Text style={[styles.seeAll, { color: colors.mutedForeground }]}>See All</Text>
            </Pressable>
          </View>

          <View style={styles.radialCarousel}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.carouselScroll}
              contentContainerStyle={[
                styles.carouselContent,
                { paddingHorizontal: Math.max((width - MEAL_CARD_WIDTH) / 2, 20) },
              ]}
              snapToInterval={MEAL_CARD_WIDTH + MEAL_CARD_GAP}
              snapToAlignment="start"
              decelerationRate="fast"
              scrollEventThrottle={16}
              onMomentumScrollEnd={(event: NativeSyntheticEvent<NativeScrollEvent>) => {
                const next = Math.round(
                  event.nativeEvent.contentOffset.x / (MEAL_CARD_WIDTH + MEAL_CARD_GAP),
                );
                setActiveMeal(Math.max(0, Math.min(next, meals.length - 1)));
                Haptics.selectionAsync();
              }}
              testID="meal-radial-carousel"
            >
              {meals.map((meal, index) => (
                <RadialMealCard
                  key={meal.id}
                  meal={meal}
                  active={activeMeal === index}
                  onPress={() => {
                    Haptics.selectionAsync();
                    if (sampleMeal) {
                      router.push('/log-food');
                      return;
                    }
                    router.push(demoMode ? `/log-food/dish/${meal.id}` : `/log-food/detail/${meal.id}`);
                  }}
                />
              ))}
            </ScrollView>
            <BlurView
              intensity={10}
              tint="light"
              pointerEvents="none"
              style={[styles.edgeBlur, styles.edgeBlurLeft]}
            />
            <BlurView
              intensity={10}
              tint="light"
              pointerEvents="none"
              style={[styles.edgeBlur, styles.edgeBlurRight]}
            />
          </View>

          <View
            style={styles.pagination}
            accessibilityLabel={`Meal ${activeMeal + 1} of ${meals.length}`}
          >
            {meals.map((meal, index) => (
              <View
                key={meal.id}
                style={[
                  styles.paginationDot,
                  { backgroundColor: index === activeMeal ? colors.foreground : colors.border },
                  index === activeMeal && styles.paginationDotActive,
                ]}
              />
            ))}
          </View>
        </Animated.View>
        </React.Fragment>
        ) : null}

      </ScrollView>
    </View>
  );
}

function CircularProgress({ size, progress, strokeWidth, color, trackColor }: any) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const clamped = Math.max(0, Math.min(100, Number.isFinite(progress) ? progress : 0));
  const drawn = (clamped / 100) * circumference;

  return (
    <Svg width={size} height={size}>
      <Circle stroke={trackColor} fill="none" cx={size / 2} cy={size / 2} r={radius} strokeWidth={strokeWidth} />
      {clamped > 0.5 ? (
        <Circle
          stroke={color}
          fill="none"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          strokeDasharray={`${drawn} ${circumference}`}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      ) : null}
    </Svg>
  );
}

const OVAL_R = 38;
const OVAL_TOP = 4;
const OVAL_BOTTOM = 80;
const OVAL_LEFT = 42;
const OVAL_RIGHT = 142;
const OVAL_CY = 42;
const OVAL_START_X = 92;
const OVAL_TOP_LEFT = OVAL_START_X - OVAL_LEFT;
const OVAL_SEMI = Math.PI * OVAL_R;
const OVAL_BOTTOM_LEN = OVAL_RIGHT - OVAL_LEFT;
const OVAL_TOP_RIGHT = OVAL_RIGHT - OVAL_START_X;
const OVAL_LENGTH = OVAL_TOP_LEFT + OVAL_SEMI + OVAL_BOTTOM_LEN + OVAL_SEMI + OVAL_TOP_RIGHT;
const OVAL_TRACK =
  'M92 4 H42 A38 38 0 0 0 4 42 A38 38 0 0 0 42 80 H142 A38 38 0 0 0 180 42 A38 38 0 0 0 142 4 H92';

function ovalPoint(progress: number): { x: number; y: number } {
  const distance = (Math.max(0, Math.min(100, progress)) / 100) * OVAL_LENGTH;
  if (distance <= OVAL_TOP_LEFT) {
    return { x: OVAL_START_X - distance, y: OVAL_TOP };
  }
  let rest = distance - OVAL_TOP_LEFT;
  if (rest <= OVAL_SEMI) {
    const angle = -Math.PI / 2 - (rest / OVAL_SEMI) * Math.PI;
    return { x: OVAL_LEFT + OVAL_R * Math.cos(angle), y: OVAL_CY + OVAL_R * Math.sin(angle) };
  }
  rest -= OVAL_SEMI;
  if (rest <= OVAL_BOTTOM_LEN) {
    return { x: OVAL_LEFT + rest, y: OVAL_BOTTOM };
  }
  rest -= OVAL_BOTTOM_LEN;
  if (rest <= OVAL_SEMI) {
    const angle = Math.PI / 2 - (rest / OVAL_SEMI) * Math.PI;
    return { x: OVAL_RIGHT + OVAL_R * Math.cos(angle), y: OVAL_CY + OVAL_R * Math.sin(angle) };
  }
  rest -= OVAL_SEMI;
  return { x: OVAL_RIGHT - rest, y: OVAL_TOP };
}

function OvalProgress({
  progress,
  color,
  trackColor,
  thumbColor,
}: {
  progress: number;
  color: string;
  trackColor: string;
  thumbColor: string;
}) {
  const clamped = Math.max(0, Math.min(100, Number.isFinite(progress) ? progress : 0));
  const drawn = (clamped / 100) * OVAL_LENGTH;
  const thumb = ovalPoint(clamped);

  return (
    <Svg width={184} height={84} viewBox="0 0 184 84">
      <Path d={OVAL_TRACK} fill="none" stroke={trackColor} strokeWidth={8} strokeLinecap="round" />
      {clamped > 0.5 ? (
        <Path
          d={OVAL_TRACK}
          fill="none"
          stroke={color}
          strokeWidth={8}
          strokeLinecap="round"
          strokeDasharray={`${drawn} ${OVAL_LENGTH}`}
        />
      ) : null}
      {clamped > 0.5 ? (
        <Circle cx={thumb.x} cy={thumb.y} r={9} fill={thumbColor} stroke="#FFFFFF" strokeWidth={5} />
      ) : null}
    </Svg>
  );
}

function MacroCard({ title, value, progress, emoji }: {
  title: string;
  value: string;
  progress: number;
  emoji: string;
}) {
  const colors = useColors();
  return (
    <View style={[styles.macroCard, { backgroundColor: colors.card }]}>
      <View style={styles.macroCardBody}>
        <Text style={[styles.macroCardValue, { color: colors.foreground }]} numberOfLines={1} adjustsFontSizeToFit>
          {value}
        </Text>
        <Text style={[styles.macroCardLeft, { color: colors.mutedForeground }]}>{title}</Text>
      </View>
      <View style={styles.macroRing}>
        <ProgressRing progress={progress} size={83} emoji={emoji} />
      </View>
    </View>
  );
}

function NutrientMiniCard({
  value,
  unit,
  label,
  progress,
  emoji,
}: {
  value: string;
  unit: string;
  label: string;
  progress: number;
  emoji: string;
}) {
  const colors = useColors();
  return (
    <View style={[styles.nutrientCard, { backgroundColor: colors.card }]}>
      <View style={styles.nutrientCardText}>
        <Text style={[styles.nutrientValue, { color: colors.foreground }]}>
          {value}
          <Text style={styles.nutrientUnit}> {unit}</Text>
        </Text>
        <Text style={styles.nutrientLabel}>{label}</Text>
      </View>
      <View style={styles.nutrientRingWrap}>
        <ProgressRing progress={progress} size={83} emoji={emoji} />
      </View>
    </View>
  );
}

function ActivityMiniCard({
  label,
  value,
  unit,
  progress,
  emoji,
  largeRing,
}: {
  label: string;
  value: string;
  unit?: string;
  progress: number;
  emoji: string;
  largeRing?: boolean;
}) {
  const colors = useColors();
  const ringSize = largeRing ? 100 : 83;
  return (
    <View style={[styles.activityCard, { backgroundColor: colors.card }]}>
      <View style={styles.nutrientCardText}>
        <Text style={styles.nutrientLabel}>{label}</Text>
        <Text style={[styles.nutrientValue, { color: colors.foreground }]}>
          {value}
          {unit ? <Text style={styles.activityUnit}> {unit}</Text> : null}
        </Text>
      </View>
      <View style={[styles.nutrientRingWrap, largeRing && styles.activityRingWrap]}>
        <ProgressRing progress={progress} size={ringSize} emoji={emoji} />
      </View>
    </View>
  );
}

function ProgressRing({
  progress,
  size,
  emoji,
}: {
  progress: number;
  size: number;
  emoji: string;
}) {
  const strokeWidth = 6;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.max(0, Math.min(100, Number.isFinite(progress) ? progress : 0));
  const drawn = (clamped / 100) * circumference;
  const angle = ((clamped / 100) * 360 - 90) * (Math.PI / 180);
  const thumbX = size / 2 + radius * Math.cos(angle);
  const thumbY = size / 2 + radius * Math.sin(angle);

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#E2E8F0"
          strokeWidth={strokeWidth}
          fill="none"
        />
        {clamped > 0.5 ? (
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="#1570EF"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            fill="none"
            strokeDasharray={`${drawn} ${circumference}`}
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
          />
        ) : null}
        {clamped > 0.5 ? (
          <Circle cx={thumbX} cy={thumbY} r={6} fill="#1570EF" />
        ) : null}
      </Svg>
      <Text style={styles.ringEmoji}>{emoji}</Text>
    </View>
  );
}

function HealthScoreCard({ score, outOf, advice }: { score: number; outOf: number; advice: string }) {
  const progress = (score / outOf) * 100;
  return (
    <View style={styles.healthScoreCard} testID="health-score-card">
      <View style={styles.healthScoreHeader}>
        <Text style={styles.healthScoreTitle}>Logging progress</Text>
        <Text style={styles.healthScoreValue}>{score}/{outOf}</Text>
      </View>
      <View style={styles.healthScoreTrack}>
        <View style={[styles.healthScoreFill, { width: `${progress}%` }]} />
      </View>
      <Text style={styles.healthScoreAdvice}>{advice}</Text>
    </View>
  );
}

function WaterIntakeCard({
  valueMl,
  goalMl,
  onChange,
}: {
  valueMl: number;
  goalMl: number;
  onChange: (v: number) => void;
}) {
  const colors = useColors();

  const adjust = (delta: number) => {
    onChange(Math.max(0, Math.min(goalMl, valueMl + delta)));
    Haptics.selectionAsync();
  };

  return (
    <View style={[styles.waterCard, { backgroundColor: colors.card }]}>
      <View style={styles.waterLeft}>
        <Text style={[styles.waterTitle, { color: colors.foreground }]}>Water Intake</Text>
        <View style={styles.waterValueRow}>
          <Image
            source={require('@/assets/images/home/water-glass.png')}
            style={styles.waterGlass}
            accessibilityLabel="Water glass"
          />
          <Text style={[styles.waterValue, { color: colors.foreground }]}>
            {valueMl}
            <Text style={styles.waterUnit}> ml</Text>
          </Text>
          <Feather name="settings" size={20} color="#64748B" accessibilityLabel="Water settings" />
        </View>
      </View>
      <View style={styles.waterButtons}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Decrease water intake"
          testID="water-decrease"
          onPress={() => adjust(-WATER_STEP_ML)}
          style={({ pressed }) => [styles.waterButtonOutline, pressed && styles.pressed]}
        >
          <Feather name="minus" size={16} color="#0F172A" />
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Increase water intake"
          testID="water-increase"
          onPress={() => adjust(WATER_STEP_ML)}
          style={({ pressed }) => [styles.waterButtonFilled, pressed && styles.pressed]}
        >
          <Feather name="plus" size={16} color="#FFFFFF" />
        </Pressable>
      </View>
    </View>
  );
}

function RadialMealCard({
  meal,
  active,
  onPress,
}: {
  meal: LastMealDish;
  active: boolean;
  onPress: () => void;
}) {
  const colors = useColors();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${meal.name}, ${meal.calories} calories`}
      testID={`meal-card-${meal.id}`}
      onPress={onPress}
      style={({ pressed }) => [
        styles.mealCard,
        {
          backgroundColor: colors.card,
          opacity: active ? 1 : 0.48,
          transform: [{ scale: pressed ? 0.98 : active ? 1 : 0.93 }],
        },
      ]}
    >
      <View style={styles.plateHalo}>
        <CircularSaucer source={meal.image} size={150} testID={`meal-saucer-${meal.id}`} />
      </View>
      <Text style={[styles.mealName, { color: colors.foreground }]} numberOfLines={2}>
        {meal.name}
      </Text>
      <View style={styles.calorieBlock}>
        <Feather name="zap" size={13} color={colors.foreground} />
        <Text style={[styles.calorieLabel, { color: colors.mutedForeground }]}>Calories</Text>
        <Text style={[styles.mealCals, { color: colors.foreground }]}>
          {meal.calories}{' '}
          <Text style={[styles.mealUnit, { color: colors.mutedForeground }]}>Kcal</Text>
        </Text>
      </View>
      <View style={styles.mealMacros}>
        <MealMacro icon="circle" value={meal.protein} />
        <MealMacro icon="box" value={meal.carbs} />
        <MealMacro icon="heart" value={meal.fat} />
      </View>
    </Pressable>
  );
}

function MealMacro({ icon, value }: { icon: 'circle' | 'box' | 'heart'; value: number }) {
  const colors = useColors();

  return (
    <View style={styles.mealMacro}>
      <Feather name={icon} size={13} color={colors.foreground} />
      <Text style={[styles.mealMacroValue, { color: colors.foreground }]}>
        {value} <Text style={[styles.mealMacroUnit, { color: colors.mutedForeground }]}>g</Text>
      </Text>
    </View>
  );
}

const bentoCardShadow = {
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 1 },
  shadowOpacity: 0.04,
  shadowRadius: 2,
  elevation: 1,
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  pageScroll: {
    overflow: 'visible',
  },
  scrollContent: {
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTextContainer: {
    marginLeft: 12,
  },
  greeting: {
    fontSize: 13,
    fontFamily: 'Inter_500Medium',
  },
  name: {
    fontSize: 16,
    fontFamily: 'Inter_500Medium',
  },
  programLabel: {
    marginTop: 2,
    fontSize: 12,
    fontFamily: 'Inter_500Medium',
    color: '#1570EF',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E5E5EA',
  },
  streakPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  streakText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 14,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  personaliseBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateStrip: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  dateItem: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 44,
    height: 60,
    borderRadius: 22,
  },
  dateItemDark: {
    backgroundColor: '#0A0A0A',
  },
  dateItemSelected: {
    borderWidth: 2,
    borderColor: '#0A0A0A',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.14,
    shadowRadius: 4,
  },
  pressed: {
    opacity: 0.65,
  },
  dateDay: {
    fontSize: 12,
    fontFamily: 'Inter_500Medium',
    marginBottom: 4,
  },
  dateNum: {
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
  },
  dashboardCard: {
    backgroundColor: '#0A0A0A',
    borderRadius: 24,
    paddingHorizontal: 18,
    paddingVertical: 18,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    ...bentoCardShadow,
  },
  caloriesNumber: {
    color: '#ffffff',
    fontSize: 40,
    fontFamily: 'Inter_700Bold',
    letterSpacing: -0.5,
    marginBottom: 2,
  },
  caloriesIcon: {
    marginBottom: 2,
  },
  caloriesLabel: {
    color: '#94A3B8',
    fontSize: 13,
    fontFamily: 'Inter_500Medium',
  },
  progressRingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressLabel: {
    position: 'absolute',
    color: '#ffffff',
    fontSize: 15,
    fontFamily: 'Inter_600SemiBold',
    zIndex: 1,
  },
  pagerWrapper: {
    marginHorizontal: -DASHBOARD_SIDE_INSET,
    marginBottom: 24,
    overflow: 'hidden',
  },
  pagerScroll: {
    width: PAGE_WIDTH,
  },
  pagerPage: {
    width: PAGE_WIDTH,
    paddingHorizontal: DASHBOARD_SIDE_INSET,
  },
  pagerPageStack: {
    gap: 8,
  },
  macrosRow: {
    flexDirection: 'row',
    gap: 8,
  },
  macroCard: {
    flex: 1,
    borderRadius: 24,
    padding: 16,
    gap: 10,
    minHeight: 162,
    ...bentoCardShadow,
  },
  nutrientCard: {
    flex: 1,
    borderRadius: 24,
    padding: 16,
    gap: 10,
    minHeight: 162,
    ...bentoCardShadow,
  },
  nutrientCardText: {
    gap: 2,
  },
  nutrientValue: {
    fontSize: 24,
    lineHeight: 30,
    fontFamily: 'Inter_500Medium',
    letterSpacing: -0.15,
  },
  nutrientUnit: {
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: -0.12,
  },
  nutrientLabel: {
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: -0.12,
    color: '#94A3B8',
    fontFamily: 'Inter_400Regular',
  },
  nutrientRingWrap: {
    height: 83,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activityCard: {
    flex: 1,
    borderRadius: 24,
    padding: 16,
    gap: 10,
    minHeight: 180,
    ...bentoCardShadow,
  },
  activityRingWrap: {
    height: 100,
  },
  activityUnit: {
    fontSize: 10,
    lineHeight: 12,
    color: '#64748B',
    fontFamily: 'Inter_400Regular',
  },
  ringEmoji: {
    position: 'absolute',
    fontSize: 20,
    letterSpacing: 1,
  },
  healthScoreCard: {
    backgroundColor: '#0A0A0A',
    borderRadius: 24,
    padding: 16,
    gap: 16,
    ...bentoCardShadow,
  },
  healthScoreHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  healthScoreTitle: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 16,
    lineHeight: 22,
    letterSpacing: -0.18,
    fontFamily: 'Inter_500Medium',
  },
  healthScoreValue: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 16,
    lineHeight: 22,
    letterSpacing: -0.18,
    fontFamily: 'Inter_500Medium',
    textAlign: 'right',
  },
  healthScoreTrack: {
    height: 14,
    backgroundColor: '#1E293B',
    overflow: 'hidden',
  },
  healthScoreFill: {
    height: 15,
    backgroundColor: '#1570EF',
  },
  healthScoreAdvice: {
    color: '#FFFFFF',
    fontSize: 10,
    lineHeight: 12,
    fontFamily: 'Inter_400Regular',
  },
  waterCard: {
    borderRadius: 24,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    minHeight: 117,
    ...bentoCardShadow,
  },
  waterLeft: {
    flex: 1,
    justifyContent: 'space-between',
    alignSelf: 'stretch',
    gap: 12,
  },
  waterTitle: {
    fontSize: 16,
    lineHeight: 22,
    letterSpacing: -0.18,
    fontFamily: 'Inter_500Medium',
  },
  waterValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  waterGlass: {
    width: 32,
    height: 32,
  },
  waterValue: {
    fontSize: 32,
    lineHeight: 38,
    letterSpacing: -0.2,
    fontFamily: 'Inter_500Medium',
  },
  waterUnit: {
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: -0.12,
    color: '#64748B',
    fontFamily: 'Inter_400Regular',
  },
  waterButtons: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  waterButtonOutline: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#0F172A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  waterButtonFilled: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#0A0A0A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  macroCardBody: {
    flexDirection: 'column',
  },
  macroCardValue: {
    fontSize: 18,
    fontFamily: 'Inter_700Bold',
    letterSpacing: -0.2,
  },
  macroCardLeft: {
    fontSize: 12,
    fontFamily: 'Inter_500Medium',
    marginTop: 2,
  },
  macroRing: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  mealsSection: {
    marginBottom: 0,
    marginHorizontal: -20,
  },
  sectionHeader: {
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontFamily: 'Inter_700Bold',
    letterSpacing: -0.5,
  },
  seeAll: {
    fontSize: 12,
    fontFamily: 'Inter_500Medium',
  },
  carouselScroll: {
    overflow: 'visible',
  },
  carouselContent: {
    gap: MEAL_CARD_GAP,
    paddingTop: 58,
    paddingBottom: 28,
  },
  radialCarousel: {
    position: 'relative',
    overflow: 'visible',
  },
  edgeBlur: {
    position: 'absolute',
    top: 38,
    bottom: 0,
    width: 56,
    opacity: 0.42,
  },
  edgeBlurLeft: {
    left: 0,
  },
  edgeBlurRight: {
    right: 0,
  },
  mealCard: {
    width: MEAL_CARD_WIDTH,
    height: 326,
    maxHeight: 326,
    borderRadius: 24,
    paddingTop: 104,
    paddingHorizontal: 16,
    paddingBottom: 16,
    alignItems: 'center',
    overflow: 'visible',
    shadowColor: '#000',
    shadowOffset: { width: 10, height: 20 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 8,
  },
  plateHalo: {
    position: 'absolute',
    top: -50,
    width: 150,
    height: 150,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mealName: {
    minHeight: 60,
    fontSize: 24,
    fontFamily: 'Inter_500Medium',
    lineHeight: 30,
    letterSpacing: -0.45,
    textAlign: 'center',
  },
  calorieBlock: {
    height: 58,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 1,
    marginVertical: 4,
  },
  calorieLabel: {
    fontSize: 10,
    fontFamily: 'Inter_400Regular',
  },
  mealCals: {
    fontSize: 24,
    fontFamily: 'Inter_500Medium',
  },
  mealUnit: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
  },
  mealMacros: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    gap: 8,
  },
  mealMacro: {
    width: 66,
    alignItems: 'center',
    gap: 3,
  },
  mealMacroValue: {
    fontSize: 16,
    fontFamily: 'Inter_500Medium',
  },
  mealMacroUnit: {
    fontSize: 10,
    fontFamily: 'Inter_400Regular',
  },
  pagination: {
    height: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 4,
  },
  paginationDot: {
    height: 6,
    borderRadius: 999,
  },
  paginationDotInactive: {
    width: 6,
    backgroundColor: '#CBD5E1',
  },
  paginationDotActive: {
    width: 12,
    backgroundColor: '#0A0A0A',
  },
});
