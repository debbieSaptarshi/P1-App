import React, { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { AppleIcon, FacebookIcon, GoogleIcon } from '@/components/icons/AuthIcons';
import { facebookLoginEnabled } from '@/constants/legal';
import { colors } from '@/constants/tokens';
import { isAuthCancelled, signInAnonymously, signInWithApple, signInWithFacebook, signInWithGoogle } from '@/services/auth';
import { errorMessage } from '@/services/api';
import { setAuthIntent } from '@/services/auth-flow';

type SocialProvider = 'apple' | 'google' | 'facebook' | 'guest';

const ACTIONS: Record<SocialProvider, () => Promise<unknown>> = {
  google: signInWithGoogle,
  facebook: signInWithFacebook,
  apple: signInWithApple,
  guest: signInAnonymously,
};

export function SocialAuthButtons({
  onError,
  intent = 'signin',
  disabled = false,
}: {
  onError: (message: string) => void;
  intent?: 'signin' | 'signup';
  disabled?: boolean;
}) {
  const [busy, setBusy] = useState<SocialProvider | null>(null);

  const run = async (provider: SocialProvider) => {
    if (busy || disabled) return;
    setBusy(provider);
    try {
      onError('');
      setAuthIntent(provider === 'guest' || intent === 'signup' ? 'signup' : 'signin');
      await ACTIONS[provider]();
    } catch (error) {
      if (!isAuthCancelled(error) || /did not return to the app/i.test(errorMessage(error))) onError(errorMessage(error));
    } finally {
      setBusy(null);
    }
  };

  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{intent === 'signup' ? 'Or sign up with' : 'Or login with'}</Text>
      <View style={styles.row}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={intent === 'signup' ? 'Sign up with Google' : 'Continue with Google'}
          disabled={disabled || !!busy}
          onPress={() => void run('google')}
          style={({ pressed }) => [styles.google, pressed && styles.pressed]}
        >
          {busy === 'google' ? <ActivityIndicator color={colors.textPrimary} /> : <GoogleIcon />}
        </Pressable>
        {facebookLoginEnabled ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={intent === 'signup' ? 'Sign up with Facebook' : 'Continue with Facebook'}
          disabled={disabled || !!busy}
          onPress={() => void run('facebook')}
          style={({ pressed }) => [styles.facebook, pressed && styles.pressed]}
        >
          {busy === 'facebook' ? <ActivityIndicator color="#FFFFFF" /> : <FacebookIcon />}
        </Pressable>
        ) : null}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={intent === 'signup' ? 'Sign up with Apple' : 'Continue with Apple'}
          disabled={disabled || !!busy}
          onPress={() => void run('apple')}
          style={({ pressed }) => [styles.apple, pressed && styles.pressed]}
        >
          {busy === 'apple' ? <ActivityIndicator color={colors.textInverse} /> : <AppleIcon />}
        </Pressable>
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Continue as guest"
        disabled={disabled || !!busy}
        onPress={() => void run('guest')}
        style={({ pressed }) => [styles.guest, pressed && styles.pressed]}
      >
        {busy === 'guest' ? (
          <ActivityIndicator color={colors.textPrimary} />
        ) : (
          <Text style={styles.guestLabel}>Continue as guest</Text>
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', gap: 16 },
  label: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 12,
    color: colors.formPlaceholder,
  },
  row: { flexDirection: 'row', gap: 8, justifyContent: 'center' },
  google: {
    width: 60,
    height: 60,
    borderRadius: 24,
    backgroundColor: colors.formFill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  facebook: {
    width: 60,
    height: 60,
    borderRadius: 24,
    backgroundColor: '#1278F3',
    alignItems: 'center',
    justifyContent: 'center',
  },
  apple: {
    width: 60,
    height: 60,
    borderRadius: 24,
    backgroundColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  guest: { paddingVertical: 4, minHeight: 24, justifyContent: 'center' },
  guestLabel: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 12,
    color: colors.accentPink,
    textDecorationLine: 'underline',
  },
  pressed: { opacity: 0.85 },
});
