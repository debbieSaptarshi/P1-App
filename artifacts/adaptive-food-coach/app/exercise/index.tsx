import React, { useCallback, useMemo, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Button, Header } from '@/components/ui';
import { colors, radii, spacing } from '@/constants/tokens';
import { useAppStore } from '@/hooks/useAppStore';
import type { ExerciseLog, ExerciseType } from '@/types';

interface ExerciseOption {
  id: ExerciseType;
  label: string;
  icon: 'activity' | 'trending-up' | 'zap' | 'user' | 'wind' | 'disc' | 'navigation' | 'more-horizontal';
  accent: string;
  kcalPerMin: number;
  defaultDuration: number;
}

const EXERCISE_OPTIONS: ExerciseOption[] = [
  {
    id: 'running',
    label: 'Running',
    icon: 'trending-up',
    accent: '#FF6A1A',
    kcalPerMin: 11.5,
    defaultDuration: 30,
  },
  {
    id: 'cycling',
    label: 'Cycling',
    icon: 'navigation',
    accent: '#1570EF',
    kcalPerMin: 7.5,
    defaultDuration: 45,
  },
  {
    id: 'strength',
    label: 'Strength',
    icon: 'zap',
    accent: '#0A0A0A',
    kcalPerMin: 6.5,
    defaultDuration: 40,
  },
  {
    id: 'yoga',
    label: 'Yoga',
    icon: 'wind',
    accent: '#7C3AED',
    kcalPerMin: 3.5,
    defaultDuration: 45,
  },
  {
    id: 'swimming',
    label: 'Swimming',
    icon: 'disc',
    accent: '#4ADE80',
    kcalPerMin: 9.5,
    defaultDuration: 30,
  },
  {
    id: 'hiit',
    label: 'HIIT',
    icon: 'activity',
    accent: '#FF3B30',
    kcalPerMin: 12.5,
    defaultDuration: 20,
  },
  {
    id: 'walking',
    label: 'Walking',
    icon: 'user',
    accent: '#4ADE80',
    kcalPerMin: 4.0,
    defaultDuration: 45,
  },
  {
    id: 'other',
    label: 'Other',
    icon: 'more-horizontal',
    accent: '#64748B',
    kcalPerMin: 5.5,
    defaultDuration: 30,
  },
];

const WEEKLY_GOAL_MIN = 150;

/**
 * Exercise entry point.
 *
 * Lets the user pick an activity type and starts a session for it.
 * "Start GPS run" jumps to the active session screen with a live
 * mock tracker; non-run types are quick-logged on tap with sensible
 * macro estimates derived from the user's weight & duration.
 */
