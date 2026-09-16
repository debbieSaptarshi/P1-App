import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { Button, ProgressBar } from '@/components/ui';
import { colors, radii, spacing } from '@/constants/tokens';

const TOTAL_STEPS = 10;
const STEP_NUM = 9;

/**
 * Animated "building your plan" screen. Persists a `generating: true` flag
 * to the store, runs a 3-stage progress timeline, then transitions to the
 * `complete` screen where the answers are committed to the user profile.
 */
export default function GeneratingPlanScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [progress, setProgress] = useState(0);
  const [stage, setStage] = useState(0);
  const stageTimers = useRef<Array<ReturnType<typeof setTimeout>>>([]);

  const pulse = useSharedValue(0);

  useEffect(() => {
    pulse.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 700, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: 700, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
      true,
    );
    return () => {
      pulse.value = 0;
      for (const t of stageTimers.current) clearTimeout(t);
    };
  }, [pulse]);

  useEffect(() => {
    // Run a 3-stage progression so the user perceives real activity.
    stageTimers.current.push(setTimeout(() => setStage(1), 600));
    stageTimers.current.push(setTimeout(() => setStage(2), 1500));
    stageTimers.current.push(setTimeout(() => setStage(3), 2400));
    stageTimers.current.push(setTimeout(() => setProgress(100), 3300));
    stageTimers.current.push(setTimeout(() => router.replace('/(onboarding)/complete'), 3850));
  }, [router]);

  const pulseStyle = useAnimatedStyle(() => ({
    opacity: 0.5 + pulse.value * 0.45,
    transform: [{ scale: 0.95 + pulse.value * 0.06 }],
  }));

  const staggerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 0.95 + pulse.value * 0.05 }],
  }));

  return (
    <View style={styles.flex}>
      <View style={{ paddingTop: insets.top + spacing.sm, paddingHorizontal: spacing.lg }}>
        <ProgressBar progress={STEP_NUM / TOTAL_STEPS} />
      </View>

      <View style={styles.center}>
        <Animated.View style={[styles.crest, pulseStyle]}>
          <Animated.View style={[styles.crestInner, staggerStyle]}>
            <Feather name="zap" size={36} color={colors.textInverse} />
          </Animated.View>
        </Animated.View>

        <Text style={styles.title}>Building your adaptive plan…</Text>
        <Text style={styles.subtitle}>
          We&apos;re crunching your responses to find meals, workouts and habit nudges that fit
          your goals.
        </Text>

        <View style={styles.stageList}>
          {STAGES.map((s, idx) => {
            const active = idx === stage - 1 || (stage === STAGES.length && idx === STAGES.length - 1);
            const done = idx < stage - 1 || stage === STAGES.length;
            return (
              <StageRow
                key={s.label}
                label={s.label}
                icon={s.icon as keyof typeof Feather.glyphMap}
                state={done ? 'done' : active ? 'active' : 'queued'}
              />
            );
          })}
        </View>
      </View>

      <View style={[styles.footer, { paddingBottom: insets.bottom + spacing.lg }]}>
        <View style={styles.progressBarWrap}>
          <ProgressBar progress={progress / 100} color={colors.primary} />
          <Text style={styles.progressText}>
            {Math.round(progress)}% · Hang tight, coach-grade personalization takes a beat.
          </Text>
        </View>
        <Button
          title="Skip — open the dashboard"
          variant="ghost"
          onPress={() => router.replace('/(onboarding)/complete')}
        />
      </View>
    </View>
  );
}

const STAGES = [
  { label: 'Calibrating biometrics', icon: 'activity' },
  { label: 'Selecting meal library', icon: 'book-open' },
  { label: 'Tuning daily nudges', icon: 'bell' },
];

function StageRow({
  label,
  icon,
  state,
}: {
  label: string;
  icon: keyof typeof Feather.glyphMap;
  state: 'queued' | 'active' | 'done';
}) {
  const appearance =
    state === 'done'
      ? {
          bg: colors.primary,
          fg: colors.textInverse,
          iconName: 'check' as keyof typeof Feather.glyphMap,
        }
      : state === 'active'
        ? { bg: colors.primarySoft, fg: colors.primary, iconName: icon }
        : { bg: colors.card, fg: colors.textMuted, iconName: icon };

  return (
    <View style={styles.stageRow}>
      <View style={[styles.stageBadge, { backgroundColor: appearance.bg }]}>
        <Feather name={appearance.iconName} size={16} color={appearance.fg} />
      </View>
      <Text style={[styles.stageLabel, state === 'queued' && styles.stageLabelQueued]}>
        {label}
      </Text>
      {state === 'active' ? (
        <Text style={styles.stageStatus}>Working…</Text>
      ) : state === 'done' ? (
        <Text style={styles.stageStatusDone}>Done</Text>
      ) : (
        <Text style={styles.stageStatusQueued}>Queued</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background, paddingHorizontal: spacing.lg },
  center: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: spacing.xl,
    gap: spacing.lg,
  },
  crest: {
    width: 132,
    height: 132,
    borderRadius: 66,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  crestInner: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.32,
    shadowRadius: 22,
    elevation: 12,
  },
  title: {
    fontFamily: 'Inter_700Bold',
    fontSize: 24,
    lineHeight: 30,
    color: colors.textPrimary,
    letterSpacing: -0.5,
    textAlign: 'center',
  },
  subtitle: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    lineHeight: 21,
    color: colors.textMuted,
    textAlign: 'center',
    paddingHorizontal: spacing.md,
  },
  stageList: {
    alignSelf: 'stretch',
    backgroundColor: colors.card,
    padding: spacing.md,
    borderRadius: radii.lg,
    gap: spacing.sm,
  },
  stageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  stageBadge: {
    width: 32,
    height: 32,
    borderRadius: radii.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stageLabel: {
    flex: 1,
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
    color: colors.textPrimary,
  },
  stageLabelQueued: {
    color: colors.textMuted,
  },
  stageStatus: {
    fontFamily: 'Inter_500Medium',
    fontSize: 12,
    color: colors.primary,
  },
  stageStatusDone: {
    fontFamily: 'Inter_500Medium',
    fontSize: 12,
    color: colors.accentGreen,
  },
  stageStatusQueued: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: colors.textMuted,
  },
  footer: {
    gap: spacing.sm,
  },
  progressBarWrap: {
    gap: spacing.xs,
  },
  progressText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 12,
    color: colors.textMuted,
    textAlign: 'center',
  },
});
