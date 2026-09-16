import React, { useMemo, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Feather } from '@expo/vector-icons';

import {
  BadgeIcon,
  Button,
  Card,
  Header,
  ModalSheet,
} from '@/components/ui';
import { useAppStore } from '@/hooks/useAppStore';
import { useColors } from '@/hooks/useColors';
import { colors as tokens, radii, spacing } from '@/constants/tokens';
import type { MilestoneBadge } from '@/types';

type Toast = { id: number; message: string; tone: 'success' | 'info' };

type ShareProps = {
  /** When provided, the screen acts as a navigator route; when undefined, the modal is self-mounted. */
  badgeIdOverride?: string;
  /** Called when the user dismisses the share experience. Required in self-mounted mode. */
  onDismiss?: () => void;
};

/**
 * The share sheet doubles as an expo-router route (/milestones/share/[badgeId])
 * and as a self-mounting modal that any screen can render inline.
 *
 * In route mode the sheet defaults to "open"; in inline mode callers
 * pass `visible` and `onDismiss` to control it directly.
 */
export default function ShareBadgeScreen(props: ShareProps) {
  return <ShareBadgeInner {...props} />;
}

/**
 * BindMount is a tiny helper other screens use to mount the share flow
 * without navigating. It returns a component that always renders itself
 * inside a ModalSheet so the rest of the app can present the share UI
 * from any host.
 */
export function ShareBadgeMount({
  visible,
  badgeId,
  onClose,
}: {
  visible: boolean;
  badgeId?: string;
  onClose: () => void;
}) {
  return <ShareBadgeInner badgeIdOverride={badgeId} onDismiss={onClose} mounted={visible} />;
}