export default function ExerciseIndexScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { state, actions } = useAppStore();
  const [loggedMessage, setLoggedMessage] = useState<string | null>(null);

  const todayIso = useMemo(() => new Date().toISOString().slice(0, 10), []);

  const todaysBurn = useMemo(() => {
    return state.exerciseLogs
      .filter((l) => l.date === todayIso)
      .reduce((sum, l) => sum + l.caloriesBurned, 0);
  }, [state.exerciseLogs, todayIso]);

  const weeklyMinutes = useMemo(() => {
    const sevenAgo = new Date(Date.now() - 6 * 86_400_000).toISOString().slice(0, 10);
    return state.exerciseLogs
      .filter((l) => l.date >= sevenAgo)
      .reduce((sum, l) => sum + l.durationMinutes, 0);
  }, [state.exerciseLogs]);

  const weightKg = state.profile?.currentWeightKg ?? 75;

  const handlePick = useCallback(
    (option: ExerciseOption) => {
      Haptics.selectionAsync();
      if (option.id === 'running') {
        router.push('/exercise/run-active');
        return;
      }
      const calories = estimateCalories(option, weightKg, option.defaultDuration, state.profile?.id);
      const log: Omit<ExerciseLog, 'id'> = {
        date: todayIso,
        type: option.id,
        durationMinutes: option.defaultDuration,
        caloriesBurned: calories,
        notes: undefined,
      };
      actions.logExercise(log);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setLoggedMessage(`Logged ${option.label} · ${calories} kcal`);
    },
    [actions, router, state.profile?.id, todayIso, weightKg],
  );

  const handleStartGpsRun = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push('/exercise/run-active');
  }, [router]);

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <Header
        title="Log exercise"
        subtitle={`${todaysBurn} kcal burned today`}
        rightIcon="message-circle"
        onRightPress={() => router.push('/exercise/voice-describer')}
      />

      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingBottom: insets.bottom + 160 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.heroCard}>
          <View style={styles.heroHeader}>
            <View style={styles.heroBadge}>
              <Feather name="activity" size={20} color="#FFFFFF" />
            </View>
            <Text style={styles.heroTitle}>Weekly goal</Text>
            <Text style={styles.heroStat}>
              {weeklyMinutes} / {WEEKLY_GOAL_MIN} min
            </Text>
          </View>
          <View style={styles.progressRow}>
            <View style={styles.progressBg}>
              <View
                style={[
                  styles.progressFg,
                  {
                    width: `${Math.min(
                      100,
                      (weeklyMinutes / WEEKLY_GOAL_MIN) * 100,
                    )}%`,
                  },
                ]}
              />
            </View>
          </View>
          <Text style={styles.heroSubtitle}>
            Aim for {WEEKLY_GOAL_MIN} active minutes a week to keep your streak.
          </Text>
        </View>

        <View style={styles.primaryCta}>
          <Button
            title="Start GPS run"
            variant="dark"
            size="lg"
            leadingIcon="play"
            onPress={handleStartGpsRun}
            testID="exercise-start-run"
          />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Describe an exercise"
            testID="exercise-voice-link"
            onPress={() => router.push('/exercise/voice-describer')}
            style={({ pressed }) => [styles.voiceRow, pressed && styles.pressed]}
          >
            <Feather name="mic" size={18} color={colors.primary} />
            <Text style={styles.voiceText}>Describe an exercise or paste a workout</Text>
            <Feather name="arrow-right" size={14} color={colors.textMuted} />
          </Pressable>
        </View>

        <Text style={styles.sectionLabel}>Pick an activity</Text>
        <View style={styles.grid}>
          {EXERCISE_OPTIONS.map((option) => (
            <ActivityTile
              key={option.id}
              option={option}
              onPress={() => handlePick(option)}
              weightKg={weightKg}
            />
          ))}
        </View>

        {loggedMessage ? (
          <View style={styles.flashCard}>
            <Feather name="check-circle" size={16} color={colors.accentGreen} />
            <Text style={styles.flashText}>{loggedMessage}</Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Dismiss"
              testID="exercise-flash-dismiss"
              onPress={() => setLoggedMessage(null)}
              hitSlop={8}
              style={({ pressed }) => pressed && styles.pressed}
            >
              <Feather name="x" size={14} color={colors.textMuted} />
            </Pressable>
          </View>
        ) : null}

        <View style={styles.history}>
          <Text style={styles.sectionLabel}>Recent activity</Text>
          {state.exerciseLogs.slice(0, 4).map((log) => (
            <View key={log.id} style={styles.historyRow}>
              <View style={[styles.historyIcon, { backgroundColor: `${accentForType(log.type)}1A` }]}>
                <Feather name={iconForType(log.type)} size={16} color={accentForType(log.type)} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.historyTitle}>{labelForType(log.type)}</Text>
                <Text style={styles.historyMeta}>
                  {log.durationMinutes} min · {log.distanceKm ? `${log.distanceKm} km · ` : ''}
                  {log.caloriesBurned} kcal
                </Text>
              </View>
              <Text style={styles.historyDate}>{formatRelDate(log.date, todayIso)}</Text>
            </View>
          ))}
          {state.exerciseLogs.length === 0 ? (
            <View style={styles.historyEmpty}>
              <Text style={styles.historyEmptyText}>No exercise logged yet.</Text>
            </View>
          ) : null}
        </View>
      </ScrollView>
    </View>
  );
}

