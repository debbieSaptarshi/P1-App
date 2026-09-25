import { Link, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
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

export default function SignInScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ error?: string; autologin?: string }>();
  const insets = useSafeAreaInsets();
  const [error, setError] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const autoLoginAttempted = useRef(false);
  const canSubmit = email.trim().length > 0 && password.length > 0;

  useEffect(() => {
    if (typeof params.error === 'string' && params.error) setError(params.error);
  }, [params.error]);

  useEffect(() => {
    if (!__DEV__ || params.autologin !== '1' || autoLoginAttempted.current) return;
    const devEmail = process.env.EXPO_PUBLIC_DEV_AUTO_LOGIN_EMAIL?.trim();
    const devPassword = process.env.EXPO_PUBLIC_DEV_AUTO_LOGIN_PASSWORD;
    if (!devEmail || !devPassword) return;
    autoLoginAttempted.current = true;
    setEmail(devEmail);
    setPassword(devPassword);
    setAccepted(true);
    void (async () => {
      setSubmitting(true);
      try {
        setError('');
        setAuthIntent('signin');
        const { error: signInError } = await authClient().auth.signInWithPassword({
          email: devEmail,
          password: devPassword,
        });
        if (signInError) throw signInError;
      } catch (caught) {
        setError(errorMessage(caught));
      } finally {
        setSubmitting(false);
      }
    })();
  }, [params.autologin]);

  const handleSubmit = async () => {
    if (!canSubmit || submitting) return;
    setSubmitting(true);
    try {
      setError('');
      setAuthIntent('signin');
      const { error: signInError } = await authClient().auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (signInError) throw signInError;
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
        <AuthNav onBack={() => router.replace('/(auth)/intro')} />
        <Text style={styles.title}>Hello again 🔥</Text>
        <View style={styles.form}>
          {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}
          <TextField
            variant="pill"
            value={email}
            onChangeText={setEmail}
            placeholder="Email"
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            textContentType="emailAddress"
          />
          <TextField
            variant="pill"
            value={password}
            onChangeText={setPassword}
            placeholder="Password"
            secureTextEntry={!showPassword}
            autoCapitalize="none"
            autoComplete="password"
            textContentType="password"
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
          />
          <Pressable
            style={styles.forgot}
            onPress={() => router.push('/(auth)/forgot-password')}
            accessibilityRole="link"
          >
            <Text style={styles.forgotText}>Recovery password</Text>
          </Pressable>
        </View>
        <View style={styles.actions}>
          <Button
            title={submitting ? 'Signing in…' : 'Sign In'}
            variant="dark"
            onPress={handleSubmit}
            disabled={!canSubmit}
            loading={submitting}
            style={styles.loginButton}
          />
          <LegalConsent accepted={accepted} onChange={setAccepted} />
          <SocialAuthButtons onError={setError} disabled={!accepted || submitting} />
        </View>
        <View style={styles.signupRow}>
          <Text style={styles.signupHint}>Don&apos;t have an account? </Text>
          <Link href="/(auth)/register" asChild>
            <TouchableOpacity accessibilityRole="link">
              <Text style={styles.signupAction}>Register</Text>
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
    lineHeight: 28,
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
  forgot: { alignSelf: 'flex-end', paddingVertical: 4 },
  forgotText: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 12,
    color: colors.accentPink,
    textDecorationLine: 'underline',
  },
  actions: { marginTop: 'auto', paddingHorizontal: 24, gap: 16, paddingTop: 32 },
  loginButton: { borderRadius: 999, height: 46, alignSelf: 'center', width: 322 },
  signupRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
  },
  signupHint: { fontFamily: 'Poppins_500Medium', fontSize: 12, color: '#000000' },
  signupAction: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 12,
    color: colors.accentPink,
    textDecorationLine: 'underline',
  },
});
