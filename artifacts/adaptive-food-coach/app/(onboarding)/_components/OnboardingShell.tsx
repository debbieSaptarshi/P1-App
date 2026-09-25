import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ChevronLeftIcon } from '@/components/icons/OnboardingIcons';
import { colors } from '@/constants/tokens';

export function OnboardingShell({
  progress,
  title,
  subtitle = 'This will be used to calibrate your custom plan',
  continueTitle = 'Continue',
  continueDisabled = false,
  onContinue,
  showBack = true,
  showProgress = true,
  bodyCentered = false,
  flush = false,
  children,
}: {
  progress: number;
  title?: string;
  subtitle?: string | null;
  continueTitle?: string;
  continueDisabled?: boolean;
  onContinue?: () => void;
  showBack?: boolean;
  showProgress?: boolean;
  bodyCentered?: boolean;
  flush?: boolean;
  children?: React.ReactNode;
}) {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  return (
    <View style={[styles.flex, { paddingTop: insets.top }]}>
      <StatusBar style="dark" />
      <View style={styles.header}>
        {showBack ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Back"
            onPress={() => (router.canGoBack() ? router.back() : router.replace('/(onboarding)/welcome'))}
            style={({ pressed }) => [styles.back, pressed && styles.pressed]}
          >
            <ChevronLeftIcon size={20} />
          </Pressable>
        ) : (
          <View style={styles.backSpacer} />
        )}
        {showProgress ? (
          <View style={styles.track}>
            <View style={[styles.fill, { width: `${Math.max(4, Math.min(100, progress * 100))}%` }]} />
          </View>
        ) : (
          <View style={styles.headerSpacer} />
        )}
      </View>
      {title ? (
        <View style={styles.copy}>
          <Text style={styles.title}>{title}</Text>
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        </View>
      ) : null}
      <View
        style={[
          styles.body,
          flush && styles.bodyFlush,
          bodyCentered && styles.bodyCentered,
        ]}
      >
        {children}
      </View>
      {onContinue != null && (
        <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 12) }]}>
          <Pressable
            accessibilityRole="button"
            disabled={continueDisabled}
            onPress={onContinue}
            style={({ pressed }) => [
              styles.cta,
              continueDisabled && styles.ctaDisabled,
              pressed && !continueDisabled && styles.pressed,
            ]}
          >
            <Text style={styles.ctaLabel}>{continueTitle}</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  back: {
    width: 40,
    height: 40,
    borderRadius: 999,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  backSpacer: { width: 40, height: 40 },
  headerSpacer: { flex: 1 },
  track: {
    flex: 1,
    height: 4,
    backgroundColor: colors.card,
    overflow: 'hidden',
  },
  fill: {
    height: 4,
    backgroundColor: colors.progressBlue,
  },
  copy: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 8,
  },
  title: {
    fontFamily: 'Inter_500Medium',
    fontSize: 32,
    lineHeight: 38,
    letterSpacing: -0.2,
    color: colors.textPrimary,
  },
  subtitle: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    lineHeight: 16,
    color: colors.textMuted,
    maxWidth: 331,
  },
  body: { flex: 1, paddingHorizontal: 20, paddingTop: 12 },
  bodyFlush: { paddingHorizontal: 0 },
  bodyCentered: { justifyContent: 'flex-start' },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 12,
    gap: 8,
    backgroundColor: colors.background,
  },
  cta: {
    minHeight: 46,
    borderRadius: 999,
    backgroundColor: colors.darkSurface,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  ctaDisabled: { opacity: 0.45 },
  ctaLabel: {
    fontFamily: 'Inter_500Medium',
    fontSize: 16,
    lineHeight: 22,
    letterSpacing: -0.18,
    color: colors.textInverse,
  },
  pressed: { opacity: 0.85 },
});
