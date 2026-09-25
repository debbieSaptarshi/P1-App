import React, { useMemo, useState } from 'react';
import {
  Dimensions,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { useAppStore } from '@/hooks/useAppStore';
import {
  PROGRAMS,
  programsByCategory,
  resolveProgram,
  type ProgramDefinition,
} from '@/constants/programs';
import { colors, radii, spacing } from '@/constants/tokens';

const testIllustration = require('@/assets/images/onboarding/plan-ready.png');

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SIDE = spacing.lg;
const HERO_WIDTH = SCREEN_WIDTH - SIDE * 2;
const HERO_HEIGHT = 250;
const CARD_WIDTH = 220;
const CARD_HEIGHT = 156;

type HeroPage = { kind: 'test' } | { kind: 'recommended'; program: ProgramDefinition } | { kind: 'program'; program: ProgramDefinition };

export default function ProgramsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { state } = useAppStore();
  const [heroIndex, setHeroIndex] = useState(0);

  const current = resolveProgram(state.preferences.programId);
  const planTest = state.preferences.planTest;
  const recommended = planTest ? resolveProgram(planTest.programId) : null;

  const heroPages = useMemo<HeroPage[]>(() => {
    const first: HeroPage = recommended ? { kind: 'recommended', program: recommended } : { kind: 'test' };
    const rest: HeroPage[] = PROGRAMS.filter((program) => program.id !== 'general' && program.id !== recommended?.id).map(
      (program) => ({ kind: 'program', program }),
    );
    return [first, ...rest];
  }, [recommended]);

  const groups = useMemo(() => programsByCategory(), []);

  const openProgram = (program: ProgramDefinition, extra?: Record<string, string>) => {
    Haptics.selectionAsync();
    router.push({ pathname: '/programs/[programId]', params: { programId: program.id, ...extra } });
  };

  const openTest = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push('/programs/test');
  };

  return (
    <View style={styles.root}>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingTop: insets.top + spacing.md, paddingBottom: 96 + (insets.bottom || 16) }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <Animated.View entering={FadeInDown.duration(400).delay(60)} style={styles.header}>
          <View>
            <Text style={styles.kicker}>PROGRAMMES</Text>
            <Text style={styles.title}>Find your plan</Text>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Open profile"
            testID="programs-profile"
            onPress={() => {
              Haptics.selectionAsync();
              router.push('/profile');
            }}
            style={({ pressed }) => [styles.roundButton, pressed && styles.pressed]}
          >
            <Feather name="user" size={18} color={colors.textPrimary} />
          </Pressable>
        </Animated.View>

        {/* Hero pager */}
        <Animated.View entering={FadeInDown.duration(400).delay(120)}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            decelerationRate="fast"
            snapToInterval={HERO_WIDTH + spacing.sm}
            snapToAlignment="start"
            contentContainerStyle={styles.heroRow}
            style={styles.heroScroll}
            scrollEventThrottle={16}
            onMomentumScrollEnd={(event: NativeSyntheticEvent<NativeScrollEvent>) => {
              const next = Math.round(event.nativeEvent.contentOffset.x / (HERO_WIDTH + spacing.sm));
              setHeroIndex(Math.max(0, Math.min(next, heroPages.length - 1)));
            }}
            testID="programs-hero"
          >
            {heroPages.map((page, index) => {
              if (page.kind === 'test') {
                return <TestHero key="test" onPress={openTest} />;
              }
              const isRecommended = page.kind === 'recommended';
              return (
                <ProgramHero
                  key={`${page.kind}-${page.program.id}-${index}`}
                  program={page.program}
                  kicker={isRecommended ? 'Recommended for you' : page.program.category === 'everyday' ? 'Balanced' : page.program.kicker}
                  active={current.id === page.program.id}
                  onPress={() => openProgram(page.program, isRecommended ? { recommended: '1' } : undefined)}
                />
              );
            })}
          </ScrollView>
          <View style={styles.dots} accessibilityLabel={`Page ${heroIndex + 1} of ${heroPages.length}`}>
            {heroPages.map((_, index) => (
              <View key={index} style={[styles.dot, index === heroIndex ? styles.dotOn : styles.dotOff]} />
            ))}
          </View>
        </Animated.View>

        {/* Active programme */}
        {current.id !== 'general' ? (
          <Animated.View entering={FadeInDown.duration(400).delay(160)}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Your programme: ${current.title}`}
              testID="programs-current"
              onPress={() => openProgram(current)}
              style={({ pressed }) => [styles.currentRow, pressed && styles.pressed]}
            >
              <View style={styles.currentDot} />
              <View style={styles.flex}>
                <Text style={styles.currentLabel}>YOUR PROGRAMME</Text>
                <Text style={styles.currentTitle}>{current.title}</Text>
              </View>
              <Feather name="chevron-right" size={18} color={colors.textMuted} />
            </Pressable>
          </Animated.View>
        ) : null}

        {/* Category rows */}
        {groups.map((group, groupIndex) => (
          <Animated.View key={group.category.id} entering={FadeInDown.duration(400).delay(200 + groupIndex * 60)} style={styles.section}>
            <Text style={styles.sectionLabel}>{group.category.label.toUpperCase()}</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.cardRow}
              style={styles.cardScroll}
              decelerationRate="fast"
              snapToInterval={CARD_WIDTH + spacing.sm}
              snapToAlignment="start"
            >
              {group.programs.map((program) => (
                <ProgramCard
                  key={program.id}
                  program={program}
                  active={current.id === program.id}
                  onPress={() => openProgram(program)}
                />
              ))}
            </ScrollView>
          </Animated.View>
        ))}

        {/* Need recommendations */}
        <Animated.View entering={FadeInDown.duration(400).delay(420)} style={styles.recommendCard}>
          <View style={styles.recommendIllustrationWrap}>
            <Image source={testIllustration} style={styles.recommendIllustration} contentFit="contain" />
          </View>
          <Text style={styles.recommendTitle}>{recommended ? 'Want a second opinion?' : 'Need recommendations?'}</Text>
          <Text style={styles.recommendBody}>
            {recommended
              ? `We suggested ${recommended.title.toLowerCase()} last time. Retake the test if things have changed.`
              : 'Answer seven quick questions and we will point you to the programme that fits.'}
          </Text>
          <View style={styles.recommendDivider} />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={recommended ? 'Retake the test' : 'Take the test'}
            testID="programs-take-test"
            onPress={openTest}
            style={({ pressed }) => [styles.recommendAction, pressed && styles.pressed]}
          >
            <Text style={styles.recommendActionText}>{recommended ? 'RETAKE THE TEST' : 'TAKE THE TEST'}</Text>
          </Pressable>
        </Animated.View>

        <Text style={styles.disclaimer}>Programmes reshape your home screen and coaching. They are not medical advice — talk to your doctor before changing medication.</Text>
      </ScrollView>
    </View>
  );
}

function TestHero({ onPress }: { onPress: () => void }) {
  return (
    <View style={[styles.hero, styles.heroDark]} testID="hero-test">
      <Text style={styles.heroKickerLight}>TAKE OUR TEST</Text>
      <Text style={styles.heroTitleLight}>Find your plan</Text>
      <Text style={styles.heroBodyLight}>Take our quick test and we'll find the perfect programme for you.</Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Take the test"
        onPress={onPress}
        style={({ pressed }) => [styles.heroButtonLight, pressed && styles.pressed]}
      >
        <Text style={styles.heroButtonLightText}>TAKE THE TEST</Text>
      </Pressable>
      <Image source={testIllustration} style={styles.heroIllustration} contentFit="contain" pointerEvents="none" />
    </View>
  );
}

function ProgramHero({
  program,
  kicker,
  active,
  onPress,
}: {
  program: ProgramDefinition;
  kicker: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${kicker}: ${program.title}`}
      testID={`hero-${program.id}`}
      onPress={onPress}
      style={({ pressed }) => [styles.hero, { backgroundColor: program.accent }, pressed && styles.pressed]}
    >
      <Text style={styles.heroKickerLight}>{kicker.toUpperCase()}</Text>
      <Text style={styles.heroTitleLight} numberOfLines={2}>
        {program.title}
      </Text>
      <Text style={styles.heroBodyLight} numberOfLines={2}>
        {program.tagline}
      </Text>
      <View style={styles.heroButtonOutline}>
        <Text style={styles.heroButtonOutlineText}>{active ? 'YOUR PROGRAMME' : 'READ MORE'}</Text>
      </View>
      <Image source={program.image} style={styles.heroPlate} contentFit="contain" pointerEvents="none" />
    </Pressable>
  );
}

