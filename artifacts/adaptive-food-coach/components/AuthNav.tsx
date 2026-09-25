import React from 'react';
import { Alert, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ChevronLeftIcon, QuestionIcon } from '@/components/icons/AuthIcons';

export function AuthNav({ onBack }: { onBack?: () => void }) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  return (
    <View style={[styles.row, { paddingTop: insets.top }]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Back"
        onPress={onBack ?? (() => (router.canGoBack() ? router.back() : router.replace('/(auth)/intro')))}
        style={({ pressed }) => [styles.back, pressed && styles.pressed]}
      >
        <ChevronLeftIcon />
      </Pressable>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Help"
        onPress={() =>
          Alert.alert(
            'How to sign in',
            'Use email and password, Google, or Apple on iPhone. Reset sends a 6-digit code to your email.',
          )
        }
        style={({ pressed }) => [styles.help, pressed && styles.pressed]}
      >
        <QuestionIcon />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
  },
  back: {
    width: 60,
    height: 60,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: '#F9F8FD',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  help: {
    width: 60,
    height: 60,
    borderRadius: 24,
    backgroundColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: { opacity: 0.8 },
});
