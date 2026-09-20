import { localDate } from '@/services/dates';
import React, { useMemo, useState } from 'react';
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import Animated, { FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';

import { Button, ModalSheet, TextField } from '@/components/ui';
import { useAppStore } from '@/hooks/useAppStore';
import { colors as tokens, radii, spacing } from '@/constants/tokens';
import type { DailyFoodLog, WeightEntry } from '@/types';

const CARD_RADIUS = 24;
const CHART_HEIGHT = 192;
const WEIGHT_Y_MAX = 70;
const WEIGHT_Y_MIN = 60;
const CALORIE_Y_MAX = 500;
const ENERGY_Y_MAX = 500;
const WEEKDAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'] as const;
const WEEKDAY_FULL = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;
const WEIGHT_RANGES = [
  { key: '90D', days: 90 },
  { key: '6M', days: 182 },
  { key: '1Y', days: 365 },
  { key: 'ALL', days: null },
] as const;
const WEEK_OFFSETS = [
  { key: 'This wk', weeksAgo: 0 },
  { key: 'Last wk', weeksAgo: 1 },
  { key: '2 wk ago', weeksAgo: 2 },
  { key: '3 wk ago', weeksAgo: 3 },
] as const;
const WEIGHT_CHANGE_WINDOWS = [
  { label: '3 days', days: 3 },
  { label: '7 days', days: 7 },
  { label: '14 days', days: 14 },
  { label: '30 days', days: 30 },
  { label: '90 days', days: 90 },
  { label: 'All Time', days: null },
] as const;

type Mood = 'happy' | 'neutral' | 'sad';

const MOOD_OPTIONS: { value: Mood; label: string; emoji: string }[] = [
  { value: 'happy', label: 'Happy', emoji: '😄' },
  { value: 'neutral', label: 'Okay', emoji: '🙂' },
  { value: 'sad', label: 'Tough', emoji: '😢' },
];

function startOfWeekSunday(date: Date): Date {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  next.setDate(next.getDate() - next.getDay());
  return next;
}

function isoDate(date: Date): string {
  return localDate(date);
}

function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function formatKg(value: number, decimals = 2): string {
  return `${value.toFixed(decimals)} kg`;
}

function formatGoalDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function bmiCategory(bmi: number): {
  label: string;
  pillBg: string;
  pillFg: string;
} {
  if (bmi < 18.5) {
    return { label: 'Underweight', pillBg: '#1E3A5F', pillFg: '#2E90FA' };
  }
  if (bmi < 25) {
    return { label: 'Healthy', pillBg: '#052E16', pillFg: '#16B364' };
  }
  if (bmi < 30) {
    return { label: 'Overweight', pillBg: '#542C0D', pillFg: '#EAAA08' };
  }
  return { label: 'Obese', pillBg: '#450A0A', pillFg: '#EF4444' };
}

function bmiMarkerPercent(bmi: number): number {
  const bands = [
    { min: 14, max: 18.5 },
    { min: 18.5, max: 25 },
    { min: 25, max: 30 },
    { min: 30, max: 40 },
  ];
  const clamped = Math.max(14, Math.min(40, bmi));
  const index = bands.findIndex((band) => clamped < band.max) === -1
    ? 3
    : Math.max(0, bands.findIndex((band) => clamped < band.max));
  const band = bands[index]!;
  const local = (clamped - band.min) / (band.max - band.min);
  return ((index + Math.max(0, Math.min(1, local))) / 4) * 100;
}

function weightAtOrBefore(sorted: WeightEntry[], date: string): number | null {
  const found = [...sorted].reverse().find((entry) => entry.date <= date);
  return found?.weightKg ?? null;
}

export default function ProgressScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { state, streakDays, actions } = useAppStore();
  const profile = state.profile;
  const weights = state.weightHistory ?? [];
  const foodLogs = state.foodLogs ?? [];
  const exerciseLogs = state.exerciseLogs ?? [];
  const milestones = state.milestones ?? [];

  const [weightRange, setWeightRange] = useState<(typeof WEIGHT_RANGES)[number]['key']>('90D');
  const [calorieWeek, setCalorieWeek] = useState(0);
  const [energyWeek, setEnergyWeek] = useState(0);
  const [weightSheetVisible, setWeightSheetVisible] = useState(false);
  const [weightDraft, setWeightDraft] = useState(profile.currentWeightKg.toString());
  const [weightMood, setWeightMood] = useState<Mood>('happy');
  const [weightNote, setWeightNote] = useState('');

  const logsByDate = useMemo(() => {
    const map = new Map<string, DailyFoodLog>();
    for (const log of foodLogs) map.set(log.date, log);
    return map;
  }, [foodLogs]);

  const sortedWeights = useMemo(
    () => [...weights].sort((a, b) => (a.date < b.date ? -1 : 1)),
    [weights],
  );

  const startingKg = useMemo(() => {
    if (!sortedWeights.length) return profile.currentWeightKg;
    return sortedWeights[0]!.weightKg;
  }, [sortedWeights, profile.currentWeightKg]);

  const currentKg = profile.currentWeightKg;
  const targetKg = profile.targetWeightKg;
  const journeyProgress = useMemo(() => {
    const span = Math.abs(startingKg - targetKg);
    if (span === 0) return 1;
    return Math.max(0, Math.min(1, Math.abs(startingKg - currentKg) / span));
  }, [startingKg, currentKg, targetKg]);

  const goalByLabel = useMemo(() => {
    const remaining = currentKg - targetKg;
    if (remaining <= 0) return formatGoalDate(new Date());
    const weekly = 0.5;
    const days = Math.max(7, Math.round((remaining / weekly) * 7));
    return formatGoalDate(addDays(new Date(), days));
  }, [currentKg, targetKg]);

  const nextWeighInDays = useMemo(() => {
    const last = sortedWeights[sortedWeights.length - 1];
    if (!last) return 7;
    const lastDate = new Date(`${last.date}T00:00:00`);
    const due = addDays(lastDate, 7);
    return Math.max(0, Math.ceil((due.getTime() - Date.now()) / 86_400_000));
  }, [sortedWeights]);

  const weekDots = useMemo(() => {
    const start = startOfWeekSunday(new Date());
    const today = isoDate(new Date());
    return WEEKDAY_LABELS.map((label, index) => {
      const date = isoDate(addDays(start, index));
      const logged = (logsByDate.get(date)?.entries.length ?? 0) > 0;
      return { label, date, logged, isToday: date === today };
    });
  }, [logsByDate]);

  const unlockedBadges = useMemo(
    () => milestones.filter((badge) => badge.unlocked).length,
    [milestones],
  );

  const weightBars = useMemo(() => {
    const range = WEIGHT_RANGES.find((item) => item.key === weightRange);
    const cutoff = range?.days
      ? isoDate(addDays(new Date(), -(range.days - 1)))
      : sortedWeights[0]?.date;
    const series = cutoff
      ? sortedWeights.filter((entry) => entry.date >= cutoff)
      : sortedWeights;
    const bucketCount = 16;
    const values = !series.length
      ? Array.from({ length: bucketCount }, () => currentKg)
      : (() => {
          const start = new Date(`${series[0]!.date}T00:00:00`);
          const end = new Date(`${series[series.length - 1]!.date}T00:00:00`);
          const span = Math.max(1, end.getTime() - start.getTime());
          return Array.from({ length: bucketCount }, (_, index) => {
            const t = index / Math.max(1, bucketCount - 1);
            const date = isoDate(new Date(start.getTime() + t * span));
            return weightAtOrBefore(series, date) ?? series[0]!.weightKg;
          });
        })();
    const dataMin = Math.min(...values, targetKg);
    const dataMax = Math.max(...values, startingKg);
    const yMax = Math.max(WEIGHT_Y_MAX, Math.ceil(dataMax));
    const yMin = Math.min(WEIGHT_Y_MIN, Math.floor(dataMin));
    const step = Math.max(1, Math.round((yMax - yMin) / 5));
    const labels = Array.from({ length: 6 }, (_, index) => String(yMax - index * step));
    return { values, yMin: yMax - step * 5, yMax, labels };
  }, [sortedWeights, weightRange, currentKg, targetKg, startingKg]);

  const weightChanges = useMemo(() => {
    const today = isoDate(new Date());
    return WEIGHT_CHANGE_WINDOWS.map((window) => {
      const fromDate = window.days ? isoDate(addDays(new Date(), -window.days)) : sortedWeights[0]?.date;
      const from = fromDate ? weightAtOrBefore(sortedWeights, fromDate) : startingKg;
      const to = weightAtOrBefore(sortedWeights, today) ?? currentKg;
      const startValue = from ?? startingKg;
      const delta = parseFloat((to - startValue).toFixed(2));
      let outcome = `Stay on ${targetKg.toFixed(0)} kg`;
      if (delta < -0.05) outcome = `Dropped to ${to.toFixed(2)} kg`;
      else if (delta > 0.05) outcome = `Gained to ${to.toFixed(2)} kg`;
      return {
        label: window.label,
        from: startValue,
        outcome,
      };
    });
  }, [sortedWeights, startingKg, currentKg, targetKg]);

  const weekDaysForOffset = (weeksAgo: number) => {
    const start = addDays(startOfWeekSunday(new Date()), -weeksAgo * 7);
    return WEEKDAY_FULL.map((label, index) => {
      const date = isoDate(addDays(start, index));
      const log = logsByDate.get(date);
      const burned = exerciseLogs
        .filter((entry) => entry.date === date)
        .reduce((sum, entry) => sum + entry.caloriesBurned, 0);
      return {
        label,
        date,
        protein: log?.totals.protein ?? 0,
        carbs: log?.totals.carbs ?? 0,
        fat: log?.totals.fat ?? 0,
        consumed: log?.totals.calories ?? 0,
        burned,
      };
    });
  };

  const calorieDays = useMemo(
    () => weekDaysForOffset(calorieWeek),
    [calorieWeek, logsByDate, exerciseLogs],
  );
  const energyDays = useMemo(
    () => weekDaysForOffset(energyWeek),
    [energyWeek, logsByDate, exerciseLogs],
  );
  const calorieAxis = useMemo(() => {
    const totals = calorieDays.map(
      (day) => day.protein * 4 + day.carbs * 4 + day.fat * 9,
    );
    const max = Math.max(CALORIE_Y_MAX, ...totals);
    const yMax = Math.ceil(max / 100) * 100 || CALORIE_Y_MAX;
    const step = yMax / 5;
    return {
      yMax,
      labels: Array.from({ length: 6 }, (_, index) => String(Math.round(yMax - index * step))),
    };
  }, [calorieDays]);
  const energyAxis = useMemo(() => {
    const max = Math.max(
      ENERGY_Y_MAX,
      ...energyDays.map((day) => Math.max(day.burned, day.consumed)),
    );
    const yMax = Math.ceil(max / 100) * 100 || ENERGY_Y_MAX;
    const step = yMax / 5;
    return {
      yMax,
      labels: Array.from({ length: 6 }, (_, index) => String(Math.round(yMax - index * step))),
    };
  }, [energyDays]);

  const calorieAverage = useMemo(() => {
    const totals = calorieDays.map((day) => day.consumed);
    const filled = totals.filter((value) => value > 0);
    if (!filled.length) return 0;
    return Math.round(filled.reduce((sum, value) => sum + value, 0) / filled.length);
  }, [calorieDays]);

  const energyTotals = useMemo(() => {
    const burned = energyDays.reduce((sum, day) => sum + day.burned, 0);
    const consumed = energyDays.reduce((sum, day) => sum + day.consumed, 0);
    return { burned, consumed, energy: consumed - burned };
  }, [energyDays]);

  const bmi = useMemo(() => {
    const meters = profile.heightCm / 100;
    if (meters <= 0) return 0;
    return parseFloat((currentKg / (meters * meters)).toFixed(1));
  }, [profile.heightCm, currentKg]);
  const bmiMeta = bmiCategory(bmi);

  const openWeightSheet = () => {
    Haptics.selectionAsync();
    setWeightDraft(profile.currentWeightKg.toString());
    setWeightMood('happy');
    setWeightNote('');
    setWeightSheetVisible(true);
  };

  const submitWeight = async () => {
    const parsed = parseFloat(weightDraft.replace(',', '.'));
    if (!Number.isFinite(parsed) || parsed < 30 || parsed > 250) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await actions.addWeight({
      date: isoDate(new Date()),
      weightKg: parsed,
      note: `${weightMood}${weightNote ? ` — ${weightNote}` : ''}`,
    });
    setWeightSheetVisible(false);
    setWeightNote('');
  };

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 120 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.pageTitle}>Progress</Text>

        <Animated.View entering={FadeInDown.duration(400).delay(40)} style={styles.heroRow}>
          <View style={styles.statCard}>
            <View style={styles.illustrationWrap}>
              <Image
                source={require('@/assets/images/progress/flame-only.png')}
                style={styles.flameImage}
                accessibilityLabel="Day streak"
              />
              <View style={styles.countPill}>
                <Text style={styles.countPillText}>{streakDays}</Text>
              </View>
            </View>
            <Text style={styles.statCardLabel}>Day Streak</Text>
            <View style={styles.weekDots}>
              {weekDots.map((day) => (
                <View key={day.date} style={styles.weekDotCol}>
                  <Text
                    style={[
                      styles.weekDotLetter,
                      (day.isToday || day.logged) && styles.weekDotLetterActive,
                    ]}
                  >
                    {day.label}
                  </Text>
                  <View
                    style={[
                      styles.weekDot,
                      day.logged && styles.weekDotLogged,
                      day.isToday && styles.weekDotToday,
                    ]}
                  />
                </View>
              ))}
            </View>
          </View>

          <Pressable
            style={styles.statCard}
            onPress={() => {
              Haptics.selectionAsync();
              router.push('/milestones');
            }}
            accessibilityRole="button"
            accessibilityLabel="Badge earned"
            testID="progress-badges"
          >
            <View style={styles.illustrationWrap}>
              <Image
                source={require('@/assets/images/progress/badge-polygon.png')}
                style={styles.badgeImage}
                accessibilityLabel="Badge"
              />
              <View style={styles.countPill}>
                <Text style={styles.countPillText}>{unlockedBadges}</Text>
              </View>
            </View>
            <Text style={styles.statCardLabel}>Badge Earned</Text>
            <View style={styles.badgeDots}>
              {[0, 1, 2].map((index) => (
                <View key={index} style={styles.badgeDot} />
              ))}
            </View>
          </Pressable>
        </Animated.View>

        <Animated.View entering={FadeInDown.duration(400).delay(80)}>
          <Pressable
            style={styles.darkCard}
            onPress={openWeightSheet}
            accessibilityRole="button"
            accessibilityLabel="Current weight"
            testID="current-weight-card"
          >
            <View style={styles.cardHeaderRow}>
              <Text style={styles.darkTitle}>Current Weight</Text>
              <View style={styles.darkChip}>
                <Text style={styles.darkChipText}>
                  Next Weight in : {nextWeighInDays} Days
                </Text>
              </View>
            </View>
            <View style={styles.weightTrack}>
              <View style={[styles.weightFill, { width: `${journeyProgress * 100}%` }]} />
              <View
                style={[
                  styles.weightThumb,
                  { left: `${Math.max(2, Math.min(98, journeyProgress * 100))}%` },
                ]}
              />
            </View>
            <View style={styles.weightMetaRow}>
              <Text style={styles.weightMeta}>
                <Text style={styles.weightMetaMuted}>Start :</Text>
                {` ${startingKg.toFixed(0)} kg`}
              </Text>
              <Text style={[styles.weightMeta, styles.weightMetaRight]}>
                <Text style={styles.weightMetaMuted}>Goal :</Text>
                {` ${targetKg.toFixed(0)} kg`}
              </Text>
            </View>
            <Text style={styles.weightMeta}>
              <Text style={styles.weightMetaMuted}>At your goal by</Text>
              {` ${goalByLabel}`}
            </Text>
          </Pressable>
        </Animated.View>

        <Animated.View entering={FadeInDown.duration(400).delay(120)} style={styles.whiteCard}>
          <View style={styles.cardHeaderRow}>
            <Text style={styles.lightTitle}>Weight Progress</Text>
            <View style={styles.lightChip}>
              <Text style={styles.lightChipText}>
                <Text style={styles.lightChipStrong}>{Math.round(journeyProgress * 100)}%</Text>
                {' of Goals'}
              </Text>
            </View>
          </View>
          <YAxisChart
            labels={weightBars.labels}
            height={CHART_HEIGHT}
          >
            <View style={styles.weightBars}>
              {weightBars.values.map((value, index) => {
                const ratio = Math.max(
                  0,
                  Math.min(1, (value - weightBars.yMin) / Math.max(1, weightBars.yMax - weightBars.yMin)),
                );
                return (
                  <View
                    key={`weight-bar-${index}`}
                    style={[styles.weightBar, { height: Math.max(8, ratio * 144) }]}
                  />
                );
              })}
            </View>
          </YAxisChart>
          <SegmentedControl
            options={WEIGHT_RANGES.map((item) => item.key)}
            value={weightRange}
            onChange={(next) => {
              Haptics.selectionAsync();
              setWeightRange(next as typeof weightRange);
            }}
          />
        </Animated.View>

        <Animated.View entering={FadeInDown.duration(400).delay(160)} style={styles.whiteCard}>
          <Text style={styles.lightTitle}>Weight Changes</Text>
          <View style={styles.changeList}>
            {weightChanges.map((row) => (
              <View key={row.label} style={styles.changeRow}>
                <Text style={styles.changePeriod}>{row.label}</Text>
                <Text style={styles.changeFrom}>{formatKg(row.from)}</Text>
                <ArrowRightIcon />
                <Text style={styles.changeTo}>{row.outcome}</Text>
              </View>
            ))}
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.duration(400).delay(200)} style={styles.whiteCard}>
          <Text style={styles.lightTitle}>Daily Average Calories</Text>
          <Text style={styles.heroMetric}>
            {calorieAverage}
            <Text style={styles.heroMetricUnit}> Cal</Text>
          </Text>
          <YAxisChart
            labels={calorieAxis.labels}
            height={CHART_HEIGHT}
          >
            <View style={styles.stackedBars}>
              {calorieDays.map((day) => {
                const px = (value: number) => Math.max(0, (value / calorieAxis.yMax) * 144);
                return (
                  <View key={day.date} style={styles.stackedCol}>
                    <View style={styles.stackedStack}>
                      <View style={[styles.stackFat, { height: Math.max(px(day.fat * 9), 2) }]} />
                      <View style={[styles.stackCarbs, { height: Math.max(px(day.carbs * 4), 2) }]} />
                      <View style={[styles.stackProtein, { height: Math.max(px(day.protein * 4), 2) }]} />
                    </View>
                    <Text style={styles.dayTick}>{day.label}</Text>
                  </View>
                );
              })}
            </View>
          </YAxisChart>
          <View style={styles.legendRow}>
            <LegendDot color="#DC2626" label="Protein" />
            <LegendDot color="#1570EF" label="Carbs" />
            <LegendDot color="#EF6820" label="Fats" />
          </View>
          <SegmentedControl
            options={WEEK_OFFSETS.map((item) => item.key)}
            value={WEEK_OFFSETS[calorieWeek]!.key}
            onChange={(next) => {
              Haptics.selectionAsync();
              setCalorieWeek(WEEK_OFFSETS.findIndex((item) => item.key === next));
            }}
          />
        </Animated.View>

        <Animated.View entering={FadeInDown.duration(400).delay(240)} style={styles.whiteCard}>
          <Text style={styles.lightTitle}>Weekly Energy</Text>
          <View style={styles.energyStats}>
            <EnergyStat label="Burned" value={energyTotals.burned} />
            <EnergyStat label="Consumed" value={energyTotals.consumed} />
            <EnergyStat
              label="Energy"
              value={energyTotals.energy}
              signed
            />
          </View>
          <YAxisChart
            labels={energyAxis.labels}
            height={CHART_HEIGHT}
          >
            <View style={styles.energyBars}>
              {energyDays.map((day) => {
                const burnedH = Math.max(8, (day.burned / energyAxis.yMax) * 159);
                const consumedH = Math.max(8, (day.consumed / energyAxis.yMax) * 159);
                return (
                  <View key={day.date} style={styles.energyCol}>
                    <View style={styles.energyPair}>
                      <View style={[styles.energyBurned, { height: burnedH }]} />
                      <View style={[styles.energyConsumed, { height: consumedH }]} />
                    </View>
                    <Text style={styles.dayTick}>{day.label}</Text>
                  </View>
                );
              })}
            </View>
          </YAxisChart>
          <View style={styles.legendRow}>
            <LegendDot color="#FAC515" label="Burned" />
            <LegendDot color="#16B364" label="Consumed" />
          </View>
          <SegmentedControl
            options={WEEK_OFFSETS.map((item) => item.key)}
            value={WEEK_OFFSETS[energyWeek]!.key}
            onChange={(next) => {
              Haptics.selectionAsync();
              setEnergyWeek(WEEK_OFFSETS.findIndex((item) => item.key === next));
            }}
          />
        </Animated.View>

        <Animated.View entering={FadeInDown.duration(400).delay(280)} style={styles.darkCard}>
          <View style={styles.cardHeaderRow}>
            <Text style={styles.darkTitle}>Your BMI</Text>
            <InfoIcon />
          </View>
          <View style={styles.bmiValueRow}>
            <Text style={styles.bmiValue}>{bmi.toFixed(1)}</Text>
            <View style={styles.bmiStatusRow}>
              <Text style={styles.bmiStatusCopy}>your weight is </Text>
              <View style={[styles.bmiPill, { backgroundColor: bmiMeta.pillBg }]}>
                <Text style={[styles.bmiPillText, { color: bmiMeta.pillFg }]}>
                  {bmiMeta.label}
                </Text>
              </View>
            </View>
          </View>
          <View style={styles.bmiTrack}>
            <View style={[styles.bmiSegment, { backgroundColor: '#2E90FA' }]} />
            <View style={[styles.bmiSegment, { backgroundColor: '#16B364' }]} />
            <View style={[styles.bmiSegment, { backgroundColor: '#EAAA08' }]} />
            <View style={[styles.bmiSegment, { backgroundColor: '#EF4444' }]} />
            <View style={[styles.bmiMarker, { left: `${bmiMarkerPercent(bmi)}%` }]} />
          </View>
          <View style={styles.bmiLegend}>
            <BmiLegend color="#2E90FA" title="Underweight" caption="<18.5" />
            <BmiLegend color="#16B364" title="Healthy" caption="18.5-24.9" />
            <BmiLegend color="#EAAA08" title="Overweight" caption="25.0-29.9" />
            <BmiLegend color="#EF4444" title="Obese" caption=">30" />
          </View>
        </Animated.View>
      </ScrollView>

      <ModalSheet
        visible={weightSheetVisible}
        onClose={() => setWeightSheetVisible(false)}
        title="Add weight"
        height="70%"
      >
        <View style={styles.modalBody}>
          <Text style={styles.modalLabel}>Weight ({profile.units.weight})</Text>
          <TextField
            value={weightDraft}
            onChangeText={setWeightDraft}
            keyboardType="decimal-pad"
            placeholder="e.g. 77.8"
          />
          <Text style={styles.modalLabel}>How did it feel?</Text>
          <View style={styles.moodRow}>
            {MOOD_OPTIONS.map((mood) => {
              const selected = weightMood === mood.value;
              return (
                <Pressable
                  key={mood.value}
                  onPress={() => {
                    Haptics.selectionAsync();
                    setWeightMood(mood.value);
                  }}
                  accessibilityRole="button"
                  accessibilityLabel={`Mood ${mood.label}`}
                  testID={`mood-${mood.value}`}
                  style={[
                    styles.moodChip,
                    {
                      backgroundColor: selected ? tokens.primarySoft : tokens.card,
                      borderColor: selected ? tokens.primary : tokens.border,
                    },
                  ]}
                >
                  <Text style={styles.moodEmoji}>{mood.emoji}</Text>
                  <Text
                    style={[
                      styles.moodLabel,
                      { color: selected ? tokens.primary : tokens.textPrimary },
                    ]}
                  >
                    {mood.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
          <Text style={styles.modalLabel}>Note (optional)</Text>
          <TextField
            value={weightNote}
            onChangeText={setWeightNote}
            placeholder="Energy, sleep notes…"
            multiline
          />
          <Button title="Save entry" onPress={submitWeight} style={{ marginTop: spacing.md }} />
          <Button
            title="Cancel"
            variant="ghost"
            onPress={() => setWeightSheetVisible(false)}
            fullWidth={false}
            style={styles.cancelButton}
          />
        </View>
      </ModalSheet>
    </View>
  );
}

function YAxisChart({
  labels,
  height,
  children,
}: {
  labels: string[];
  height: number;
  children: React.ReactNode;
}) {
  return (
    <View style={[styles.chart, { height }]}>
      {labels.map((label, index) => (
        <View key={`${label}-${index}`} style={[styles.gridRow, { top: index * 32 }]}>
          <Text style={styles.gridLabel}>{label}</Text>
          <View style={styles.gridLine} />
        </View>
      ))}
      <View style={styles.chartPlot}>{children}</View>
    </View>
  );
}

function SegmentedControl({
  options,
  value,
  onChange,
}: {
  options: readonly string[];
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <View style={styles.segment}>
      {options.map((option) => {
        const selected = option === value;
        return (
          <Pressable
            key={option}
            onPress={() => onChange(option)}
            style={[styles.segmentItem, selected && styles.segmentItemSelected]}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            testID={`segment-${option}`}
          >
            <Text style={[styles.segmentText, selected && styles.segmentTextSelected]}>
              {option}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <View style={styles.legendItem}>
      <View style={[styles.legendDot, { backgroundColor: color }]} />
      <Text style={styles.legendLabel}>{label}</Text>
    </View>
  );
}

function EnergyStat({
  label,
  value,
  signed,
}: {
  label: string;
  value: number;
  signed?: boolean;
}) {
  const display = signed
    ? `${value > 0 ? '+' : ''}${Math.round(value)}`
    : `${Math.round(value)}`;
  return (
    <View style={styles.energyStat}>
      <Text style={styles.energyStatLabel}>{label}</Text>
      <Text style={styles.energyStatValue}>
        {display}
        <Text style={styles.energyStatUnit}> Cal</Text>
      </Text>
    </View>
  );
}

function BmiLegend({
  color,
  title,
  caption,
}: {
  color: string;
  title: string;
  caption: string;
}) {
  return (
    <View style={styles.bmiLegendItem}>
      <View style={[styles.legendDot, { backgroundColor: color }]} />
      <View>
        <Text style={styles.bmiLegendTitle}>{title}</Text>
        <Text style={styles.bmiLegendTitle}>{caption}</Text>
      </View>
    </View>
  );
}

function ArrowRightIcon() {
  return (
    <Svg width={14} height={14} viewBox="0 0 14 14" fill="none">
      <Path
        d="M12.122 7.30953L8.18453 11.247C8.10244 11.3291 7.9911 11.3752 7.875 11.3752C7.7589 11.3752 7.64756 11.3291 7.56547 11.247C7.48338 11.1649 7.43726 11.0536 7.43726 10.9375C7.43726 10.8214 7.48338 10.7101 7.56547 10.628L10.7565 7.4375H2.1875C2.07147 7.4375 1.96019 7.39141 1.87814 7.30936C1.79609 7.22731 1.75 7.11603 1.75 7C1.75 6.88397 1.79609 6.77269 1.87814 6.69064C1.96019 6.60859 2.07147 6.5625 2.1875 6.5625H10.7565L7.56547 3.37203C7.48338 3.28994 7.43726 3.1786 7.43726 3.0625C7.43726 2.9464 7.48338 2.83506 7.56547 2.75297C7.64756 2.67088 7.7589 2.62476 7.875 2.62476C7.9911 2.62476 8.10244 2.67088 8.18453 2.75297L12.122 6.69047C12.1627 6.7311 12.195 6.77935 12.217 6.83246C12.239 6.88558 12.2503 6.94251 12.2503 7C12.2503 7.05749 12.239 7.11442 12.217 7.16754C12.195 7.22065 12.1627 7.2689 12.122 7.30953Z"
        fill="#2E90FA"
      />
    </Svg>
  );
}

function InfoIcon() {
  return (
    <Svg width={16} height={16} viewBox="0 0 16 16" fill="none">
      <Path
        d="M8.75 11.25C8.75 11.3983 8.70601 11.5433 8.6236 11.6667C8.54119 11.79 8.42406 11.8861 8.28701 11.9429C8.14997 11.9997 7.99917 12.0145 7.85368 11.9856C7.7082 11.9567 7.57456 11.8852 7.46967 11.7803C7.36478 11.6754 7.29335 11.5418 7.26441 11.3963C7.23547 11.2508 7.25032 11.1 7.30709 10.963C7.36386 10.8259 7.45999 10.7088 7.58332 10.6264C7.70666 10.544 7.85166 10.5 8 10.5C8.19891 10.5 8.38968 10.579 8.53033 10.7197C8.67098 10.8603 8.75 11.0511 8.75 11.25ZM8 4.5C6.62125 4.5 5.5 5.50937 5.5 6.75V7C5.5 7.13261 5.55268 7.25979 5.64645 7.35355C5.74021 7.44732 5.86739 7.5 6 7.5C6.13261 7.5 6.25979 7.44732 6.35355 7.35355C6.44732 7.25979 6.5 7.13261 6.5 7V6.75C6.5 6.0625 7.17313 5.5 8 5.5C8.82687 5.5 9.5 6.0625 9.5 6.75C9.5 7.4375 8.82687 8 8 8C7.86739 8 7.74021 8.05268 7.64645 8.14645C7.55268 8.24021 7.5 8.36739 7.5 8.5V9C7.5 9.13261 7.55268 9.25979 7.64645 9.35355C7.74021 9.44732 7.86739 9.5 8 9.5C8.13261 9.5 8.25979 9.44732 8.35355 9.35355C8.44732 9.25979 8.5 9.13261 8.5 9V8.955C9.64 8.74562 10.5 7.83625 10.5 6.75C10.5 5.50937 9.37875 4.5 8 4.5ZM14.5 8C14.5 9.28558 14.1188 10.5423 13.4046 11.6112C12.6903 12.6801 11.6752 13.5132 10.4874 14.0052C9.29972 14.4972 7.99279 14.6259 6.73191 14.3751C5.47104 14.1243 4.31285 13.5052 3.40381 12.5962C2.49476 11.6872 1.8757 10.529 1.6249 9.26809C1.37409 8.00721 1.50281 6.70028 1.99478 5.51256C2.48675 4.32484 3.31987 3.30968 4.38879 2.59545C5.45771 1.88122 6.71442 1.5 8 1.5C9.72335 1.50182 11.3756 2.18722 12.5942 3.40582C13.8128 4.62441 14.4982 6.27665 14.5 8ZM13.5 8C13.5 6.9122 13.1774 5.84883 12.5731 4.94436C11.9687 4.03989 11.1098 3.33494 10.1048 2.91866C9.09977 2.50238 7.9939 2.39346 6.927 2.60568C5.86011 2.8179 4.8801 3.34172 4.11091 4.11091C3.34172 4.8801 2.8179 5.86011 2.60568 6.927C2.39346 7.9939 2.50238 9.09977 2.91866 10.1048C3.33494 11.1098 4.03989 11.9687 4.94436 12.5731C5.84883 13.1774 6.9122 13.5 8 13.5C9.45818 13.4983 10.8562 12.9184 11.8873 11.8873C12.9184 10.8562 13.4983 9.45818 13.5 8Z"
        fill="#94A3B8"
      />
    </Svg>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  scroll: {
    paddingHorizontal: 20,
    gap: 8,
  },
  pageTitle: {
    fontFamily: 'Inter_500Medium',
    fontSize: 32,
    lineHeight: 38,
    letterSpacing: -0.2,
    color: '#0F172A',
    paddingVertical: 12,
  },
  heroRow: {
    flexDirection: 'row',
    gap: 8,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: CARD_RADIUS,
    paddingHorizontal: 16,
    paddingVertical: 16,
    alignItems: 'center',
    gap: 10,
  },
  illustrationWrap: {
    width: 100,
    height: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  flameImage: {
    width: 50,
    height: 71,
  },
  badgeImage: {
    width: 70,
    height: 70,
  },
  countPill: {
    position: 'absolute',
    bottom: 9,
    minWidth: 24,
    height: 24,
    padding: 2,
    borderRadius: 999,
    backgroundColor: '#0A0A0A',
    borderWidth: 1,
    borderColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  countPillText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 16,
    lineHeight: 22,
    letterSpacing: -0.18,
    color: '#FFFFFF',
    width: 20,
    textAlign: 'center',
  },
  statCardLabel: {
    fontFamily: 'Inter_500Medium',
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: -0.12,
    color: '#0F172A',
    textAlign: 'center',
    width: '100%',
  },
  weekDots: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  weekDotCol: {
    alignItems: 'center',
    gap: 2,
  },
  weekDotLetter: {
    fontFamily: 'Inter_500Medium',
    fontSize: 9,
    lineHeight: 10,
    color: '#64748B',
  },
  weekDotLetterActive: {
    color: '#0F172A',
  },
  weekDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#E2E8F0',
  },
  weekDotLogged: {
    backgroundColor: '#2E90FA',
  },
  weekDotToday: {
    backgroundColor: '#2E90FA',
  },
  badgeDots: {
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
    width: '100%',
    minHeight: 28,
    alignItems: 'center',
  },
  badgeDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#1570EF',
  },
  darkCard: {
    backgroundColor: '#0A0A0A',
    borderRadius: CARD_RADIUS,
    padding: 16,
    gap: 16,
  },
  whiteCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: CARD_RADIUS,
    padding: 16,
    gap: 10,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  darkTitle: {
    flex: 1,
    fontFamily: 'Inter_500Medium',
    fontSize: 16,
    lineHeight: 22,
    letterSpacing: -0.18,
    color: '#FFFFFF',
  },
  lightTitle: {
    flex: 1,
    fontFamily: 'Inter_500Medium',
    fontSize: 16,
    lineHeight: 22,
    letterSpacing: -0.18,
    color: '#0F172A',
  },
  darkChip: {
    backgroundColor: '#1E293B',
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  darkChipText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 10,
    lineHeight: 12,
    color: '#FFFFFF',
  },
  lightChip: {
    backgroundColor: '#FFFFFF',
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  lightChipText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 10,
    lineHeight: 12,
    color: '#64748B',
  },
  lightChipStrong: {
    color: '#0F172A',
  },
  weightTrack: {
    height: 8,
    width: '100%',
    backgroundColor: '#1E293B',
    justifyContent: 'center',
  },
  weightFill: {
    height: 8,
    backgroundColor: '#1570EF',
  },
  weightThumb: {
    position: 'absolute',
    width: 16,
    height: 16,
    marginLeft: -8,
    top: -4,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 3,
    borderColor: '#1570EF',
  },
  weightMetaRow: {
    flexDirection: 'row',
    width: '100%',
  },
  weightMeta: {
    fontFamily: 'Inter_400Regular',
    fontSize: 10,
    lineHeight: 12,
    color: '#FFFFFF',
    flex: 1,
  },
  weightMetaRight: {
    textAlign: 'right',
  },
  weightMetaMuted: {
    color: '#64748B',
  },
  chart: {
    width: '100%',
    overflow: 'hidden',
  },
  gridRow: {
    position: 'absolute',
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
  },
  gridLabel: {
    fontFamily: 'Inter_500Medium',
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: -0.12,
    color: '#64748B',
    minWidth: 22,
    textAlign: 'right',
  },
  gridLine: {
    flex: 1,
    height: 1,
    borderStyle: 'dashed',
    borderWidth: 0.5,
    borderColor: '#E2E8F0',
  },
  chartPlot: {
    position: 'absolute',
    left: 26,
    right: 0,
    bottom: 0,
    top: 16,
  },
  weightBars: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    gap: 8,
    paddingBottom: 16,
  },
  weightBar: {
    flex: 1,
    backgroundColor: '#1570EF',
  },
  segment: {
    backgroundColor: '#E2E8F0',
    borderRadius: 999,
    padding: 2,
    flexDirection: 'row',
    alignItems: 'center',
  },
  segmentItem: {
    flex: 1,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentItemSelected: {
    backgroundColor: '#FFFFFF',
  },
  segmentText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: -0.12,
    color: '#64748B',
  },
  segmentTextSelected: {
    color: '#0F172A',
  },
  changeList: {
    gap: 0,
  },
  changeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
  },
  changePeriod: {
    width: 56,
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: -0.12,
    color: '#64748B',
  },
  changeFrom: {
    flex: 1,
    fontFamily: 'Inter_500Medium',
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: -0.12,
    color: '#0F172A',
  },
  changeTo: {
    flex: 1,
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: -0.12,
    color: '#0F172A',
  },
  heroMetric: {
    fontFamily: 'Inter_500Medium',
    fontSize: 32,
    lineHeight: 38,
    letterSpacing: -0.2,
    color: '#0F172A',
    width: '100%',
  },
  heroMetricUnit: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: -0.12,
    color: '#64748B',
  },
  stackedBars: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    paddingBottom: 0,
  },
  stackedCol: {
    flex: 1,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 4,
  },
  stackedStack: {
    width: '100%',
    justifyContent: 'flex-end',
  },
  stackFat: { width: '100%', backgroundColor: '#EF6820' },
  stackCarbs: { width: '100%', backgroundColor: '#1570EF' },
  stackProtein: { width: '100%', backgroundColor: '#DC2626' },
  dayTick: {
    fontFamily: 'Inter_400Regular',
    fontSize: 10,
    lineHeight: 12,
    color: '#475569',
  },
  legendRow: {
    flexDirection: 'row',
    gap: 16,
    justifyContent: 'center',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendLabel: {
    fontFamily: 'Inter_400Regular',
    fontSize: 10,
    lineHeight: 12,
    color: '#0F172A',
  },
  energyStats: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
  },
  energyStat: {
    flex: 1,
    gap: 2,
  },
  energyStatLabel: {
    fontFamily: 'Inter_400Regular',
    fontSize: 10,
    lineHeight: 12,
    color: '#64748B',
  },
  energyStatValue: {
    fontFamily: 'Inter_500Medium',
    fontSize: 16,
    lineHeight: 22,
    letterSpacing: -0.18,
    color: '#0F172A',
  },
  energyStatUnit: {
    fontFamily: 'Inter_400Regular',
    fontSize: 10,
    lineHeight: 12,
    color: '#64748B',
  },
  energyBars: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
  },
  energyCol: {
    flex: 1,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 4,
  },
  energyPair: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    width: '100%',
    flex: 1,
  },
  energyBurned: {
    flex: 1,
    backgroundColor: '#EAAA08',
  },
  energyConsumed: {
    flex: 1,
    backgroundColor: '#16B364',
  },
  bmiValueRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
  },
  bmiValue: {
    fontFamily: 'Inter_500Medium',
    fontSize: 32,
    lineHeight: 38,
    letterSpacing: -0.2,
    color: '#FFFFFF',
  },
  bmiStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingBottom: 6,
  },
  bmiStatusCopy: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: -0.12,
    color: '#64748B',
  },
  bmiPill: {
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  bmiPillText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 10,
    lineHeight: 12,
  },
  bmiTrack: {
    flexDirection: 'row',
    gap: 2,
    height: 8,
    width: '100%',
  },
  bmiSegment: {
    flex: 1,
    height: 8,
  },
  bmiMarker: {
    position: 'absolute',
    top: -4,
    width: 1,
    height: 16,
    backgroundColor: '#F1F5F9',
    marginLeft: -0.5,
  },
  bmiLegend: {
    flexDirection: 'row',
    gap: 16,
  },
  bmiLegendItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  bmiLegendTitle: {
    fontFamily: 'Inter_400Regular',
    fontSize: 10,
    lineHeight: 12,
    color: '#FFFFFF',
  },
  modalBody: {
    paddingVertical: spacing.sm,
    gap: spacing.xs,
  },
  modalLabel: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 12,
    color: tokens.textMuted,
    marginTop: spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  moodRow: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  moodChip: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    borderRadius: radii.md,
    borderWidth: 1.5,
    gap: 4,
  },
  moodEmoji: { fontSize: 22 },
  moodLabel: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 12,
  },
  cancelButton: {
    alignSelf: 'center',
    marginTop: spacing.xs,
  },
});
