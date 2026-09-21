import React, { useMemo } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';

import { CircleIconButton } from '@/components/meals/CircleIconButton';
import { HexBadge } from '@/components/milestones/HexBadge';
import { Button } from '@/components/ui';
import { colors, radii, spacing } from '@/constants/tokens';
import { formatStartedOn, mergeMilestoneCatalog } from '@/lib/milestones';
import { useAppStore } from '@/hooks/useAppStore';

const iconBack = require('@/assets/images/milestones/back.svg');
const iconShare = require('@/assets/images/milestones/share.svg');

export default function BadgeDetail() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams<{ badgeId: string }>();
  const { state } = useAppStore();
  const catalog = useMemo(
    () => mergeMilestoneCatalog(state.milestones ?? []),
    [state.milestones],
  );
  const badge = catalog.find((item) => item.id === params.badgeId) ?? null;

  const goBack = () => {
    Haptics.selectionAsync();
    if (router.canGoBack()) router.back();
    else router.replace('/milestones');
  };

  const goShare = () => {
    if (!badge) return;
    Haptics.selectionAsync();
    router.push(`/milestones/share/${badge.id}`);
  };

  if (!badge) {
    return (
      <View style={[styles.screen, { paddingTop: insets.top + 8 }]}>
        <View style={styles.topBar}>
          <CircleIconButton
            source={iconBack}
            accessibilityLabel="Go back"
            testID="badge-detail-back"
            onPress={goBack}
          />
        </View>
        <View style={styles.fallback}>
          <Text style={styles.fallbackTitle}>Badge not found</Text>
          <Button title="Back to milestones" onPress={() => router.replace('/milestones')} />
        </View>
      </View>
    );
  }

  const unlockedLabel = formatStartedOn(badge.unlockedAt);

  return (
    <View style={[styles.screen, { paddingTop: insets.top + 8 }]}>
      <View style={styles.topBar}>
        <CircleIconButton
          source={iconBack}
          accessibilityLabel="Go back"
          testID="badge-detail-back"
          onPress={goBack}
        />
        <CircleIconButton
          source={iconShare}
          accessibilityLabel="Share this badge"
          testID="badge-detail-share"
          onPress={goShare}
        />
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingBottom: insets.bottom + 40 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.hero}>
          <HexBadge badge={badge} showCaption={false} size={160} />
          <Text style={styles.eyebrow}>
            {badge.unlocked ? 'Badge Unlocked' : 'Locked'}
          </Text>
          <Text style={styles.title}>{badge.title}</Text>
          <Text style={styles.description}>{badge.description}</Text>
        </View>

        <View style={styles.metaCard}>
          <Text style={styles.metaLine}>
            {badge.unlocked && unlockedLabel
              ? `Unlocked on ${unlockedLabel}`
              : `${Math.round(badge.progress * 100)}% complete`}
          </Text>
          <Text style={styles.metaSupport}>
            {badge.unlocked
              ? 'Share this win with your people.'
              : 'Keep logging. The unlock share sheet is ready when you are.'}
          </Text>
        </View>

        <Button
          title={badge.unlocked ? 'Share badge' : 'Share preview'}
          onPress={goShare}
          leadingIcon="share-2"
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xs,
  },
  scroll: {
    paddingHorizontal: spacing.lg,
    gap: spacing.lg,
  },
  fallback: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.xl,
  },
  fallbackTitle: {
    fontFamily: 'Inter_700Bold',
    fontSize: 18,
    color: colors.textPrimary,
  },
  hero: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
    gap: spacing.xs,
  },
  eyebrow: {
    marginTop: spacing.md,
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    lineHeight: 16,
    color: colors.textMuted,
  },
  title: {
    fontFamily: 'Inter_500Medium',
    fontSize: 40,
    lineHeight: 48,
    letterSpacing: -0.3,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  description: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    lineHeight: 16,
    color: colors.textMuted,
    textAlign: 'center',
  },
  metaCard: {
    backgroundColor: colors.card,
    borderRadius: radii.xl,
    padding: spacing.lg,
    gap: spacing.xs,
  },
  metaLine: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 15,
    color: colors.textPrimary,
  },
  metaSupport: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    lineHeight: 19,
    color: colors.textMuted,
  },
});