function ShareBadgeInner({
  badgeIdOverride,
  onDismiss,
  mounted: mountedProp,
}: ShareProps & { mounted?: boolean }) {
  const insets = useSafeAreaInsets();
  const palette = useColors();
  const router = useRouter();
  const params = useLocalSearchParams<{ badgeId: string }>();

  const { state, actions } = useAppStore();
  const badgeId = badgeIdOverride ?? params.badgeId;
  const badge = useMemo(
    () => (state.milestones ?? []).find((m) => m.id === badgeId) ?? null,
    [state.milestones, badgeId],
  );

  const [toast, setToast] = useState<Toast | null>(null);

  const caption = useMemo(() => {
    if (!badge) return '';
    if (badge.unlocked) {
      return `I just unlocked the "${badge.title}" badge in Adaptive Food Coach! ${badge.description}`;
    }
    return `Working toward the "${badge.title}" badge in Adaptive Food Coach — ${Math.round(badge.progress * 100)}% there.`;
  }, [badge]);

  const handleClose = () => {
    Haptics.selectionAsync();
    if (onDismiss) {
      onDismiss();
    } else if (router.canGoBack()) {
      router.back();
    }
  };

  const handleUnlockForShare = async () => {
    if (!badge) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await actions.unlockMilestone(badge.id);
    setToast({ id: Date.now(), message: `${badge.title} unlocked!`, tone: 'success' });
    setTimeout(() => setToast(null), 2600);
  };

  const flashToast = (message: string, tone: Toast['tone'] = 'info') => {
    Haptics.selectionAsync();
    setToast({ id: Date.now(), message, tone });
    setTimeout(() => setToast(null), 2200);
  };

  // ---- Self-mounting modal mode --------------------------------------------
  const mounted = mountedProp ?? false;
  const containerStyle = { backgroundColor: palette.background };
  const body = (
    <View style={[styles.container, containerStyle]}>
      <Header
        title="Share"
        rightIcon="x"
        onRightPress={handleClose}
        showBack={false}
      />
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingBottom: insets.bottom + 32 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <ShareSummary badge={badge} caption={caption} />
        <ShareDestinations
          onCopyCaption={() => flashToast('Caption copied to clipboard', 'success')}
          onShareVia={() => flashToast('Opening system share sheet…', 'info')}
          onSaveImage={() => flashToast('Badge image saved (preview)', 'success')}
        />
        {!badge?.unlocked && (
          <Card style={styles.unlockCard}>
            <View style={styles.unlockRow}>
              <Feather name="zap" size={18} color={tokens.accentOrange} />
              <Text style={[styles.unlockCardTitle, { color: palette.foreground }]}>
                Want to share a real win?
              </Text>
            </View>
            <Text style={[styles.unlockCardBody, { color: palette.mutedForeground }]}>
              Mark as unlocked now so your post shows the achievement.
            </Text>
            {badge && badge.progress < 1 ? (
              <Text style={[styles.unlockFootnote, { color: palette.mutedForeground }]}>
                You’re currently at {Math.round(badge.progress * 100)}% — once you reach 100% the unlock CTA will appear here automatically.
              </Text>
            ) : (
              <Button
                title="Mark as unlocked"
                onPress={handleUnlockForShare}
                style={styles.unlockButton}
              />
            )}
          </Card>
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

  if (!badgeId && !mounted) {
    // No binding yet (e.g. accessed directly). Render the body so the route has something.
    return body;
  }

  if (mounted) {
    return (
      <ModalSheet
        visible={mounted}
        onClose={handleClose}
        height="88%"
        title="Share achievement"
      >
        {body}
      </ModalSheet>
    );
  }

  return body;
}

function ShareSummary({
  badge,
  caption,
}: {
  badge: MilestoneBadge | null;
  caption: string;
}) {
  const palette = useColors();
  if (!badge) {
    return (
      <View style={styles.fallback}>
        <Feather name="alert-circle" size={26} color={tokens.textMuted} />
        <Text style={[styles.fallbackBody, { color: palette.mutedForeground }]}>
          That badge can’t be found any more.
        </Text>
      </View>
    );
  }
  return (
    <View style={[styles.summaryCard, { backgroundColor: tokens.darkSurface }]}>
      <View style={[styles.summaryHalo, { backgroundColor: summaryHalo(badge.tier) }]} />
      <BadgeIcon
        tier={badge.tier}
        iconKey={badge.iconKey as any}
        progress={Math.max(0.4, badge.progress)}
        unlocked={badge.unlocked}
        size="lg"
      />
      <Text style={styles.summaryTitle} numberOfLines={2}>
        {badge.title}
      </Text>
      <Text style={styles.summaryMeta} numberOfLines={2}>
        {tierLabel(badge)} · {badge.unlocked ? 'Unlocked' : `${Math.round(badge.progress * 100)}% to unlock`}
      </Text>
      <Text style={styles.summaryCaption}>{caption}</Text>
    </View>
  );
}

function ShareDestinations({
  onCopyCaption,
  onShareVia,
  onSaveImage,
}: {
  onCopyCaption: () => void;
  onShareVia: () => void;
  onSaveImage: () => void;
}) {
  const palette = useColors();
  return (
    <>
      <Text style={[styles.sectionLabel, { color: palette.mutedForeground }]}>
        Share it
      </Text>
      <View style={styles.actionsGrid}>
        <ShareActionTile
          icon="copy"
          label="Copy caption"
          support="Quick copy for any app"
          tint={tokens.primary}
          onPress={onCopyCaption}
        />
        <ShareActionTile
          icon="share-2"
          label="Share via…"
          support="Messages, mail & more"
          tint={tokens.accentPurple}
          onPress={onShareVia}
        />
        <ShareActionTile
          icon="download"
          label="Save image"
          support="Sticker pack ready"
          tint={tokens.accentGreen}
          onPress={onSaveImage}
        />
      </View>
    </>
  );
}

function ShareActionTile({
  icon,
  label,
  support,
  tint,
  onPress,
}: {
  icon: keyof typeof Feather.glyphMap;
  label: string;
  support: string;
  tint: string;
  onPress: () => void;
}) {
  const palette = useColors();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      testID={`share-action-${label.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`}
      onPress={onPress}
      style={({ pressed }) => [
        styles.actionTile,
        {
          backgroundColor: palette.card,
          borderColor: tokens.border,
          opacity: pressed ? 0.92 : 1,
        },
      ]}
    >
      <View style={[styles.actionIconWrap, { backgroundColor: `${tint}22` }]}>
        <Feather name={icon} size={20} color={tint} />
      </View>
      <Text style={[styles.actionLabel, { color: palette.foreground }]}>
        {label}
      </Text>
      <Text
        style={[styles.actionSupport, { color: palette.mutedForeground }]}
        numberOfLines={2}
      >
        {support}
      </Text>
    </Pressable>
  );
}

function summaryHalo(tier: MilestoneBadge['tier']): string {
  switch (tier) {
    case 'bronze':
      return 'rgba(245,158,11,0.22)';
    case 'silver':
      return 'rgba(148,163,184,0.22)';
    case 'gold':
      return 'rgba(234,179,8,0.22)';
    case 'platinum':
      return 'rgba(124,58,237,0.22)';
  }
}

function tierLabel(badge: MilestoneBadge): string {
  return `${badge.tier[0]!.toUpperCase()}${badge.tier.slice(1)} tier`;
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xs,
  },
  fallback: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
    gap: spacing.sm,
  },
  fallbackBody: {
    fontFamily: 'Inter_500Medium',
    fontSize: 13,
  },
  summaryCard: {
    borderRadius: radii.xl,
    padding: spacing.lg,
    overflow: 'hidden',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  summaryHalo: {
    position: 'absolute',
    right: -60,
    top: -60,
    width: 220,
    height: 220,
    borderRadius: 110,
  },
  summaryTitle: {
    color: tokens.textInverse,
    fontFamily: 'Inter_700Bold',
    fontSize: 22,
    textAlign: 'center',
    letterSpacing: -0.4,
    marginTop: spacing.sm,
  },
  summaryMeta: {
    color: 'rgba(255,255,255,0.7)',
    fontFamily: 'Inter_500Medium',
    fontSize: 12,
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  summaryCaption: {
    color: 'rgba(255,255,255,0.86)',
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'center',
    marginTop: spacing.sm,
    paddingHorizontal: spacing.sm,
  },
  sectionLabel: {
    fontFamily: 'Inter_500Medium',
    fontSize: 11,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    marginBottom: spacing.sm,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  actionTile: {
    flexGrow: 1,
    flexBasis: '47%',
    padding: spacing.md,
    borderRadius: radii.lg,
    borderWidth: 1,
    alignItems: 'flex-start',
    gap: spacing.xs,
  },
  actionIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  actionLabel: {
    fontFamily: 'Inter_700Bold',
    fontSize: 14,
  },
  actionSupport: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    lineHeight: 17,
  },
  unlockCard: {
    gap: spacing.xs,
    marginBottom: spacing.xl,
  },
  unlockRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  unlockCardTitle: {
    fontFamily: 'Inter_700Bold',
    fontSize: 15,
    flex: 1,
  },
  unlockCardBody: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    lineHeight: 19,
  },
  unlockFootnote: {
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
    lineHeight: 17,
    color: tokens.textMuted,
  },
  unlockButton: {
    marginTop: spacing.sm,
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
