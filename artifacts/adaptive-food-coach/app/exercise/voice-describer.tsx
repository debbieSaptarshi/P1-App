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
import { Button, Header, TextField } from '@/components/ui';
import { colors, radii, spacing } from '@/constants/tokens';
import { useAppStore } from '@/hooks/useAppStore';
import type { ExerciseType } from '@/types';

interface TypeSuggestion {
  type: ExerciseType;
  label: string;
  reason: string;
  accent: string;
}

/**
 * Detect the most likely ExerciseType from a textual description.
 *
 * Pure heuristic — splits the description, looks for keywords, and
 * returns the highest-confidence match (or 'other' if nothing fits).
 */
function deriveType(description: string): TypeSuggestion {
  const text = description.toLowerCase();
  const has = (...words: string[]) =>
    words.some((w) => text.includes(w));

  if (has('run', 'jog', 'sprint', 'treadmill')) {
    return {
      type: 'running',
      label: 'Running',
      reason: 'Mention of running / jogging detected.',
      accent: '#FF6A1A',
    };
  }
  if (has('walk', 'stroll', 'hike')) {
    return {
      type: 'walking',
      label: 'Walking',
      reason: 'Walking or hike phrasing detected.',
      accent: '#4ADE80',
    };
  }
  if (has('bike', 'cycle', 'ride', 'cycling', 'spin')) {
    return {
      type: 'cycling',
      label: 'Cycling',
      reason: 'Bike ride mentioned.',
      accent: '#1570EF',
    };
  }
  if (has('lift', 'weights', 'squat', 'deadlift', 'bench', 'press')) {
    return {
      type: 'strength',
      label: 'Strength training',
      reason: 'Lifting / strength words detected.',
      accent: '#0A0A0A',
    };
  }
  if (has('yoga', 'pilates', 'stretch', 'mobility', 'meditate')) {
    return {
      type: 'yoga',
      label: 'Yoga',
      reason: 'Mind-body / stretching cues.',
      accent: '#7C3AED',
    };
  }
  if (has('swim', 'pool', 'lap')) {
    return {
      type: 'swimming',
      label: 'Swimming',
      reason: 'Swim pool/lap keywords detected.',
      accent: '#4ADE80',
    };
  }
  if (has('hiit', 'interval', 'circuit', 'tabata')) {
    return {
      type: 'hiit',
      label: 'HIIT',
      reason: 'Interval / circuit style.',
      accent: '#FF3B30',
    };
  }
  return {
    type: 'other',
    label: 'Other activity',
    reason: 'No specific type cues; logging as Other.',
    accent: '#64748B',
  };
}

/** Parse a description for a duration in minutes. */
function deriveDurationMinutes(description: string): number {
  const text = description.toLowerCase();
  const hourMatch = text.match(/(\d+(?:\.\d+)?)\s*(?:h|hr|hour|hours)/);
  if (hourMatch) return Math.round(parseFloat(hourMatch[1]) * 60);
  const minuteMatch = text.match(/(\d+)\s*(?:m|min|mins|minute|minutes)/);
  if (minuteMatch) return Math.min(180, parseInt(minuteMatch[1], 10));
  return 30; // sensible default
}

/** Calorie estimate from type, duration, body weight. */
function estimateCalories(
  type: ExerciseType,
  duration: number,
  weightKg: number,
): number {
  const base: Record<ExerciseType, number> = {
    running: 11.5,
    cycling: 7.5,
    strength: 6.5,
    yoga: 3.5,
    swimming: 9.5,
    hiit: 12.5,
    walking: 4.0,
    other: 5.5,
  };
  const hours = duration / 60;
  return Math.round(base[type] * hours * (weightKg / 75));
}

const EXAMPLE_DESCRIPTIONS: string[] = [
  'Ran 5.2 km in 32 min, felt good.',
  '45 minute yoga flow in the morning.',
  'Cycling commute, about 55 min.',
  'Leg day — squats and deadlifts, 40 min.',
  'HIIT circuit, 20 minutes, heart rate up.',
];

/**
 * Voice / text describer for an exercise.
 *
 * Renders a TextField and a microphone icon (Feather mic — no real
 * recording), heuristically classifies the description, and on submit
 * calls `actions.logExercise(...)` with sensible calorie + duration
 * estimates. The user can override the detected type.
 */
