import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '@/constants/tokens';

export function SelectRow({
  label,
  hint,
  icon,
  selected,
  onPress,
  testID,
  align = 'start',
  iconBadge = false,
}: {
  label: string;
  hint?: string;
  icon?: React.ReactNode;
  selected: boolean;
  onPress: () => void;
  testID?: string;
  align?: 'start' | 'center';
  iconBadge?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      testID={testID}
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        selected ? styles.rowOn : styles.rowOff,
        pressed && styles.pressed,
      ]}
    >
      {icon ? (
        iconBadge ? (
          <View style={[styles.badge, selected ? styles.badgeOn : styles.badgeOff]}>{icon}</View>
        ) : (
          <View style={styles.icon}>{icon}</View>
        )
      ) : null}
      <View style={[styles.copy, align === 'center' && styles.copyCenter]}>
        <Text style={[styles.label, selected && styles.labelOn]}>{label}</Text>
        {hint ? <Text style={[styles.hint, selected && styles.hintOn]}>{hint}</Text> : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    width: '100%',
    paddingHorizontal: 16,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 24,
  },
  rowOn: { backgroundColor: colors.darkSurface },
  rowOff: { backgroundColor: colors.card },
  icon: { width: 18, height: 18, alignItems: 'center', justifyContent: 'center' },
  badge: {
    width: 32,
    height: 32,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  badgeOn: { backgroundColor: colors.card },
  badgeOff: { backgroundColor: colors.background },
  copy: { flex: 1, gap: 0 },
  copyCenter: { alignItems: 'flex-start' },
  label: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    lineHeight: 20,
    letterSpacing: -0.16,
    color: colors.textPrimary,
  },
  labelOn: { color: colors.textInverse },
  hint: {
    fontFamily: 'Inter_400Regular',
    fontSize: 10,
    lineHeight: 12,
    color: colors.textMuted,
  },
  hintOn: { color: colors.textPlaceholder },
  pressed: { opacity: 0.92 },
});
