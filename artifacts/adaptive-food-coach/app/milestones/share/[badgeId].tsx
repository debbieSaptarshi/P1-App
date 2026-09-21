import React, { useMemo, useRef, useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import ViewShot, { type ViewShotRef } from 'react-native-view-shot';

import { CircleIconButton } from '@/components/meals/CircleIconButton';
import { FlameMark } from '@/components/milestones/FlameMark';
import { HexBadge } from '@/components/milestones/HexBadge';
import { colors, radii, spacing } from '@/constants/tokens';
import {
  badgeShareCaption,
  encouragementFor,
  featuredEarnedBadges,
  formatStartedOn,
  mergeMilestoneCatalog,
  shareCaption,
  streakFromLogs,
} from '@/lib/milestones';
import {
  captureShareCard,
  copyCaption,
  openInstagramOrShare,
  openMessages,
  saveImageToLibrary,
  systemShare,
} from '@/lib/shareMilestone';
import { useAppStore } from '@/hooks/useAppStore';
import type { MilestoneBadge } from '@/types';

const iconBack = require('@/assets/images/milestones/back.svg');
const iconShare = require('@/assets/images/milestones/share.svg');
const iconInstagram = require('@/assets/images/milestones/share/instagram.svg');
const iconMessages = require('@/assets/images/milestones/share/messages.svg');
const iconSave = require('@/assets/images/milestones/share/save-icon.svg');
const iconMore = require('@/assets/images/milestones/share/more-icon.svg');
const iconCopy = require('@/assets/images/milestones/share/copy-icon.svg');

export default function ShareBadgeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams<{ badgeId: string; ids?: string }>();
  const { state } = useAppStore();
  const cardRef = useRef<ViewShotRef>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const catalog = useMemo(
    () => mergeMilestoneCatalog(state.milestones ?? []),
    [state.milestones],
  );
  const streaks = useMemo(
    () => streakFromLogs(state.foodLogs ?? []),
    [state.foodLogs],
  );
  const unlockedCount = catalog.filter((badge) => badge.unlocked).length;
  const dayStreak = Math.max(streaks.current, unlockedCount > 0 ? 1 : 0);
  const isStreak = !params.badgeId || params.badgeId === 'streak';
  const selectedIds = typeof params.ids === 'string'
    ? params.ids.split(',').map((id) => id.trim()).filter(Boolean)
    : undefined;

  const badge = useMemo(
    () => (isStreak ? null : catalog.find((item) => item.id === params.badgeId) ?? null),
    [catalog, isStreak, params.badgeId],
  );
  const earned = useMemo(
    () => featuredEarnedBadges(catalog, selectedIds),
    [catalog, selectedIds],
  );

  const startedLabel = formatStartedOn(
    streaks.startedOn ?? catalog.find((item) => item.unlocked)?.unlockedAt,
  );
  const unlockedLabel = formatStartedOn(badge?.unlockedAt);
  const caption = badge
    ? badgeShareCaption(badge, unlockedLabel)
    : shareCaption(dayStreak, startedLabel);

  const close = () => {
    Haptics.selectionAsync();
    if (router.canGoBack()) router.back();
  };

  const flash = (message: string) => {
    setToast(message);
    setTimeout(() => setToast(null), 2200);
  };

  const withCard = async (run: (uri: string | null) => Promise<void>, fallback: string) => {
    if (busy) return;
    setBusy(true);
    Haptics.selectionAsync();
    try {
      const uri = await captureShareCard(cardRef);
      await run(uri);
    } catch (error) {
      flash(error instanceof Error ? error.message : fallback);
    } finally {
      setBusy(false);
    }
  };

  const onInstagram = () =>
    withCard(async (uri) => {
      const result = await openInstagramOrShare(caption, uri);
      flash(result === 'instagram' ? 'Opened Instagram' : 'Opened share sheet');
    }, 'Could not open Instagram');

  const onMessages = () =>
    withCard(async () => {
      await openMessages(caption);
    }, 'Could not open Messages');

  const onSave = () =>
    withCard(async (uri) => {
      if (!uri) throw new Error('Could not capture the share card.');
      await saveImageToLibrary(uri);
      flash('Saved to photos');
    }, 'Could not save image');

  const onMore = () =>
    withCard(async (uri) => {
      await systemShare(caption, uri);
    }, 'Sharing was cancelled');

  const onCopy = async () => {
    Haptics.selectionAsync();
    try {
      await copyCaption(caption);
      flash('Caption copied');
    } catch {
      flash('Could not copy caption');
    }
  };

  return (
    <View style={styles.root}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Dismiss share sheet"
        testID="milestones-share-overlay"
        onPress={close}
        style={styles.overlay}
      />

      <View
        pointerEvents="box-none"
        style={[styles.chrome, { paddingTop: insets.top + 8 }]}
      >
        <CircleIconButton
          source={iconBack}
          accessibilityLabel="Close share"
          testID="milestones-share-back"
          onPress={close}
        />
        <CircleIconButton
          source={iconShare}
          accessibilityLabel="Share via more"
          testID="milestones-share-top"
          onPress={() => void onMore()}
        />
      </View>

      <View
        pointerEvents="box-none"
        style={[
          styles.sheetWrap,
          {
            paddingTop: insets.top + 56,
            paddingBottom: Math.max(insets.bottom, 8),
          },
        ]}
      >
        <View style={styles.sheet}>
          <ViewShot
            ref={cardRef}
            options={{ format: 'png', quality: 1, result: 'tmpfile' }}
            style={styles.capture}
          >
            <View collapsable={false} style={styles.captureInner}>
            <LinearGradient
              colors={
                isStreak
                  ? ['#EF4444', 'rgba(239,68,68,0.42)', 'rgba(255,255,255,0)']
                  : ['#F38744', 'rgba(243,135,68,0.42)', 'rgba(255,255,255,0)']
              }
              start={{ x: 1, y: 0 }}
              end={{ x: 0.28, y: 0.72 }}
              style={styles.glow}
            />

            <View style={styles.handleRow}>
              <View style={styles.handle} />
            </View>

            {badge ? (
              <BadgeHero badge={badge} unlockedLabel={unlockedLabel} />
            ) : (
              <StreakHero dayStreak={dayStreak} startedLabel={startedLabel} earned={earned} />
            )}
            </View>
          </ViewShot>

          <View style={styles.actions}>
            <ShareAction
              label="Instagram"
              source={iconInstagram}
              iconSize={40}
              filled={false}
              onPress={() => void onInstagram()}
            />
            <ShareAction
              label="Messages"
              source={iconMessages}
              iconSize={40}
              filled={false}
              onPress={() => void onMessages()}
            />
            <ShareAction
              label="Save"
              source={iconSave}
              iconSize={20}
              onPress={() => void onSave()}
            />
            <ShareAction
              label="More"
              source={iconMore}
              iconSize={20}
              onPress={() => void onMore()}
            />
            <ShareAction
              label="Copy"
              source={iconCopy}
              iconSize={20}
              onPress={() => void onCopy()}
            />
          </View>
        </View>
      </View>

      {toast ? (
        <View pointerEvents="none" style={[styles.toast, { bottom: insets.bottom + 28 }]}>
          <Text style={styles.toastText}>{toast}</Text>
        </View>
      ) : null}
    </View>
  );
}

