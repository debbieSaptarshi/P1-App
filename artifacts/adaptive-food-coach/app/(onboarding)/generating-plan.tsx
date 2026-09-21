import { useRouter } from 'expo-router';
import React, { useEffect } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { CheckCircleIcon } from '@/components/icons/OnboardingIcons';
import { colors } from '@/constants/tokens';
import { useAppStore } from '@/hooks/useAppStore';
import { OnboardingShell } from './_components/OnboardingShell';
import { progressFor, ROUTE_TO_INDEX } from './_components/progress';

export default function GeneratingPlanScreen() {
  const router = useRouter();
  const { actions, state } = useAppStore();
  const appear = useSharedValue(0);

  useEffect(() => {
    appear.value = withTiming(1, { duration: 420, easing: Easing.out(Easing.cubic) });
  }, [appear]);

  const heroStyle = useAnimatedStyle(() => ({
    opacity: 0.35 + appear.value * 0.65,
    transform: [{ scale: 0.94 + appear.value * 0.06 }],
  }));

  const handleContinue = async () => {
    await actions.advanceOnboarding(ROUTE_TO_INDEX['complete'], state.onboarding.answers);
    router.push('/(onboarding)/complete');
  };

  return (
    <OnboardingShell
      progress={progressFor('generating-plan')}
      title={undefined}
      subtitle={null}
      onContinue={handleContinue}
      bodyCentered
    >
      <View style={styles.center}>
        <Animated.View style={heroStyle}>
          <LinearGradient
            colors={['#84CAFF', '#9B8AFB']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.ring}
          >
            <View style={styles.inner}>
              <Image
                source={require('@/assets/images/onboarding/fireworks.png')}
                style={styles.art}
                resizeMode="cover"
              />
            </View>
          </LinearGradient>
        </Animated.View>
        <View style={styles.done}>
          <CheckCircleIcon size={18} />
          <Text style={styles.doneText}>All Done</Text>
        </View>
        <Text style={styles.title}>{`Time to generate\nyour custom plan!`}</Text>
      </View>
    </OnboardingShell>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  ring: {
    width: 300,
    height: 300,
    borderRadius: 150,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  inner: {
    width: 268,
    height: 268,
    borderRadius: 134,
    overflow: 'hidden',
    backgroundColor: colors.card,
  },
  art: {
    width: 268,
    height: 268,
  },
  done: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  doneText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 14,
    lineHeight: 20,
    color: '#475569',
  },
  title: {
    fontFamily: 'Inter_500Medium',
    fontSize: 32,
    lineHeight: 38,
    letterSpacing: -0.2,
    color: colors.textPrimary,
    textAlign: 'center',
  },
});
