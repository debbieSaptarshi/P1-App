import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  ScrollView,
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
  withDelay,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { Button, Header, ProgressBar } from '@/components/ui';
import { colors, radii, spacing } from '@/constants/tokens';
import { useAppStore } from '@/hooks/useAppStore';

const TOTAL_STEPS = 10;
const STEP_NUM = 10;

export default function CompleteScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { actions, state } = useAppStore();

  const [committing, setCommitting] = useState(false);
  const committed = useRef(false);

  const ring = useSharedValue(0);
  const ringScale = useSharedValue(0.7);
  const check = useSharedValue(0);
  const title = useSharedValue(0);
  const stats = useSharedValue(0);

  useEffect(() => {
    ring.value = withTiming(1, { duration: 600, easing: Easing.out(Easing.cubic) });
    ringScale.value = withSequence(
      withTiming(1.18, { duration: 320, easing: Easing.out(Easing.quad) }),
      withTiming(1, { duration: 240, easing: Easing.inOut(Easing.quad) }),
    );
    check.value = withDelay(360, withTiming(1, { duration: 350 }));
    title.value = withDelay(540, withTiming(1, { duration: 420 }));
    stats.value = withDelay(900, withTiming(1, { duration: 380 }));
  }, [ring, ringScale, check, title, stats]);

  // Persistence: completeOnboarding reads the same on-disk answer map and
  // mirrors the canonical fields onto the user profile. We commit once on
  // mount so the dashboard is hydrated even if the user dismisses this screen.
  useEffect(() => {
    if (committed.current) return;
    committed.current = true;
    void actions.completeOnboarding(state.onboarding.answers);
  }, [actions, state.onboarding.answers]);

  const ringStyle = useAnimatedStyle(() => ({
    opacity: ring.value,
    transform: [{ scale: ringScale.value }],
  }));

  const checkStyle = useAnimatedStyle(() => ({
    opacity: check.value,
    transform: [{ scale: 0.7 + check.value * 0.3 }],
  }));

  const titleStyle = useAnimatedStyle(() => ({
    opacity: title.value,
    transform: [{ translateY: (1 - title.value) * 12 }],
  }));

  const statsStyle = useAnimatedStyle(() => ({
    opacity: stats.value,
    transform: [{ translateY: (1 - stats.value) * 16 }],
  }));

  const handleStart = async () => {
    if (committing) return;
    setCommitting(true);
    try {
      router.replace('/(tabs)');
    } finally {
      setCommitting(false);
    }
  };

  return (
    <ScrollView
      style={[styles.flex, { paddingTop: insets.top }]}
      contentContainerStyle={[
        styles.scroll,
        { paddingBottom: insets.bottom + spacing.xl },
      ]}
      showsVerticalScrollIndicator={false}
    >
      <View style={{ paddingHorizontal: spacing.lg }}>
        <Header subtitle={`Step ${STEP_NUM} of ${TOTAL_STEPS}`} showBack={false} />
        <View style={styles.progressWrap}>
          <ProgressBar progress={1} />
        </View>
      </View>

      <View style={styles.center}>
        <View style={styles.iconStack}>
          <Animated.View style={[styles.iconRing, ringStyle]} />
          <Animated.View style={[styles.iconBadge, checkStyle]}>
            <Feather name="check" size={42} color={colors.textInverse} />
          </Animated.View>
        </View>

        <Animated.View style={[styles.textBlock, titleStyle]}>
          <Text style={styles.kicker}>YOU&apos;RE ALL SET</Text>
          <Text style={styles.title}>Your adaptive plan is ready</Text>
          <Text style={styles.subtitle}>
            We&apos;ve crafted a daily cadence of meals, movement and habit prompts based on your
            answers. Open the dashboard to start your first day.
          </Text>
        </Animated.View>

        <Animated.View style={[styles.statsRow, statsStyle]}>
          <StatBadge value="3" label="Daily meals" icon="book-open" />
          <StatBadge value="5+" label="Weekly tips" icon="bell" />
          <StatBadge value="1" label="First check-in" icon="calendar" />
        </Animated.View>
      </View>

      <View style={[styles.footer, { paddingHorizontal: spacing.lg }]}>
        <Button
          title={committing ? 'Opening dashboard…' : 'Start Coaching'}
          onPress={handleStart}
          loading={committing}
          trailingIcon="arrow-right"
        />
      </View>
    </ScrollView>
  );
}

function StatBadge({
  value,
  label,
  icon,
}: {
  value: string;
  label: string;
  icon: keyof typeof Feather.glyphMap;
}) {
  return (
    <View style={styles.statCard}>
      <View style={styles.statBadge}>
        <Feather name={icon} size={16} color={colors.primary} />
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  scroll: {
    flexGrow: 1,
  },
  progressWrap: {
    paddingVertical: spacing.sm,
  },
  center: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: spacing.xxl,
    gap: spacing.xl,
  },
  iconStack: {
    width: 132,
    height: 132,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconRing: {
    position: 'absolute',
    width: 132,
    height: 132,
    borderRadius: 66,
    borderWidth: 2,
    borderColor: colors.primary,
  },
  iconBadge: {
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
  textBlock: {
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.lg,
  },
  kicker: {
    fontFamily: 'Inter_500Medium',
    fontSize: 11,
    color: colors.accentGreen,
    letterSpacing: 1.4,
  },
  title: {
    fontFamily: 'Inter_700Bold',
    fontSize: 26,
    lineHeight: 32,
    color: colors.textPrimary,
    textAlign: 'center',
    letterSpacing: -0.4,
  },
  subtitle: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    lineHeight: 21,
    color: colors.textMuted,
    textAlign: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    alignSelf: 'stretch',
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: radii.lg,
    padding: spacing.md,
    alignItems: 'center',
    gap: spacing.xs,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 2,
  },
  statBadge: {
    width: 36,
    height: 36,
    borderRadius: radii.lg,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statValue: {
    fontFamily: 'Inter_700Bold',
    fontSize: 22,
    color: colors.textPrimary,
  },
  statLabel: {
    fontFamily: 'Inter_500Medium',
    fontSize: 12,
    color: colors.textMuted,
    textAlign: 'center',
  },
  footer: {
    gap: spacing.sm,
    paddingTop: spacing.xl,
  },
});
