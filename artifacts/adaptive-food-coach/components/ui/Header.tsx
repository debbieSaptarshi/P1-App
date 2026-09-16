import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { colors, spacing } from '@/constants/tokens';

export interface HeaderProps {
  title?: string;
  subtitle?: string;
  onBack?: () => void;
  rightIcon?: keyof typeof Feather.glyphMap;
  onRightPress?: () => void;
  /** Optional content rendered to the right of the title (e.g. step counter). */
  accessory?: React.ReactNode;
  /** Use a transparent background (e.g. over a dark hero card). */
  transparent?: boolean;
  /** When false, hides the back arrow. Defaults to true. */
  showBack?: boolean;
}

export function Header({
  title,
  subtitle,
  onBack,
  rightIcon,
  onRightPress,
  accessory,
  transparent = false,
  showBack = true,
}: HeaderProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const handleBack = () => {
    if (onBack) onBack();
    else router.back();
  };

  const textColor = transparent ? colors.textInverse : colors.textPrimary;
  const iconColor = transparent ? colors.textInverse : colors.textPrimary;

  return (
    <View
      style={[
        styles.container,
        { paddingTop: insets.top + spacing.xs, backgroundColor: transparent ? 'transparent' : colors.background },
      ]}
    >
      <View style={styles.row}>
        {showBack ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Back"
            testID="header-back"
            onPress={handleBack}
            hitSlop={12}
            style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}
          >
            <Feather name="arrow-left" size={22} color={iconColor} />
          </Pressable>
        ) : (
          <View style={styles.iconButton} />
        )}

        <View style={styles.titleColumn}>
          {title != null && (
            <Text style={[styles.title, { color: textColor }]} numberOfLines={1}>
              {title}
            </Text>
          )}
          {subtitle != null && (
            <Text style={[styles.subtitle, { color: transparent ? 'rgba(255,255,255,0.7)' : colors.textMuted }]} numberOfLines={1}>
              {subtitle}
            </Text>
          )}
        </View>

        {accessory ? (
          accessory
        ) : rightIcon != null ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={rightIcon}
            testID={`header-${rightIcon}`}
            onPress={onRightPress}
            hitSlop={12}
            style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}
          >
            <Feather name={rightIcon} size={20} color={iconColor} />
          </Pressable>
        ) : (
          <View style={styles.iconButton} />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  iconButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
  },
  pressed: { opacity: 0.6 },
  titleColumn: {
    flex: 1,
    paddingHorizontal: spacing.xs,
  },
  title: {
    fontFamily: 'Inter_700Bold',
    fontSize: 17,
    letterSpacing: -0.2,
  },
  subtitle: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    marginTop: 2,
  },
});
