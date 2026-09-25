import React, { useState } from 'react';
import { Alert, Dimensions, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { Button } from '@/components/ui';
import { errorMessage } from '@/services/api';
import { appStoreActions, useAppStore } from '@/hooks/useAppStore';
import { PROGRAM_CATEGORIES, resolveProgram } from '@/constants/programs';
import { homeLayoutLabel } from '@/constants/homeLayouts';
import { colors, radii, spacing } from '@/constants/tokens';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const HERO_HEIGHT = 300;

export default function ProgramDetailScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { programId, recommended } = useLocalSearchParams<{ programId: string; recommended?: string }>();
  const { state } = useAppStore();
  const program = resolveProgram(programId);
  const active = resolveProgram(state.preferences.programId).id === program.id;
  const isRecommended = recommended === '1' || state.preferences.planTest?.programId === program.id;
  const categoryLabel = PROGRAM_CATEGORIES.find((item) => item.id === program.category)?.label ?? program.kicker;
  const [busy, setBusy] = useState(false);

  const calorieGoal = state.profile.nutrientGoals.calories || 1800;
  const layout = isRecommended && state.preferences.planTest ? state.preferences.planTest.layout : program.defaultLayout;

  const start = async () => {
    if (busy) return;
    setBusy(true);
    try {
      await appStoreActions.subscribeToProgram(program.id);
      if (layout !== program.defaultLayout) await appStoreActions.updatePreferences({ homeLayout: layout });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace('/(tabs)');
    } catch (error) {
      Alert.alert('Unable to start programme', errorMessage(error));
    } finally {
      setBusy(false);
    }
  };

  const leave = async () => {
    if (busy) return;
    setBusy(true);
    try {
      await appStoreActions.subscribeToProgram('general');
      Haptics.selectionAsync();
      router.replace('/(tabs)/programs');
    } catch (error) {
      Alert.alert('Unable to leave programme', errorMessage(error));
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={styles.root}>
      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 120 }} showsVerticalScrollIndicator={false} bounces>
        {/* Hero */}
        <View style={[styles.hero, { backgroundColor: program.accent, paddingTop: insets.top + spacing.xs, height: HERO_HEIGHT + insets.top }]}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Back"
            testID="program-back"
            hitSlop={12}
            onPress={() => router.back()}
            style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}
          >
            <Feather name="chevron-left" size={26} color={colors.textInverse} />
          </Pressable>
          <View style={styles.heroCopy}>
            <Text style={styles.heroKicker}>{(isRecommended ? 'Recommended · ' : '') + categoryLabel.toUpperCase()}</Text>
            <Text style={styles.heroTitle}>{program.title}</Text>
            <Text style={styles.heroTagline}>{program.tagline}</Text>
            {!active ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Start plan"
                testID="program-start-hero"
                onPress={() => void start()}
                style={({ pressed }) => [styles.heroButton, pressed && styles.pressed]}
              >
                <Text style={styles.heroButtonText}>START PLAN</Text>
              </Pressable>
            ) : (
              <View style={styles.activePill}>
                <Feather name="check-circle" size={14} color={colors.textInverse} />
                <Text style={styles.activePillText}>YOUR PROGRAMME</Text>
              </View>
            )}
          </View>
          <Image source={program.image} style={styles.heroPlate} contentFit="contain" pointerEvents="none" />
        </View>

        {/* Body */}
        <View style={styles.body}>
          <Animated.Text entering={FadeInDown.duration(400).delay(80)} style={styles.description}>
            {program.description} {program.focusSummary}
          </Animated.Text>

          <Animated.View entering={FadeInDown.duration(400).delay(140)} style={styles.benefits}>
            {program.benefits.map((benefit) => (
              <View key={benefit} style={styles.benefit}>
                <Feather name="check" size={18} color={colors.textPrimary} />
                <Text style={styles.benefitText}>{benefit}</Text>
              </View>
            ))}
          </Animated.View>

          {/* Your focus */}
          <Animated.View entering={FadeInDown.duration(400).delay(200)} style={[styles.card, { backgroundColor: program.accent }]}>
            <Text style={styles.cardKickerLight}>YOUR FOCUS</Text>
            <Text style={styles.cardTitleLight}>{program.focusTitle}</Text>
            <Text style={styles.cardBodyLight}>{program.focusHint}</Text>

            <View style={styles.splitRow}>
              <Text style={styles.splitKcal}>
                {calorieGoal.toLocaleString()} <Text style={styles.splitKcalUnit}>kcal</Text>
              </Text>
              <View style={styles.splitLegend}>
                <LegendRow label="Carbs" pct={program.macroSplit.carbs} color={colors.macroCarbs} />
                <LegendRow label="Protein" pct={program.macroSplit.protein} color={colors.macroProtein} />
                <LegendRow label="Fat" pct={program.macroSplit.fat} color={colors.macroFat} />
              </View>
            </View>
            <View style={styles.splitBar} accessibilityLabel={`Carbs ${program.macroSplit.carbs}%, protein ${program.macroSplit.protein}%, fat ${program.macroSplit.fat}%`}>
              <View style={[styles.splitSegment, { flex: program.macroSplit.carbs, backgroundColor: colors.macroCarbs }]} />
              <View style={[styles.splitSegment, { flex: program.macroSplit.protein, backgroundColor: colors.macroProtein }]} />
              <View style={[styles.splitSegment, { flex: program.macroSplit.fat, backgroundColor: colors.macroFat }]} />
            </View>
            <Text style={styles.cardFootnoteLight}>Home layout: {homeLayoutLabel(layout)}</Text>
          </Animated.View>

          {/* Dos and don'ts */}
          <Animated.View entering={FadeInDown.duration(400).delay(260)} style={[styles.card, styles.cardLight]}>
            <Text style={styles.cardKicker}>DOS AND DON'TS</Text>
            <View style={styles.rules}>
              {program.dos.map((rule) => (
                <View key={rule} style={styles.rule}>
                  <View style={[styles.ruleIcon, styles.ruleIconDo]}>
                    <Feather name="check" size={13} color={colors.textInverse} />
                  </View>
                  <Text style={styles.ruleText}>{rule}</Text>
                </View>
              ))}
              {program.donts.map((rule) => (
                <View key={rule} style={styles.rule}>
                  <View style={[styles.ruleIcon, styles.ruleIconDont]}>
                    <Feather name="x" size={13} color={colors.textPrimary} />
                  </View>
                  <Text style={styles.ruleText}>{rule}</Text>
                </View>
              ))}
            </View>
          </Animated.View>

          {/* Quote */}
          <Animated.View entering={FadeInDown.duration(400).delay(320)} style={[styles.card, styles.cardLight, styles.quoteCard]}>
            <Text style={[styles.quoteMark, { color: program.accent }]}>“</Text>
            <Text style={styles.quoteText}>{program.quote.text}</Text>
            <Text style={styles.quoteAuthor}>{program.quote.author}</Text>
            <Text style={styles.quoteRole}>{program.quote.role}</Text>
          </Animated.View>

          <Text style={styles.sources}>Estimates and guidance only — not a substitute for medical advice.</Text>
        </View>
      </ScrollView>

      {/* Sticky footer */}
      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, spacing.md) }]}>
        {active ? (
          <View style={styles.footerRow}>
            {program.id !== 'general' ? (
              <Button variant="outline" title="Leave" loading={busy} onPress={() => void leave()} style={styles.footerHalf} testID="program-leave" />
            ) : null}
            <Button variant="dark" title="Back to home" leadingIcon="home" onPress={() => router.replace('/(tabs)')} style={styles.footerHalf} testID="program-home" />
          </View>
        ) : (
          <Button variant="dark" title="Start plan" loading={busy} disabled={busy} onPress={() => void start()} testID="program-start" />
        )}
      </View>
    </View>
  );
}

