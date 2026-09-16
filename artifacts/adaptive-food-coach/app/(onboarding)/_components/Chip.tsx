import { Feather } from '@expo/vector-icons';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radii, spacing } from '@/constants/tokens';

export interface ChipProps {
  label: string;
  selected: boolean;
  onPress: () => void;
  testID?: string;
  leadingIcon?: keyof typeof Feather.glyphMap;
  trailingBadge?: string;
}

export function Chip({
  label,
  selected,
  onPress,
  testID,
  leadingIcon,
  trailingBadge,
}: ChipProps) {
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ selected }}
      onPress={onPress}
      testID={testID}
      style={({ pressed }) => [
        styles.chip,
        selected && styles.chipSelected,
        pressed && styles.pressed,
      ]}
    >
      {leadingIcon != null && (
        <Feather
          name={leadingIcon}
          size={14}
          color={selected ? colors.textInverse : colors.textPrimary}
          style={styles.leadingIcon}
        />
      )}
      <Text style={[styles.label, selected && styles.labelSelected]}>{label}</Text>
      {trailingBadge != null && (
        <View style={[styles.badge, selected && styles.badgeSelected]}>
          <Text style={[styles.badgeText, selected && styles.badgeTextSelected]}>
            {trailingBadge}
          </Text>
        </View>
      )}
      {selected && (
        <Feather name="check" size={14} color={colors.textInverse} style={styles.checkIcon} />
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    borderRadius: radii.pill,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.card,
    gap: spacing.xs,
  },
  chipSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primary,
  },
  pressed: { opacity: 0.85 },
  leadingIcon: { marginRight: 2 },
  label: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 13,
    color: colors.textPrimary,
    letterSpacing: -0.1,
  },
  labelSelected: { color: colors.textInverse },
  badge: {
    minWidth: 22,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radii.xs,
    backgroundColor: colors.background,
  },
  badgeSelected: {
    backgroundColor: 'rgba(255,255,255,0.22)',
  },
  badgeText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 11,
    color: colors.textMuted,
  },
  badgeTextSelected: { color: colors.textInverse },
  checkIcon: { marginLeft: 2 },
});
