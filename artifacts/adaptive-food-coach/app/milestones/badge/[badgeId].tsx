import React, { useMemo, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Feather } from '@expo/vector-icons';

import {
  BadgeIcon,
  Button,
  Card,
  Header,
  ProgressBar,
  SectionTitle,
} from '@/components/ui';
import { useAppStore } from '@/hooks/useAppStore';
import { useColors } from '@/hooks/useColors';
import { colors as tokens, radii, spacing } from '@/constants/tokens';
import type { MilestoneBadge } from '@/types';

type Toast = { id: number; message: string; tone: 'success' | 'info' };

export default function BadgeDetail() {
  const insets = useSafeAreaInsets();
  const palette = useColors();
  const router = useRouter();
  const params = useLocalSearchParams<{ badgeId: string }>();
  const badgeId = params.badgeId;

  const { state, actions } = useAppStore();
  const badge = useMemo(
    () => (state.milestones ?? []).find((m) => m.id === badgeId) ?? null,
    [state.milestones, badgeId],
  );

  const [toast, setToast] = useState<Toast | null>(null);

  const otherBadges = useMemo(() => {
    const list = (state.milestones ?? []).filter((m) => m.id !== badgeId);
    return list.slice(0, 3);
  }, [state.milestones, badgeId]);

  if (!badge) {
    return (
      <View style={[styles.container, { backgroundColor: palette.background }]}>
        <Stack.Screen options={{ title: 'Badge' }} />
        <Header title="Badge" />
        <View style={styles.fallback}>
          <Feather name="alert-circle" size={28} color={tokens.textMuted} />
          <Text style={[styles.fallbackTitle, { color: palette.foreground }]}>
            Badge not found
          </Text>
          <Text style={[styles.fallbackBody, { color: palette.mutedForeground }]}>
            The badge you are looking for does not exist any more.
          </Text>
          <Button title="Back to milestones" onPress={() => router.replace('/milestones')} />
        </View>
      </View>
    );
  }

  const unlockedDate = badge.unlockedAt
    ? new Date(badge.unlockedAt).toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      })
    : null;

  const completeLabel = badge.unlocked
    ? 'Unlocked'
    : `Keep going — ${Math.round(badge.progress * 100)}% complete`;

  const handleUnlock = async () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await actions.unlockMilestone(badge.id);
    setToast({ id: Date.now(), message: `${badge.title} unlocked!`, tone: 'success' });
    setTimeout(() => setToast(null), 2600);
  };

  const handleShare = () => {
    Haptics.selectionAsync();
    router.push(`/milestones/share/${badge.id}`);
  };

  const canManuallyComplete = !badge.unlocked && badge.progress >= 1;

  return (
    <View style={[styles.container, { backgroundColor: palette.background }]}>
      <Stack.Screen options={{ title: badge.title }} />
      <Header title={badge.title} subtitle={badge.category.replace(/^\w/, (c) => c.toUpperCase())} />

      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingBottom: insets.bottom + 160 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero card */}
        <View style={[styles.heroCard, { backgroundColor: tokens.darkSurface }]}>
          <View style={[styles.heroHalo, { backgroundColor: tierHalo(badge.tier) }]} />
          <View style={styles.heroTopRow}>
            <BadgeIcon
              tier={badge.tier}
              iconKey={badge.iconKey as any}
              progress={Math.max(0.35, badge.progress)}
              unlocked={badge.unlocked}
              size="lg"
            />
            <View style={styles.heroMetaColumn}>
              <View
                style={[
                  styles.tierPill,
                  {
                    backgroundColor: tierAccent(badge.tier),
                  },
                ]}
              >
                <Feather
                  name={badge.unlocked ? 'check-circle' : 'lock'}
                  size={11}
                  color={tokens.textInverse}
                />
                <Text style={styles.tierPillText}>{badge.tier.toUpperCase()}</Text>
              </View>
              <Text style={styles.heroCategory}>
                {badge.category.replace(/^\w/, (c) => c.toUpperCase())}
              </Text>
              {badge.unlocked ? (
                <Text style={styles.heroDate}>Unlocked {unlockedDate}</Text>
              ) : (
                <Text style={styles.heroDate}>{completeLabel}</Text>
              )}
            </View>
          </View>

          <View style={styles.heroDescriptionWrap}>
            <Text style={styles.heroDescription}>{badge.description}</Text>
          </View>

          <View style={styles.heroProgressRow}>
            <ProgressBar
              progress={Math.max(0.02, badge.progress)}
              color={badge.unlocked ? tokens.accentGreen : tokens.primary}
              backgroundColor="rgba(255,255,255,0.18)"
              height={6}
            />
            <Text style={styles.heroProgressText}>
              {badge.unlocked ? 'Unlocked' : `${Math.round(badge.progress * 100)}%`}
            </Text>
          </View>
        </View>

        {/* CTA buttons */}
        <View style={styles.actionStack}>
          {badge.unlocked ? (
            <Button
              title="Share achievement"
              onPress={handleShare}
              leadingIcon="share-2"
            />
          ) : canManuallyComplete ? (
            <>
              <Button
                title="Mark as unlocked"
                onPress={handleUnlock}
                leadingIcon="check"
              />
              <Button
                title="Share preview"
                variant="outline"
                onPress={handleShare}
                leadingIcon="share-2"
              />
            </>
          ) : (
            <View style={styles.lockCta}>
              <Feather name="lock" size={18} color={tokens.textMuted} />
              <Text style={[styles.lockCtaBody, { color: palette.mutedForeground }]}>
                Keep working toward this badge — the unlock CTA will appear once you’re 100% of the way there.
              </Text>
            </View>
          )}
        </View>

        {/* Status card */}
        <View style={styles.statusCard}>
          <SectionTitle title="Status" />
          <Card>
            <View style={styles.statusRow}>
              <StatusLine
                label="Tier"
                value={badge.tier.replace(/^\w/, (c) => c.toUpperCase())}
                icon="award"
              />
              <StatusLine
                label="Progress"
                value={`${Math.round(badge.progress * 100)}%`}
                icon="trending-up"
              />
              <StatusLine
                label="Category"
                value={badge.category.replace(/^\w/, (c) => c.toUpperCase())}
                icon="grid"
              />
              <StatusLine
                label="Unlocked"
                value={badge.unlocked ? 'Yes' : 'Not yet'}
                icon={badge.unlocked ? 'check-circle' : 'clock'}
              />
            </View>
          </Card>
        </View>

        {/* Tips card */}
        <View style={styles.tipsCard}>
          <SectionTitle title="How to unlock" />
          <Card>
            <View style={styles.tipList}>
              {tipsFor(badge).map((tip, idx) => (
                <View key={idx} style={styles.tipRow}>
                  <View style={styles.tipBullet}>
                    <Text style={styles.tipBulletText}>{idx + 1}</Text>
                  </View>
                  <Text style={[styles.tipText, { color: palette.foreground }]}>
                    {tip}
                  </Text>
                </View>
              ))}
            </View>
          </Card>
        </View>

        {/* Related badges */}
        {otherBadges.length > 0 && (
          <View style={styles.relatedCard}>
            <SectionTitle title="Related badges" />
            <View style={styles.relatedRow}>
              {otherBadges.map((other) => (
                <Pressable
                  key={other.id}
                  accessibilityRole="button"
                  accessibilityLabel={`${other.title} badge`}
                  onPress={() => {
                    Haptics.selectionAsync();
                    router.push(`/milestones/badge/${other.id}`);
                  }}
                  style={({ pressed }) => [
                    styles.relatedChip,
                    {
                      backgroundColor: palette.card,
                      opacity: pressed ? 0.92 : 1,
                    },
                  ]}
                >
                  <BadgeIcon
                    tier={other.tier}
                    iconKey={other.iconKey as any}
                    progress={Math.max(0.35, other.progress)}
                    unlocked={other.unlocked}
                    size="sm"
                  />
                  <Text
                    style={[styles.relatedChipText, { color: palette.foreground }]}
                    numberOfLines={2}
                  >
                    {other.title}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        )}
      </ScrollView>

      {toast && (
        <View
          pointerEvents="none"
          style={[
            styles.toast,
            {
              bottom: insets.bottom + 24,
              backgroundColor: toast.tone === 'success' ? tokens.darkSurface : tokens.card,
            },
          ]}
        >
          <Feather
            name={toast.tone === 'success' ? 'check' : 'info'}
            size={14}
            color={tokens.textInverse}
          />
          <Text style={styles.toastText}>{toast.message}</Text>
        </View>
      )}
    </View>
  );
}

function StatusLine({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: keyof typeof Feather.glyphMap;
}) {
  const palette = useColors();
  return (
    <View style={styles.statusLine}>
      <View style={styles.statusLabel}>
        <Feather name={icon} size={12} color={tokens.textMuted} />
        <Text style={[styles.statusLabelText, { color: palette.mutedForeground }]}>
          {label}
        </Text>
      </View>
      <Text style={[styles.statusValueText, { color: palette.foreground }]}>
        {value}
      </Text>
    </View>
  );
}

function tipsFor(badge: MilestoneBadge): string[] {
  switch (badge.category) {
    case 'streak':
      return [
        'Log at least one meal every day to keep your streak alive.',
        'Plan a few quick meals on busy days so you never skip a log.',
        'Aim for a balanced plate — protein + fiber + color.',
      ];
    case 'nutrition':
      return [
        'Hit your daily protein or fiber goal consistently.',
        'Try adding one new veggie to your plate each day.',
        'Pair meals with water to stay within hydration goals.',
      ];
    case 'exercise':
      return [
        'Schedule workouts in advance and log them the same day.',
        'Mix cardio, strength, and mobility for balanced credit.',
        'Use the GPS run tracker to capture outdoor sessions automatically.',
      ];
    case 'community':
      return [
        'Post a win in your accountability group at least once this week.',
        'React and comment on other members’ posts to stay engaged.',
        'Join a challenge to earn bonus social milestones.',
      ];
  }
}

export function tierAccent(tier: MilestoneBadge['tier']): string {
  switch (tier) {
    case 'bronze':
      return '#C2410C';
    case 'silver':
      return '#475569';
    case 'gold':
      return '#B45309';
    case 'platinum':
      return '#5B21B6';
  }
}

function tierHalo(tier: MilestoneBadge['tier']): string {
  switch (tier) {
    case 'bronze':
      return 'rgba(245,158,11,0.18)';
    case 'silver':
      return 'rgba(148,163,184,0.18)';
    case 'gold':
      return 'rgba(234,179,8,0.18)';
    case 'platinum':
      return 'rgba(124,58,237,0.18)';
  }
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xs,
  },
  fallback: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.xl,
  },
  fallbackTitle: {
    fontFamily: 'Inter_700Bold',
    fontSize: 18,
  },
  fallbackBody: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  heroCard: {
    borderRadius: radii.xl,
    padding: spacing.lg,
    overflow: 'hidden',
    gap: spacing.md,
  },
  heroHalo: {
    position: 'absolute',
    right: -40,
    top: -40,
    width: 200,
    height: 200,
    borderRadius: 100,
  },
  heroTopRow: {
    flexDirection: 'row',
    gap: spacing.md,
    alignItems: 'center',
  },
  heroMetaColumn: {
    flex: 1,
    gap: spacing.xs,
  },
  tierPill: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radii.pill,
  },
  tierPillText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 10,
    color: tokens.textInverse,
    letterSpacing: 0.4,
  },
  heroCategory: {
    color: 'rgba(255,255,255,0.7)',
    fontFamily: 'Inter_500Medium',
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  heroDate: {
    color: tokens.textInverse,
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
  },
  heroDescriptionWrap: {
    paddingVertical: spacing.sm,
  },
  heroDescription: {
    color: 'rgba(255,255,255,0.86)',
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    lineHeight: 21,
  },
  heroProgressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  heroProgressText: {
    color: 'rgba(255,255,255,0.7)',
    fontFamily: 'Inter_500Medium',
    fontSize: 11,
    letterSpacing: 0.4,
  },
  actionStack: {
    gap: spacing.sm,
    marginVertical: spacing.md,
  },
  lockCta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: tokens.border,
    backgroundColor: tokens.card,
  },
  lockCtaBody: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    lineHeight: 18,
    flex: 1,
  },
  statusCard: {
    marginBottom: spacing.md,
  },
  statusRow: {
    gap: spacing.sm,
  },
  statusLine: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.xs,
  },
  statusLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  statusLabelText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  statusValueText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 13,
  },
  tipsCard: {
    marginBottom: spacing.md,
  },
  tipList: {
    gap: spacing.sm,
  },
  tipRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'flex-start',
  },
  tipBullet: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: tokens.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tipBulletText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 11,
    color: tokens.primary,
  },
  tipText: {
    flex: 1,
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    lineHeight: 19,
  },
  relatedCard: {
    marginBottom: spacing.lg,
  },
  relatedRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  relatedChip: {
    flex: 1,
    padding: spacing.sm,
    borderRadius: radii.lg,
    alignItems: 'center',
    gap: spacing.xs,
  },
  relatedChipText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 11,
    textAlign: 'center',
    maxWidth: 110,
  },
  toast: {
    position: 'absolute',
    left: spacing.lg,
    right: spacing.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.pill,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  toastText: {
    color: tokens.textInverse,
    fontFamily: 'Inter_600SemiBold',
    fontSize: 13,
  },
});
