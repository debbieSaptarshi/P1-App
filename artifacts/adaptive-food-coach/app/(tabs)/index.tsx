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
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import Svg, { Circle, Rect } from 'react-native-svg';
import Animated, { FadeInDown } from 'react-native-reanimated';

const { width } = Dimensions.get('window');
const MEAL_CARD_WIDTH = 250;
const MEAL_CARD_GAP = 16;

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

        {/* Dashboard Card */}
        <Animated.View entering={FadeInDown.duration(400).delay(200)} style={styles.dashboardCard}>
          <View>
            <Text style={styles.caloriesNumber}>1,314</Text>
            <Text style={styles.caloriesLabel}>Calories Left</Text>
          </View>
          <View style={styles.progressRingContainer}>
            <Text style={styles.progressLabel}>60%</Text>
            <OvalProgress progress={60} color={colors.primary} trackColor={colors.secondaryForeground} />
          </View>
        </Animated.View>

        {/* Macro Cards */}
        <Animated.View entering={FadeInDown.duration(400).delay(250)} style={styles.macrosRow}>
          <MacroCard title="Protein Left" value="137 g" progress={74} color={colors.primary} icon="circle" />
          <MacroCard title="Carbs Left" value="109 g" progress={52} color={colors.primary} icon="box" />
          <MacroCard title="Fat Left" value="36 g" progress={80} color={colors.primary} icon="heart" />
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

function OvalProgress({ progress, color, trackColor }: { progress: number; color: string; trackColor: string }) {
  const perimeter = 2 * (146 + 48);
  return (
    <Svg width={164} height={70} viewBox="0 0 164 70">
      <Rect x={4} y={4} width={156} height={62} rx={31} fill="none" stroke={trackColor} strokeWidth={7} opacity={0.35} />
      <Rect
        x={4}
        y={4}
        width={156}
        height={62}
        rx={31}
        fill="none"
        stroke={color}
        strokeWidth={7}
        strokeLinecap="round"
        strokeDasharray={perimeter}
        strokeDashoffset={perimeter - (perimeter * progress) / 100}
      />
    </Svg>
  );
}

function MacroCard({ title, value, progress, color, icon }: any) {
  const colors = useColors();
  return (
    <View style={[styles.macroCard, { backgroundColor: colors.card }]}>
      <View style={styles.macroCardBody}>
        <Text style={[styles.macroCardValue, { color: colors.foreground }]}>{value}</Text>
        <Text style={[styles.macroCardLeft, { color: colors.mutedForeground }]}>{title}</Text>
      </View>
      <View style={styles.macroRing}>
        <CircularProgress size={76} progress={progress} strokeWidth={5} color={color} trackColor={colors.secondary} />
        <Feather name={icon} size={18} color={colors.foreground} style={styles.macroIcon} />
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
  macrosRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 32,
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
    backgroundColor: 'rgba(255,255,255,0.34)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.16,
    shadowRadius: 16,
    elevation: 12,
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
