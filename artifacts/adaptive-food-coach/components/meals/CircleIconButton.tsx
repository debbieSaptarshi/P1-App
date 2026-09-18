import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import { colors } from '@/constants/tokens';

export function CircleIconButton({
  source,
  onPress,
  accessibilityLabel,
  testID,
  filled = true,
  iconSize = 20,
}: {
  source: number;
  onPress?: () => void;
  accessibilityLabel: string;
  testID: string;
  filled?: boolean;
  iconSize?: number;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      testID={testID}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        filled && styles.filled,
        pressed && styles.pressed,
      ]}
    >
      <View style={[styles.iconBox, { width: iconSize, height: iconSize }]}>
        <Image source={source} style={{ width: iconSize, height: iconSize }} contentFit="contain" />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  filled: {
    backgroundColor: colors.card,
  },
  pressed: { opacity: 0.7 },
  iconBox: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
