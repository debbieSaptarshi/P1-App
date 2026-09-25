import React from 'react';
import { StyleSheet, Text, View, TextInput, TextInputProps } from 'react-native';
import { colors, radii, spacing } from '@/constants/tokens';

export interface TextFieldProps extends TextInputProps {
  label?: string;
  helper?: string;
  error?: string;
  trailingIcon?: React.ReactNode;
  leadingIcon?: React.ReactNode;
  variant?: 'default' | 'pill';
}

export function TextField({
  label,
  helper,
  error,
  trailingIcon,
  leadingIcon,
  variant = 'default',
  style,
  ...rest
}: TextFieldProps) {
  const pill = variant === 'pill';
  return (
    <View style={styles.field}>
      {label != null && !pill && <Text style={styles.label}>{label}</Text>}
      <View
        style={[
          styles.inputWrap,
          pill && styles.inputWrapPill,
          { borderColor: error ? colors.accentRed : pill ? 'transparent' : colors.input },
        ]}
      >
        {leadingIcon != null && <View style={styles.leadingIcon}>{leadingIcon}</View>}
        <TextInput
          style={[styles.input, pill && styles.inputPill, style]}
          placeholderTextColor={pill ? colors.formPlaceholder : colors.textPlaceholder}
          {...rest}
        />
        {trailingIcon != null && <View style={styles.trailingIcon}>{trailingIcon}</View>}
      </View>
      {error != null ? (
        <Text style={styles.error}>{error}</Text>
      ) : helper != null ? (
        <Text style={styles.helper}>{helper}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  field: { marginBottom: spacing.md },
  label: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 13,
    color: colors.textMuted,
    marginBottom: spacing.xs,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 52,
    borderRadius: radii.md,
    borderWidth: 1.5,
    backgroundColor: colors.card,
    paddingHorizontal: spacing.md,
  },
  inputWrapPill: {
    height: 60,
    borderRadius: radii.xl,
    backgroundColor: colors.formFill,
    borderWidth: 0,
    paddingHorizontal: 20,
  },
  leadingIcon: { marginRight: spacing.xs },
  trailingIcon: { marginLeft: spacing.xs },
  input: {
    flex: 1,
    fontFamily: 'Inter_400Regular',
    fontSize: 15,
    color: colors.textPrimary,
    paddingVertical: 0,
  },
  inputPill: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 12,
  },
  helper: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: colors.textMuted,
    marginTop: spacing.xs,
    marginLeft: spacing.xs,
  },
  error: {
    fontFamily: 'Inter_500Medium',
    fontSize: 12,
    color: colors.accentRed,
    marginTop: spacing.xs,
    marginLeft: spacing.xs,
  },
});
