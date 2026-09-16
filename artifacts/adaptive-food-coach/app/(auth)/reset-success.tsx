import { useRouter } from 'expo-router';
import React, { useEffect, useRef } from 'react';
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
import { Button, Header } from '@/components/ui';
import { colors, radii, spacing } from '@/constants/tokens';

export default function ResetSuccessScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const ring = useSharedValue(0);
  const ringScale = useSharedValue(0.7);
  const check = useSharedValue(0);
  const title = useSharedValue(0);

  useEffect(() => {
    ring.value = withTiming(1, { duration: 600, easing: Easing.out(Easing.cubic) });
    ringScale.value = withSequence(
      withTiming(1.15, { duration: 320, easing: Easing.out(Easing.quad) }),
      withTiming(1, { duration: 240, easing: Easing.inOut(Easing.quad) }),
    );
    check.value = withDelay(360, withTiming(1, { duration: 350 }));
    title.value = withDelay(540, withTiming(1, { duration: 420 }));
  }, [ring, ringScale, check, title]);

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

  return (
    <ScrollView
      style={[styles.flex, { paddingTop: insets.top }]}
      contentContainerStyle={[
        styles.scroll,
        { paddingBottom: insets.bottom + spacing.xl },
      ]}
      showsVerticalScrollIndicator={false}
    >
      <Header onBack={() => router.replace('/(auth)/sign-in')} subtitle="All done" />

      <View style={styles.center}>
        <View style={styles.iconStack}>
          <Animated.View style={[styles.iconRing, ringStyle]} />
          <Animated.View style={[styles.iconBadge, checkStyle]}>
            <Feather name="check" size={42} color={colors.textInverse} />
          </Animated.View>
        </View>

        <Animated.View style={[styles.textBlock, titleStyle]}>
          <Text style={styles.kicker}>SUCCESS</Text>
          <Text style={styles.title}>Password reset complete</Text>
          <Text style={styles.subtitle}>
            Your Adaptive Coach password has been updated. Sign in with your new password to
            continue your coaching journey.
          </Text>
        </Animated.View>
      </View>

      <View style={styles.actions}>
        <Button
          title="Back to Sign In"
          onPress={() => router.replace('/(auth)/sign-in')}
          trailingIcon="arrow-right"
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: spacing.lg,
  },
  center: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
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
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.25,
    shadowRadius: 18,
    elevation: 10,
  },
  textBlock: {
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
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
  actions: {
    marginTop: 'auto',
    paddingTop: spacing.xl,
    borderRadius: radii.lg,
  },
});
