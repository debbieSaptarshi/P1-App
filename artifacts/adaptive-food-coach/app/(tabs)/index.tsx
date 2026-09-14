import React, { useState } from 'react';
import { StyleSheet, Text, View, ScrollView, Image, Pressable, Dimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Svg, { Circle, Rect } from 'react-native-svg';
import Animated, { FadeInDown, FadeInRight } from 'react-native-reanimated';

const { width } = Dimensions.get('window');
const MEAL_CARD_WIDTH = width * 0.85;

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const colors = useColors();

  const [selectedDay, setSelectedDay] = useState('23');

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

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.carouselContent}
            snapToInterval={MEAL_CARD_WIDTH + 16}
            decelerationRate="fast"
          >
            <Animated.View entering={FadeInRight.duration(400).delay(400)} style={[styles.mealCard, { backgroundColor: colors.card, width: MEAL_CARD_WIDTH }]}>
              <Image source={require('@/assets/images/profile-avatar.png')} style={styles.mealImage} />
              
              <View style={styles.mealInfo}>
                <View style={styles.mealTitleRow}>
                  <Text style={[styles.mealName, { color: colors.foreground }]} numberOfLines={2}>
                    Roasted Chicken with Vegetable
                  </Text>
                  <Text style={[styles.mealCals, { color: colors.foreground }]}>637 <Text style={styles.mealUnit}>Kcal</Text></Text>
                </View>

                <View style={styles.mealMacros}>
                  <Text style={[styles.mealMacroText, { color: colors.mutedForeground }]}>Carbs: 35g</Text>
                  <Text style={[styles.mealMacroText, { color: colors.mutedForeground }]}>Protein: 40g</Text>
                  <Text style={[styles.mealMacroText, { color: colors.mutedForeground }]}>Fat: 20g</Text>
                </View>
              </View>
            </Animated.View>

            {/* Peeking card placeholder */}
            <View style={[styles.mealCard, { backgroundColor: colors.card, width: MEAL_CARD_WIDTH, opacity: 0.5 }]} />
          </ScrollView>
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
  },
  sectionHeader: {
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
    gap: 16,
    paddingRight: 20,
  },
  mealCard: {
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },
  mealImage: {
    width: 150,
    height: 150,
    borderRadius: 75,
    resizeMode: 'cover',
    alignSelf: 'center',
    marginTop: 18,
  },
  mealInfo: {
    padding: 20,
  },
  mealTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
    gap: 12,
  },
  mealName: {
    flex: 1,
    fontSize: 18,
    fontFamily: 'Inter_700Bold',
    lineHeight: 24,
  },
  mealCals: {
    fontSize: 16,
    fontFamily: 'Inter_700Bold',
  },
  mealUnit: {
    fontSize: 11,
    fontFamily: 'Inter_400Regular',
  },
  mealMacros: {
    flexDirection: 'row',
    gap: 16,
  },
  mealMacroText: {
    fontSize: 13,
    fontFamily: 'Inter_500Medium',
  },
});
