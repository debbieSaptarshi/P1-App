import { router } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import React, { useMemo, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, radii, spacing } from '@/constants/tokens';
import { Card, Header, SectionTitle } from '@/components/ui';
import { useAppStore } from '@/hooks/useAppStore';
import type { LeaderboardEntry } from '@/types';
import { groupProfileHref } from './_profileNav';

const PERIOD_OPTIONS = ['Weekly', 'Monthly', 'All-time'] as const;
type Period = (typeof PERIOD_OPTIONS)[number];

/**
 * Stand-alone leaderboard view. Reuses the global leaderboard for now
 * and lets the user toggle the headline period label.
 */
export default function GroupLeaderboardScreen() {
  const insets = useSafeAreaInsets();
  const { state } = useAppStore();
  const [period, setPeriod] = useState<Period>('Weekly');

  const myEntry = useMemo(
    () =>
      state.leaderboard.find(
        (l) => l.displayName === state.profile.name || l.userId === state.profile.id,
      ),
    [state.leaderboard, state.profile],
  );

  const ordered = useMemo(
    () => [...state.leaderboard].sort((a, b) => a.rank - b.rank),
    [state.leaderboard],
  );

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <Header
        title="Leaderboard"
        subtitle={myEntry ? `You're #${myEntry.rank}` : 'Earn a spot'}
        rightIcon="zap"
        onRightPress={() => router.push('/group/challenges')}
      />
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: spacing.lg,
          paddingBottom: insets.bottom + spacing.xxxl,
        }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.periodRow}>
          {PERIOD_OPTIONS.map((p) => {
            const active = p === period;
            return (
              <Pressable
                key={p}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                testID={`leaderboard-period-${p.toLowerCase()}`}
                onPress={() => setPeriod(p)}
                style={({ pressed }) => [
                  styles.periodChip,
                  active && styles.periodChipActive,
                  pressed && styles.pressed,
                ]}
              >
                <Text style={[styles.periodLabel, active && styles.periodLabelActive]}>
                  {p}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <Card style={styles.heroCard}>
          <Text style={styles.heroLabel}>{period}</Text>
          <Text style={styles.heroScore}>
            {myEntry ? myEntry.score.toLocaleString() : '–'}
          </Text>
          <Text style={styles.heroUnit}>kcal earned</Text>
          <View style={styles.heroDivider} />
          <View style={styles.heroRow}>
            <View style={styles.heroStat}>
              <Text style={styles.heroStatLabel}>Rank</Text>
              <Text style={styles.heroStatValue}>
                {myEntry ? `#${myEntry.rank}` : '—'}
              </Text>
            </View>
            <View style={styles.heroStat}>
              <Text style={styles.heroStatLabel}>To Top</Text>
              <Text style={styles.heroStatValue}>
                {myEntry ? Math.max(0, state.leaderboard[0].score - myEntry.score).toLocaleString() : '—'}
              </Text>
            </View>
          </View>
        </Card>

        <View style={styles.listHeader}>
          <SectionTitle title="Top Performers" />
          <View style={styles.listHeaderRight}>
            <Feather name="trending-up" size={12} color={colors.textMuted} />
            <Text style={styles.listHeaderHint}>Sorted by {period.toLowerCase()}</Text>
          </View>
        </View>

        {ordered.map((entry) => (
          <LeaderRow
            key={entry.userId}
            entry={entry}
            isMe={myEntry?.userId === entry.userId}
            onOpenProfile={() => router.push(groupProfileHref(entry.userId))}
          />
        ))}
      </ScrollView>
    </View>
  );
}

function LeaderRow({
  entry,
  isMe,
  onOpenProfile,
}: {
  entry: LeaderboardEntry;
  isMe: boolean;
  onOpenProfile: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`See ${entry.displayName}'s profile`}
      testID={`leaderboard-profile-${entry.userId}`}
      onPress={onOpenProfile}
    >
      <Card style={isMe ? { ...styles.row, ...styles.rowMe } : styles.row}>
      <View style={[styles.rankBadge, isMe && styles.rankBadgeMe]}>
        <Text style={[styles.rankNumber, isMe && styles.rankNumberMe]}>
          {entry.rank}
        </Text>
      </View>
      <View style={styles.nameCol}>
        <Text style={styles.name}>{entry.displayName}</Text>
        <Text style={styles.score}>{entry.score.toLocaleString()} kcal</Text>
      </View>
      {isMe && (
        <View style={styles.youPill}>
          <Text style={styles.youPillText}>You</Text>
        </View>
      )}
      {!isMe && entry.rank <= 3 && (
        <Feather
          name={entry.rank === 1 ? 'award' : entry.rank === 2 ? 'star' : 'circle'}
          size={16}
          color={entry.rank === 1 ? colors.accentOrange : colors.textMuted}
        />
      )}
      </Card>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  periodRow: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginBottom: spacing.md,
    backgroundColor: colors.card,
    padding: 4,
    borderRadius: radii.pill,
  },
  periodChip: {
    flex: 1,
    paddingVertical: spacing.xs,
    alignItems: 'center',
    borderRadius: radii.pill,
  },
  periodChipActive: { backgroundColor: colors.darkSurface },
  periodLabel: {
    fontFamily: 'Inter_500Medium',
    fontSize: 12,
    color: colors.textPrimary,
  },
  periodLabelActive: { color: colors.textInverse },
  pressed: { opacity: 0.85 },
  heroCard: { alignItems: 'center', paddingVertical: spacing.lg, marginBottom: spacing.md },
  heroLabel: {
    fontFamily: 'Inter_500Medium',
    fontSize: 12,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  heroScore: {
    fontFamily: 'Inter_700Bold',
    fontSize: 44,
    color: colors.textPrimary,
    letterSpacing: -1,
    marginTop: spacing.xs,
  },
  heroUnit: {
    fontFamily: 'Inter_500Medium',
    fontSize: 13,
    color: colors.textMuted,
  },
  heroDivider: {
    height: 1,
    backgroundColor: colors.border,
    alignSelf: 'stretch',
    marginVertical: spacing.md,
  },
  heroRow: {
    flexDirection: 'row',
    gap: spacing.xl,
  },
  heroStat: { alignItems: 'center' },
  heroStatLabel: {
    fontFamily: 'Inter_500Medium',
    fontSize: 11,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  heroStatValue: {
    fontFamily: 'Inter_700Bold',
    fontSize: 22,
    color: colors.textPrimary,
    marginTop: 2,
  },
  listHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  listHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  listHeaderHint: {
    fontFamily: 'Inter_500Medium',
    fontSize: 11,
    color: colors.textMuted,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xs,
    paddingVertical: spacing.sm,
  },
  rowMe: { borderWidth: 1.5, borderColor: colors.primary },
  rankBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankBadgeMe: { backgroundColor: colors.primarySoft },
  rankNumber: {
    fontFamily: 'Inter_700Bold',
    fontSize: 14,
    color: colors.textPrimary,
  },
  rankNumberMe: { color: colors.primary },
  nameCol: { flex: 1 },
  name: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 15,
    color: colors.textPrimary,
  },
  score: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: colors.textMuted,
  },
  youPill: {
    paddingVertical: 2,
    paddingHorizontal: spacing.xs,
    borderRadius: radii.pill,
    backgroundColor: colors.primary,
  },
  youPillText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 11,
    color: colors.textInverse,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
});
