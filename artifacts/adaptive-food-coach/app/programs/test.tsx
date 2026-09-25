import React, { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Animated, { FadeIn, FadeInDown, FadeInRight, FadeOutLeft } from 'react-native-reanimated';

import { Button, ProgressBar } from '@/components/ui';
import { errorMessage } from '@/services/api';
import { appStoreActions } from '@/hooks/useAppStore';
import { PLAN_TEST_QUESTIONS, scorePlanTest } from '@/constants/planTest';
import { resolveProgram } from '@/constants/programs';
import { colors, radii, spacing } from '@/constants/tokens';

/** Show a short encouragement card after this many answered questions. */
const INTERSTITIAL_AFTER = 3;

export default function PlanTestScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [interstitial, setInterstitial] = useState(false);
  const [busy, setBusy] = useState(false);

  const total = PLAN_TEST_QUESTIONS.length;
  const question = PLAN_TEST_QUESTIONS[index];
  const selected = answers[question.id];
  const isLast = index === total - 1;

  const exit = () => {
    if (Object.keys(answers).length === 0) {
      router.back();
      return;
    }
    Alert.alert('Leave the test?', 'Your answers so far will not be saved.', [
      { text: 'Keep going', style: 'cancel' },
      { text: 'Leave', style: 'destructive', onPress: () => router.back() },
    ]);
  };

  const back = () => {
    Haptics.selectionAsync();
    if (interstitial) {
      setInterstitial(false);
      return;
    }
    if (index === 0) {
      exit();
      return;
    }
    setIndex((value) => value - 1);
  };

  const finish = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const result = scorePlanTest(answers);
      await appStoreActions.savePlanTest({ ...result, answers, completedAt: new Date().toISOString() });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace({ pathname: '/programs/[programId]', params: { programId: result.programId, recommended: '1' } });
    } catch (error) {
      Alert.alert('Could not save your result', errorMessage(error));
    } finally {
      setBusy(false);
    }
  };

  const next = () => {
    if (!selected) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (interstitial) {
      setInterstitial(false);
      setIndex((value) => value + 1);
      return;
    }
    if (isLast) {
      void finish();
      return;
    }
    if (index + 1 === INTERSTITIAL_AFTER) {
      setInterstitial(true);
      return;
    }
    setIndex((value) => value + 1);
  };

  const preview = interstitial ? resolveProgram(scorePlanTest(answers).programId) : null;

  return (
    <View style={styles.root}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + spacing.xs }]}>
        <Pressable accessibilityRole="button" accessibilityLabel="Back" testID="test-back" hitSlop={12} onPress={back} style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}>
          <Feather name="chevron-left" size={24} color={colors.textPrimary} />
        </Pressable>
        <View style={styles.headerCenter}>
          <Text style={styles.headerKicker}>PLAN TEST</Text>
          <Text style={styles.headerStep}>
            QUESTION {index + 1} OF {total}
          </Text>
        </View>
        <Pressable accessibilityRole="button" accessibilityLabel="Close test" testID="test-close" hitSlop={12} onPress={exit} style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}>
          <Feather name="x" size={22} color={colors.textPrimary} />
        </Pressable>
      </View>
      <View style={styles.progressWrap}>
        <ProgressBar progress={(index + (selected ? 1 : 0)) / total} height={6} color={colors.darkSurface} backgroundColor={colors.planTrack} />
      </View>

      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: 140 }]} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        {interstitial && preview ? (
          <Animated.View key="interstitial" entering={FadeIn.duration(300)} style={styles.interstitialWrap}>
            <View style={styles.interstitialCard}>
              <Text style={styles.interstitialTitle}>Great — we've got your starting point.</Text>
              <Text style={styles.interstitialBody}>
                So far it looks like {preview.title.toLowerCase()} could fit. A few more questions and we'll tune how the app should feel for you.
              </Text>
            </View>
          </Animated.View>
        ) : (
          <Animated.View key={question.id} entering={FadeInRight.duration(260)} exiting={FadeOutLeft.duration(160)} style={styles.questionBlock}>
            <Text style={styles.question}>{question.title}</Text>
            <View style={styles.options}>
              {question.options.map((option, optionIndex) => {
                const on = selected === option.id;
                return (
                  <Animated.View key={option.id} entering={FadeInDown.duration(260).delay(60 + optionIndex * 40)}>
                    <Pressable
                      accessibilityRole="radio"
                      accessibilityState={{ selected: on }}
                      accessibilityLabel={option.label}
                      testID={`test-option-${question.id}-${option.id}`}
                      onPress={() => {
                        Haptics.selectionAsync();
                        setAnswers((prev) => ({ ...prev, [question.id]: option.id }));
                      }}
                      style={({ pressed }) => [styles.option, on && styles.optionOn, pressed && styles.pressed]}
                    >
                      <Text style={[styles.optionLabel, on && styles.optionLabelOn]}>{option.label}</Text>
                      <View style={[styles.radio, on && styles.radioOn]}>{on ? <Feather name="check" size={14} color={colors.darkSurface} /> : null}</View>
                    </Pressable>
                  </Animated.View>
                );
              })}
            </View>
          </Animated.View>
        )}
      </ScrollView>

      {/* Footer */}
      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, spacing.md) }]}>
        <Button
          variant="dark"
          title={interstitial ? 'Continue' : isLast ? 'See my plan' : 'Next'}
          trailingIcon={interstitial || !isLast ? 'arrow-right' : undefined}
          disabled={!selected || busy}
          loading={busy}
          onPress={next}
          testID="test-next"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  pressed: { opacity: 0.75 },
  header: { paddingHorizontal: spacing.md, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  iconButton: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  headerCenter: { alignItems: 'center', gap: 2 },
  headerKicker: { fontFamily: 'Inter_600SemiBold', fontSize: 11, letterSpacing: 0.8, color: colors.textPrimary },
  headerStep: { fontFamily: 'Inter_500Medium', fontSize: 10, letterSpacing: 0.8, color: colors.textMuted },
  progressWrap: { paddingHorizontal: spacing.lg, paddingTop: spacing.sm },
  content: { paddingHorizontal: spacing.lg, paddingTop: spacing.xl },
  questionBlock: { gap: spacing.lg },
  question: { fontFamily: 'Inter_700Bold', fontSize: 24, lineHeight: 30, letterSpacing: -0.4, color: colors.textPrimary },
  options: { gap: spacing.xs },
  option: {
    minHeight: 60,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  optionOn: { backgroundColor: colors.darkSurface, borderColor: colors.darkSurface },
  optionLabel: { flex: 1, fontFamily: 'Inter_500Medium', fontSize: 15, lineHeight: 21, color: colors.textPrimary },
  optionLabelOn: { color: colors.textInverse, fontFamily: 'Inter_600SemiBold' },
  radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 1.5, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  radioOn: { backgroundColor: colors.card, borderColor: colors.card },
  interstitialWrap: { flex: 1, justifyContent: 'center', paddingTop: spacing.xxxl },
  interstitialCard: { backgroundColor: colors.primarySoft, borderRadius: radii.xl, padding: spacing.xl, gap: spacing.sm, alignItems: 'center' },
  interstitialTitle: { fontFamily: 'Inter_700Bold', fontSize: 22, lineHeight: 28, letterSpacing: -0.3, color: colors.textPrimary, textAlign: 'center' },
  interstitialBody: { fontFamily: 'Inter_400Regular', fontSize: 15, lineHeight: 22, color: colors.textPrimary, textAlign: 'center' },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    backgroundColor: colors.background,
  },
});