export default function VoiceDescriberScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { state, actions } = useAppStore();
  const [description, setDescription] = useState('');
  const [overrideType, setOverrideType] = useState<ExerciseType | null>(null);

  const weightKg = state.profile?.currentWeightKg ?? 75;

  const detection = useMemo(
    () => deriveType(description),
    [description],
  );
  const finalType = overrideType ?? detection.type;

  const duration = useMemo(
    () => deriveDurationMinutes(description),
    [description],
  );
  const calories = useMemo(
    () => estimateCalories(finalType, duration, weightKg),
    [duration, finalType, weightKg],
  );

  const handleUseExample = useCallback(
    (example: string) => {
      Haptics.selectionAsync();
      setDescription(example);
      setOverrideType(null);
    },
    [],
  );

  const canLog = description.trim().length >= 3;

  const handleLog = useCallback(() => {
    if (!canLog) return;
    const today = new Date().toISOString().slice(0, 10);
    actions.logExercise({
      date: today,
      type: finalType,
      durationMinutes: duration,
      caloriesBurned: calories,
      notes: description.trim(),
    });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    router.back();
  }, [actions, calories, canLog, description, duration, finalType, router]);

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <Header
        title="Describe an exercise"
        subtitle="Tap the mic to dictate, or type it in"
      />

      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingBottom: insets.bottom + 160 },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.heroCard}>
          <View style={styles.heroHeader}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Tap to dictate"
              testID="voice-mic"
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
                setDescription((prev) =>
                  prev.length === 0
                    ? 'Ran 5.2 km in 32 min, felt good.'
                    : prev,
                );
              }}
              hitSlop={8}
              style={({ pressed }) => [styles.mic, pressed && styles.pressed]}
            >
              <Feather name="mic" size={28} color="#FFFFFF" />
            </Pressable>
            <View style={styles.heroText}>
              <Text style={styles.heroTitle}>Listen + log</Text>
              <Text style={styles.heroBody}>
                Tap the mic to capture a sample, or type freely. We&apos;ll
                classify the activity for you and pre-fill the calorie
                estimate.
              </Text>
            </View>
          </View>
        </View>

        <TextField
          label="Workout description"
          placeholder="e.g. 30 min spin class, pushed hard"
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={4}
          autoCapitalize="sentences"
          testID="voice-input"
        />

        <View style={styles.examples}>
          <Text style={styles.examplesTitle}>Try an example</Text>
          <View style={styles.examplesWrap}>
            {EXAMPLE_DESCRIPTIONS.map((example) => (
              <Pressable
                key={example}
                accessibilityRole="button"
                accessibilityLabel={`Use example: ${example}`}
                testID={`voice-example-${example.length}`}
                onPress={() => handleUseExample(example)}
                style={({ pressed }) => [
                  styles.exampleChip,
                  pressed && styles.pressed,
                ]}
              >
                <Text style={styles.exampleChipText}>{example}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        <View style={styles.detectionCard}>
          <View style={styles.detectionHeader}>
            <View
              style={[
                styles.detectionBadge,
                { backgroundColor: `${detection.accent}1A` },
              ]}
            >
              <Feather name="zap" size={16} color={detection.accent} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.detectionLabel}>Detected activity</Text>
              <Text style={styles.detectionValue}>{detection.label}</Text>
            </View>
          </View>
          <Text style={styles.detectionReason}>{detection.reason}</Text>

          <View style={styles.divider} />

          <View style={styles.statsRow}>
            <Stat label="Duration" value={`${duration} min`} />
            <Stat label="Calories" value={`${calories} kcal`} />
          </View>

          <View style={styles.typeRow}>
            <Text style={styles.typeRowLabel}>Override type</Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Activity type ${finalType}`}
              testID={`voice-type-${finalType}`}
              onPress={() =>
                setOverrideType(cycleType(finalType))
              }
              style={({ pressed }) => [
                styles.typeChip,
                pressed && styles.pressed,
              ]}
            >
              <Feather
                name="refresh-cw"
                size={13}
                color={detection.accent}
              />
              <Text style={styles.typeChipText}>
                {labelForType(finalType)}
              </Text>
              <Feather name="chevron-right" size={13} color={colors.textMuted} />
            </Pressable>
          </View>
        </View>
      </ScrollView>

      <View
        style={[
          styles.footer,
          { paddingBottom: insets.bottom + spacing.md },
        ]}
      >
        <Button
          title="Log exercise"
          variant="primary"
          leadingIcon="check"
          disabled={!canLog}
          onPress={handleLog}
          testID="voice-log"
        />
      </View>
    </View>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
    </View>
  );
}

function labelForType(type: ExerciseType): string {
  return type === 'other'
    ? 'Other'
    : `${type.charAt(0).toUpperCase()}${type.slice(1)}`;
}

const TYPE_ORDER: ExerciseType[] = [
  'running',
  'walking',
  'cycling',
  'strength',
  'yoga',
  'swimming',
  'hiit',
  'other',
];

function cycleType(current: ExerciseType): ExerciseType {
  const idx = TYPE_ORDER.indexOf(current);
  return TYPE_ORDER[(idx + 1) % TYPE_ORDER.length];
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
    marginBottom: spacing.md,
  },
  heroHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  mic: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.accentRed,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.accentRed,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 6,
  },
  heroText: {
    flex: 1,
  },
  heroTitle: {
    fontFamily: 'Inter_700Bold',
    fontSize: 18,
    color: '#FFFFFF',
  },
  heroBody: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    color: 'rgba(255,255,255,0.65)',
    marginTop: 4,
    lineHeight: 18,
  },
  examples: {
    marginTop: spacing.sm,
  },
  examplesTitle: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 13,
    color: colors.textMuted,
    marginBottom: spacing.xs,
  },
  examplesWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  exampleChip: {
    backgroundColor: colors.card,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  exampleChipText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 12,
    color: colors.textPrimary,
  },
  detectionCard: {
    backgroundColor: colors.card,
    borderRadius: radii.xl,
    padding: spacing.lg,
    marginTop: spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 2,
  },
  detectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  detectionBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detectionLabel: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 11,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  detectionValue: {
    fontFamily: 'Inter_700Bold',
    fontSize: 18,
    color: colors.textPrimary,
    marginTop: 2,
  },
  detectionReason: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    color: colors.textMuted,
    marginTop: spacing.sm,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.md,
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  stat: {
    flex: 1,
    backgroundColor: colors.background,
    borderRadius: radii.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
  },
  statLabel: {
    fontFamily: 'Inter_500Medium',
    fontSize: 11,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  statValue: {
    fontFamily: 'Inter_700Bold',
    fontSize: 18,
    color: colors.textPrimary,
    marginTop: 2,
  },
  typeRow: {
    marginTop: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  typeRowLabel: {
    fontFamily: 'Inter_500Medium',
    fontSize: 13,
    color: colors.textMuted,
  },
  typeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: radii.pill,
  },
  typeChipText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 12,
    color: colors.textPrimary,
  },
  footer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    backgroundColor: colors.card,
    borderTopLeftRadius: radii.xl,
    borderTopRightRadius: radii.xl,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 8,
  },
  pressed: { opacity: 0.7 },
});