function StreakHero({
  dayStreak,
  startedLabel,
  earned,
}: {
  dayStreak: number;
  startedLabel: string | null;
  earned: MilestoneBadge[];
}) {
  return (
    <>
      <View style={styles.hero}>
        <View style={styles.flameHero}>
          <FlameMark size={200} variant="share" />
          <View style={styles.streakOrb}>
            <Text style={styles.streakOrbText}>{dayStreak}</Text>
          </View>
        </View>
        <Text style={styles.title}>{dayStreak} Day Streak</Text>
        <Text style={styles.started}>
          {startedLabel ? `Started on ${startedLabel}` : 'Keep logging to start a streak'}
        </Text>
      </View>

      <View style={styles.earnedBlock}>
        <Text style={styles.earnedLabel}>My Badge Earned</Text>
        <View style={styles.earnedRow}>
          {earned.map((item) => (
            <HexBadge key={item.id} badge={item} showCaption={false} />
          ))}
        </View>
        <View style={styles.spacer} />
      </View>
    </>
  );
}

function BadgeHero({
  badge,
  unlockedLabel,
}: {
  badge: MilestoneBadge;
  unlockedLabel: string | null;
}) {
  return (
    <>
      <View style={[styles.hero, styles.badgeHero]}>
        <HexBadge badge={{ ...badge, unlocked: true }} showCaption={false} size={200} />
        <Text style={styles.eyebrow}>
          {badge.unlocked ? 'Badge Unlocked' : 'Badge Preview'}
        </Text>
        <Text style={styles.title}>{badge.title}</Text>
        <Text style={styles.started}>{badge.description}</Text>
      </View>
      <View style={styles.noteBlock}>
        <Text style={styles.note}>
          {badge.unlocked && unlockedLabel
            ? `Unlocked on ${unlockedLabel}`
            : 'Keep going — this one is still in progress.'}
        </Text>
        <Text style={styles.note}>{encouragementFor(badge)}</Text>
        <View style={styles.spacer} />
      </View>
    </>
  );
}

