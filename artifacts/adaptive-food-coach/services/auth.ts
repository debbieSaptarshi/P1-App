import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import * as AppleAuthentication from 'expo-apple-authentication';
import * as Crypto from 'expo-crypto';
import * as WebBrowser from 'expo-web-browser';
import { makeRedirectUri } from 'expo-auth-session';
import * as QueryParams from 'expo-auth-session/build/QueryParams';
import { authClient } from './supabase';

const INTRO_KEY = 'afc.intro.seen';
WebBrowser.maybeCompleteAuthSession();

export type SocialProvider = 'google' | 'apple' | 'facebook';

const PROVIDER_LABEL: Record<SocialProvider, string> = {
  google: 'Google',
  apple: 'Apple',
  facebook: 'Facebook',
};

export async function hasSeenIntro() {
  return (await AsyncStorage.getItem(INTRO_KEY)) === '1';
}

export async function markIntroSeen() {
  await AsyncStorage.setItem(INTRO_KEY, '1');
}

export function oauthRedirectUrl() {
  if (Platform.OS === 'web') return makeRedirectUri({ path: 'auth/callback' });
  // Expo Go on Simulator cannot reliably capture exp:// after Google; localhost is already allow-listed.
  if (Constants.appOwnership === 'expo' && Constants.isDevice === false) {
    return 'http://localhost:8081/auth/callback';
  }
  return makeRedirectUri({
    scheme: Constants.appOwnership === 'expo' ? undefined : 'adaptive-food-coach',
    path: 'auth/callback',
  });
}

export function isAuthCancelled(error: unknown) {
  const code = error && typeof error === 'object' && 'code' in error ? String((error as { code: unknown }).code) : '';
  const message = error instanceof Error ? error.message : String(error ?? '');
  return code === 'ERR_REQUEST_CANCELED' || /cancel/i.test(message);
}

function randomNonce(length = 32) {
  const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz-._';
  const bytes = Crypto.getRandomBytes(length);
  return Array.from(bytes, (byte) => chars[byte % chars.length]).join('');
}

function parseAuthParams(url: string) {
  const params: Record<string, string> = {};
  const hashIndex = url.indexOf('#');
  const queryIndex = url.indexOf('?');
  const hash = hashIndex >= 0 ? url.slice(hashIndex + 1) : '';
  const queryEnd = hashIndex >= 0 ? hashIndex : url.length;
  const query = queryIndex >= 0 && queryIndex < queryEnd ? url.slice(queryIndex + 1, queryEnd) : '';
  for (const chunk of `${query}&${hash}`.split('&')) {
    if (!chunk) continue;
    const eq = chunk.indexOf('=');
    if (eq === -1) continue;
    const key = decodeURIComponent(chunk.slice(0, eq));
    const value = decodeURIComponent(chunk.slice(eq + 1).replace(/\+/g, ' '));
    if (key) params[key] = value;
  }
  return params;
}

function socialAuthError(provider: SocialProvider, error: unknown): Error {
  if (isAuthCancelled(error)) return new Error(`${PROVIDER_LABEL[provider]} sign-in was cancelled.`);
  const raw = error instanceof Error ? error.message : 'Sign-in failed.';
  if (/not enabled|unsupported provider/i.test(raw)) {
    return new Error(`${PROVIDER_LABEL[provider]} is not turned on yet. Enable it in Supabase Authentication → Providers.`);
  }
  if (/audience|invalid (id )?token|unacceptable/i.test(raw)) {
    return new Error(`${PROVIDER_LABEL[provider]} client IDs in Supabase do not match this app. For Expo Go, Apple must include host.exp.Exponent.`);
  }
  if (/redirect/i.test(raw)) {
    return new Error('This app URL is missing from the Supabase redirect allow list. Add adaptive-food-coach://** and exp://**.');
  }
  return error instanceof Error ? error : new Error(raw);
}

export async function completeOAuthFromUrl(url: string) {
  const parsed = QueryParams.getQueryParams(url);
  const params = { ...parseAuthParams(url), ...parsed.params };
  const errorCode = parsed.errorCode || params.error || params.error_description;
  if (!params.code && !params.access_token) return false;
  if (errorCode) throw new Error(params.error_description || String(errorCode));
  const client = authClient();
  if (params.code) {
    const { error } = await client.auth.exchangeCodeForSession(params.code);
    if (error) throw error;
    return true;
  }
  if (params.access_token && params.refresh_token) {
    const { error } = await client.auth.setSession({
      access_token: params.access_token,
      refresh_token: params.refresh_token,
    });
    if (error) throw error;
    return true;
  }
  throw new Error('Social sign-in did not return a session. Try again.');
}

async function signInWithOAuthProvider(provider: SocialProvider) {
  const client = authClient();
  const redirectTo = oauthRedirectUrl();
  const { data, error } = await client.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo,
      skipBrowserRedirect: true,
      scopes: provider === 'facebook' ? 'email,public_profile' : undefined,
      queryParams: provider === 'google' ? { access_type: 'offline', prompt: 'select_account' } : undefined,
    },
  });
  if (error || !data.url) throw socialAuthError(provider, error ?? new Error(`Could not start ${PROVIDER_LABEL[provider]} sign-in.`));
  await WebBrowser.warmUpAsync();
  try {
    const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
    if (result.type === 'success' && result.url) {
      await completeOAuthFromUrl(result.url);
      return;
    }
    const { data: sessionData } = await client.auth.getSession();
    if (sessionData.session) return;
    if (result.type === 'cancel' || result.type === 'dismiss') {
      throw new Error(`${PROVIDER_LABEL[provider]} did not return to the app. Keep the browser open until it closes by itself.`);
    }
    throw new Error(`${PROVIDER_LABEL[provider]} sign-in did not finish. Try email instead.`);
  } catch (caught) {
    throw socialAuthError(provider, caught);
  } finally {
    void WebBrowser.coolDownAsync();
  }
}

export async function appleSignInAvailable() {
  return Platform.OS === 'ios' && (await AppleAuthentication.isAvailableAsync());
}

export async function signInWithApple() {
  if (!(await appleSignInAvailable())) return signInWithOAuthProvider('apple');
  try {
    const client = authClient();
    const rawNonce = randomNonce();
    const hashedNonce = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, rawNonce);
    const credential = await AppleAuthentication.signInAsync({
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
      ],
      nonce: hashedNonce,
    });
    if (!credential.identityToken) throw new Error('Apple did not return a sign-in token. Try again.');
    const { data, error } = await client.auth.signInWithIdToken({
      provider: 'apple',
      token: credential.identityToken,
      nonce: rawNonce,
    });
    if (error) throw error;
    const name = [credential.fullName?.givenName, credential.fullName?.familyName].filter(Boolean).join(' ');
    if (name) await client.auth.updateUser({ data: { name, full_name: name } });
    return data.user;
  } catch (caught) {
    throw socialAuthError('apple', caught);
  }
}

export async function signInWithGoogle() {
  await signInWithOAuthProvider('google');
}

export async function signInWithFacebook() {
  await signInWithOAuthProvider('facebook');
}

export async function signInAnonymously() {
  const client = authClient();
  const { data, error } = await client.auth.signInAnonymously();
  if (error) {
    if (/anonymous.*disabled|anonymous_provider_disabled/i.test(error.message)) {
      throw new Error('Anonymous sign-in is still off in Supabase. Open Authentication → Providers → Anonymous, enable it, and save.');
    }
    throw error;
  }
  if (!data.user) throw new Error('Guest sign-in did not return a session. Try again.');
  return data.user;
}
