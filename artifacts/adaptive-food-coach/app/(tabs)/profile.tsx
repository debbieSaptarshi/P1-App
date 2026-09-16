import { router, type RelativePathString } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, radii, spacing } from '@/constants/tokens';
import { Button, Card, ModalSheet, SectionTitle } from '@/components/ui';
import { appStoreActions, useAppStore } from '@/hooks/useAppStore';

type ProfileHref =
  | '/profile-edit/weight'
  | '/profile-edit/height'
  | '/profile-edit/dob'
  | '/profile-edit/steps'
  | '/profile-edit/nutrients'
  | '/profile-edit/preferences';

interface DetailRow {
  key: string;
  label: string;
  value: string;
  href: ProfileHref;
}

interface DetailCardProps {
  title: string;
  rows: DetailRow[];
  subtitle?: string;
}

const CM_TO_FT_IN = (cm: number) => {
  const totalInches = cm / 2.54;
  const ft = Math.floor(totalInches / 12);
  const inches = Math.round(totalInches - ft * 12);
  return `${ft}'${inches}"`;
};

const formatDob = (iso: string): string => {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
};

const WORKOUT_LABELS: Record<string, string> = {
  never: 'Never',
  rarely: 'Rarely',
  '1_2_per_week': '1–2 / week',
  '3_4_per_week': '3–4 / week',
  '5_plus_per_week': '5+ / week',
};

const DIET_LABELS: Record<string, string> = {
  omnivore: 'Omnivore',
  vegetarian: 'Vegetarian',
  vegan: 'Vegan',
  pescatarian: 'Pescatarian',
  keto: 'Keto',
  mediterranean: 'Mediterranean',
  custom: 'Custom',
};

/**
 * Profile tab landing.
 *
 * - Avatar + name + edit pencil
 * - Three Card sections (Personal Details, Daily Goals, Activity)
 * - Subscription & Preferences CTAs
 * - Sign Out with ModalSheet confirmation
 */
export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { state } = useAppStore();
  const { profile } = state;
  const [confirmSignOut, setConfirmSignOut] = useState(false);

  const personalRows: DetailRow[] = [
    {
      key: 'weight',
      label: 'Weight',
      value: `${profile.currentWeightKg.toFixed(1)} kg`,
      href: '/profile-edit/weight',
    },
    {
      key: 'height',
      label: 'Height',
      value: `${profile.heightCm} cm · ${CM_TO_FT_IN(profile.heightCm)}`,
      href: '/profile-edit/height',
    },
    {
      key: 'dob',
      label: 'Date of Birth',
      value: formatDob(profile.dateOfBirth),
      href: '/profile-edit/dob',
    },
  ];

  const goalsRows: DetailRow[] = [
    {
      key: 'steps',
      label: 'Daily steps',
      value: profile.dailyStepGoal.toLocaleString(),
      href: '/profile-edit/steps',
    },
    {
      key: 'nutrients',
      label: 'Nutrient goals',
      value: `${profile.nutrientGoals.calories} kcal · ${profile.nutrientGoals.protein} g protein`,
      href: '/profile-edit/nutrients',
    },
    {
      key: 'water',
      label: 'Water',
      value: `${(profile.nutrientGoals.waterMl / 1000).toFixed(1)} L`,
      href: '/profile-edit/nutrients',
    },
  ];

  const activityRows: DetailRow[] = [
    {
      key: 'workout',
      label: 'Workouts',
      value: WORKOUT_LABELS[profile.workoutFrequency] ?? 'Rarely',
      href: '/profile-edit/preferences',
    },
    {
      key: 'diet',
      label: 'Diet pattern',
      value: DIET_LABELS[profile.dietPattern] ?? 'Custom',
      href: '/profile-edit/preferences',
    },
    {
      key: 'allergies',
      label: 'Allergies',
      value: profile.allergies.length === 0 ? 'None' : profile.allergies.join(', '),
      href: '/profile-edit/preferences',
    },
  ];

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={{
          paddingTop: insets.top + spacing.md,
          paddingHorizontal: spacing.lg,
          paddingBottom: insets.bottom + spacing.xxxl,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.identity}>
            <View style={styles.avatarWrap}>
              <Image
                source={require('@/assets/images/roasted-chicken.png')}
                style={styles.avatar}
                accessibilityLabel="User avatar"
              />
            </View>
            <View style={styles.identityText}>
              <Text style={styles.greeting}>Profile</Text>
              <Text style={styles.name}>{profile.name}</Text>
              <Text style={styles.email}>{profile.email}</Text>
            </View>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Edit profile"
            testID="profile-edit-pencil"
            onPress={() => router.push('/profile-edit/weight')}
            style={({ pressed }) => [styles.editBtn, pressed && styles.pressed]}
          >
            <Feather name="edit-2" size={18} color={colors.textPrimary} />
          </Pressable>
        </View>

        {/* Personal Details */}
        <View style={styles.section}>
          <SectionTitle title="Personal Details" />
          <DetailCard title="My body" rows={personalRows} />
        </View>

        {/* Daily Goals */}
        <View style={styles.section}>
          <SectionTitle title="Daily Goals" />
          <DetailCard title="Targets" rows={goalsRows} />
        </View>

        {/* Activity */}
        <View style={styles.section}>
          <SectionTitle title="Activity" />
          <DetailCard title="Habits" rows={activityRows} />
        </View>

        {/* Subscription & Preferences */}
        <View style={styles.ctaRow}>
          <Button
            variant="inverse"
            title="Subscription"
            leadingIcon="award"
            onPress={() => router.push('/profile-edit/subscription')}
            style={styles.cta}
            testID="cta-subscription"
          />
          <Button
            variant="inverse"
            title="Preferences"
            leadingIcon="settings"
            onPress={() => router.push('/profile-edit/preferences')}
            style={styles.cta}
            testID="cta-preferences"
          />
        </View>

        <Button
          variant="outline"
          title="Sign Out"
          leadingIcon="log-out"
          onPress={() => setConfirmSignOut(true)}
          style={styles.signOut}
          testID="cta-signout"
        />
      </ScrollView>

      <ModalSheet
        visible={confirmSignOut}
        onClose={() => setConfirmSignOut(false)}
        title="Sign out?"
      >
        <Text style={styles.confirmBody}>
          Your data stays on this device, but you’ll need to sign back in to
          sync your activity.
        </Text>
        <View style={styles.confirmRow}>
          <Button
            variant="outline"
            title="Cancel"
            onPress={() => setConfirmSignOut(false)}
            style={styles.confirmBtn}
          />
          <Button
            title="Sign Out"
            onPress={() => {
              setConfirmSignOut(false);
              appStoreActions.reset();
              router.replace('/');
            }}
            style={styles.confirmBtn}
            testID="signout-confirm"
          />
        </View>
      </ModalSheet>
    </View>
  );
}

