import React, { useState } from 'react';
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
import { Feather } from '@expo/vector-icons';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import Svg, { Circle, Path } from 'react-native-svg';
import Animated, { FadeInDown } from 'react-native-reanimated';

const { width } = Dimensions.get('window');
const MEAL_CARD_WIDTH = 250;
const MEAL_CARD_GAP = 16;
const PAGE_WIDTH = width - 40;

const meals = [
  { id: '1', name: 'Roasted Chicken with Vegetable', calories: 637, protein: 65, carbs: 45, fat: 18 },
  { id: '2', name: 'Protein Bowl with Greens', calories: 518, protein: 48, carbs: 39, fat: 16 },
  { id: '3', name: 'Salmon with Roasted Vegetables', calories: 584, protein: 54, carbs: 32, fat: 22 },
];

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const colors = useColors();

  const [selectedDay, setSelectedDay] = useState('23');
  const [activeMeal, setActiveMeal] = useState(0);
  const [activePage, setActivePage] = useState(0);
  const [waterIntake, setWaterIntake] = useState(1.2);

  const days = [
    { day: 'Sun', num: '18' },
    { day: 'Mon', num: '19' },
    { day: 'Tue', num: '20' },
    { day: 'Wed', num: '21' },
    { day: 'Thu', num: '22' },
    { day: 'Fri', num: '23' },
    { day: 'Sat', num: '24' },
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 120 }
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <Animated.View entering={FadeInDown.duration(400).delay(100)} style={styles.header}>
          <View style={styles.headerLeft}>
            <Image
              source={require('@/assets/images/roasted-chicken.png')}
              style={styles.avatar}
              accessibilityLabel="User profile"
            />
            <View style={styles.headerTextContainer}>
              <Text style={[styles.greeting, { color: colors.mutedForeground }]}>Good Morning</Text>
              <Text style={[styles.name, { color: colors.foreground }]}>Mike Wheeler</Text>
            </View>
          </View>
          <View style={styles.streakPill}>
            <Feather name="award" size={19} color={colors.foreground} />
            <Text style={[styles.streakText, { color: colors.foreground }]}>1</Text>
          </View>
        </Animated.View>

        {/* Date Strip */}
        <Animated.View entering={FadeInDown.duration(400).delay(150)} style={styles.dateStrip}>
          {days.map((item, index) => (
            (() => {
              const selected = selectedDay === item.num;
              const upcoming = item.num === '24';
              return (
            <Pressable
              key={index}
              style={({ pressed }) => [
                styles.dateItem,
                (selected || upcoming) && styles.dateItemDark,
                selected && styles.dateItemSelected,
                pressed && styles.pressed,
              ]}
              onPress={() => {
                setSelectedDay(item.num);
                Haptics.selectionAsync();
              }}
              accessibilityRole="button"
              accessibilityLabel={`${item.day} ${item.num}`}
              accessibilityState={{ selected }}
              testID={`date-${item.num}`}
            >
              <Text style={[
                styles.dateDay,
                { color: selected || upcoming ? colors.primaryForeground : colors.mutedForeground }
              ]}>{item.day}</Text>
              <Text style={[
                styles.dateNum,
                { color: selected || upcoming ? colors.primaryForeground : colors.mutedForeground }
              ]}>{item.num}</Text>
            </Pressable>
              );
            })()
          ))}
        </Animated.View>

        {/* Dashboard Pager */}
        <Animated.View entering={FadeInDown.duration(400).delay(200)} style={styles.pagerWrapper}>
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            style={{ width: PAGE_WIDTH }}
            snapToInterval={PAGE_WIDTH}
            decelerationRate="fast"
            scrollEventThrottle={16}
            onMomentumScrollEnd={(event: NativeSyntheticEvent<NativeScrollEvent>) => {
              const next = Math.round(event.nativeEvent.contentOffset.x / PAGE_WIDTH);
              setActivePage(Math.max(0, Math.min(next, 2)));
              Haptics.selectionAsync();
            }}
            testID="dashboard-pager"
          >
            {/* Page 1: Calories */}
            <View style={{ width: PAGE_WIDTH }}>
              <View style={styles.dashboardCard}>
                <View>
                  <MaterialCommunityIcons name="fire" size={26} color="#FF6A1A" style={styles.caloriesIcon} />
                  <Text style={styles.caloriesNumber}>1,314</Text>
                  <Text style={styles.caloriesLabel}>Calories Left</Text>
                </View>
                <View style={styles.progressRingContainer}>
                  <Text style={styles.progressLabel}>60%</Text>
                  <OvalProgress progress={60} color="#FFFFFF" trackColor="#2B3549" thumbColor={colors.primary} />
                </View>
              </View>
              <View style={styles.macrosRow}>
                <MacroCard title="Protein Left" value="137 g" progress={74} color={colors.primary} icon="circle" />
                <MacroCard title="Carbs Left" value="109 g" progress={52} color={colors.primary} icon="box" />
                <MacroCard title="Fat Left" value="36 g" progress={80} color={colors.primary} icon="heart" />
              </View>
            </View>

            {/* Page 2: Nutrients */}
            <View style={{ width: PAGE_WIDTH }}>
              <HealthScoreCard score={5} outOf={10} advice="Your diet is balanced, but try adding more fiber-rich foods to hit your daily target." />
              <View style={styles.macrosRow}>
                <MacroCard title="Fiber Left" value="18 g" progress={62} color={colors.primary} icon="leaf" iconSet="mci" />
                <MacroCard title="Sugar Left" value="24 g" progress={40} color={colors.primary} icon="candy-outline" iconSet="mci" />
                <MacroCard title="Sodium Left" value="1,200 mg" progress={55} color={colors.primary} icon="shaker-outline" iconSet="mci" />
              </View>
            </View>

            {/* Page 3: Workout */}
            <View style={{ width: PAGE_WIDTH }}>
              <WaterIntakeCard value={waterIntake} goal={2.5} onChange={setWaterIntake} />
              <View style={styles.macrosRow}>
                <MacroCard title="Steps" value="6,248" progress={62} color={colors.primary} icon="shoe-print" iconSet="mci" wide />
                <MacroCard title="Calorie Burned" value="420 kcal" progress={48} color="#FF6A1A" icon="fire" iconSet="mci" wide />
              </View>
            </View>
          </ScrollView>

          <View style={styles.pagination} accessibilityLabel={`Page ${activePage + 1} of 3`}>
            {[0, 1, 2].map((index) => (
              <View
                key={index}
                style={[
                  styles.paginationDot,
                  { backgroundColor: index === activePage ? colors.foreground : colors.border },
                  index === activePage && styles.paginationDotActive,
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
              style={({ pressed }) => pressed && styles.pressed}
            >
              <Text style={[styles.seeAll, { color: colors.mutedForeground }]}>See All</Text>
            </Pressable>
          </View>

          <View style={styles.radialCarousel}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
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
                <RadialMealCard key={meal.id} meal={meal} active={activeMeal === index} />
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

      </ScrollView>
    </View>
  );
}

function CircularProgress({ size, progress, strokeWidth, color, trackColor }: any) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <Svg width={size} height={size}>
      <Circle stroke={trackColor} fill="none" cx={size / 2} cy={size / 2} r={radius} strokeWidth={strokeWidth} />
      <Circle
        stroke={color}
        fill="none"
        cx={size / 2}
        cy={size / 2}
        r={radius}
        strokeWidth={strokeWidth}
        strokeDasharray={circumference}
        strokeDashoffset={strokeDashoffset}
        strokeLinecap="round"
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
    </Svg>
  );
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
  const trackPath = 'M92 4 H42 A38 38 0 0 0 4 42 A38 38 0 0 0 42 80 H142 A38 38 0 0 0 180 42 A38 38 0 0 0 142 4 H92';
  const progressPath = 'M92 4 H42 A38 38 0 0 0 4 42 A38 38 0 0 0 42 80 H132';
  return (
    <Svg width={184} height={84} viewBox="0 0 184 84">
      <Path d={trackPath} fill="none" stroke={trackColor} strokeWidth={8} strokeLinecap="round" />
      <Path
        d={progressPath}
        fill="none"
        stroke={color}
        strokeWidth={8}
        strokeLinecap="round"
      />
      <Circle cx={132} cy={80} r={9} fill={thumbColor} stroke="#FFFFFF" strokeWidth={5} />
    </Svg>
  );
}

function MacroCard({ title, value, progress, color, icon, iconSet, wide }: any) {
  const colors = useColors();
  const IconComp = iconSet === 'mci' ? MaterialCommunityIcons : Feather;
  return (
    <View style={[styles.macroCard, wide && styles.macroCardWide, { backgroundColor: colors.card }]}>
      <View style={styles.macroCardBody}>
        <Text style={[styles.macroCardValue, { color: colors.foreground }]}>{value}</Text>
        <Text style={[styles.macroCardLeft, { color: colors.mutedForeground }]}>{title}</Text>
      </View>
      <View style={styles.macroRing}>
        <CircularProgress size={76} progress={progress} strokeWidth={5} color={color} trackColor={colors.secondary} />
        <IconComp name={icon} size={18} color={colors.foreground} style={styles.macroIcon} />
      </View>
    </View>
  );
}

function HealthScoreCard({ score, outOf, advice }: { score: number; outOf: number; advice: string }) {
  const progress = (score / outOf) * 100;
  return (
    <View style={styles.healthScoreCard}>
      <View style={styles.healthScoreHeader}>
        <MaterialCommunityIcons name="heart-pulse" size={22} color={'#4ADE80'} />
        <Text style={styles.healthScoreTitle}>Health Score</Text>
        <Text style={styles.healthScoreValue}>
          {score}<Text style={styles.healthScoreOutOf}>/{outOf}</Text>
        </Text>
      </View>
      <View style={styles.healthScoreTrack}>
        <View style={[styles.healthScoreFill, { width: `${progress}%` }]} />
      </View>
      <Text style={styles.healthScoreAdvice}>{advice}</Text>
    </View>
  );
}

function WaterIntakeCard({
  value,
  goal,
  onChange,
}: {
  value: number;
  goal: number;
  onChange: (v: number) => void;
}) {
  const colors = useColors();
  const progress = Math.min(100, (value / goal) * 100);

  const adjust = (delta: number) => {
    onChange(Math.max(0, Math.round((value + delta) * 10) / 10));
    Haptics.selectionAsync();
  };

  return (
    <View style={[styles.waterCard, { backgroundColor: colors.card }]}>
      <View style={styles.waterHeader}>
        <View style={styles.waterIconBadge}>
          <Feather name="droplet" size={16} color="#0A7AFF" />
        </View>
        <Text style={[styles.waterTitle, { color: colors.foreground }]}>Water Intake</Text>
        <Feather name="settings" size={18} color={colors.mutedForeground} />
      </View>

      <View style={styles.waterTrack}>
        <View style={[styles.waterFill, { width: `${progress}%` }]} />
      </View>

      <View style={styles.waterControlsRow}>
        <Text style={[styles.waterValue, { color: colors.foreground }]}>
          {value.toFixed(1)} <Text style={styles.waterGoal}>/ {goal} L</Text>
        </Text>
        <View style={styles.waterButtons}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Decrease water intake"
            testID="water-decrease"
            onPress={() => adjust(-0.2)}
            style={({ pressed }) => [styles.waterButton, pressed && styles.pressed]}
          >
            <Feather name="minus" size={16} color={colors.foreground} />
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Increase water intake"
            testID="water-increase"
            onPress={() => adjust(0.2)}
            style={({ pressed }) => [styles.waterButton, styles.waterButtonPrimary, pressed && styles.pressed]}
          >
            <Feather name="plus" size={16} color="#FFFFFF" />
          </Pressable>
        </View>
      </View>
    </View>
  );
}

function RadialMealCard({
  meal,
  active,
}: {
  meal: (typeof meals)[number];
  active: boolean;
}) {
  const colors = useColors();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${meal.name}, ${meal.calories} calories`}
      testID={`meal-card-${meal.id}`}
      onPress={() => Haptics.selectionAsync()}
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
        <Image
          source={require('@/assets/images/profile-avatar.png')}
          style={styles.mealImage}
          resizeMode="cover"
        />
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
    fontSize: 18,
    fontFamily: 'Inter_700Bold',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
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
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 10,
  },
  caloriesNumber: {
    color: '#ffffff',
    fontSize: 36,
    fontFamily: 'Inter_700Bold',
    letterSpacing: -1,
    marginBottom: 4,
  },
  caloriesIcon: {
    marginBottom: 2,
  },
  caloriesLabel: {
    color: '#A1A1AA',
    fontSize: 15,
    fontFamily: 'Inter_500Medium',
  },
  progressRingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressLabel: {
    position: 'absolute',
    color: '#ffffff',
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
    zIndex: 1,
  },
  pagerWrapper: {
    marginBottom: 32,
  },
  macrosRow: {
    flexDirection: 'row',
    gap: 4,
  },
  macroCard: {
    flex: 1,
    borderRadius: 20,
    padding: 16,
    height: 174,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 2,
  },
  macroCardWide: {
    height: 164,
  },
  healthScoreCard: {
    backgroundColor: '#0A0A0A',
    borderRadius: 24,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 10,
  },
  healthScoreHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
  },
  healthScoreTitle: {
    flex: 1,
    color: '#ffffff',
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
  },
  healthScoreValue: {
    color: '#ffffff',
    fontSize: 20,
    fontFamily: 'Inter_700Bold',
  },
  healthScoreOutOf: {
    color: '#A1A1AA',
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
  },
  healthScoreTrack: {
    height: 8,
    borderRadius: 4,
    backgroundColor: '#2B2B30',
    overflow: 'hidden',
    marginBottom: 14,
  },
  healthScoreFill: {
    height: '100%',
    borderRadius: 4,
    backgroundColor: '#4ADE80',
  },
  healthScoreAdvice: {
    color: '#D4D4D8',
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    lineHeight: 19,
  },
  waterCard: {
    borderRadius: 24,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 2,
  },
  waterHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  waterIconBadge: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(10,122,255,0.12)',
  },
  waterTitle: {
    flex: 1,
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
  },
  waterTrack: {
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(10,122,255,0.12)',
    overflow: 'hidden',
    marginBottom: 16,
  },
  waterFill: {
    height: '100%',
    borderRadius: 4,
    backgroundColor: '#0A7AFF',
  },
  waterControlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  waterValue: {
    fontSize: 22,
    fontFamily: 'Inter_700Bold',
  },
  waterGoal: {
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
    color: '#A1A1AA',
  },
  waterButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  waterButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(10,122,255,0.12)',
  },
  waterButtonPrimary: {
    backgroundColor: '#0A7AFF',
  },
  macroCardBody: {
    flexDirection: 'column',
  },
  macroCardValue: {
    fontSize: 20,
    fontFamily: 'Inter_700Bold',
  },
  macroCardLeft: {
    fontSize: 12,
    fontFamily: 'Inter_500Medium',
    marginTop: 2,
  },
  macroRing: {
    marginTop: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  macroIcon: {
    position: 'absolute',
  },
  mealsSection: {
    marginBottom: 32,
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
  carouselContent: {
    gap: MEAL_CARD_GAP,
    paddingTop: 58,
    paddingBottom: 18,
  },
  radialCarousel: {
    position: 'relative',
    overflow: 'hidden',
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
    minHeight: 326,
    borderRadius: 24,
    paddingTop: 104,
    paddingHorizontal: 16,
    paddingBottom: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 10, height: 20 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 8,
  },
  plateHalo: {
    position: 'absolute',
    top: -52,
    width: 178,
    height: 178,
    borderRadius: 89,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mealImage: {
    width: 154,
    height: 154,
    borderRadius: 77,
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
    height: 64,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 1,
    marginVertical: 10,
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
    gap: 4,
    marginTop: 4,
  },
  paginationDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  paginationDotActive: {
    width: 12,
  },
});
