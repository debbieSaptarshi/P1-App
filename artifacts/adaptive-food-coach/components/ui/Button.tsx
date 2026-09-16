import React from 'react';
import {
  Pressable,
  PressableProps,
  StyleSheet,
  Text,
  View,
  ActivityIndicator,
  StyleProp,
  ViewStyle,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors, radii, spacing } from '@/constants/tokens';

export type ButtonVariant = 'dark' | 'primary' | 'outline' | 'ghost' | 'inverse';
export type ButtonSize = 'md' | 'lg' | 'sm';

export interface ButtonProps extends Omit<PressableProps, 'children'> {
  title: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  leadingIcon?: keyof typeof Feather.glyphMap;
  trailingIcon?: keyof typeof Feather.glyphMap;
  loading?: boolean;
  fullWidth?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function Button({
  title,
  variant = 'primary',
  size = 'lg',
  leadingIcon,
  trailingIcon,
  loading,
  disabled,
  fullWidth = true,
  style,
  ...rest
}: ButtonProps) {
  const palette = palettes[variant];
  const dimensions = dimensions_map[size];
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !!disabled || !!loading }}
      disabled={!!disabled || !!loading}
      style={({ pressed }) => [
        styles.base,
        {
          backgroundColor: palette.background,
          borderColor: palette.border,
          height: dimensions.height,
          paddingHorizontal: dimensions.paddingH,
          opacity: disabled ? 0.5 : pressed ? 0.85 : 1,
          width: fullWidth ? '100%' : undefined,
        },
        style,
      ]}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator color={palette.text} />
      ) : (
        <View style={styles.content}>
          {leadingIcon != null && (
            <Feather
              name={leadingIcon}
              size={18}
              color={palette.text}
              style={styles.leadingIcon}
            />
          )}
          <Text
            style={[
              styles.label,
              { color: palette.text, fontSize: dimensions.fontSize },
            ]}
            numberOfLines={1}
          >
            {title}
          </Text>
          {trailingIcon != null && (
            <Feather
              name={trailingIcon}
              size={18}
              color={palette.text}
              style={styles.trailingIcon}
            />
          )}
        </View>
      )}
    </Pressable>
  );
}

const palettes: Record<
  ButtonVariant,
  { background: string; border: string; text: string }
> = {
  dark: {
    background: colors.darkSurface,
    border: colors.darkSurface,
    text: colors.textInverse,
  },
  primary: {
    background: colors.primary,
    border: colors.primary,
    text: colors.textInverse,
  },
  outline: {
    background: 'transparent',
    border: colors.border,
    text: colors.textPrimary,
  },
  ghost: {
    background: 'transparent',
    border: 'transparent',
    text: colors.primary,
  },
  inverse: {
    background: colors.card,
    border: colors.card,
    text: colors.textPrimary,
  },
};

const dimensions_map: Record<
  ButtonSize,
  { height: number; paddingH: number; fontSize: number }
> = {
  sm: { height: 40, paddingH: spacing.md, fontSize: 13 },
  md: { height: 48, paddingH: spacing.lg, fontSize: 15 },
  lg: { height: 52, paddingH: spacing.lg, fontSize: 16 },
};

const styles = StyleSheet.create({
  base: {
    borderRadius: radii.xl,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  leadingIcon: { marginRight: spacing.xs },
  trailingIcon: { marginLeft: spacing.xs },
  label: {
    fontFamily: 'Inter_600SemiBold',
    letterSpacing: -0.2,
  },
});
