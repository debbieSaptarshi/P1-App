import React, { useMemo } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';

import { CircleIconButton } from '@/components/meals/CircleIconButton';
import { FlameMark } from '@/components/milestones/FlameMark';
import { HexBadge } from '@/components/milestones/HexBadge';
import { colors, radii, spacing } from '@/constants/tokens';
import { mergeMilestoneCatalog, streakFromLogs } from '@/lib/milestones';
import { useAppStore } from '@/hooks/useAppStore';
import type { MilestoneBadge } from '@/types';

const iconBack = require('@/assets/images/milestones/back.svg');
const iconShare = require('@/assets/images/milestones/share.svg');
const badgeHex = require('@/assets/images/milestones/hex-earned.png');
const badgeHexSm = require('@/assets/images/milestones/hex-earned-sm.png');

export default function MilestonesIndex() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { state } = useAppStore();
  const catalog = useMemo(
    () => mergeMilestoneCatalog(state.milestones ?? []),
    [state.milestones],
  );

  const unlockedCount = catalog.filter((badge) => badge.unlocked).length;
  const streaks = useMemo(
    () => streakFromLogs(state.foodLogs ?? []),
    [state.foodLogs],
  );
  const dayStreak = Math.max(streaks.current, unlockedCount > 0 ? 1 : 0);
  const longest = Math.max(streaks.longest, dayStreak);
  const progress = catalog.length === 0 ? 0 : unlockedCount / catalog.length;

  const handleBadgePress = (badge: MilestoneBadge) => {
    Haptics.selectionAsync();
    router.push(`/milestones/badge/${badge.id}`);
  };

  const handleShare = () => {
    Haptics.selectionAsync();
    router.push('/milestones/share/streak');
  };

  return (
    <View style={[styles.screen, { paddingTop: insets.top + 8 }]}>
      <View style={styles.topBar}>
        <CircleIconButton
          source={iconBack}
          accessibilityLabel="Go back"
          testID="milestones-back"
          onPress={() => {
            Haptics.selectionAsync();
            if (router.canGoBack()) router.back();
            else router.replace('/(tabs)/progress');
          }}
        />
        <CircleIconButton
          source={iconShare}
          accessibilityLabel="Share milestones"
          testID="milestones-share"
          onPress={handleShare}
        />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + 40 },
        ]}
      >
        <Text style={styles.pageTitle}>Milestones</Text>

        <View style={styles.statRow}>
          <View style={styles.statCard}>
            <View style={styles.flameStage}>
              <FlameMark size={100} />
              <View style={styles.countPill}>
                <Text style={styles.countPillText}>{dayStreak}</Text>
              </View>
            </View>
            <Text style={styles.statLabel}>Day Streak</Text>
          </View>

          <View style={styles.statCard}>
            <View style={styles.hexStage}>
              <Image source={badgeHex} style={styles.hexArt} contentFit="contain" />
              <View style={styles.countPill}>
                <Text style={styles.countPillText}>{unlockedCount}</Text>
              </View>
            </View>
            <Text style={styles.statLabel}>Badge Earned</Text>
          </View>
        </View>

        <View style={styles.chipRow}>
          <View style={styles.chip}>
            <View style={styles.chipIcon}>
              <FlameMark size={40} />
            </View>
            <View style={styles.chipCopy}>
              <Text style={styles.chipTitle}>
                {longest} day{longest === 1 ? '' : 's'}
              </Text>
              <Text style={styles.chipCaption}>Longest Streak</Text>
            </View>
          </View>

          <View style={styles.chip}>
            <View style={styles.chipIcon}>
              <Image source={badgeHexSm} style={styles.chipHex} contentFit="contain" />
            </View>
            <View style={styles.chipCopy}>
              <Text style={styles.chipTitle}>
                {unlockedCount}/{catalog.length} Badges
              </Text>
              <View style={styles.track}>
                <View style={[styles.trackFill, { width: `${Math.max(6, progress * 100)}%` }]} />
              </View>
            </View>
          </View>
        </View>

        <View style={styles.grid}>
          {catalog.map((badge) => (
            <View key={badge.id} style={styles.gridCell}>
              <HexBadge badge={badge} onPress={() => handleBadgePress(badge)} />
            </View>
          ))}
        </View>
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
  content: {
    paddingHorizontal: spacing.lg,
  },
  pageTitle: {
    fontFamily: 'Inter_500Medium',
    fontSize: 32,
    lineHeight: 38,
    letterSpacing: -0.2,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
    paddingVertical: spacing.sm,
  },
  statRow: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: radii.xl,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    gap: 10,
  },
  flameStage: {
    width: 100,
    height: 100,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  hexStage: {
    width: 100,
    height: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hexArt: {
    width: 70,
    height: 70,
  },
  countPill: {
    position: 'absolute',
    bottom: 8,
    minWidth: 24,
    height: 24,
    paddingHorizontal: 2,
    borderRadius: radii.pill,
    backgroundColor: colors.darkSurface,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  countPillText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 16,
    lineHeight: 22,
    letterSpacing: -0.18,
    color: colors.textInverse,
    textAlign: 'center',
  },
  statLabel: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: -0.12,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  chipRow: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginTop: spacing.xs,
    marginBottom: spacing.xl,
  },
  chip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: radii.xl,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    gap: 2,
  },
  chipIcon: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipHex: {
    width: 28,
    height: 28,
  },
  chipCopy: {
    flex: 1,
    gap: 2,
  },
  chipTitle: {
    fontFamily: 'Inter_500Medium',
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: -0.12,
    color: colors.textPrimary,
  },
  chipCaption: {
    fontFamily: 'Inter_400Regular',
    fontSize: 10,
    lineHeight: 12,
    color: colors.textMuted,
  },
  track: {
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.background,
    overflow: 'hidden',
    marginTop: 2,
  },
  trackFill: {
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.primary,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: spacing.xl,
  },
  gridCell: {
    width: '31%',
    alignItems: 'center',
  },
});
