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
import { Button, TextField } from '@/components/ui';
import { AuthNav } from '@/components/AuthNav';
import { LegalConsent } from '@/components/LegalConsent';
import { SocialAuthButtons } from '@/components/SocialAuthButtons';
import { EyeIcon } from '@/components/icons/AuthIcons';
import { colors } from '@/constants/tokens';
import { authClient } from '@/services/supabase';
import { setAuthIntent } from '@/services/auth-flow';
import { errorMessage } from '@/services/api';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function RegisterScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [error, setError] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [touched, setTouched] = useState(false);
  const [accepted, setAccepted] = useState(false);

  const emailValid = EMAIL_RE.test(email.trim());
  const passwordValid = password.length >= 8;
  const nameValid = name.trim().length >= 2;
  const canSubmit = emailValid && passwordValid && nameValid && accepted && !submitting;

  const handleSubmit = async () => {
    setTouched(true);
    if (!accepted) {
      setError('Please agree to the Privacy Policy and Terms of Use.');
      return;
    }
    if (!canSubmit) return;
    setSubmitting(true);
    try {
      setError('');
      setAuthIntent('signup');
      const { data, error: signUpError } = await authClient().auth.signUp({
        email: email.trim(),
        password,
        options: { data: { name: name.trim(), full_name: name.trim() } },
      });
      if (signUpError) throw signUpError;
      if (data.session) return;
      router.replace({ pathname: '/(auth)/verify-otp', params: { email: email.trim(), type: 'signup' } });
    } catch (caught) {
      setError(errorMessage(caught));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 24 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <AuthNav />
        <Text style={styles.title}>Create your account</Text>
        <View style={styles.form}>
          {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}
          <TextField variant="pill" value={name} onChangeText={setName} placeholder="Full name" autoCapitalize="words" autoComplete="name" textContentType="name" />
          <TextField
            variant="pill"
            value={email}
            onChangeText={setEmail}
            placeholder="Email"
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            textContentType="emailAddress"
            error={touched && !emailValid ? 'Enter a valid email' : undefined}
          />
          <TextField
            variant="pill"
            value={password}
            onChangeText={setPassword}
            placeholder="Password"
            secureTextEntry={!showPassword}
            autoCapitalize="none"
            autoComplete="password-new"
            textContentType="newPassword"
            trailingIcon={
              <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
                onPress={() => setShowPassword((value) => !value)}
                hitSlop={12}
              >
                <EyeIcon />
              </TouchableOpacity>
            }
            error={touched && !passwordValid ? 'Use at least 8 characters' : undefined}
          />
        </View>
        <View style={styles.actions}>
          <LegalConsent accepted={accepted} onChange={setAccepted} />
          {touched && !accepted ? <Text style={styles.error}>Agree to continue</Text> : null}
          <Button
            title={submitting ? 'Creating account…' : 'Register'}
            variant="dark"
            onPress={handleSubmit}
            disabled={!canSubmit}
            loading={submitting}
            style={styles.loginButton}
          />
          <SocialAuthButtons onError={setError} intent="signup" disabled={!accepted || submitting} />
        </View>
        <View style={styles.signupRow}>
          <Text style={styles.signupHint}>Already have an account? </Text>
          <Link href="/(auth)/sign-in" asChild>
            <TouchableOpacity accessibilityRole="link">
              <Text style={styles.signupAction}>Sign In</Text>
            </TouchableOpacity>
          </Link>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#FFFFFF' },
  scroll: { flexGrow: 1 },
  title: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 28,
    lineHeight: 34,
    color: '#000000',
    textAlign: 'center',
    marginTop: 72,
    marginBottom: 36,
    paddingHorizontal: 24,
  },
  form: { paddingHorizontal: 24 },
  error: {
    color: colors.accentRed,
    fontFamily: 'Poppins_500Medium',
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 8,
  },
  actions: { marginTop: 'auto', paddingHorizontal: 24, gap: 16, paddingTop: 32 },
  loginButton: { borderRadius: 999, height: 46, alignSelf: 'center', width: 322 },
  signupRow: { flexDirection: 'row', justifyContent: 'center', marginTop: 24 },
  signupHint: { fontFamily: 'Poppins_500Medium', fontSize: 12, color: '#000000' },
  signupAction: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 12,
    color: colors.accentPink,
    textDecorationLine: 'underline',
  },
});
