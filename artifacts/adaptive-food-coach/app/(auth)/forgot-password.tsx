import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  ToastAndroid,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { Alert } from 'react-native';
import { Button, Header, TextField } from '@/components/ui';
import { colors, radii, spacing } from '@/constants/tokens';

import { authClient } from '@/services/supabase';
import { errorMessage } from '@/services/api';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [sentHint, setSentHint] = useState(false);

  const emailValid = EMAIL_RE.test(email.trim());

  const showFeedback = (message: string) => {
    if (Platform.OS === 'android') {
      ToastAndroid.show(message, ToastAndroid.SHORT);
    } else {
      Alert.alert('Sent', message);
    }
  };

  const handleSubmit = async () => {
    if (!emailValid || submitting) return;
    setSubmitting(true);
    try {
      const { error } = await authClient().auth.resetPasswordForEmail(email.trim());
      if (error) throw error;
      setSentHint(true);
      showFeedback('If an account exists, a recovery code will arrive shortly.');
      router.push({ pathname: '/(auth)/verify-otp', params: { email: email.trim(), type: 'recovery' } });
    } catch (error) { Alert.alert('Unable to send code', errorMessage(error));
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
        <Header subtitle="Reset password" />

        <View style={styles.hero}>
          <Text style={styles.kicker}>FORGOT PASSWORD</Text>
          <Text style={styles.title}>Reset your password</Text>
          <Text style={styles.subtitle}>
            Enter the email address linked to your Adaptive Coach account and we&apos;ll send a
            one-time password to verify it&apos;s really you.
          </Text>
        </View>

        <View style={styles.form}>
          <TextField
            label="Email"
            value={email}
            onChangeText={setEmail}
            placeholder="[email protected]"
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            textContentType="emailAddress"
            leadingIcon={<Feather name="mail" size={18} color={colors.textMuted} />}
          />

          <View style={styles.helpBox}>
            <Feather name="info" size={16} color={colors.primary} />
            <Text style={styles.helpText}>
              The OTP is valid for 10 minutes. Check your spam folder if you don&apos;t see it.
              {sentHint ? ' Code sent — check your inbox.' : ''}
            </Text>
          </View>

          <Button
            title={submitting ? 'Sending OTP…' : 'Send OTP'}
            onPress={handleSubmit}
            disabled={!emailValid}
            loading={submitting}
          />
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
    fontSize: 28,
    lineHeight: 34,
    color: colors.textPrimary,
    letterSpacing: -0.5,
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    lineHeight: 21,
    color: colors.textMuted,
  },
  form: { gap: spacing.sm },
  helpBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.xs,
    padding: spacing.md,
    backgroundColor: colors.primarySoft,
    borderRadius: radii.md,
    marginTop: spacing.xs,
  },
  helpText: {
    flex: 1,
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    lineHeight: 18,
    color: colors.textPrimary,
  },
});
