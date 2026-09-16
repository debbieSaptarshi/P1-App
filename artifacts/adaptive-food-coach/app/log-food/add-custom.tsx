import React, { useCallback, useMemo, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Button, Header, TextField } from '@/components/ui';
import { colors, radii, spacing } from '@/constants/tokens';
import { useAppStore } from '@/hooks/useAppStore';
import type { SavedFood } from '@/types';

interface DraftFood {
  name: string;
  brand: string;
  servingSize: string;
  calories: string;
  protein: string;
  carbs: string;
  fat: string;
  fiber: string;
  sodium: string;
}

const INITIAL_DRAFT: DraftFood = {
  name: '',
  brand: '',
  servingSize: '100 g',
  calories: '',
  protein: '',
  carbs: '',
  fat: '',
  fiber: '',
  sodium: '',
};

/**
 * Screen for creating a custom food entry.
 *
 * Captures macro inputs the user enters manually and persists the
 * record via `actions.saveFood`. Per the plan the store encodes the
 * macro payload inside the SavedFood `notes` field (as JSON) so the
 * type system stays clean; the saved-list screen parses it back out
 * for display and logging.
 */
export default function AddCustomFoodScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { actions } = useAppStore();
  const [draft, setDraft] = useState<DraftFood>(INITIAL_DRAFT);
  const [error, setError] = useState<string | null>(null);

  const isValid = useMemo(
    () => draft.name.trim().length >= 2 && draft.calories.trim().length > 0,
    [draft],
  );

  const previewTotals = useMemo(() => ({
    calories: Number(draft.calories) || 0,
    protein: Number(draft.protein) || 0,
    carbs: Number(draft.carbs) || 0,
    fat: Number(draft.fat) || 0,
    fiber: Number(draft.fiber) || 0,
    sodium: Number(draft.sodium) || 0,
  }), [draft]);

  const update = useCallback(
    (key: keyof DraftFood) => (value: string) => {
      setDraft((d) => ({ ...d, [key]: value }));
    },
    [],
  );

  const handleSave = useCallback(() => {
    if (!isValid) {
      setError('A name and at least the calorie value are required.');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      return;
    }
    const id = `cf_${Date.now()}`;
    const macros = {
      calories: previewTotals.calories,
      protein: previewTotals.protein,
      carbs: previewTotals.carbs,
      fat: previewTotals.fat,
      fiber: previewTotals.fiber,
      sodium: previewTotals.sodium,
      servingSize: draft.servingSize,
      brand: draft.brand,
    };
    const saved: SavedFood = {
      id,
      name: draft.name.trim(),
      notes: JSON.stringify(macros),
      ingredients: [{ foodId: id, quantity: 1 }],
      calories: previewTotals.calories,
      createdAt: new Date().toISOString(),
    };
    actions.saveFood(saved);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    router.back();
  }, [actions, draft, isValid, previewTotals, router]);

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <Header
        title="New custom food"
        subtitle="Macro details stay on-device"
      />

      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingBottom: insets.bottom + 120 },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Identity</Text>
          <TextField
            label="Food name"
            placeholder="e.g. Homemade smoothie"
            value={draft.name}
            onChangeText={update('name')}
            autoCapitalize="words"
            returnKeyType="next"
            testID="addcustom-name"
          />
          <TextField
            label="Brand (optional)"
            placeholder="e.g. Local brand"
            value={draft.brand}
            onChangeText={update('brand')}
            returnKeyType="next"
            testID="addcustom-brand"
          />
          <TextField
            label="Serving size"
            placeholder="e.g. 100 g, 1 cup"
            value={draft.servingSize}
            onChangeText={update('servingSize')}
            returnKeyType="next"
            testID="addcustom-serving"
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Macros per serving</Text>
          <View style={styles.macroGrid}>
            <NumericField
              label="Calories"
              suffix="kcal"
              value={draft.calories}
              onChangeText={update('calories')}
              testID="addcustom-calories"
            />
            <NumericField
              label="Protein"
              suffix="g"
              value={draft.protein}
              onChangeText={update('protein')}
              testID="addcustom-protein"
            />
            <NumericField
              label="Carbs"
              suffix="g"
              value={draft.carbs}
              onChangeText={update('carbs')}
              testID="addcustom-carbs"
            />
            <NumericField
              label="Fat"
              suffix="g"
              value={draft.fat}
              onChangeText={update('fat')}
              testID="addcustom-fat"
            />
            <NumericField
              label="Fiber"
              suffix="g"
              value={draft.fiber}
              onChangeText={update('fiber')}
              testID="addcustom-fiber"
            />
            <NumericField
              label="Sodium"
              suffix="mg"
              value={draft.sodium}
              onChangeText={update('sodium')}
              testID="addcustom-sodium"
            />
          </View>
        </View>

        <View style={styles.previewCard}>
          <View style={styles.previewHeader}>
            <Feather name="pie-chart" size={18} color={colors.primary} />
            <Text style={styles.previewTitle}>Live preview</Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Reset form"
              testID="addcustom-reset"
              onPress={() => setDraft(INITIAL_DRAFT)}
              hitSlop={8}
              style={({ pressed }) => [styles.resetBtn, pressed && styles.pressed]}
            >
              <Feather name="rotate-ccw" size={14} color={colors.textMuted} />
              <Text style={styles.resetLabel}>Reset</Text>
            </Pressable>
          </View>
          {draft.name ? (
            <>
              <Text style={styles.previewName}>{draft.name}</Text>
              {draft.brand ? (
                <Text style={styles.previewBrand}>{draft.brand}</Text>
              ) : null}
              <Text style={styles.previewMeta}>
                {draft.servingSize} · {Math.round(previewTotals.calories)} kcal
              </Text>
              <View style={styles.previewMacroRow}>
                <MacroBadge label="P" value={`${previewTotals.protein}`} />
                <MacroBadge label="C" value={`${previewTotals.carbs}`} />
                <MacroBadge label="F" value={`${previewTotals.fat}`} />
                <MacroBadge label="Fiber" value={`${previewTotals.fiber}`} />
              </View>
            </>
          ) : (
            <Text style={styles.previewEmpty}>
              Fill in a name and calories to see a preview here.
            </Text>
          )}
        </View>

        {error ? (
          <Text style={styles.error} testID="addcustom-error">
            {error}
          </Text>
        ) : null}
      </ScrollView>

      <View
        style={[
          styles.footer,
          { paddingBottom: insets.bottom + spacing.md },
        ]}
      >
        <Button
          title="Save custom food"
          leadingIcon="check"
          variant="primary"
          onPress={handleSave}
          disabled={!isValid}
          testID="addcustom-save"
        />
      </View>
    </View>
  );
}

