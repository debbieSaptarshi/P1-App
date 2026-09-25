import { useRouter } from 'expo-router';
import { useEffect, useRef } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { initializeAccount } from '@/hooks/useAppStore';
import { signInAnonymously } from '@/services/auth';
import { setAuthIntent } from '@/services/auth-flow';
import { authClient } from '@/services/supabase';
import { errorMessage } from '@/services/api';

export default function GuestSignInScreen() {
  const router = useRouter();
  const started = useRef(false);

  useEffect(() => {
    if (!__DEV__ || started.current) return;
    started.current = true;
    void (async () => {
      try {
        const client = authClient();
        await client.auth.signOut({ scope: 'local' });
        await initializeAccount(null);
        setAuthIntent('signup');
        await signInAnonymously();
      } catch (error) {
        router.replace({ pathname: '/(auth)/sign-in', params: { error: errorMessage(error) } });
      }
    })();
  }, [router]);

  return (
    <View style={styles.screen}>
      <ActivityIndicator size="large" />
      <Text style={styles.copy}>Signing in as guest…</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16, backgroundColor: '#FFFFFF' },
  copy: { fontFamily: 'Poppins_500Medium', fontSize: 14, color: '#64748B' },
});