function DetailCard({ title, subtitle, rows }: DetailCardProps) {
  return (
    <Card>
      <View style={styles.detailHeader}>
        <Feather name="sliders" size={14} color={colors.textMuted} />
        <Text style={styles.detailTitle}>{title}</Text>
        {subtitle && <Text style={styles.detailSubtitle}>{subtitle}</Text>}
      </View>
      <View style={styles.detailRows}>
        {rows.map((row, i) => (
          <React.Fragment key={row.key}>
            {i > 0 && <View style={styles.rowDivider} />}
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Edit ${row.label}`}
              testID={`detail-row-${row.key}`}
              onPress={() => router.push(row.href as RelativePathString)}
              style={({ pressed }) => [styles.row, pressed && styles.pressed]}
            >
              <View>
                <Text style={styles.rowLabel}>{row.label}</Text>
                <Text style={styles.rowValue} numberOfLines={1}>{row.value}</Text>
              </View>
              <Feather name="chevron-right" size={18} color={colors.textMuted} />
            </Pressable>
          </React.Fragment>
        ))}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  identity: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flex: 1 },
  avatarWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    overflow: 'hidden',
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatar: { width: 64, height: 64, resizeMode: 'cover' },
  identityText: { flex: 1 },
  greeting: {
    fontFamily: 'Inter_500Medium',
    fontSize: 12,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  name: {
    fontFamily: 'Inter_700Bold',
    fontSize: 22,
    color: colors.textPrimary,
    letterSpacing: -0.4,
  },
  email: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: colors.textMuted,
  },
  editBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: { opacity: 0.7 },
  section: { marginBottom: spacing.lg },
  detailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  detailTitle: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 13,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  detailSubtitle: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: colors.textMuted,
  },
  detailRows: {},
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
  },
  rowLabel: {
    fontFamily: 'Inter_500Medium',
    fontSize: 12,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  rowValue: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 15,
    color: colors.textPrimary,
    marginTop: 2,
  },
  rowDivider: {
    height: 1,
    backgroundColor: colors.border,
  },
  ctaRow: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  cta: { flex: 1 },
  signOut: { marginTop: spacing.sm, borderRadius: radii.xl },
  confirmBody: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: colors.textPrimary,
    lineHeight: 20,
    marginBottom: spacing.md,
  },
  confirmRow: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  confirmBtn: { flex: 1 },
});
