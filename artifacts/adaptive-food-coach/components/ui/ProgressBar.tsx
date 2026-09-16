import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { colors, radii } from '@/constants/tokens';

export interface ProgressBarProps {
  /** Progress value between 0 and 1. */
  progress: number;
  backgroundColor?: string;
  color?: string;
  height?: number;
}

export function ProgressBar({
  progress,
  backgroundColor = colors.input,
  color = colors.primary,
  height = 8,
}: ProgressBarProps) {
  const target = Math.max(0, Math.min(1, progress));
  const value = useSharedValue(target);

  useEffect(() => {
    value.value = withTiming(target, { duration: 360 });
  }, [target, value]);

  const fillStyle = useAnimatedStyle(() => ({
    width: `${value.value * 100}%`,
  }));

  return (
    <View
      testID="progress-bar"
      style={[
        styles.track,
        { backgroundColor, height, borderRadius: height / 2 },
      ]}
    >
      <Animated.View
        testID="progress-bar-fill"
        style={[
          styles.fill,
          fillStyle,
          { backgroundColor: color, borderRadius: height / 2 },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    width: '100%',
    overflow: 'hidden',
    borderRadius: radii.xs,
  },
  fill: { height: '100%' },
});
