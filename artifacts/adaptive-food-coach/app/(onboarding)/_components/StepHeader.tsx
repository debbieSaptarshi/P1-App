import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button, Header, ProgressBar } from '@/components/ui';
import { colors, spacing } from '@/constants/tokens';

/**
 * Reusable shell wrapping every quiz step with a Figma-style header,
 * progress indicator, content slot, and a primary CTA footer.
 *
 * Lives under a private `_components` folder so expo-router does not pick
 * it up as a route.
 */
export interface StepHeaderProps {
  stepNum: number;
  totalSteps: number;
  title: string;
  subtitle?: string;
  kicker?: string;
  continueTitle?: string;
  continueDisabled?: boolean;
  onContinue?: () => void;
  continueTrailingIcon?: 'arrow-right' | 'check';
  children?: React.ReactNode;
}

export function StepHeader({
  stepNum,
  totalSteps,
  title,
  subtitle,
  kicker,
  continueTitle = 'Continue',
  continueDisabled = false,
  onContinue,
  continueTrailingIcon = 'arrow-right',
  children,
}: StepHeaderProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.flex}>
      <View style={{ paddingTop: insets.top }}>
        <Header subtitle={`Step ${stepNum} of ${totalSteps}`} />
      </View>
      <View style={styles.progressWrap}>
        <ProgressBar progress={stepNum / totalSteps} />
      </View>

      <View style={styles.body}>
        {kicker != null && <Text style={styles.kicker}>{kicker}</Text>}
        <Text style={styles.title}>{title}</Text>
        {subtitle != null && <Text style={styles.subtitle}>{subtitle}</Text>}
        {children}
      </View>

      {onContinue != null && (
        <View style={[styles.footer, { paddingBottom: insets.bottom + spacing.md }]}>
          <Button
            title={continueTitle}
            onPress={onContinue}
            disabled={continueDisabled}
            trailingIcon={continueTrailingIcon}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  progressWrap: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
  },
  body: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
  },
  kicker: {
    fontFamily: 'Inter_500Medium',
    fontSize: 11,
    color: colors.primary,
    letterSpacing: 1.4,
    marginBottom: spacing.xs,
  },
  title: {
    fontFamily: 'Inter_700Bold',
    fontSize: 26,
    lineHeight: 32,
    color: colors.textPrimary,
    letterSpacing: -0.4,
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    lineHeight: 21,
    color: colors.textMuted,
    marginBottom: spacing.xl,
  },
  footer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
  },
});
