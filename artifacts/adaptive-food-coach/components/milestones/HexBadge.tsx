import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';

import { milestoneBadgeArt } from '@/components/milestones/badgeArt';
import { colors } from '@/constants/tokens';
import type { MilestoneBadge } from '@/types';

const SIZE = 80;

export function HexBadge({
  badge,
  onPress,
  showCaption = true,
  size = SIZE,
}: {
  badge: MilestoneBadge;
  onPress?: () => void;
  showCaption?: boolean;
  size?: number;
}) {
  const source = milestoneBadgeArt(badge.id, badge.unlocked);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${badge.title} badge${badge.unlocked ? '' : ', locked'}`}
      testID={`hex-badge-${badge.id}`}
      disabled={!onPress}
      onPress={onPress}
      style={({ pressed }) => [
        styles.press,
        { width: showCaption ? size : size },
        pressed && onPress && styles.pressed,
      ]}
    >
      <View style={[styles.stage, { width: size, height: size }]}>
        <Image source={source} style={{ width: size, height: size }} contentFit="contain" />
      </View>
      {showCaption ? (
        <View style={[styles.caption, { width: size + 8 }]}>
          <Text style={styles.title} numberOfLines={1}>
            {badge.title}
          </Text>
          <Text style={styles.description} numberOfLines={1}>
            {badge.description}
          </Text>
        </View>
      ) : null}
    </Pressable>
  );
}

export const HEX_BADGE_SIZE = SIZE;

const styles = StyleSheet.create({
  press: {
    alignItems: 'center',
  },
  pressed: { opacity: 0.88 },
  stage: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  caption: {
    marginTop: 2,
    alignItems: 'center',
    gap: 2,
  },
  title: {
    fontFamily: 'Inter_500Medium',
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: -0.12,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  description: {
    fontFamily: 'Inter_400Regular',
    fontSize: 10,
    lineHeight: 12,
    color: colors.textMuted,
    textAlign: 'center',
  },
});
