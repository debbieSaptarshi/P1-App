import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import type { DietPattern } from '@/types';
import { TextField } from '@/components/ui';
import { StepHeader } from './_components/StepHeader';
import { Chip as LocalChip } from './_components/Chip';
import { colors, radii, spacing } from '@/constants/tokens';
import { useAppStore } from '@/hooks/useAppStore';

const TOTAL_STEPS = 10;
const STEP_NUM = 8;

const DIET_OPTIONS: {
  value: DietPattern;
  label: string;
  description: string;
  icon: keyof typeof Feather.glyphMap;
}[] = [
  { value: 'omnivore', label: 'Omnivore', description: 'Everything in moderation', icon: 'circle' },
  { value: 'vegetarian', label: 'Vegetarian', description: 'No meat, still eats dairy & eggs', icon: 'sun' },
  { value: 'vegan', label: 'Vegan', description: 'Plant-based only', icon: 'feather' },
  { value: 'pescatarian', label: 'Pescatarian', description: 'Seafood-friendly', icon: 'droplet' },
  { value: 'mediterranean', label: 'Mediterranean', description: 'Whole foods, olive oil, fish', icon: 'heart' },
  { value: 'keto', label: 'Keto', description: 'Very low carb, high fat', icon: 'zap' },
  { value: 'custom', label: 'Custom', description: "I'll describe in the notes", icon: 'edit-2' },
];

function parseAllergies(input: string): string[] {
  return input
    .split(/[,\n]/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

export default function StepDietScreen() {
  const router = useRouter();
  const { actions, state } = useAppStore();

  const persistedAllergies = Array.isArray(state.onboarding.answers.allergies)
    ? (state.onboarding.answers.allergies as string[])
    : Array.isArray(state.profile.allergies)
      ? state.profile.allergies
      : [];
  const persistedNotes =
    typeof state.onboarding.answers.notes === 'string'
      ? (state.onboarding.answers.notes as string)
      : '';
  const persistedCooking =
    typeof state.onboarding.answers.cookingTime === 'string'
      ? (state.onboarding.answers.cookingTime as string)
      : '';

  const [diet, setDiet] = useState<DietPattern | null>(
    (state.onboarding.answers.diet as DietPattern | undefined) ?? null,
  );
  const [allergiesText, setAllergiesText] = useState(persistedAllergies.join(', '));
  const [cookingTime, setCookingTime] = useState(persistedCooking);
  const [notes, setNotes] = useState(persistedNotes);

  const continueEnabled = diet !== null;

  const handleContinue = async () => {
    if (!diet) return;
    const allergies = parseAllergies(allergiesText);
    await actions.advanceOnboarding(9, {
      diet,
      allergies: allergies.length > 0 ? allergies : [],
      cookingTime: cookingTime.trim(),
      notes: notes.trim(),
    });
    router.push('/(onboarding)/generating-plan');
  };

  return (
    <StepHeader
      stepNum={STEP_NUM}
      totalSteps={TOTAL_STEPS}
      kicker="FOOD"
      title="Diet & restrictions"
      subtitle="Pick your pattern, then flag anything we should always avoid."
      onContinue={handleContinue}
      continueDisabled={!continueEnabled}
    >
      <ScrollView
        style={styles.list}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Diet pattern</Text>
          <View style={styles.dietGrid}>
            {DIET_OPTIONS.map((opt) => (
              <LocalChip
                key={opt.value}
                label={opt.label}
                selected={diet === opt.value}
                onPress={() => setDiet(opt.value)}
                leadingIcon={opt.icon}
                testID={`diet-${opt.value}`}
              />
            ))}
          </View>
          {diet && (
            <Text style={styles.dietDescription}>
              {DIET_OPTIONS.find((o) => o.value === diet)?.description}
            </Text>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Allergies</Text>
          <TextField
            value={allergiesText}
            onChangeText={setAllergiesText}
            placeholder="e.g. peanut, shellfish, sesame"
            autoCapitalize="none"
            leadingIcon={<Feather name="alert-triangle" size={16} color={colors.textMuted} />}
            helper="Comma-separated. We'll hide any food containing one of these."
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Cooking time</Text>
          <TextField
            value={cookingTime}
            onChangeText={setCookingTime}
            placeholder="e.g. 20 minutes on weeknights"
            leadingIcon={<Feather name="clock" size={16} color={colors.textMuted} />}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notes for your coach</Text>
          <TextField
            value={notes}
            onChangeText={setNotes}
            placeholder="Anything else we should know — preferences, meds, lifestyle rhythms…"
            multiline
            numberOfLines={4}
            style={styles.notesInput}
          />
        </View>

        <View style={styles.privacyNote}>
          <Feather name="lock" size={14} color={colors.textMuted} />
          <Text style={styles.privacyText}>
            Allergies and notes are private to your account and shared with your coach only when
            you opt in.
          </Text>
        </View>
      </ScrollView>
    </StepHeader>
  );
}

const styles = StyleSheet.create({
  list: { flex: 1 },
  listContent: {
    gap: spacing.lg,
    paddingBottom: spacing.xl,
  },
  section: {
    gap: spacing.sm,
  },
  sectionTitle: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 13,
    color: colors.textPrimary,
    letterSpacing: -0.1,
  },
  dietGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  dietDescription: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: colors.textMuted,
    lineHeight: 18,
  },
  notesInput: {
    minHeight: 96,
    textAlignVertical: 'top',
    paddingVertical: spacing.sm,
  },
  privacyNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    padding: spacing.sm,
    borderRadius: radii.md,
    backgroundColor: colors.card,
  },
  privacyText: {
    flex: 1,
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: colors.textMuted,
  },
});
