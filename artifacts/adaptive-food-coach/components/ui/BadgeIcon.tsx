import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors, radii, spacing } from '@/constants/tokens';

export type BadgeTier = 'bronze' | 'silver' | 'gold' | 'platinum';

export interface BadgeIconProps {
  tier: BadgeTier;
  iconKey?: keyof typeof Feather.glyphMap;
  title?: string;
  progress?: number; // 0..1
  unlocked: boolean;
  size?: 'sm' | 'md' | 'lg';
  onPress?: () => void;
}

const tierColors: Record<BadgeTier, { bg: string; fg: string; ring: string }> = {
  bronze: {
    bg: '#FBE6CF',
    fg: '#C2410C',
    ring: '#F59E0B',
  },
  silver: {
    bg: '#E2E8F0',
    fg: '#475569',
    ring: '#94A3B8',
  },
  gold: {
    bg: '#FEF3C7',
    fg: '#B45309',
    ring: '#EAB308',
  },
  platinum: {
    bg: '#EDE9FE',
    fg: '#5B21B6',
    ring: '#7C3AED',
  },
};

export function BadgeIcon({
  tier,
  iconKey = 'award',
  title,
  progress = 1,
  unlocked,
  size = 'md',
  onPress,
}: BadgeIconProps) {
  const palette = tierColors[tier];
  const dimensions =
    size === 'sm' ? 56 : size === 'lg' ? 96 : 72;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title ?? 'Badge'}
      testID={`badge-${tier}`}
      onPress={onPress}
      style={({ pressed }) => [
        styles.container,
        { opacity: unlocked ? 1 : 0.55 },
        pressed && styles.pressed,
      ]}
    >
      <View
        style={[
          styles.badge,
          {
            width: dimensions,
            height: dimensions,
            borderRadius: dimensions / 2,
            backgroundColor: palette.bg,
            borderColor: palette.ring,
            opacity: progress,
          },
        ]}
      >
        <Feather name={iconKey} size={dimensions * 0.4} color={palette.fg} />
      </View>
      {title != null && (
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  badge: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
  },
  pressed: { opacity: 0.8, transform: [{ scale: 0.97 }] },
  title: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 12,
    color: colors.textPrimary,
    textAlign: 'center',
    maxWidth: 96,
  },
});
