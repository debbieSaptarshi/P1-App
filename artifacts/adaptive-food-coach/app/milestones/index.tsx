import React, { useMemo, useState } from 'react';
import {
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Feather } from '@expo/vector-icons';

import { BadgeIcon, Header, ProgressBar } from '@/components/ui';
import { useAppStore } from '@/hooks/useAppStore';
import { useColors } from '@/hooks/useColors';
import { colors as tokens, radii, spacing } from '@/constants/tokens';
import type { MilestoneBadge } from '@/types';

type Category = 'all' | 'streak' | 'nutrition' | 'exercise' | 'community';

const CATEGORIES: { key: Category; label: string; icon: keyof typeof Feather.glyphMap }[] = [
  { key: 'all', label: 'All', icon: 'grid' },
  { key: 'streak', label: 'Streak', icon: 'zap' },
  { key: 'nutrition', label: 'Nutrition', icon: 'heart' },
  { key: 'exercise', label: 'Exercise', icon: 'activity' },
  { key: 'community', label: 'Community', icon: 'users' },
];

export default function MilestonesIndex() {
  const insets = useSafeAreaInsets();
  const palette = useColors();
  const router = useRouter();
  const { state } = useAppStore();
  const milestones = state.milestones ?? [];

  const [category, setCategory] = useState<Category>('all');

  const filtered = useMemo(() => {
    if (category === 'all') return milestones;
    return milestones.filter((m) => m.category === category);
  }, [milestones, category]);

  const counts = useMemo(() => {
    const acc: Record<Category, { total: number; unlocked: number }> = {
      all: { total: 0, unlocked: 0 },
      streak: { total: 0, unlocked: 0 },
      nutrition: { total: 0, unlocked: 0 },
      exercise: { total: 0, unlocked: 0 },
      community: { total: 0, unlocked: 0 },
    };
    for (const m of milestones) {
      acc.all.total += 1;
      if (m.unlocked) acc.all.unlocked += 1;
      acc[m.category].total += 1;
      if (m.unlocked) acc[m.category].unlocked += 1;
    }
    return acc;
  }, [milestones]);

  const overallProgress = useMemo(() => {
    if (counts.all.total === 0) return 0;
    return counts.all.unlocked / counts.all.total;
  }, [counts]);

  const handleCategoryChange = (next: Category) => {
    Haptics.selectionAsync();
    setCategory(next);
  };

  const handleBadgePress = (badge: MilestoneBadge) => {
    Haptics.selectionAsync();
    router.push(`/milestones/badge/${badge.id}`);
  };

  return (
    <View style={[styles.container, { backgroundColor: palette.background }]}>
      <Header
        title="Milestones"
        subtitle={`${counts.all.unlocked} of ${counts.all.total} unlocked`}
      />

      <View style={styles.tabsWrapper}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabsRow}
        >
          {CATEGORIES.map((cat) => {
            const active = category === cat.key;
            const data = counts[cat.key];
            return (
              <Pressable
                key={cat.key}
                accessibilityRole="tab"
                accessibilityState={{ selected: active }}
                accessibilityLabel={`${cat.label} category`}
                testID={`milestone-tab-${cat.key}`}
                onPress={() => handleCategoryChange(cat.key)}
                style={({ pressed }) => [
                  styles.tabChip,
                  {
                    backgroundColor: active
                      ? tokens.darkSurface
                      : tokens.card,
                    borderColor: active ? tokens.darkSurface : tokens.border,
                    opacity: pressed ? 0.85 : 1,
                  },
                ]}
              >
                <Feather
                  name={cat.icon}
                  size={14}
                  color={active ? tokens.textInverse : tokens.textPrimary}
                />
                <Text
                  style={[
                    styles.tabChipLabel,
                    {
                      color: active
                        ? tokens.textInverse
                        : tokens.textPrimary,
                    },
                  ]}
                >
                  {cat.label}
                </Text>
                {data.total > 0 && (
                  <View
                    style={[
                      styles.tabChipCount,
                      {
                        backgroundColor: active
                          ? 'rgba(255,255,255,0.2)'
                          : tokens.background,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.tabChipCountText,
                        {
                          color: active
                            ? tokens.textInverse
                            : tokens.textMuted,
                        },
                      ]}
                    >
                      {data.unlocked}/{data.total}
                    </Text>
                  </View>
                )}
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      <View style={styles.progressSummary}>
        <View style={styles.progressSummaryHeader}>
          <Text style={[styles.progressSummaryEyebrow, { color: palette.mutedForeground }]}>
            Catalog progress
          </Text>
          <Text style={[styles.progressSummaryValue, { color: palette.foreground }]}>
            {Math.round(overallProgress * 100)}%
          </Text>
        </View>
        <ProgressBar
          progress={overallProgress}
          color={tokens.accentGreen}
          backgroundColor={tokens.background}
          height={6}
        />
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={styles.gridRow}
        contentContainerStyle={[
          styles.gridContent,
          { paddingBottom: insets.bottom + 120 },
        ]}
        ItemSeparatorComponent={() => <View style={styles.gridGap} />}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Feather name="award" size={28} color={tokens.textMuted} />
            <Text style={[styles.emptyStateText, { color: palette.mutedForeground }]}>
              No badges in this category yet.
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <BadgeCard badge={item} onPress={() => handleBadgePress(item)} />
        )}
      />
    </View>
  );
}

function BadgeCard({
  badge,
  onPress,
}: {
  badge: MilestoneBadge;
  onPress: () => void;
}) {
  const palette = useColors();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${badge.title} badge`}
      testID={`badge-card-${badge.id}`}
      onPress={onPress}
      style={({ pressed }) => [
        styles.badgeCard,
        {
          backgroundColor: palette.card,
          opacity: pressed ? 0.94 : 1,
        },
      ]}
    >
      <View style={styles.badgeCardHeader}>
        <BadgeIcon
          tier={badge.tier}
          iconKey={badge.iconKey as any}
          progress={Math.max(0.35, badge.progress)}
          unlocked={badge.unlocked}
          size="md"
        />
        <View
          style={[
            styles.tierPill,
            {
              backgroundColor: badge.unlocked
                ? tierAccent(badge.tier)
                : tokens.background,
            },
          ]}
        >
          <Feather
            name={badge.unlocked ? 'check-circle' : 'lock'}
            size={11}
            color={badge.unlocked ? tokens.textInverse : tokens.textMuted}
          />
          <Text
            style={[
              styles.tierPillText,
              {
                color: badge.unlocked
                  ? tokens.textInverse
                  : tokens.textMuted,
              },
            ]}
          >
            {badge.unlocked ? badge.tier : 'Locked'}
          </Text>
        </View>
      </View>
      <Text style={[styles.badgeCardTitle, { color: palette.foreground }]} numberOfLines={2}>
        {badge.title}
      </Text>
      <Text
        style={[styles.badgeCardDescription, { color: palette.mutedForeground }]}
        numberOfLines={3}
      >
        {badge.description}
      </Text>
      <View style={styles.badgeCardProgressRow}>
        <ProgressBar
          progress={Math.max(0.02, badge.progress)}
          color={badge.unlocked ? tokens.accentGreen : tokens.primary}
          backgroundColor={tokens.background}
          height={4}
        />
        <Text
          style={[
            styles.badgeCardProgressText,
            { color: palette.mutedForeground },
          ]}
        >
          {badge.unlocked ? 'Unlocked' : `${Math.round(badge.progress * 100)}%`}
        </Text>
      </View>
    </Pressable>
  );
}

function tierAccent(tier: MilestoneBadge['tier']): string {
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

const styles = StyleSheet.create({
  container: { flex: 1 },
  tabsWrapper: { paddingTop: spacing.xs },
  tabsRow: {
    paddingHorizontal: spacing.lg,
    gap: spacing.xs,
  },
  tabChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderRadius: radii.pill,
    borderWidth: 1,
    marginRight: spacing.xs,
  },
  tabChipLabel: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 13,
  },
  tabChipCount: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radii.pill,
  },
  tabChipCountText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 10,
  },
  progressSummary: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: spacing.xs,
  },
  progressSummaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressSummaryEyebrow: {
    fontFamily: 'Inter_500Medium',
    fontSize: 11,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  progressSummaryValue: {
    fontFamily: 'Inter_700Bold',
    fontSize: 18,
    letterSpacing: -0.4,
  },
  gridContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xs,
  },
  gridRow: {
    gap: spacing.sm,
  },
  gridGap: { height: spacing.sm },
  badgeCard: {
    flex: 1,
    borderRadius: radii.lg,
    padding: spacing.md,
    gap: spacing.xs,
  },
  badgeCardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  tierPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radii.pill,
  },
  tierPillText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  badgeCardTitle: {
    fontFamily: 'Inter_700Bold',
    fontSize: 15,
    letterSpacing: -0.2,
  },
  badgeCardDescription: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    lineHeight: 18,
  },
  badgeCardProgressRow: {
    gap: 6,
    marginTop: spacing.xs,
  },
  badgeCardProgressText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 11,
    letterSpacing: 0.3,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
    gap: spacing.sm,
  },
  emptyStateText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 13,
  },
});
