import { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import * as Linking from 'expo-linking';
import { useLocalSearchParams } from 'expo-router';
import { completeOAuthFromUrl } from '@/services/auth';
import { authClient } from '@/services/supabase';

export default function AuthCallbackScreen() {
  const params = useLocalSearchParams<{ code?: string | string[] }>();

  useEffect(() => {
    const code = Array.isArray(params.code) ? params.code[0] : params.code;
    void (async () => {
      if (code) {
        const { error } = await authClient().auth.exchangeCodeForSession(code);
        if (error) console.warn('OAuth code exchange failed', error.message);
        return;
      }
      const url = await Linking.getInitialURL();
      if (url) await completeOAuthFromUrl(url).catch((error) => {
        console.warn('OAuth callback failed', error instanceof Error ? error.message : error);
        return false;
      });
    })();
  }, [params.code]);

  return (
    <View style={styles.fill}>
      <ActivityIndicator />
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFFFFF' },
});