function LegendRow({ label, pct, color }: { label: string; pct: number; color: string }) {
  return (
    <View style={styles.legendRow}>
      <View style={[styles.legendDot, { backgroundColor: color }]} />
      <Text style={styles.legendLabel}>{label.toUpperCase()}</Text>
      <Text style={styles.legendPct}>{pct}%</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  pressed: { opacity: 0.8 },
  hero: { paddingHorizontal: spacing.lg, overflow: 'hidden', justifyContent: 'space-between', paddingBottom: spacing.xl },
  backButton: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginLeft: -spacing.sm },
  heroCopy: { gap: spacing.xs, maxWidth: SCREEN_WIDTH * 0.6 },
  heroKicker: { fontFamily: 'Inter_500Medium', fontSize: 11, letterSpacing: 0.8, color: 'rgba(255,255,255,0.72)' },
  heroTitle: { fontFamily: 'Inter_700Bold', fontSize: 30, lineHeight: 35, letterSpacing: -0.6, color: colors.textInverse },
  heroTagline: { fontFamily: 'Inter_400Regular', fontSize: 15, lineHeight: 21, color: 'rgba(255,255,255,0.82)' },
  heroButton: {
    alignSelf: 'flex-start',
    marginTop: spacing.sm,
    height: 44,
    paddingHorizontal: spacing.xl,
    borderRadius: radii.pill,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroButtonText: { fontFamily: 'Inter_600SemiBold', fontSize: 13, letterSpacing: 0.8, color: colors.textPrimary },
  activePill: {
    alignSelf: 'flex-start',
    marginTop: spacing.sm,
    height: 36,
    paddingHorizontal: spacing.md,
    borderRadius: radii.pill,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.8)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  activePillText: { fontFamily: 'Inter_600SemiBold', fontSize: 11, letterSpacing: 0.8, color: colors.textInverse },
  heroPlate: { position: 'absolute', right: -60, bottom: -10, width: 240, height: 240 },

  body: { paddingHorizontal: spacing.lg, paddingTop: spacing.xl, gap: spacing.lg },
  description: { fontFamily: 'Inter_400Regular', fontSize: 16, lineHeight: 24, color: colors.textPrimary, textAlign: 'center' },
  benefits: { flexDirection: 'row', justifyContent: 'center', gap: spacing.lg, flexWrap: 'wrap' },
  benefit: { alignItems: 'center', gap: 6, maxWidth: 140 },
  benefitText: { fontFamily: 'Inter_500Medium', fontSize: 13, lineHeight: 18, color: colors.textPrimary, textAlign: 'center' },

  card: { borderRadius: radii.xl, padding: spacing.lg, gap: spacing.sm },
  cardLight: {
    backgroundColor: colors.card,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 2,
  },
  cardKicker: { fontFamily: 'Inter_600SemiBold', fontSize: 11, letterSpacing: 0.8, color: colors.textMuted },
  cardKickerLight: { fontFamily: 'Inter_600SemiBold', fontSize: 11, letterSpacing: 0.8, color: 'rgba(255,255,255,0.72)' },
  cardTitleLight: { fontFamily: 'Inter_700Bold', fontSize: 22, letterSpacing: -0.3, color: colors.textInverse },
  cardBodyLight: { fontFamily: 'Inter_400Regular', fontSize: 14, lineHeight: 20, color: 'rgba(255,255,255,0.82)' },
  cardFootnoteLight: { fontFamily: 'Inter_400Regular', fontSize: 12, color: 'rgba(255,255,255,0.7)' },
  splitRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: spacing.sm, gap: spacing.md },
  splitKcal: { fontFamily: 'Inter_700Bold', fontSize: 32, letterSpacing: -0.5, color: colors.textInverse },
  splitKcalUnit: { fontFamily: 'Inter_400Regular', fontSize: 16, letterSpacing: 0, color: 'rgba(255,255,255,0.8)' },
  splitLegend: { gap: 4 },
  legendRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendLabel: { fontFamily: 'Inter_500Medium', fontSize: 10, letterSpacing: 0.8, color: 'rgba(255,255,255,0.8)', width: 60 },
  legendPct: { fontFamily: 'Inter_600SemiBold', fontSize: 12, color: colors.textInverse },
  splitBar: { flexDirection: 'row', height: 10, borderRadius: 999, overflow: 'hidden', gap: 2 },
  splitSegment: { height: 10 },

  rules: { gap: spacing.sm },
  rule: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  ruleIcon: { width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center', marginTop: 1 },
  ruleIconDo: { backgroundColor: colors.darkSurface },
  ruleIconDont: { backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border },
  ruleText: { flex: 1, fontFamily: 'Inter_400Regular', fontSize: 14, lineHeight: 20, color: colors.textPrimary },

  quoteCard: { alignItems: 'center', paddingVertical: spacing.xl },
  quoteMark: { fontFamily: 'Inter_700Bold', fontSize: 48, lineHeight: 48, marginBottom: -spacing.sm },
  quoteText: { fontFamily: 'Inter_600SemiBold', fontSize: 18, lineHeight: 26, letterSpacing: -0.3, color: colors.textPrimary, textAlign: 'center' },
  quoteAuthor: { fontFamily: 'Inter_600SemiBold', fontSize: 14, color: colors.textPrimary, marginTop: spacing.sm },
  quoteRole: { fontFamily: 'Inter_400Regular', fontSize: 12, color: colors.textMuted },
  sources: { fontFamily: 'Inter_400Regular', fontSize: 12, lineHeight: 16, color: colors.textPlaceholder, textAlign: 'center' },

  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  footerRow: { flexDirection: 'row', gap: spacing.xs },
  footerHalf: { flex: 1 },
});