function ActivityTile({
  option,
  onPress,
  weightKg,
}: {
  option: ExerciseOption;
  onPress: () => void;
  weightKg: number;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Log ${option.label}`}
      testID={`exercise-tile-${option.id}`}
      onPress={onPress}
      style={({ pressed }) => [
        styles.tile,
        pressed && styles.pressed,
      ]}
    >
      <View style={[styles.tileBadge, { backgroundColor: `${option.accent}1A` }]}>
        <Feather name={option.icon} size={20} color={option.accent} />
      </View>
      <Text style={styles.tileLabel}>{option.label}</Text>
      <View style={styles.tileChips}>
        <Text style={styles.tileChipPrimary}>
          {estimateCalories(option, weightKg, option.defaultDuration, '')} kcal
        </Text>
        <Text style={styles.tileChipMuted}>{option.defaultDuration} min</Text>
      </View>
    </Pressable>
  );
}

function estimateCalories(
  option: ExerciseOption,
  weightKg: number,
  durationMinutes: number,
  _userId: string | undefined,
): number {
  // MET heuristic — kcal = MET × kg × hours. Simplified here for the
  // mock dataset so values feel realistic without pulling user age
  // into the calculation.
  const hours = durationMinutes / 60;
  return Math.round(option.kcalPerMin * durationMinutes * (weightKg / 75));
}

function accentForType(type: ExerciseType): string {
  return (
    EXERCISE_OPTIONS.find((o) => o.id === type)?.accent ?? '#64748B'
  );
}

function labelForType(type: ExerciseType): string {
  return EXERCISE_OPTIONS.find((o) => o.id === type)?.label ?? 'Exercise';
}

function iconForType(type: ExerciseType): 'activity' | 'trending-up' | 'zap' | 'user' | 'wind' | 'disc' | 'navigation' | 'more-horizontal' {
  return (
    EXERCISE_OPTIONS.find((o) => o.id === type)?.icon ?? 'activity'
  );
}

function formatRelDate(iso: string, today: string): string {
  if (iso === today) return 'Today';
  const diff = Math.round((Date.parse(today) - Date.parse(iso)) / 86_400_000);
  if (diff === 1) return 'Yesterday';
  return `${diff}d ago`;
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
    backgroundColor: colors.darkSurface,
    borderRadius: radii.xl,
    padding: spacing.lg,
  },
  heroHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  heroBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.10)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroTitle: {
    flex: 1,
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
    color: 'rgba(255,255,255,0.85)',
  },
  heroStat: {
    fontFamily: 'Inter_700Bold',
    fontSize: 18,
    color: '#FFFFFF',
  },
  progressRow: {
    marginTop: spacing.md,
  },
  progressBg: {
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.12)',
    overflow: 'hidden',
  },
  progressFg: {
    height: '100%',
    borderRadius: 4,
    backgroundColor: '#4ADE80',
  },
  heroSubtitle: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    color: 'rgba(255,255,255,0.65)',
    marginTop: spacing.sm,
  },
  primaryCta: {
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  voiceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.card,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.md,
  },
  voiceText: {
    flex: 1,
    fontFamily: 'Inter_500Medium',
    fontSize: 13,
    color: colors.textPrimary,
  },
  sectionLabel: {
    fontFamily: 'Inter_700Bold',
    fontSize: 13,
    color: colors.textMuted,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  tile: {
    width: '47%',
    backgroundColor: colors.card,
    borderRadius: radii.lg,
    padding: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 2,
  },
  tileBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  tileLabel: {
    fontFamily: 'Inter_700Bold',
    fontSize: 16,
    color: colors.textPrimary,
  },
  tileChips: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: 4,
  },
  tileChipPrimary: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 12,
    color: colors.primary,
  },
  tileChipMuted: {
    fontFamily: 'Inter_500Medium',
    fontSize: 12,
    color: colors.textMuted,
  },
  flashCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.card,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.md,
    marginTop: spacing.md,
  },
  flashText: {
    flex: 1,
    fontFamily: 'Inter_500Medium',
    fontSize: 13,
    color: colors.textPrimary,
  },
  history: {
    marginTop: spacing.md,
  },
  historyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
  },
  historyIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  historyTitle: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
    color: colors.textPrimary,
  },
  historyMeta: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  historyDate: {
    fontFamily: 'Inter_500Medium',
    fontSize: 12,
    color: colors.textMuted,
  },
  historyEmpty: {
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  historyEmptyText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    color: colors.textMuted,
  },
  pressed: { opacity: 0.6 },
});
