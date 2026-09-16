import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radii, spacing } from '@/constants/tokens';

export interface RulerPickerProps {
  /** Range bounds */
  min: number;
  max: number;
  /** Step between tick marks */
  step?: number;
  value: number;
  unit?: string;
  onChange: (value: number) => void;
  accentColor?: string;
}

export function RulerPicker({
  min,
  max,
  step = 1,
  value,
  unit,
  onChange,
  accentColor = colors.primary,
}: RulerPickerProps) {
  const ticks: number[] = [];
  for (let i = min; i <= max; i += step) ticks.push(i);

  const adjust = (delta: number) => {
    const next = Math.max(min, Math.min(max, value + delta));
    onChange(parseFloat(next.toFixed(2)));
  };

  return (
    <View style={styles.container} testID="ruler-picker">
      <View style={styles.controlRow}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Decrement"
          testID="ruler-decrement"
          onPress={() => adjust(-step)}
          style={({ pressed }) => [styles.adjuster, pressed && styles.pressed]}
        >
          <Text style={styles.adjusterLabel}>−</Text>
        </Pressable>
        <View style={styles.valueBox}>
          <Text style={styles.value}>{value}</Text>
          {unit != null && <Text style={styles.unit}>{unit}</Text>}
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Increment"
          testID="ruler-increment"
          onPress={() => adjust(step)}
          style={({ pressed }) => [styles.adjuster, pressed && styles.pressed]}
        >
          <Text style={styles.adjusterLabel}>+</Text>
        </Pressable>
      </View>

      <View style={styles.tickRow}>
        {ticks.map((tick) => {
          const isActive = Math.abs(tick - value) < step / 2;
          return (
            <View
              key={tick}
              style={[
                styles.tick,
                { backgroundColor: isActive ? accentColor : colors.border },
                isActive && styles.tickActive,
              ]}
            />
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: spacing.md,
  },
  controlRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.lg,
  },
  adjuster: {
    width: 48,
    height: 48,
    borderRadius: radii.lg,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  pressed: { opacity: 0.7 },
  adjusterLabel: {
    fontSize: 26,
    fontFamily: 'Inter_600SemiBold',
    color: colors.textPrimary,
  },
  valueBox: {
    minWidth: 140,
    alignItems: 'center',
  },
  value: {
    fontFamily: 'Inter_700Bold',
    fontSize: 44,
    color: colors.textPrimary,
    letterSpacing: -1,
  },
  unit: {
    fontFamily: 'Inter_500Medium',
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 2,
  },
  tickRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    marginTop: spacing.sm,
  },
  tick: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    marginHorizontal: 2,
  },
  tickActive: {
    height: 8,
  },
});
