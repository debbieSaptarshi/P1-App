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
import { initializeAccount } from '@/hooks/useAppStore';
import { authClient } from '@/services/supabase';
import { errorMessage } from '@/services/api';

export default function SignInScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();


  const [error, setError] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const canSubmit = email.trim().length > 0 && password.length > 0;

  const handleSubmit = async () => {
    if (!canSubmit || submitting) return;
    setSubmitting(true);
    try {
      setError('');
      const { data, error } = await authClient().auth.signInWithPassword({ email: email.trim(), password });
      if (error) throw error;
      await initializeAccount(data.user);
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
          { paddingTop: insets.top + spacing.md, paddingBottom: insets.bottom + spacing.xl },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Header onBack={() => router.replace('/')} showBack={false} />

        <View style={styles.hero}>
          <Text style={styles.kicker}>WELCOME BACK</Text>
          <Text style={styles.title}>Login to your account</Text>
          <Text style={styles.subtitle}>
            Continue your adaptive coaching journey with personalized meals, workouts and habit nudges.
          </Text>
        </View>

        <View style={styles.form}>
          {error ? <Text accessibilityRole="alert" style={{ color: '#b42318' }}>{error}</Text> : null}
          <TextField
            label="Email"
            value={email}
            onChangeText={setEmail}
            placeholder="[email protected]"
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            textContentType="emailAddress"
            leadingIcon={
              <Feather name="mail" size={18} color={colors.textMuted} />
            }
          />

          <TextField
            label="Password"
            value={password}
            onChangeText={setPassword}
            placeholder="Enter your password"
            secureTextEntry={!showPassword}
            autoCapitalize="none"
            autoComplete="password"
            textContentType="password"
            leadingIcon={
              <Feather name="lock" size={18} color={colors.textMuted} />
            }
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
          />

          <TouchableOpacity
            style={styles.forgot}
            onPress={() => router.push('/(auth)/forgot-password')}
            accessibilityRole="link"
          >
            <Text style={styles.forgotText}>Forgot password?</Text>
          </TouchableOpacity>

          <Button
            title={submitting ? 'Signing in…' : 'Continue'}
            onPress={handleSubmit}
            disabled={!canSubmit}
            loading={submitting}
          />

          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerLabel}>or</Text>
            <View style={styles.dividerLine} />
          </View>

          <View style={styles.signupRow}>
            <Text style={styles.signupHint}>Don&apos;t have an account?</Text>
            <Link href="/(auth)/register" asChild>
              <TouchableOpacity accessibilityRole="link">
                <Text style={styles.signupAction}>Sign up</Text>
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
  forgot: {
    alignSelf: 'flex-end',
    paddingVertical: spacing.xs,
  },
  forgotText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 13,
    color: colors.primary,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginVertical: spacing.md,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
    borderRadius: radii.xs,
  },
  dividerLabel: {
    fontFamily: 'Inter_500Medium',
    fontSize: 12,
    color: colors.textMuted,
  },
  signupRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    marginTop: spacing.xs,
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
