import { Link, useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { Button, Header, TextField } from '@/components/ui';
import { colors, radii, spacing } from '@/constants/tokens';

import { authClient } from '@/services/supabase';
import { errorMessage } from '@/services/api';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function RegisterScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [error, setError] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [accept, setAccept] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [touched, setTouched] = useState(false);

  const emailValid = EMAIL_RE.test(email.trim());
  const passwordValid = password.length >= 8;
  const confirmValid = password === confirm;
  const nameValid = name.trim().length >= 2;

  const canSubmit =
    emailValid && passwordValid && confirmValid && nameValid && accept && !submitting;

  const emailError = touched && !emailValid ? 'Enter a valid email' : undefined;
  const passwordError =
    touched && !passwordValid ? 'Use at least 8 characters' : undefined;
  const confirmError =
    touched && password.length >= 8 && !confirmValid ? 'Passwords do not match' : undefined;

  const handleSubmit = async () => {
    setTouched(true);
    if (!canSubmit) return;
    setSubmitting(true);
    try {
      setError('');
      const { data, error } = await authClient().auth.signUp({ email: email.trim(), password, options: { data: { name: name.trim() } } });
      if (error) throw error;
      if (!data.session) router.replace({ pathname: '/(auth)/verify-otp', params: { email: email.trim(), type: 'signup' } });
    } catch (error) { setError(errorMessage(error));
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
        <Header subtitle="Step 0 of 1" />

        <View style={styles.hero}>
          <Text style={styles.kicker}>CREATE ACCOUNT</Text>
          <Text style={styles.title}>Join Adaptive Coach</Text>
          <Text style={styles.subtitle}>
            Tell us a little about yourself so we can personalize your meals, workouts and daily nudges.
          </Text>
        </View>

        <View style={styles.form}>
          {error ? <Text accessibilityRole="alert" style={{ color: '#b42318' }}>{error}</Text> : null}
          <TextField
            label="Full name"
            value={name}
            onChangeText={setName}
            placeholder="Alex Rivera"
            autoCapitalize="words"
            autoComplete="name"
            textContentType="name"
            leadingIcon={<Feather name="user" size={18} color={colors.textMuted} />}
          />

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
            error={emailError}
          />

          <TextField
            label="Password"
            value={password}
            onChangeText={setPassword}
            placeholder="At least 6 characters"
            secureTextEntry={!showPassword}
            autoCapitalize="none"
            autoComplete="password-new"
            textContentType="newPassword"
            leadingIcon={<Feather name="lock" size={18} color={colors.textMuted} />}
            trailingIcon={
              <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
                onPress={() => setShowPassword((v) => !v)}
                hitSlop={12}
              >
                <Feather
                  name={showPassword ? 'eye-off' : 'eye'}
                  size={18}
                  color={colors.textMuted}
                />
              </TouchableOpacity>
            }
            error={passwordError}
          />

          <TextField
            label="Confirm password"
            value={confirm}
            onChangeText={setConfirm}
            placeholder="Repeat your password"
            secureTextEntry={!showPassword}
            autoCapitalize="none"
            autoComplete="password-new"
            textContentType="newPassword"
            leadingIcon={<Feather name="shield" size={18} color={colors.textMuted} />}
            error={confirmError}
          />

          <TouchableOpacity
            style={styles.termsRow}
            onPress={() => setAccept((v) => !v)}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: accept }}
            activeOpacity={0.8}
          >
            <View style={[styles.checkbox, accept && styles.checkboxOn]}>
              {accept ? (
                <Feather name="check" size={14} color={colors.textInverse} />
              ) : null}
            </View>
            <Text style={styles.termsText}>
              I agree to the <Text style={styles.termsLink}>Terms</Text> and{' '}
              <Text style={styles.termsLink}>Privacy Policy</Text>.
            </Text>
          </TouchableOpacity>

          <Button
            title={submitting ? 'Creating account…' : 'Create Account'}
            onPress={handleSubmit}
            disabled={!canSubmit}
            loading={submitting}
          />

          <View style={styles.signupRow}>
            <Text style={styles.signupHint}>Already have an account?</Text>
            <Link href="/(auth)/sign-in" asChild>
              <TouchableOpacity accessibilityRole="link">
                <Text style={styles.signupAction}>Sign in</Text>
              </TouchableOpacity>
            </Link>
          </View>
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
    fontSize: 30,
    lineHeight: 36,
    color: colors.textPrimary,
    letterSpacing: -0.6,
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    lineHeight: 21,
    color: colors.textMuted,
  },
  form: { gap: spacing.sm },
  termsRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    paddingVertical: spacing.xs,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: radii.xs,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  checkboxOn: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  termsText: {
    flex: 1,
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    lineHeight: 19,
    color: colors.textMuted,
  },
  termsLink: {
    fontFamily: 'Inter_500Medium',
    color: colors.primary,
  },
  signupRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    marginTop: spacing.md,
  },
  signupHint: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: colors.textMuted,
  },
  signupAction: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
    color: colors.primary,
  },
});
