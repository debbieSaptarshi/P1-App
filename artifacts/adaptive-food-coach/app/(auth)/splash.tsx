import { useRouter } from 'expo-router';
import React, { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, Text } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '@/constants/tokens';
import { hasSeenIntro } from '@/services/auth';

export default function SplashScreen() {
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => {
      void hasSeenIntro().then((seen) => {
        router.replace(seen ? '/(auth)/sign-in' : '/(auth)/intro');
      });
    }, 1400);
    return () => clearTimeout(timer);
  }, [router]);

  return (
    <LinearGradient
      colors={[colors.splashOrange, colors.splashRed, colors.splashRose, colors.splashPink]}
      start={{ x: 0.05, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.fill}
    >
      <Text style={styles.logo}>My P1</Text>
      <ActivityIndicator color="#FFFFFF" style={styles.spinner} />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  logo: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 40,
    color: '#FFFFFF',
    letterSpacing: -0.4,
  },
  spinner: { position: 'absolute', bottom: 111 },
});
