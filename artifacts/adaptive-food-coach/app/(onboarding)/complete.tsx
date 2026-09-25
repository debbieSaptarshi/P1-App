import { useRouter } from 'expo-router';
import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { ProgressBar } from '@/components/ui';
import { colors, radii, spacing } from '@/constants/tokens';
import { buildCustomPlan } from '@/lib/customPlan';
import { useAppStore } from '@/hooks/useAppStore';
import { OnboardingShell } from './_components/OnboardingShell';
import { progressFor } from './_components/progress';

export default function CompleteScreen() {
  const router = useRouter();
  const { actions, state } = useAppStore();
  const plan = useMemo(() => buildCustomPlan(state.onboarding.answers), [state.onboarding.answers]);

  const handleContinue = async () => {
    await actions.completeOnboarding(state.onboarding.answers);
    router.replace('/(tabs)');
  };

  return (
    <OnboardingShell
      progress={progressFor('complete')}
      title={undefined}
      subtitle={null}
      continueTitle="Let’s Get Started"
      onContinue={handleContinue}
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>Congratulations your custom plan is ready!</Text>
        <Text style={styles.should}>
          {plan.direction === 'gain' ? 'You should gain :' : 'You should lose :'}
        </Text>
        <View style={styles.pill}>
          <Text style={styles.pillText}>{plan.targetLabel}</Text>
        </View>
        <Text style={styles.heading}>Daily Recommendation</Text>
        <View style={styles.statStack}>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>🔥 Calories</Text>
            <Text style={styles.statValue}>{plan.calories}</Text>
          </View>
          <View style={styles.statRow}>
            <MacroCard label="🥚 Protein" value={plan.protein} unit="g" />
            <MacroCard label="🍞 Carbs" value={plan.carbs} unit="g" />
            <MacroCard label="🥑 Fats" value={plan.fat} unit="g" />
          </View>
          <View style={styles.statRow}>
            <MacroCard label="🍎 Fiber" value={plan.fiber.toFixed(1)} unit="g" />
            <MacroCard label="🍧 Sugar" value={plan.sugar.toFixed(1)} unit="g" />
            <MacroCard label="🍚 Sodium" value={plan.sodium} unit="mg" />
          </View>
          <View style={styles.healthCard}>
            <View style={styles.healthRow}>
              <Text style={styles.healthLabel}>Health Score</Text>
              <Text style={styles.healthValue}>{plan.healthScore}/10</Text>
            </View>
            <ProgressBar
              progress={plan.healthScore / 10}
              backgroundColor="#1E293B"
              color="#1570EF"
              height={14}
            />
          </View>
        </View>
      </ScrollView>
    </OnboardingShell>
  );
}

function MacroCard({
  label,
  value,
  unit,
}: {
  label: string;
  value: number | string;
  unit: string;
}) {
  return (
    <View style={styles.macroCard}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.macroValue}>
        {value} <Text style={styles.macroUnit}>{unit}</Text>
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  scrollView: { flex: 1 },
  scroll: {
    gap: 16,
    paddingBottom: 8,
  },
  title: {
    fontFamily: 'Inter_500Medium',
    fontSize: 32,
    lineHeight: 38,
    letterSpacing: -0.2,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  should: {
    fontFamily: 'Inter_500Medium',
    fontSize: 20,
    lineHeight: 24,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  pill: {
    alignSelf: 'center',
    backgroundColor: colors.card,
    borderRadius: radii.pill,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  pillText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 14,
    lineHeight: 20,
    color: colors.textPrimary,
  },
  heading: {
    fontFamily: 'Inter_500Medium',
    fontSize: 20,
    lineHeight: 24,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  statStack: {
    gap: 8,
  },
  statCard: {
    backgroundColor: colors.card,
    borderRadius: radii.xl,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  statRow: {
    flexDirection: 'row',
    gap: 8,
  },
  macroCard: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: radii.xl,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    minWidth: 0,
  },
  statLabel: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: -0.12,
    color: colors.textPrimary,
    marginBottom: 4,
  },
  statValue: {
    fontFamily: 'Inter_500Medium',
    fontSize: 24,
    lineHeight: 30,
    letterSpacing: -0.15,
    color: colors.textPrimary,
  },
  macroValue: {
    fontFamily: 'Inter_500Medium',
    fontSize: 24,
    lineHeight: 30,
    letterSpacing: -0.15,
    color: colors.textPrimary,
  },
  macroUnit: {
    fontFamily: 'Inter_400Regular',
    fontSize: 10,
    lineHeight: 12,
    color: colors.textMuted,
  },
  healthCard: {
    backgroundColor: colors.darkSurface,
    borderRadius: radii.xl,
    padding: spacing.md,
    gap: spacing.md,
  },
  healthRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  healthLabel: {
    fontFamily: 'Inter_500Medium',
    fontSize: 16,
    lineHeight: 22,
    letterSpacing: -0.18,
    color: colors.textInverse,
  },
  healthValue: {
    fontFamily: 'Inter_500Medium',
    fontSize: 16,
    lineHeight: 22,
    letterSpacing: -0.18,
    color: colors.textInverse,
  },
});