function ShareAction({
  label,
  source,
  iconSize,
  filled = true,
  onPress,
}: {
  label: string;
  source: number;
  iconSize: number;
  filled?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      testID={`milestones-share-${label.toLowerCase()}`}
      onPress={onPress}
      style={({ pressed }) => [styles.action, pressed && styles.actionPressed]}
    >
      <View style={[styles.actionIcon, filled && styles.actionIconFilled]}>
        <Image
          source={source}
          style={{ width: iconSize, height: iconSize }}
          contentFit="contain"
        />
      </View>
      <Text style={styles.actionLabel}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'transparent',
  },
  overlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(26,26,26,0.75)',
  },
  chrome: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 2,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
  },
  sheetWrap: {
    flex: 1,
    paddingHorizontal: spacing.xs,
    zIndex: 1,
  },
  sheet: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: radii.xl,
    overflow: 'hidden',
  },
  capture: {
    flex: 1,
    backgroundColor: colors.card,
  },
  captureInner: {
    flex: 1,
  },
  glow: {
    position: 'absolute',
    right: 0,
    top: 0,
    width: '100%',
    height: 510,
  },
  handleRow: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
  },
  handle: {
    width: 48,
    height: 4,
    borderRadius: radii.pill,
    backgroundColor: 'rgba(255,255,255,0.7)',
  },
  hero: {
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xxl,
  },
  badgeHero: {
    paddingBottom: spacing.md,
  },
  flameHero: {
    width: 200,
    height: 200,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  streakOrb: {
    position: 'absolute',
    bottom: 18,
    minWidth: 48,
    height: 48,
    paddingHorizontal: 4,
    borderRadius: radii.pill,
    backgroundColor: colors.darkSurface,
    borderWidth: 2,
    borderColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  streakOrbText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 32,
    lineHeight: 40,
    letterSpacing: -0.36,
    color: colors.textInverse,
    textAlign: 'center',
  },
  title: {
    fontFamily: 'Inter_500Medium',
    fontSize: 40,
    lineHeight: 48,
    letterSpacing: -0.3,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  eyebrow: {
    marginTop: spacing.sm,
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: -0.12,
    color: colors.textMuted,
    textAlign: 'center',
  },
  started: {
    marginTop: 2,
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: -0.12,
    color: colors.textMuted,
    textAlign: 'center',
  },
  earnedBlock: {
    flexGrow: 1,
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: 24,
  },
  spacer: {
    flexGrow: 1,
    minHeight: 24,
  },
  earnedLabel: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    lineHeight: 20,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  earnedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xxl,
    width: '100%',
  },
  noteBlock: {
    flexGrow: 1,
    paddingHorizontal: spacing.lg,
    paddingVertical: 60,
    alignItems: 'center',
  },
  note: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    lineHeight: 20,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xxl,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xl,
  },
  action: {
    width: 60,
    alignItems: 'center',
    gap: spacing.xs,
  },
  actionPressed: { opacity: 0.72 },
  actionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionIconFilled: {
    backgroundColor: colors.background,
  },
  actionLabel: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: -0.12,
    color: colors.textPrimary,
  },
  toast: {
    position: 'absolute',
    left: 24,
    right: 24,
    backgroundColor: colors.darkSurface,
    borderRadius: radii.pill,
    paddingHorizontal: 16,
    paddingVertical: 10,
    alignItems: 'center',
    zIndex: 3,
  },
  toastText: {
    color: colors.textInverse,
    fontFamily: 'Inter_600SemiBold',
    fontSize: 13,
  },
});