function NumericField({
  label,
  suffix,
  value,
  onChangeText,
  testID,
}: {
  label: string;
  suffix: string;
  value: string;
  onChangeText: (text: string) => void;
  testID?: string;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View style={styles.fieldInputWrap}>
        <TextInput
          value={value}
          onChangeText={onChangeText}
          keyboardType="decimal-pad"
          placeholder="0"
          placeholderTextColor={colors.textPlaceholder}
          style={styles.fieldInput}
          returnKeyType="next"
          testID={testID}
        />
        <Text style={styles.fieldSuffix}>{suffix}</Text>
      </View>
    </View>
  );
}

function MacroBadge({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.previewMacroBadge}>
      <Text style={styles.previewMacroLabel}>{label}</Text>
      <Text style={styles.previewMacroValue}>{value || '0'}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scroll: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  section: {
    backgroundColor: colors.card,
    borderRadius: radii.xl,
    padding: spacing.lg,
    marginBottom: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 2,
  },
  sectionTitle: {
    fontFamily: 'Inter_700Bold',
    fontSize: 16,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  macroGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    justifyContent: 'space-between',
  },
  field: {
    width: '47%',
    marginBottom: spacing.xs,
  },
  fieldLabel: {
    fontFamily: 'Inter_500Medium',
    fontSize: 12,
    color: colors.textMuted,
    marginBottom: 4,
  },
  fieldInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: radii.sm,
    paddingHorizontal: spacing.sm,
    height: 44,
    borderWidth: 1,
    borderColor: colors.input,
  },
  fieldInput: {
    flex: 1,
    fontFamily: 'Inter_500Medium',
    fontSize: 15,
    color: colors.textPrimary,
  },
  fieldSuffix: {
    fontFamily: 'Inter_500Medium',
    fontSize: 12,
    color: colors.textMuted,
    marginLeft: spacing.xs,
  },
  previewCard: {
    backgroundColor: colors.darkSurface,
    borderRadius: radii.xl,
    padding: spacing.lg,
  },
  previewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  previewTitle: {
    flex: 1,
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
  },
  resetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.xs,
    paddingVertical: 4,
  },
  resetLabel: {
    fontFamily: 'Inter_500Medium',
    fontSize: 12,
    color: 'rgba(255,255,255,0.6)',
  },
  previewName: {
    fontFamily: 'Inter_700Bold',
    fontSize: 22,
    color: '#FFFFFF',
    letterSpacing: -0.4,
    marginTop: spacing.xs,
  },
  previewBrand: {
    fontFamily: 'Inter_500Medium',
    fontSize: 13,
    color: 'rgba(255,255,255,0.6)',
    marginTop: 2,
  },
  previewMeta: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    color: 'rgba(255,255,255,0.65)',
    marginTop: spacing.xs,
  },
  previewMacroRow: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginTop: spacing.md,
    flexWrap: 'wrap',
  },
  previewMacroBadge: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.10)',
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: radii.sm,
  },
  previewMacroLabel: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 11,
    color: 'rgba(255,255,255,0.6)',
  },
  previewMacroValue: {
    fontFamily: 'Inter_700Bold',
    fontSize: 14,
    color: '#FFFFFF',
  },
  previewEmpty: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    color: 'rgba(255,255,255,0.55)',
    marginTop: spacing.xs,
  },
  error: {
    fontFamily: 'Inter_500Medium',
    fontSize: 13,
    color: colors.accentRed,
    marginTop: spacing.sm,
    textAlign: 'center',
  },
  footer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    backgroundColor: colors.card,
    borderTopLeftRadius: radii.xl,
    borderTopRightRadius: radii.xl,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 8,
  },
  pressed: { opacity: 0.7 },
});
