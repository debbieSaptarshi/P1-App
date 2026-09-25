import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import * as Linking from 'expo-linking';
import { useRootNavigationState, useRouter, useSegments } from 'expo-router';
import { backendConfigured, demoMode, supabase } from '@/services/supabase';
import { appStoreActions, initializeAccount, retrySync, resolveSyncConflict, useAppStore } from '@/hooks/useAppStore';
import { errorMessage } from '@/services/api';
import { completeOAuthFromUrl, hasSeenIntro } from '@/services/auth';
import { ONBOARDING_ROUTE_SET } from '@/app/(onboarding)/_components/progress';
import {
  AUTH_ENTRY_SCREENS,
  AUTH_FLOW_SCREENS,
  consumeAuthIntent,
  isCurrentRoute,
  resolvePostAuthRoute,
} from '@/services/auth-flow';
import { SUPPORT_EMAIL } from '@/constants/legal';

export function AuthGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const segments = useSegments();
  const navigation = useRootNavigationState();
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(!demoMode);
  const [error, setError] = useState('');
  const [introSeen, setIntroSeen] = useState<boolean | null>(demoMode ? true : null);
  const { hydrated, state, syncStatus, syncMessage } = useAppStore();
  const lastUserIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (demoMode) return;
    void hasSeenIntro().then(setIntroSeen);
  }, []);

  useEffect(() => {
    if (demoMode || !supabase) return;
    const handle = async (url: string | null) => {
      if (!url) return;
      try {
        await completeOAuthFromUrl(url);
      } catch (e) {
        console.warn('OAuth deep link failed', e instanceof Error ? e.message : e);
      }
    };
    const sub = Linking.addEventListener('url', ({ url }) => {
      void handle(url);
    });
    void Linking.getInitialURL().then(handle);
    return () => sub.remove();
  }, []);

  useEffect(() => {
    if (demoMode || !supabase) {
      setLoading(false);
      return;
    }
    let alive = true;
    let generation = 0;
    const apply = async (user: { id: string } | null) => {
      const current = ++generation;
      const nextUserId = user?.id ?? null;
      const switchingAccount = lastUserIdRef.current !== nextUserId;
      lastUserIdRef.current = nextUserId;

      if (switchingAccount) {
        setLoading(true);
        setError('');
      }
      setUserId(nextUserId);

      try {
        await initializeAccount(user as Parameters<typeof initializeAccount>[0]);
      } catch (e) {
        if (alive && current === generation) setError(errorMessage(e));
      } finally {
        if (alive && current === generation && switchingAccount) setLoading(false);
      }
    };
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setTimeout(() => {
        if (alive) void apply(session?.user ?? null);
      }, 0);
    });
    return () => {
      alive = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (demoMode || !backendConfigured || loading || error || !navigation?.key || introSeen == null) return;

    const parts = segments as string[];
    const inAuthGroup = parts[0] === '(auth)';
    const inOAuthCallback = parts[0] === 'auth';
    const authScreen = String(parts[1] ?? '');
    const inOnboarding =
      parts[0] === '(onboarding)' || parts.some((segment) => ONBOARDING_ROUTE_SET.has(segment));
    const inMidAuthFlow = inAuthGroup && AUTH_FLOW_SCREENS.has(authScreen);

    const go = (href: string) => {
      if (isCurrentRoute(parts, href)) return;
      router.replace(href as '/(tabs)');
    };

    if (!userId && !inAuthGroup && !inOAuthCallback) {
      go(introSeen ? '/(auth)/sign-in' : '/(auth)/splash');
      return;
    }

    if (!userId || !hydrated || inMidAuthFlow) return;

    const { onboarding } = state;

    if (onboarding.complete) {
      if (inAuthGroup || inOAuthCallback || inOnboarding) go('/(tabs)');
      return;
    }

    const leavingAuthEntry = inAuthGroup && AUTH_ENTRY_SCREENS.has(authScreen);
    const needsOnboarding = !inOnboarding && !inMidAuthFlow;
    if (!leavingAuthEntry && !needsOnboarding) return;

    const intent = leavingAuthEntry ? consumeAuthIntent() : 'signin';
    if (
      intent === 'signup' &&
      onboarding.stepIndex === 0 &&
      Object.keys(onboarding.answers).length === 0
    ) {
      void appStoreActions.startOnboarding();
    }

    go(resolvePostAuthRoute(onboarding, intent));
  }, [userId, loading, error, hydrated, state.onboarding.complete, segments, navigation?.key, introSeen, router]);

  if (!backendConfigured && !demoMode) {
    if (!__DEV__) {
      return (
        <View style={styles.cover}>
          <Text style={styles.title}>Temporarily unavailable</Text>
          <Text style={styles.copy}>
            Adaptive Food Coach cannot reach its servers right now. Check your connection and try again. If this
            continues, email {SUPPORT_EMAIL}.
          </Text>
        </View>
      );
    }
    return (
      <View style={styles.cover}>
        <Text style={styles.title}>Connect your backend</Text>
        <Text style={styles.copy}>
          Add the Supabase URL, public key, and API URL to the Expo .env file, then restart Expo. See docs/BACKEND.md
          for local setup.
        </Text>
        <Text style={styles.copy}>
          To preview the original sample screens, explicitly enable EXPO_PUBLIC_DEMO_MODE=true.
        </Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      {children}
      {demoMode ? (
        <View style={styles.banner}>
          <Text>Demo preview · sample data · cloud features disabled</Text>
        </View>
      ) : null}
      {loading || error ? (
        <View style={styles.cover}>
          {loading ? (
            <ActivityIndicator />
          ) : (
            <>
              <Text style={styles.title}>Unable to load your account</Text>
              <Text style={styles.copy}>{error}</Text>
              <Pressable
                onPress={async () => {
                  setLoading(true);
                  try {
                    const { data } = await supabase!.auth.getUser();
                    await initializeAccount(data.user);
                    setError('');
                  } catch (e) {
                    setError(errorMessage(e));
                  } finally {
                    setLoading(false);
                  }
                }}
              >
                <Text>Retry</Text>
              </Pressable>
            </>
          )}
        </View>
      ) : null}
      {!loading && !error && userId && ['offline', 'error', 'conflict'].includes(syncStatus) ? (
        <View style={styles.banner}>
          <Text>
            {syncStatus === 'conflict'
              ? 'Changes found on another device.'
              : syncStatus === 'offline'
                ? 'Saved on this device. Waiting to sync.'
                : syncMessage}
          </Text>
          {syncStatus === 'conflict' ? (
            <View style={{ flexDirection: 'row', gap: 20 }}>
              <Pressable onPress={() => void resolveSyncConflict(false)?.catch((e) => setError(errorMessage(e)))}>
                <Text>Use cloud changes</Text>
              </Pressable>
              <Pressable onPress={() => void resolveSyncConflict(true)?.catch((e) => setError(errorMessage(e)))}>
                <Text>Keep my edits</Text>
              </Pressable>
            </View>
          ) : (
            <Pressable onPress={() => void retrySync()}>
              <Text style={{ fontWeight: 'bold' }}>Retry sync</Text>
            </Pressable>
          )}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  cover: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 28,
    gap: 20,
  },
  title: { fontSize: 22, fontWeight: '700' },
  copy: { fontSize: 15, lineHeight: 23, textAlign: 'center' },
  banner: {
    position: 'absolute',
    top: 50,
    left: 12,
    right: 12,
    backgroundColor: '#fff0ce',
    padding: 12,
    borderRadius: 12,
    gap: 8,
    zIndex: 90,
  },
});
