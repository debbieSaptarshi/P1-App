import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import Animated, {
  useAnimatedProps,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { colors } from '@/constants/tokens';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export interface CircularProgressProps {
  /** Progress between 0 and 1 (or supply 0..100 and set raw). */
  progress: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  trackColor?: string;
  /** When true `progress` is interpreted as 0..100. */
  raw?: boolean;
  children?: React.ReactNode;
}

export function CircularProgress({
  progress,
  size = 96,
  strokeWidth = 8,
  color = colors.primary,
  trackColor = colors.input,
  raw = false,
  children,
}: CircularProgressProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const target = Math.max(0, Math.min(raw ? 100 : 1, progress));
  const value = useSharedValue(target);

  useEffect(() => {
    value.value = withTiming(target, { duration: 600 });
  }, [target, value]);

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: circumference * (1 - value.value / (raw ? 100 : 1)),
  }));

  return (
    <View
      style={[
        styles.container,
        { width: size, height: size },
      ]}
      testID="circular-progress"
    >
      <Svg width={size} height={size}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={trackColor}
          strokeWidth={strokeWidth}
          fill="none"
        />
        <AnimatedCircle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={circumference}
          animatedProps={animatedProps}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      <View style={[styles.center, { width: size, height: size }]}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { position: 'relative', alignItems: 'center', justifyContent: 'center' },
  center: { position: 'absolute', alignItems: 'center', justifyContent: 'center' },
});
