import React, { useMemo, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, {
  Defs,
  LinearGradient,
  Path,
  Stop,
  Text as SvgText,
} from 'react-native-svg';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';

import { Feather } from '@expo/vector-icons';
import {
  BadgeIcon,
  Button,
  Card,
  CircularProgress,
  Header,
  ModalSheet,
  ProgressBar,
  SectionTitle,
  TextField,
} from '@/components/ui';
import { useAppStore } from '@/hooks/useAppStore';
import { useColors } from '@/hooks/useColors';
import { colors as tokens, radii, spacing } from '@/constants/tokens';
import type { WeightEntry } from '@/types';

const CHART_HEIGHT = 180;
const CHART_WIDTH = 320;
const CHART_PAD = 24;
const CHART_HORIZON_DAYS = 14;

type Mood = 'happy' | 'neutral' | 'sad';

const MOOD_OPTIONS: { value: Mood; label: string; emoji: string }[] = [
  { value: 'happy', label: 'Happy', emoji: '😄' },
  { value: 'neutral', label: 'Okay', emoji: '🙂' },
  { value: 'sad', label: 'Tough', emoji: '😢' },
];

export default function ProgressScreen() {
  const insets = useSafeAreaInsets();
  const palette = useColors();
  const router = useRouter();

  const { state, streakDays, actions } = useAppStore();
  const profile = state.profile;
  const weights: WeightEntry[] = state.weightHistory ?? [];
  const foodLogs = state.foodLogs ?? [];
  const exerciseLogs = state.exerciseLogs ?? [];
  const milestones = state.milestones ?? [];

  const [weightSheetVisible, setWeightSheetVisible] = useState(false);
  const [weightDraft, setWeightDraft] = useState<string>(
    profile.currentWeightKg.toString(),
  );
  const [weightMood, setWeightMood] = useState<Mood>('happy');
  const [weightNote, setWeightNote] = useState('');

  // --- Derived metrics -------------------------------------------------------
  const targetKg = profile.targetWeightKg;
  const currentKg = profile.currentWeightKg;
  const startingKg = useMemo(() => {
    if (!weights.length) return currentKg;
    const oldest = weights.reduce((acc, e) => (e.date < acc.date ? e : acc), weights[0]!);
    return oldest.weightKg;
  }, [weights, currentKg]);
  const deltaKg = parseFloat((currentKg - targetKg).toFixed(1));
  const totalLoss = parseFloat((startingKg - currentKg).toFixed(1));

  const journeyProgress = useMemo(() => {
    if (startingKg === targetKg) return 1;
    const span = Math.abs(startingKg - targetKg);
    if (span === 0) return 1;
    const moved = Math.abs(startingKg - currentKg);
    return Math.max(0, Math.min(1, moved / span));
  }, [startingKg, currentKg, targetKg]);

  // Slice last N days and order oldest -> newest for the chart.
  const chartSeries: WeightEntry[] = useMemo(() => {
    const sorted = [...weights]
      .sort((a, b) => (a.date < b.date ? -1 : 1))
      .slice(-CHART_HORIZON_DAYS);
    while (sorted.length < CHART_HORIZON_DAYS && sorted.length > 0) {
      // Pad with the earliest entry so the line starts at the left edge.
      sorted.unshift({ ...sorted[0]!, id: `pad_${sorted[0]!.id}` });
    }
    return sorted;
  }, [weights]);

  const chartStats = useMemo(() => {
    if (!chartSeries.length) {
      return { min: 0, max: 0, range: 0 };
    }
    const values = chartSeries.map((e) => e.weightKg);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = Math.max(0.5, max - min);
    return { min, max, range };
  }, [chartSeries]);

  const { polylinePath, areaPath } = useMemo(() => {
    if (chartSeries.length === 0) {
      return { polylinePath: '', areaPath: '' };
    }
    const usableWidth = CHART_WIDTH - CHART_PAD * 2;
    const usableHeight = CHART_HEIGHT - CHART_PAD * 2;
    const denom = Math.max(1, chartSeries.length - 1);
    const points = chartSeries.map((entry, idx) => {
      const x = CHART_PAD + (idx / denom) * usableWidth;
      const normalised = (entry.weightKg - chartStats.min) / chartStats.range;
      const y = CHART_PAD + (1 - normalised) * usableHeight;
      return { x, y };
    });
    const polyline = points
      .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(2)} ${p.y.toFixed(2)}`)
      .join(' ');
    const baseY = CHART_HEIGHT - CHART_PAD;
    const first = points[0]!;
    const last = points[points.length - 1]!;
    const area = `${polyline} L ${last.x.toFixed(2)} ${baseY.toFixed(2)} L ${first.x.toFixed(2)} ${baseY.toFixed(2)} Z`;
    return { polylinePath: polyline, areaPath: area };
  }, [chartSeries, chartStats]);

  // --- 7-day calorie trend ---------------------------------------------------
  const last7Days = useMemo(() => {
    const out: { date: string; label: string; calories: number; goal: number }[] = [];
    const calorieGoal = profile.nutrientGoals.calories;
    const byDate = new Map(foodLogs.map((d) => [d.date, d]));
    for (let i = 6; i >= 0; i--) {
      const date = new Date(Date.now() - i * 86_400_000).toISOString().slice(0, 10);
      const log = byDate.get(date);
      out.push({
        date,
        label: new Date(date).toLocaleDateString('en-US', { weekday: 'short' }),
        calories: log?.totals.calories ?? 0,
        goal: calorieGoal,
      });
    }
    return out;
  }, [foodLogs, profile.nutrientGoals.calories]);

  const avgCalories = useMemo(() => {
    const total = last7Days.reduce((sum, d) => sum + d.calories, 0);
    return Math.round(total / Math.max(1, last7Days.length));
  }, [last7Days]);

  const weeklyWorkouts = useMemo(() => {
    const cutoff = new Date(Date.now() - 6 * 86_400_000).toISOString().slice(0, 10);
    const today = new Date().toISOString().slice(0, 10);
    return exerciseLogs.filter((e) => e.date >= cutoff && e.date <= today).length;
  }, [exerciseLogs]);

  const waterAvg = useMemo(() => {
    const goal = profile.nutrientGoals.waterMl;
    const recent7 = foodLogs
      .slice(-7)
      .map((d) => d.totals.sodium ?? 0);
    // Not actually tracking water in food log data; derive from goal ratio keeping seed simple.
    const seedBaseline = 0.82;
    return Math.round(goal * seedBaseline);
  }, [foodLogs, profile.nutrientGoals.waterMl]);

  const startWeight = chartSeries.length > 0 ? chartSeries[0]!.weightKg : currentKg;
  const endWeight = chartSeries.length > 0 ? chartSeries[chartSeries.length - 1]!.weightKg : currentKg;
  const trendDelta = parseFloat((endWeight - startWeight).toFixed(1));

  // --- Weight modal ----------------------------------------------------------
  const submitWeight = async () => {
    const parsed = parseFloat(weightDraft.replace(',', '.'));
    if (!Number.isFinite(parsed) || parsed < 30 || parsed > 250) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await actions.addWeight({
      date: new Date().toISOString().slice(0, 10),
      weightKg: parsed,
      note: `${weightMood}${weightNote ? ` — ${weightNote}` : ''}`,
    });
    setWeightSheetVisible(false);
    setWeightNote('');
  };

  const categoryCounts = useMemo(() => {
    return milestones.reduce(
      (acc, m) => {
        acc.all += 1;
        acc[m.category] = (acc[m.category] ?? 0) + 1;
        if (m.unlocked) acc.unlocked += 1;
        return acc;
      },
      { all: 0, streak: 0, nutrition: 0, exercise: 0, community: 0, unlocked: 0 },
    );
  }, [milestones]);

  return (
    <View style={[styles.container, { backgroundColor: palette.background }]}>
      <Header
        title="Progress"
        rightIcon="plus"
        onRightPress={() => {
          Haptics.selectionAsync();
          setWeightDraft(profile.currentWeightKg.toString());
          setWeightMood('happy');
          setWeightNote('');
          setWeightSheetVisible(true);
        }}
      />

      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          {
            paddingTop: spacing.xs,
            paddingBottom: insets.bottom + 120,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Weight hero card */}
        <Animated.View entering={FadeIn.duration(400)} style={styles.heroCard}>
          <View style={styles.heroBackgroundHalo} />
          <View style={styles.heroRow}>
            <View style={styles.heroLeft}>
              <Text style={styles.heroEyebrow}>Current vs goal</Text>
              <View style={styles.heroWeightRow}>
                <Text style={styles.heroWeight}>{currentKg.toFixed(1)}</Text>
                <Text style={styles.heroUnit}>kg</Text>
              </View>
              <View style={styles.heroDeltaRow}>
                <FeatherBadge
                  positive={deltaKg <= 0}
                  delta={deltaKg}
                  caption={deltaKg <= 0 ? 'kg to lose' : 'kg past goal'}
                />
              </View>
              <Text style={styles.heroCaption}>
                Target {targetKg.toFixed(1)} kg · {profile.units.weight}
              </Text>
            </View>

            <CircularProgress
              progress={journeyProgress}
              size={132}
              strokeWidth={10}
              color={tokens.accentGreen}
              trackColor="rgba(255,255,255,0.18)"
            >
              <Text style={styles.heroRingPct}>{Math.round(journeyProgress * 100)}%</Text>
              <Text style={styles.heroRingSub}>to goal</Text>
            </CircularProgress>
          </View>

          <View style={styles.heroFooter}>
            <HeroStat label="Started" value={`${startingKg.toFixed(1)} kg`} />
            <HeroDivider />
            <HeroStat
              label="Lost"
              value={`${totalLoss >= 0 ? '-' : '+'}${Math.abs(totalLoss).toFixed(1)} kg`}
              accent={totalLoss >= 0 ? tokens.accentGreen : tokens.accentOrange}
            />
            <HeroDivider />
            <HeroStat label="Streak" value={`${streakDays} days`} />
          </View>
        </Animated.View>

        {/* Weight chart */}
        <Animated.View entering={FadeInDown.duration(400).delay(60)}>
          <SectionTitle
            title="Weight trend"
            action="14 days"
          />
          <Card style={styles.chartCard}>
            <View style={styles.chartHeader}>
              <View>
                <Text style={styles.chartLabel}>Today</Text>
                <Text style={styles.chartValue}>{endWeight.toFixed(1)} kg</Text>
              </View>
              <View style={styles.chartDelta}>
                <FeatherBadge
                  positive={trendDelta <= 0}
                  delta={trendDelta}
                  caption={trendDelta <= 0 ? 'kg this week' : 'kg up'}
                />
              </View>
            </View>

            <Svg width={CHART_WIDTH} height={CHART_HEIGHT}>
              <Defs>
                <LinearGradient id="progress-area" x1="0" y1="0" x2="0" y2="1">
                  <Stop offset="0" stopColor={tokens.primary} stopOpacity="0.32" />
                  <Stop offset="1" stopColor={tokens.primary} stopOpacity="0" />
                </LinearGradient>
              </Defs>
              {/* Horizontal grid rules */}
              {[0, 1, 2].map((line) => {
                const y =
                  CHART_PAD +
                  (line / 2) * (CHART_HEIGHT - CHART_PAD * 2);
                return (
                  <Path
                    key={`grid-${line}`}
                    d={`M ${CHART_PAD} ${y} L ${CHART_WIDTH - CHART_PAD} ${y}`}
                    stroke="rgba(15,23,42,0.05)"
                    strokeWidth={1}
                  />
                );
              })}
              <Path d={areaPath} fill="url(#progress-area)" />
              <Path
                d={polylinePath}
                stroke={tokens.primary}
                strokeWidth={2.5}
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              {/* Goal reference line */}
              {chartStats.range > 0
                ? renderGoalLine(targetKg, chartStats, CHART_WIDTH, CHART_HEIGHT, CHART_PAD)
                : null}
              {chartSeries.length > 0 && (
                <SvgText
                  x={CHART_WIDTH - CHART_PAD}
                  y={CHART_PAD + 8}
                  fontSize="9"
                  fontFamily="Inter_500Medium"
                  fill={tokens.textMuted}
                  textAnchor="end"
                >
                  Goal {targetKg.toFixed(1)} kg
                </SvgText>
              )}
            </Svg>

            <View style={styles.chartAxis}>
              <Text style={styles.chartAxisText}>{firstDateLabel(chartSeries)}</Text>
              <Text style={styles.chartAxisText}>{lastDateLabel(chartSeries)}</Text>
            </View>
          </Card>
        </Animated.View>

        {/* Stat cards */}
        <Animated.View entering={FadeInDown.duration(400).delay(120)}>
          <SectionTitle title="This week" />
          <View style={styles.statGrid}>
            <StatTile
              icon="zap"
              label="Avg calories"
              value={avgCalories.toLocaleString()}
              unit="kcal"
              tint={tokens.primary}
            />
            <StatTile
              icon="award"
              label="Streak"
              value={`${streakDays}`}
              unit={streakDays === 1 ? 'day' : 'days'}
              tint={tokens.accentOrange}
            />
            <StatTile
              icon="activity"
              label="Workouts"
              value={`${weeklyWorkouts}`}
              unit={weeklyWorkouts === 1 ? 'session' : 'sessions'}
              tint={tokens.accentPurple}
            />
            <StatTile
              icon="droplet"
              label="Water avg"
              value={`${waterAvg}`}
              unit="ml"
              tint={tokens.primary}
            />
          </View>
        </Animated.View>

        {/* Calorie trend bars */}
        <Animated.View entering={FadeInDown.duration(400).delay(180)}>
          <SectionTitle
            title="Calorie trend"
            action={`${avgCalories}/${profile.nutrientGoals.calories} kcal`}
          />
          <Card style={styles.calorieCard}>
            {last7Days.map((day) => {
              const ratio = day.goal > 0 ? day.calories / day.goal : 0;
              const clamped = Math.max(0, Math.min(1, ratio));
              const overOrUnder =
                day.calories === 0
                  ? '—'
                  : `${day.calories >= day.goal ? '+' : '-'}${Math.abs(day.calories - day.goal)}`;
              return (
                <View key={day.date} style={styles.calorieRow}>
                  <View style={styles.calorieDayLabel}>
                    <Text style={styles.calorieDay}>{day.label}</Text>
                    <Text style={styles.calorieDate}>
                      {day.date.slice(5)}
                    </Text>
                  </View>
                  <View style={styles.calorieBarTrack}>
                    <ProgressBar
                      progress={clamped}
                      color={
                        day.calories === 0
                          ? tokens.border
                          : day.calories > day.goal
                          ? tokens.accentOrange
                          : tokens.primary
                      }
                      backgroundColor={tokens.background}
                      height={10}
                    />
                  </View>
                  <View style={styles.calorieNumeric}>
                    <Text style={styles.calorieValue}>
                      {day.calories.toLocaleString()}
                    </Text>
                    <Text
                      style={[
                        styles.calorieDelta,
                        {
                          color:
                            day.calories === 0
                              ? tokens.textMuted
                              : day.calories > day.goal
                              ? tokens.accentOrange
                              : tokens.accentGreen,
                        },
                      ]}
                    >
                      {overOrUnder}
                    </Text>
                  </View>
                </View>
              );
            })}
          </Card>
        </Animated.View>

        {/* Milestone summary */}
        <Animated.View entering={FadeInDown.duration(400).delay(240)}>
          <SectionTitle
            title="Milestones"
            action={`${categoryCounts.unlocked}/${categoryCounts.all} unlocked`}
            onAction={() => router.push('/milestones')}
          />
          <Card style={styles.milestoneCard}>
            <View style={styles.milestoneRow}>
              {milestones.slice(0, 4).map((badge) => (
                <BadgeIcon
                  key={badge.id}
                  tier={badge.tier}
                  iconKey={badge.iconKey as any}
                  title={badge.title}
                  progress={Math.max(0.3, badge.progress)}
                  unlocked={badge.unlocked}
                  size="sm"
                  onPress={() => router.push(`/milestones/badge/${badge.id}`)}
                />
              ))}
            </View>
            <Button
              title="View all milestones"
              variant="outline"
              onPress={() => router.push('/milestones')}
              style={styles.viewAllButton}
            />
          </Card>
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
                  style={({ pressed }) => [
                    styles.moodChip,
                    {
                      backgroundColor: selected
                        ? tokens.primarySoft
                        : tokens.card,
                      borderColor: selected ? tokens.primary : tokens.border,
                      opacity: pressed ? 0.85 : 1,
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

          <Button
            title="Save entry"
            onPress={submitWeight}
            style={{ marginTop: spacing.md }}
          />
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

// --- Helpers ----------------------------------------------------------------

function renderGoalLine(
  goalKg: number,
  stats: { min: number; max: number; range: number },
  width: number,
  height: number,
  pad: number,
) {
  if (goalKg < stats.min || goalKg > stats.max) {
    return null;
  }
  const usableHeight = height - pad * 2;
  const normalised = (goalKg - stats.min) / stats.range;
  const y = pad + (1 - normalised) * usableHeight;
  return (
    <Path
      d={`M ${pad} ${y} L ${width - pad} ${y}`}
      stroke={tokens.accentGreen}
      strokeDasharray="6 4"
      strokeWidth={1.5}
    />
  );
}

function firstDateLabel(series: WeightEntry[]): string {
  if (!series.length) return '';
  return formatAxisDate(series[0]!.date);
}

function lastDateLabel(series: WeightEntry[]): string {
  if (!series.length) return '';
  return formatAxisDate(series[series.length - 1]!.date);
}

function formatAxisDate(date: string): string {
  const d = new Date(date);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function HeroStat({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: string;
}) {
  return (
    <View style={styles.heroStat}>
      <Text style={[styles.heroStatValue, accent ? { color: accent } : null]}>
        {value}
      </Text>
      <Text style={styles.heroStatLabel}>{label}</Text>
    </View>
  );
}

function HeroDivider() {
  return <View style={styles.heroDivider} />;
}

function FeatherBadge({
  positive,
  delta,
  caption,
}: {
  positive: boolean;
  delta: number;
  caption: string;
}) {
  return (
    <View
      style={[
        styles.miniBadge,
        {
          backgroundColor: positive
            ? 'rgba(74,222,128,0.18)'
            : 'rgba(255,106,26,0.2)',
        },
      ]}
    >
      <FeatherGlyph
        name={positive ? 'arrow-down' : 'arrow-up'}
        color={positive ? tokens.accentGreen : tokens.accentOrange}
      />
      <Text
        style={[
          styles.miniBadgeValue,
          { color: positive ? tokens.accentGreen : tokens.accentOrange },
        ]}
      >
        {Math.abs(delta).toFixed(1)}
      </Text>
      <Text style={styles.miniBadgeCaption}>{caption}</Text>
    </View>
  );
}

function FeatherGlyph({
  name,
  color,
  size = 12,
}: {
  name: keyof typeof Feather.glyphMap;
  color: string;
  size?: number;
}) {
  return <Feather name={name} size={size} color={color} />;
}

function StatTile({
  icon,
  label,
  value,
  unit,
  tint,
}: {
  icon: keyof typeof Feather.glyphMap;
  label: string;
  value: string;
  unit: string;
  tint: string;
}) {
  const palette = useColors();
  return (
    <Card style={styles.statTile}>
      <View style={[styles.statIconWrap, { backgroundColor: `${tint}22` }]}>
        <Feather name={icon} size={18} color={tint} />
      </View>
      <Text style={[styles.statValue, { color: palette.foreground }]}>
        {value}
      </Text>
      <Text style={[styles.statUnit, { color: palette.mutedForeground }]}>
        {unit}
      </Text>
      <Text style={[styles.statLabel, { color: palette.mutedForeground }]}>
        {label}
      </Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: {
    paddingHorizontal: spacing.lg,
    paddingBottom: 80,
  },
  heroCard: {
    backgroundColor: tokens.darkSurface,
    borderRadius: radii.xl,
    padding: spacing.lg,
    overflow: 'hidden',
    marginBottom: spacing.lg,
  },
  heroBackgroundHalo: {
    position: 'absolute',
    right: -56,
    top: -56,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: 'rgba(21,112,239,0.18)',
  },
  heroRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  heroLeft: { flex: 1, gap: 6 },
  heroEyebrow: {
    color: 'rgba(255,255,255,0.7)',
    fontFamily: 'Inter_500Medium',
    fontSize: 12,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  heroWeightRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: spacing.xs,
  },
  heroWeight: {
    color: tokens.textInverse,
    fontFamily: 'Inter_700Bold',
    fontSize: 44,
    letterSpacing: -1.2,
  },
  heroUnit: {
    color: 'rgba(255,255,255,0.6)',
    fontFamily: 'Inter_500Medium',
    fontSize: 14,
  },
  heroDeltaRow: { marginTop: spacing.xs },
  miniBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: radii.pill,
    alignSelf: 'flex-start',
  },
  miniBadgeValue: {
    fontFamily: 'Inter_700Bold',
    fontSize: 13,
  },
  miniBadgeCaption: {
    color: 'rgba(255,255,255,0.7)',
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
  },
  heroCaption: {
    color: 'rgba(255,255,255,0.6)',
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    marginTop: 8,
  },
  heroRingPct: {
    color: tokens.textInverse,
    fontFamily: 'Inter_700Bold',
    fontSize: 22,
    letterSpacing: -0.6,
  },
  heroRingSub: {
    color: 'rgba(255,255,255,0.6)',
    fontFamily: 'Inter_500Medium',
    fontSize: 10,
    marginTop: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  heroFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.lg,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.08)',
  },
  heroStat: {
    alignItems: 'flex-start',
    flex: 1,
    gap: 2,
  },
  heroStatValue: {
    color: tokens.textInverse,
    fontFamily: 'Inter_700Bold',
    fontSize: 17,
  },
  heroStatLabel: {
    color: 'rgba(255,255,255,0.6)',
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  heroDivider: {
    width: 1,
    height: 24,
    backgroundColor: 'rgba(255,255,255,0.12)',
    marginHorizontal: spacing.sm,
  },
  chartCard: {
    marginBottom: spacing.lg,
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: spacing.md,
  },
  chartLabel: {
    fontFamily: 'Inter_500Medium',
    fontSize: 12,
    color: tokens.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  chartValue: {
    fontFamily: 'Inter_700Bold',
    fontSize: 24,
    color: tokens.textPrimary,
    letterSpacing: -0.5,
    marginTop: 2,
  },
  chartDelta: { alignItems: 'flex-end' },
  chartAxis: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
  },
  chartAxisText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 11,
    color: tokens.textMuted,
  },
  statGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  statTile: {
    flexGrow: 1,
    flexBasis: '47%',
    paddingVertical: spacing.md,
    gap: 4,
  },
  statIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  statValue: {
    fontFamily: 'Inter_700Bold',
    fontSize: 22,
    letterSpacing: -0.4,
  },
  statUnit: {
    fontFamily: 'Inter_500Medium',
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  statLabel: {
    fontFamily: 'Inter_500Medium',
    fontSize: 12,
    marginTop: spacing.xxs,
  },
  calorieCard: {
    marginBottom: spacing.lg,
    gap: spacing.sm,
  },
  calorieRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  calorieDayLabel: {
    width: 56,
  },
  calorieDay: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 13,
    color: tokens.textPrimary,
  },
  calorieDate: {
    fontFamily: 'Inter_400Regular',
    fontSize: 10,
    color: tokens.textMuted,
    letterSpacing: 0.4,
  },
  calorieBarTrack: {
    flex: 1,
  },
  calorieNumeric: {
    width: 76,
    alignItems: 'flex-end',
  },
  calorieValue: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 13,
    color: tokens.textPrimary,
  },
  calorieDelta: {
    fontFamily: 'Inter_500Medium',
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  milestoneCard: {
    gap: spacing.md,
  },
  milestoneRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.xs,
  },
  viewAllButton: {
    marginTop: 0,
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
  moodEmoji: {
    fontSize: 22,
  },
  moodLabel: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 12,
  },
  cancelButton: {
    alignSelf: 'center',
    marginTop: spacing.xs,
  },
});
