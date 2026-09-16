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
import { Button, Card, Header, SectionTitle } from '@/components/ui';
import { appStoreActions, useAppStore } from '@/hooks/useAppStore';
import type { Challenge, GroupPost, LeaderboardEntry } from '@/types';

type Segment = 'feed' | 'leaderboard' | 'challenges';

const SEGMENTS: { key: Segment; label: string; icon: keyof typeof Feather.glyphMap }[] = [
  { key: 'feed', label: 'Feed', icon: 'message-circle' },
  { key: 'leaderboard', label: 'Leaderboard', icon: 'bar-chart-2' },
  { key: 'challenges', label: 'Challenges', icon: 'zap' },
];

/**
 * Community tab landing with a segmented pill that toggles between
 * Feed / Leaderboard / Challenges. Each segment is rendered inline
 * (no second navigation push) backed by `useAppStore`.
 */
export default function CommunityScreen() {
  const insets = useSafeAreaInsets();
  const { state } = useAppStore();
  const [segment, setSegment] = useState<Segment>('feed');

  const joinedGroupIds = useMemo(
    () => new Set(state.groups.filter((g) => g.joined).map((g) => g.id)),
    [state.groups],
  );

  const myRank = useMemo(() => {
    return state.leaderboard.find(
      (l) => l.displayName === state.profile.name || l.userId === state.profile.id,
    )?.rank;
  }, [state.leaderboard, state.profile]);

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <Header title="Community" subtitle="Stay accountable together" />

      {/* Segmented pill */}
      <View style={styles.segmentRow}>
        {SEGMENTS.map((seg) => {
          const isActive = seg.key === segment;
          return (
            <Pressable
              key={seg.key}
              accessibilityRole="button"
              accessibilityState={{ selected: isActive }}
              testID={`community-segment-${seg.key}`}
              onPress={() => setSegment(seg.key)}
              style={({ pressed }) => [
                styles.segment,
                isActive && styles.segmentActive,
                pressed && styles.segmentPressed,
              ]}
            >
              <Feather
                name={seg.icon}
                size={14}
                color={isActive ? colors.textInverse : colors.textMuted}
              />
              <Text
                style={[
                  styles.segmentLabel,
                  isActive && styles.segmentLabelActive,
                ]}
              >
                {seg.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: spacing.lg,
          paddingBottom: insets.bottom + spacing.xxxl,
        }}
        showsVerticalScrollIndicator={false}
      >
        {segment === 'feed' && (
          <Feed posts={state.groupPosts} joinedGroupIds={joinedGroupIds} />
        )}
        {segment === 'leaderboard' && (
          <Leaderboard entries={state.leaderboard} myRank={myRank} />
        )}
        {segment === 'challenges' && <Challenges challenges={state.challenges} />}

        <Button
          variant="outline"
          title="Find groups"
          leadingIcon="search"
          trailingIcon="arrow-right"
          onPress={() => router.push('/group')}
          style={styles.findCta}
          testID="community-find-groups"
        />
      </ScrollView>
    </View>
  );
}

interface FeedProps {
  posts: GroupPost[];
  joinedGroupIds: Set<string>;
}

function Feed({ posts, joinedGroupIds }: FeedProps) {
  const visible = posts.filter((p) => joinedGroupIds.has(p.groupId));
  if (visible.length === 0) {
    return (
      <Card style={styles.emptyCard}>
        <Feather name="message-circle" size={24} color={colors.textMuted} />
        <Text style={styles.emptyTitle}>No posts yet</Text>
        <Text style={styles.emptyBody}>
          Join an accountability group to see its daily feed here.
        </Text>
      </Card>
    );
  }
  return (
    <View style={styles.feedWrap}>
      <SectionTitle title="Activity" />
      {visible.map((post) => (
        <PostRow key={post.id} post={post} />
      ))}
    </View>
  );
}

function PostRow({ post }: { post: GroupPost }) {
  return (
    <Card style={styles.postCard}>
      <View style={styles.postHeader}>
        <View style={styles.postAuthor}>
          <View style={styles.postAvatar}>
            <Feather name="user" size={14} color={colors.textPrimary} />
          </View>
          <View>
            <Text style={styles.postAuthorName}>{post.authorName}</Text>
            <Text style={styles.postMeta}>{relTime(post.createdAt)}</Text>
          </View>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Open post"
          testID={`post-open-${post.id}`}
          onPress={() => router.push(`/group/post/${post.id}`)}
          style={styles.postOpen}
        >
          <Feather name="chevron-right" size={16} color={colors.textMuted} />
        </Pressable>
      </View>
      <Text style={styles.postBody} numberOfLines={3}>{post.body}</Text>
      <View style={styles.postActions}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={post.liked ? 'Unlike' : 'Like'}
          accessibilityState={{ selected: !!post.liked }}
          testID={`post-like-${post.id}`}
          onPress={() => appStoreActions.likePost(post.id)}
          style={({ pressed }) => [styles.actionChip, pressed && styles.actionChipPressed]}
        >
          <Feather
            name={post.liked ? 'heart' : 'heart'}
            size={14}
            color={post.liked ? colors.accentRed : colors.primary}
          />
          <Text style={[styles.actionLabel, post.liked && styles.actionLabelActive]}>
            {post.reactions}
          </Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Comment"
          testID={`post-comment-${post.id}`}
          onPress={() => router.push(`/group/post/${post.id}`)}
          style={({ pressed }) => [styles.actionChip, pressed && styles.actionChipPressed]}
        >
          <Feather name="message-square" size={14} color={colors.textMuted} />
          <Text style={styles.actionLabel}>{post.comments}</Text>
        </Pressable>
        <View style={{ flex: 1 }} />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Share"
          testID={`post-share-${post.id}`}
          onPress={() => {
            if (__DEV__) console.log('[community] share', post.id);
          }}
          style={({ pressed }) => [styles.actionChip, pressed && styles.actionChipPressed]}
        >
          <Feather name="share-2" size={14} color={colors.textMuted} />
        </Pressable>
      </View>
    </Card>
  );
}

interface LeaderboardProps {
  entries: LeaderboardEntry[];
  myRank?: number;
}

function Leaderboard({ entries, myRank }: LeaderboardProps) {
  return (
    <View style={styles.feedWrap}>
      <SectionTitle
        title="Top Performers"
        action={myRank ? `You’re #${myRank}` : undefined}
      />
      {entries.map((entry) => {
        const highlight = entry.rank === myRank || entry.highlight;
        return (
          <Card
            key={entry.userId}
            style={highlight ? { ...styles.rankRow, ...styles.rankRowHighlight } : styles.rankRow}
          >
            <View style={[styles.rankBadge, highlight && styles.rankBadgeHighlight]}>
              <Text style={[styles.rankNumber, highlight && styles.rankNumberHighlight]}>
                {entry.rank}
              </Text>
            </View>
            <View style={styles.rankNameWrap}>
              <Text style={styles.rankName}>{entry.displayName}</Text>
              <Text style={styles.rankHint}>{entry.score.toLocaleString()} kcal — 30 days</Text>
            </View>
            {highlight && (
              <View style={styles.youPill}>
                <Text style={styles.youPillText}>You</Text>
              </View>
            )}
          </Card>
        );
      })}
    </View>
  );
}

function Challenges({ challenges }: { challenges: Challenge[] }) {
  return (
    <View style={styles.feedWrap}>
      <SectionTitle title="Active Challenges" />
      {challenges.map((c) => (
        <Card key={c.id} style={styles.challengeCard}>
          <View style={styles.challengeHeader}>
            <View>
              <Text style={styles.challengeTitle}>{c.title}</Text>
              <Text style={styles.challengeDescription}>{c.description}</Text>
            </View>
            {c.joined && (
              <View style={styles.joinedPill}>
                <Text style={styles.joinedPillText}>Joined</Text>
              </View>
            )}
          </View>
          <View style={styles.challengeMeta}>
            <Feather name="users" size={12} color={colors.textMuted} />
            <Text style={styles.challengeMetaText}>
              {c.participants.toLocaleString()} participants
            </Text>
            <Feather name="clock" size={12} color={colors.textMuted} style={{ marginLeft: spacing.sm }} />
            <Text style={styles.challengeMetaText}>{c.daysRemaining} days left</Text>
          </View>
          <View style={styles.challengeRewardRow}>
            <Feather name="award" size={14} color={colors.accentOrange} />
            <Text style={styles.challengeReward}>Reward: {c.reward}</Text>
          </View>
          {!c.joined && (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Join ${c.title}`}
              testID={`challenge-join-${c.id}`}
              onPress={() => appStoreActions.joinChallenge(c.id)}
              style={({ pressed }) => [styles.joinBtn, pressed && styles.joinBtnPressed]}
            >
              <Text style={styles.joinBtnLabel}>Join challenge</Text>
            </Pressable>
          )}
        </Card>
      ))}
    </View>
  );
}

function relTime(iso: string): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return iso;
  const diff = Math.max(0, Date.now() - then);
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString();
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  segmentRow: {
    flexDirection: 'row',
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    backgroundColor: colors.card,
    padding: 4,
    borderRadius: radii.pill,
    gap: 4,
  },
  segment: {
    flex: 1,
    paddingVertical: spacing.xs,
    borderRadius: radii.pill,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.xxs,
  },
  segmentActive: {
    backgroundColor: colors.darkSurface,
  },
  segmentPressed: { opacity: 0.85 },
  segmentLabel: {
    fontFamily: 'Inter_500Medium',
    fontSize: 12,
    color: colors.textMuted,
  },
  segmentLabelActive: {
    color: colors.textInverse,
  },
  feedWrap: { marginBottom: spacing.lg },
  emptyCard: { alignItems: 'center', gap: spacing.xs, paddingVertical: spacing.lg },
  emptyTitle: {
    fontFamily: 'Inter_700Bold',
    fontSize: 16,
    color: colors.textPrimary,
  },
  emptyBody: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    color: colors.textMuted,
    textAlign: 'center',
    maxWidth: 280,
  },
  postCard: { marginBottom: spacing.sm },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  postAuthor: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  postAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  postAuthorName: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
    color: colors.textPrimary,
  },
  postMeta: {
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
    color: colors.textMuted,
  },
  postOpen: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  postBody: {
    fontFamily: 'Inter_400Regular',
    fontSize: 15,
    color: colors.textPrimary,
    lineHeight: 21,
    marginBottom: spacing.sm,
  },
  postActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  actionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.xs,
    paddingVertical: 4,
    borderRadius: radii.pill,
    backgroundColor: colors.background,
  },
  actionChipPressed: { opacity: 0.7 },
  actionLabel: {
    fontFamily: 'Inter_500Medium',
    fontSize: 12,
    color: colors.textMuted,
  },
  actionLabelActive: { color: colors.accentRed },
  rankRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  rankRowHighlight: { borderWidth: 1.5, borderColor: colors.primary },
  rankBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankBadgeHighlight: { backgroundColor: colors.primarySoft },
  rankNumber: {
    fontFamily: 'Inter_700Bold',
    fontSize: 14,
    color: colors.textPrimary,
  },
  rankNumberHighlight: { color: colors.primary },
  rankNameWrap: { flex: 1 },
  rankName: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 15,
    color: colors.textPrimary,
  },
  rankHint: {
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
  challengeCard: { marginBottom: spacing.sm },
  challengeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: spacing.xs,
  },
  challengeTitle: {
    fontFamily: 'Inter_700Bold',
    fontSize: 16,
    color: colors.textPrimary,
  },
  challengeDescription: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 4,
  },
  joinedPill: {
    paddingVertical: 2,
    paddingHorizontal: spacing.xs,
    borderRadius: radii.pill,
    backgroundColor: colors.accentGreen,
  },
  joinedPillText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 11,
    color: colors.textInverse,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  challengeMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginVertical: spacing.xs,
  },
  challengeMetaText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: colors.textMuted,
  },
  challengeRewardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xxs,
    marginBottom: spacing.xs,
  },
  challengeReward: {
    fontFamily: 'Inter_500Medium',
    fontSize: 13,
    color: colors.textPrimary,
  },
  joinBtn: {
    alignSelf: 'flex-start',
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: radii.pill,
    backgroundColor: colors.primary,
  },
  joinBtnPressed: { opacity: 0.85 },
  joinBtnLabel: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 13,
    color: colors.textInverse,
  },
  findCta: { marginTop: spacing.md },
});
