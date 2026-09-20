import { Alert } from 'react-native';
import { configureReminders } from '@/services/notifications';
import { errorMessage } from '@/services/api';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { colors, radii, spacing } from '@/constants/tokens';
import { Button, Card, Header, TextField } from '@/components/ui';
import { useAppStore, appStoreActions } from '@/hooks/useAppStore';
import type { DietPattern, WorkoutFrequency } from '@/types';

interface NotificationToggles {
  daily: boolean;
  weekly: boolean;
  sound: boolean;
}

interface ToggleRow {
  key: keyof NotificationToggles;
  label: string;
  description: string;
  icon: keyof typeof Feather.glyphMap;
}

const NOTIFICATION_TOGGLES: ToggleRow[] = [
  { key: 'daily', label: 'Meal reminders', description: 'Daily at 8 am, 1 pm and 7 pm on this device.', icon: 'bell' },
  { key: 'weekly', label: 'Weekly review reminder', description: 'A reminder every Monday at 9 am.', icon: 'mail' },
  { key: 'sound', label: 'Reminder sounds', description: 'Play a sound with scheduled reminders.', icon: 'volume-2' },
];

const DIET_OPTIONS: { key: DietPattern; label: string }[] = [
  { key: 'omnivore', label: 'Omnivore' },
  { key: 'vegetarian', label: 'Vegetarian' },
  { key: 'vegan', label: 'Vegan' },
  { key: 'pescatarian', label: 'Pescatarian' },
  { key: 'keto', label: 'Keto' },
  { key: 'mediterranean', label: 'Mediterranean' },
  { key: 'custom', label: 'Custom' },
];

const ACTIVITY_OPTIONS: { key: WorkoutFrequency; label: string }[] = [
  { key: 'never', label: 'Never' },
  { key: 'rarely', label: 'Rarely' },
  { key: '1_2_per_week', label: '1–2 / week' },
  { key: '3_4_per_week', label: '3–4 / week' },
  { key: '5_plus_per_week', label: '5+ / week' },
];

/**
 * Preferences screen — collects notification switches, dietary preferences,
 * activity cadence, and an allergies free-text input.
 *
 * Persists the entire profile via `actions.updateProfile` on save.
 */
export default function PreferencesEditScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { state } = useAppStore();
  const [notifDraft, setNotifDraft] = useState<NotificationToggles>({
    daily: state.preferences.reminders?.daily ?? false,
    weekly: state.preferences.reminders?.weekly ?? false,
    sound: state.preferences.reminders?.sound ?? true,
  });
  const [dietDraft, setDietDraft] = useState<DietPattern>(state.profile.dietPattern);
  const [activityDraft, setActivityDraft] = useState<WorkoutFrequency>(state.profile.workoutFrequency);
  const [allergiesDraft, setAllergiesDraft] = useState(state.profile.allergies.join(', '));

  const save = async () => {
    try {
    await configureReminders(notifDraft);
    await appStoreActions.updatePreferences({ reminders: notifDraft });
    await appStoreActions.updateProfile({
      dietPattern: dietDraft,
      workoutFrequency: activityDraft,
      allergies: parseAllergies(allergiesDraft),
      updatedAt: new Date().toISOString(),
    });
    router.back();
    } catch(error) { Alert.alert('Unable to save preferences', errorMessage(error)); }
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <Header
        title="Preferences"
        subtitle="Notifications, allergies, and habits"
        rightIcon="check"
        onRightPress={save}
      />
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: spacing.lg,
          paddingBottom: insets.bottom + spacing.xxxl,
        }}
        showsVerticalScrollIndicator={false}
      >
        <SectionHeader title="Notifications" />
        <Card>
          {NOTIFICATION_TOGGLES.map((row, index) => (
            <View key={row.key}>
              {index > 0 && <View style={styles.divider} />}
              <View style={styles.notifRow}>
                <View style={styles.notifIcon}>
                  <Feather name={row.icon} size={18} color={colors.primary} />
                </View>
                <View style={styles.notifBody}>
                  <Text style={styles.notifLabel}>{row.label}</Text>
                  <Text style={styles.notifDescription}>{row.description}</Text>
                </View>
                <Switch
                  value={notifDraft[row.key]}
                  onValueChange={(v) =>
                    setNotifDraft((prev) => ({ ...prev, [row.key]: v }))
                  }
                  trackColor={{ false: colors.input, true: colors.primarySoft }}
                  thumbColor={notifDraft[row.key] ? colors.primary : colors.card}
                  ios_backgroundColor={colors.input}
                  testID={`pref-switch-${row.key}`}
                />
              </View>
            </View>
          ))}
        </Card>

        <SectionHeader title="Dietary Pattern" />
        <Card>
          <View style={styles.chipWrap}>
            {DIET_OPTIONS.map((opt) => (
              <Chip
                key={opt.key}
                label={opt.label}
                active={dietDraft === opt.key}
                onPress={() => setDietDraft(opt.key)}
              />
            ))}
          </View>
        </Card>

        <SectionHeader title="Activity Frequency" />
        <Card>
          <View style={styles.chipWrap}>
            {ACTIVITY_OPTIONS.map((opt) => (
              <Chip
                key={opt.key}
                label={opt.label}
                active={activityDraft === opt.key}
                onPress={() => setActivityDraft(opt.key)}
              />
            ))}
          </View>
        </Card>

        <SectionHeader title="Allergies" />
        <Card>
          <TextField
            label="Allergies"
            helper="Comma-separated — e.g. peanut, shellfish"
            value={allergiesDraft}
            onChangeText={setAllergiesDraft}
            autoCapitalize="none"
            placeholder="peanut, shellfish"
            testID="allergies-input"
          />
        </Card>

        <Button title="Save Preferences" onPress={save} leadingIcon="check" style={styles.saveCta} />
      </ScrollView>
    </View>
  );
}

function SectionHeader({ title }: { title: string }) {
  return <Text style={styles.sectionHeader}>{title}</Text>;
}

interface ChipProps {
  label: string;
  active: boolean;
  onPress: () => void;
}

function Chip({ label, active, onPress }: ChipProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      testID={`pref-chip-${label.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`}
      onPress={onPress}
      style={({ pressed }) => [
        styles.chip,
        active && styles.chipActive,
        pressed && styles.chipPressed,
      ]}
    >
      <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
    </Pressable>
  );
}

function parseAllergies(input: string): string[] {
  return input
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  sectionHeader: {
    fontFamily: 'Inter_700Bold',
    fontSize: 14,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginTop: spacing.lg,
    marginBottom: spacing.xs,
  },
  notifRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.xs,
    gap: spacing.sm,
  },
  notifIcon: {
    width: 36,
    height: 36,
    borderRadius: radii.lg,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primarySoft,
  },
  notifBody: { flex: 1, paddingRight: spacing.xs },
  notifLabel: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 15,
    color: colors.textPrimary,
  },
  notifDescription: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.xs,
  },
  chipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  chip: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: radii.pill,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipActive: {
    backgroundColor: colors.primarySoft,
    borderColor: colors.primary,
  },
  chipPressed: { opacity: 0.75 },
  chipText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 13,
    color: colors.textPrimary,
  },
  chipTextActive: {
    color: colors.primary,
  },
  saveCta: { marginTop: spacing.xl },
});
