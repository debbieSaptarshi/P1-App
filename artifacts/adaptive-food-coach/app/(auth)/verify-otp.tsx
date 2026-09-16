import { useRouter } from 'expo-router';
import React, { useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { Button, Header } from '@/components/ui';
import { colors, radii, spacing } from '@/constants/tokens';

const OTP_LENGTH = 6;

export default function VerifyOtpScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [digits, setDigits] = useState<string[]>(() =>
    Array.from({ length: OTP_LENGTH }, () => ''),
  );
  const [submitting, setSubmitting] = useState(false);
  const inputs = useRef<Array<TextInput | null>>([]);

  const complete = digits.every((d) => d.length === 1);

  const setDigit = (idx: number, value: string) => {
    const next = [...digits];
    next[idx] = value.replace(/\D/g, '').slice(0, 1);
    setDigits(next);
    if (value && idx < OTP_LENGTH - 1) {
      inputs.current[idx + 1]?.focus();
    }
  };

  const handleKey = (idx: number, key: string) => {
    if (key === 'Backspace' && !digits[idx] && idx > 0) {
      inputs.current[idx - 1]?.focus();
    }
  };

  const handleVerify = async () => {
    if (!complete || submitting) return;
    setSubmitting(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 350));
      router.replace('/(auth)/reset-success');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingTop: insets.top + spacing.md, paddingBottom: insets.bottom + spacing.xxl },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Header subtitle="Verify code" />

        <View style={styles.hero}>
          <Text style={styles.kicker}>VERIFICATION</Text>
          <Text style={styles.title}>Enter the 6-digit code</Text>
          <Text style={styles.subtitle}>
            We just sent a one-time password to your email. Enter it below to continue resetting
            your password.
          </Text>
        </View>

        <View style={styles.otpRow}>
          {digits.map((digit, idx) => (
            <TextInput
              key={`otp-${idx}`}
              ref={(node) => {
                inputs.current[idx] = node;
              }}
              value={digit}
              onChangeText={(value) => setDigit(idx, value)}
              onKeyPress={(e) => handleKey(idx, e.nativeEvent.key)}
              keyboardType="number-pad"
              maxLength={1}
              style={[styles.otpInput, digit && styles.otpInputFilled]}
              accessibilityLabel={`Digit ${idx + 1}`}
              testID={`otp-input-${idx}`}
              selectionColor={colors.primary}
              autoFocus={idx === 0}
            />
          ))}
        </View>

        <View style={styles.actionsRow}>
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="Resend code"
            onPress={() => setDigits(Array.from({ length: OTP_LENGTH }, () => ''))}
          >
            <Text style={styles.resend}>Didn&apos;t get a code? Resend</Text>
          </TouchableOpacity>
        </View>

        <Button
          title={submitting ? 'Verifying…' : 'Verify'}
          onPress={handleVerify}
          disabled={!complete}
          loading={submitting}
        />

        <View style={styles.support}>
          <Feather name="shield" size={14} color={colors.textMuted} />
          <Text style={styles.supportText}>
            Encrypted in transit — Adaptive Coach never stores plain OTP codes.
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: spacing.lg,
  },
  hero: { marginTop: spacing.lg, marginBottom: spacing.xl },
  kicker: {
    fontFamily: 'Inter_500Medium',
    fontSize: 11,
    color: colors.primary,
    letterSpacing: 1.2,
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
  },
  otpRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.xs,
    marginVertical: spacing.lg,
  },
  otpInput: {
    flex: 1,
    height: 56,
    borderRadius: radii.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.card,
    fontFamily: 'Inter_700Bold',
    fontSize: 22,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  otpInputFilled: {
    borderColor: colors.primary,
  },
  actionsRow: {
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  resend: {
    fontFamily: 'Inter_500Medium',
    fontSize: 13,
    color: colors.primary,
  },
  support: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    marginTop: spacing.md,
  },
  supportText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: colors.textMuted,
  },
});