function ProgramCard({ program, active, onPress }: { program: ProgramDefinition; active: boolean; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${program.kicker}: ${program.title}. ${program.tagline}`}
      accessibilityState={{ selected: active }}
      testID={`program-card-${program.id}`}
      onPress={onPress}
      style={({ pressed }) => [styles.card, { backgroundColor: program.accent }, pressed && styles.pressed]}
    >
      <Text style={styles.cardKicker}>{program.kicker.toUpperCase()}</Text>
      <Text style={styles.cardTitle} numberOfLines={2}>
        {program.title}
      </Text>
      <Text style={styles.cardTagline} numberOfLines={2}>
        {program.tagline}
      </Text>
      {active ? (
        <View style={styles.cardActiveBadge}>
          <Feather name="check" size={12} color={colors.darkSurface} />
        </View>
      ) : null}
      <Image source={program.image} style={styles.cardPlate} contentFit="contain" pointerEvents="none" />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  content: { paddingHorizontal: SIDE, gap: spacing.lg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  kicker: { fontFamily: 'Inter_500Medium', fontSize: 11, letterSpacing: 0.8, color: colors.textMuted },
  title: { fontFamily: 'Inter_700Bold', fontSize: 28, letterSpacing: -0.5, color: colors.textPrimary, marginTop: 2 },
  roundButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.card, alignItems: 'center', justifyContent: 'center' },
  pressed: { opacity: 0.8 },

  heroScroll: { marginHorizontal: -SIDE },
  heroRow: { paddingHorizontal: SIDE, gap: spacing.sm },
  hero: {
    width: HERO_WIDTH,
    height: HERO_HEIGHT,
    borderRadius: radii.xl,
    padding: spacing.lg,
    overflow: 'hidden',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  heroDark: { backgroundColor: colors.darkSurface },
  heroKickerLight: { fontFamily: 'Inter_500Medium', fontSize: 11, letterSpacing: 0.8, color: 'rgba(255,255,255,0.72)' },
  heroTitleLight: { fontFamily: 'Inter_700Bold', fontSize: 28, lineHeight: 33, letterSpacing: -0.5, color: colors.textInverse, maxWidth: HERO_WIDTH * 0.6 },
  heroBodyLight: { fontFamily: 'Inter_400Regular', fontSize: 14, lineHeight: 20, color: 'rgba(255,255,255,0.8)', maxWidth: HERO_WIDTH * 0.58 },
  heroButtonLight: {
    alignSelf: 'flex-start',
    marginTop: spacing.xs,
    height: 40,
    paddingHorizontal: spacing.lg,
    borderRadius: radii.pill,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroButtonLightText: { fontFamily: 'Inter_600SemiBold', fontSize: 12, letterSpacing: 0.8, color: colors.textPrimary },
  heroButtonOutline: {
    alignSelf: 'flex-start',
    marginTop: spacing.xs,
    height: 40,
    paddingHorizontal: spacing.lg,
    borderRadius: radii.pill,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroButtonOutlineText: { fontFamily: 'Inter_600SemiBold', fontSize: 12, letterSpacing: 0.8, color: colors.textInverse },
  heroIllustration: { position: 'absolute', right: -10, bottom: -6, width: 150, height: 150, opacity: 0.95 },
  heroPlate: { position: 'absolute', right: -56, top: 30, width: 200, height: 200 },
  dots: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: spacing.sm, height: 8 },
  dot: { height: 6, borderRadius: 999 },
  dotOn: { width: 14, backgroundColor: colors.darkSurface },
  dotOff: { width: 6, backgroundColor: colors.planFaded },

  currentRow: {
    backgroundColor: colors.card,
    borderRadius: radii.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  currentDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.accentGreen },
  currentLabel: { fontFamily: 'Inter_500Medium', fontSize: 10, letterSpacing: 0.8, color: colors.textMuted },
  currentTitle: { fontFamily: 'Inter_600SemiBold', fontSize: 15, color: colors.textPrimary, marginTop: 1 },

  section: { gap: spacing.sm },
  sectionLabel: { fontFamily: 'Inter_600SemiBold', fontSize: 12, letterSpacing: 0.8, color: colors.textPrimary },
  cardScroll: { marginHorizontal: -SIDE },
  cardRow: { paddingHorizontal: SIDE, gap: spacing.sm },
  card: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    borderRadius: radii.lg,
    padding: spacing.md,
    overflow: 'hidden',
    gap: 4,
  },
  cardKicker: { fontFamily: 'Inter_500Medium', fontSize: 10, letterSpacing: 0.8, color: 'rgba(255,255,255,0.72)' },
  cardTitle: { fontFamily: 'Inter_700Bold', fontSize: 19, lineHeight: 23, letterSpacing: -0.3, color: colors.textInverse, maxWidth: CARD_WIDTH * 0.62 },
  cardTagline: { fontFamily: 'Inter_400Regular', fontSize: 12, lineHeight: 16, color: 'rgba(255,255,255,0.78)', maxWidth: CARD_WIDTH * 0.6, marginTop: 'auto' },
  cardActiveBadge: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardPlate: { position: 'absolute', right: -44, bottom: -30, width: 140, height: 140 },

  recommendCard: {
    backgroundColor: colors.card,
    borderRadius: radii.xl,
    padding: spacing.lg,
    alignItems: 'center',
    gap: spacing.xs,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 2,
  },
  recommendIllustrationWrap: { width: 96, height: 96, borderRadius: 48, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.xs },
  recommendIllustration: { width: 84, height: 84 },
  recommendTitle: { fontFamily: 'Inter_700Bold', fontSize: 20, letterSpacing: -0.3, color: colors.textPrimary, textAlign: 'center' },
  recommendBody: { fontFamily: 'Inter_400Regular', fontSize: 14, lineHeight: 20, color: colors.textMuted, textAlign: 'center' },
  recommendDivider: { alignSelf: 'stretch', height: 1, backgroundColor: colors.border, marginVertical: spacing.sm },
  recommendAction: { height: 40, paddingHorizontal: spacing.lg, alignItems: 'center', justifyContent: 'center' },
  recommendActionText: { fontFamily: 'Inter_600SemiBold', fontSize: 13, letterSpacing: 0.8, color: colors.primary },
  disclaimer: { fontFamily: 'Inter_400Regular', fontSize: 12, lineHeight: 16, color: colors.textPlaceholder, textAlign: 'center', paddingHorizontal: spacing.sm },
});
