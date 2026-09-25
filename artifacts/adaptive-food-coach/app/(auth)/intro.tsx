import { useRouter } from 'expo-router';
import React, { useRef, useState } from 'react';
import {
  Dimensions,
  FlatList,
  Image,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '@/constants/tokens';
import { markIntroSeen } from '@/services/auth';

const FIGMA_WIDTH = 375;
const { width: windowWidth } = Dimensions.get('window');
const scale = windowWidth / FIGMA_WIDTH;

const HOME_FRAME = { width: 402, height: 874 };
const PROGRESS_FRAME = { width: 402, height: 933 };

const SLIDES = [
  {
    key: 'home',
    title: 'Reach your health goals faster',
    image: require('@/assets/images/onboarding/home.png'),
    imageWidth: 291,
    imageHeight: 291 * (HOME_FRAME.height / HOME_FRAME.width),
    radius: 47,
    imageTop: 6,
    fade: [0.46672, 0.67234] as [number, number],
  },
  {
    key: 'progress',
    title: 'AI-powered\nnutrition insights',
    image: require('@/assets/images/onboarding/progress.png'),
    imageWidth: 263,
    imageHeight: 263 * (PROGRESS_FRAME.height / PROGRESS_FRAME.width),
    radius: 34,
    imageTop: 20,
    fade: [0.3661, 0.63462] as [number, number],
  },
];

export default function IntroScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const list = useRef<FlatList<(typeof SLIDES)[number]>>(null);
  const [index, setIndex] = useState(0);

  const go = async (path: '/(auth)/register' | '/(auth)/sign-in') => {
    await markIntroSeen();
    router.replace(path);
  };

  const onScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const next = Math.round(event.nativeEvent.contentOffset.x / windowWidth);
    if (next !== index) setIndex(next);
  };

  return (
    <View style={[styles.fill, { paddingBottom: Math.max(insets.bottom, 16) }]}>
      <FlatList
        ref={list}
        style={styles.list}
        data={SLIDES}
        keyExtractor={(item) => item.key}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
        renderItem={({ item }) => (
          <View style={[styles.slide, { width: windowWidth }]}>
            <Text style={[styles.title, { marginTop: insets.top + 34 }]}>{item.title}</Text>
            <View style={styles.hero}>
              <View style={styles.phone}>
                <Image
                  source={item.image}
                  style={{
                    width: item.imageWidth * scale,
                    height: item.imageHeight * scale,
                    borderRadius: item.radius * scale,
                    marginTop: item.imageTop * scale,
                  }}
                  resizeMode="contain"
                />
                <LinearGradient
                  colors={['rgba(255,255,255,0)', '#FFFFFF']}
                  locations={item.fade}
                  pointerEvents="none"
                  style={styles.fade}
                />
              </View>
            </View>
          </View>
        )}
      />
      <View style={styles.footer}>
        <Pressable
          accessibilityRole="button"
          onPress={() => void go('/(auth)/register')}
          style={({ pressed }) => [styles.cta, pressed && styles.pressed]}
        >
          <Text style={styles.ctaLabel}>Get Started</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          onPress={() => void go('/(auth)/sign-in')}
          style={styles.signIn}
        >
          <Text style={styles.signInHint}>Already have an account</Text>
          <Text style={styles.signInLink}>Sign In</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, backgroundColor: '#FFFFFF' },
  list: { flex: 1 },
  slide: { flex: 1 },
  title: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 28,
    lineHeight: 34,
    textAlign: 'center',
    color: '#000000',
    paddingHorizontal: 32,
  },
  hero: {
    flex: 1,
    alignItems: 'center',
    paddingTop: 16,
  },
  phone: {
    width: 311 * scale,
    height: 472 * scale,
    alignItems: 'center',
    overflow: 'hidden',
  },
  fade: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  footer: { paddingHorizontal: 24, paddingBottom: 10, gap: 10 },
  cta: {
    height: 48,
    borderRadius: 30,
    backgroundColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaLabel: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 16,
    color: '#FFFFFF',
  },
  signIn: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 6,
  },
  signInHint: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 14,
    color: '#000000',
  },
  signInLink: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 14,
    color: colors.accentPink,
  },
  pressed: { opacity: 0.88 },
});
