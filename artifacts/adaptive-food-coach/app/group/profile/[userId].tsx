import { Image } from 'expo-image';
import { StatusBar } from 'expo-status-bar';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useMemo } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CircleIconButton } from '@/components/meals/CircleIconButton';
import { colors, radii, spacing } from '@/constants/tokens';
import { useAppStore } from '@/hooks/useAppStore';
import type { GroupPost, LeaderboardEntry, MilestoneBadge, UserProfile } from '@/types';
import { nameFromProfileId, profileIdFromName } from '../_profileNav';

const iconBack = require('@/assets/images/group-profile/back.svg');
const defaultAvatar = require('@/assets/images/group-profile/avatar.png');
const badgesStat = require('@/assets/images/group-profile/badges-stat.png');
const flame1 = require('@/assets/images/group-profile/flame-1.svg');
const flame2 = require('@/assets/images/group-profile/flame-2.svg');
const flame3 = require('@/assets/images/group-profile/flame-3.svg');

const BADGE_SIZE = 80;
const BADGES_TOTAL = 36;
const STREAK_PILL_BORDER = '#F1F5F9';

const KNOWN_HANDLES: Record<string, string> = {
  'ethan clark': 'GentleGiant',
  'aisha khan': 'AishaMoves',
  'lin chen': 'LinLogs',
  'carlos rivera': 'CarlosRuns',
  'mike wheeler': 'MikeW',
  'priya shah': 'PriyaS',
  'diego alvarez': 'DiegoA',
  'hana park': 'HanaP',
};

type BadgeCopyKind = 'streak' | 'meals' | 'dumpster';

interface BadgeArt {
  id: string;
  title: string;
  caption: string;
  copy: BadgeCopyKind;
  value: string;
  shield: number;
  fill: number;
  shieldBox: { width: number; height: number; left: number; top: number };
  fillBox: { width: number; height: number; left: number; top: number };
}

const DIAMOND_SHIELD = { width: 76.0236, height: 76.0236, left: 1.9882, top: 1.9882 };
const DIAMOND_FILL = { width: 61.349, height: 61.349, left: 9.3255, top: 9.3255 };
const PENTAGON_SHIELD = { width: 74.3997, height: 71.2276, left: 2.8, top: 1.136 };
const PENTAGON_FILL = { width: 59.7444, height: 57.1331, left: 10.1248, top: 8.7552 };
const DUMPSTER_SHIELD = { width: 76.0845, height: 79.506, left: 1.9578, top: 0.247 };
const DUMPSTER_FILL = { width: 60.8676, height: 63.6706, left: 9.5662, top: 8.1647 };

const MILESTONE_BADGES: BadgeArt[] = [
  {
    id: 'rookie',
    title: 'Rookie',
    caption: '3 day streak',
    copy: 'streak',
    value: '3',
    shield: require('@/assets/images/group-profile/badge-1-shield.svg'),
    fill: require('@/assets/images/group-profile/badge-1-fill.svg'),
    shieldBox: DIAMOND_SHIELD,
    fillBox: DIAMOND_FILL,
  },
  {
    id: 'getting-serious',
    title: 'Getting Serious',
    caption: '10 day streak',
    copy: 'streak',
    value: '10',
    shield: require('@/assets/images/group-profile/badge-2-shield.svg'),
    fill: require('@/assets/images/group-profile/badge-2-fill.svg'),
    shieldBox: DIAMOND_SHIELD,
    fillBox: DIAMOND_FILL,
  },
  {
    id: 'locked-in',
    title: 'Locked In',
    caption: '50 day streak',
    copy: 'streak',
    value: '50',
    shield: require('@/assets/images/group-profile/badge-3-shield.svg'),
    fill: require('@/assets/images/group-profile/badge-3-fill.svg'),
    shieldBox: DIAMOND_SHIELD,
    fillBox: DIAMOND_FILL,
  },
  {
    id: 'triple-threat',
    title: 'Triple Threat',
    caption: '100 day streak',
    copy: 'streak',
    value: '100',
    shield: require('@/assets/images/group-profile/badge-4-shield.svg'),
    fill: require('@/assets/images/group-profile/badge-4-fill.svg'),
    shieldBox: DIAMOND_SHIELD,
    fillBox: DIAMOND_FILL,
  },
  {
    id: 'no-days-off',
    title: 'No Days Off',
    caption: '365 day streak',
    copy: 'streak',
    value: '365',
    shield: require('@/assets/images/group-profile/badge-5-shield.svg'),
    fill: require('@/assets/images/group-profile/badge-5-fill.svg'),
    shieldBox: DIAMOND_SHIELD,
    fillBox: DIAMOND_FILL,
  },
  {
    id: 'immortal',
    title: 'Immortal',
    caption: '1000 day streak',
    copy: 'streak',
    value: '1000',
    shield: require('@/assets/images/group-profile/badge-6-shield.svg'),
    fill: require('@/assets/images/group-profile/badge-6-fill.svg'),
    shieldBox: DIAMOND_SHIELD,
    fillBox: DIAMOND_FILL,
  },
  {
    id: 'meals',
    title: 'Meals',
    caption: 'Logged 5 meals',
    copy: 'meals',
    value: '5',
    shield: require('@/assets/images/group-profile/badge-7-shield.svg'),
    fill: require('@/assets/images/group-profile/badge-7-fill.svg'),
    shieldBox: PENTAGON_SHIELD,
    fillBox: PENTAGON_FILL,
  },
  {
    id: 'nutrition',
    title: 'Nutrition',
    caption: 'Logged 50 meals',
    copy: 'meals',
    value: '50',
    shield: require('@/assets/images/group-profile/badge-8-shield.svg'),
    fill: require('@/assets/images/group-profile/badge-8-fill.svg'),
    shieldBox: PENTAGON_SHIELD,
    fillBox: PENTAGON_FILL,
  },
  {
    id: 'logfather',
    title: 'Logfather',
    caption: 'Logged 500 meals',
    copy: 'meals',
    value: '500',
    shield: require('@/assets/images/group-profile/badge-9-shield.svg'),
    fill: require('@/assets/images/group-profile/badge-9-fill.svg'),
    shieldBox: PENTAGON_SHIELD,
    fillBox: PENTAGON_FILL,
  },
  {
    id: 'dumpster',
    title: 'Dumpster',
    caption: 'Longest Streak',
    copy: 'dumpster',
    value: '10',
    shield: require('@/assets/images/group-profile/badge-dumpster-shield.svg'),
    fill: require('@/assets/images/group-profile/badge-dumpster-fill.svg'),
    shieldBox: DUMPSTER_SHIELD,
    fillBox: DUMPSTER_FILL,
  },
];

const dumpsterHeart = require('@/assets/images/group-profile/badge-dumpster-heart.svg');

interface PublicProfile {
  userId: string;
  name: string;
  handle: string;
  avatarUri?: string;
  currentStreak: number;
  longestStreak: number;
  badgesUnlocked: number;
  badgesTotal: number;
  isMe: boolean;
}

function handleFromName(name: string): string {
  const known = KNOWN_HANDLES[name.trim().toLowerCase()];
  if (known) return `@${known}`;
  const compact = name.replace(/[^A-Za-z0-9]/g, '');
  return `@${compact || 'member'}`;
}

function hashId(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash * 31 + value.charCodeAt(i)) >>> 0;
  }
  return hash;
}

function longestLoggedStreak(dates: string[]): number {
  const unique = [...new Set(dates)].sort();
  let best = 0;
  let current = 0;
  let previous: string | null = null;
  for (const date of unique) {
    if (previous) {
      const diff = (Date.parse(date) - Date.parse(previous)) / 86_400_000;
      current = diff === 1 ? current + 1 : 1;
    } else {
      current = 1;
    }
    best = Math.max(best, current);
    previous = date;
  }
  return best;
}

function isCurrentUser(userId: string, profile: UserProfile): boolean {
  const raw = decodeURIComponent(userId);
  return (
    raw === profile.id ||
    raw === 'u_demo' ||
    raw === 'usr_demo' ||
    profileIdFromName(profile.name) === raw
  );
}

function matchLeader(userId: string, name: string, board: LeaderboardEntry[]): LeaderboardEntry | undefined {
  const raw = decodeURIComponent(userId);
  return board.find(
    (entry) =>
      entry.userId === raw ||
      profileIdFromName(entry.displayName) === raw ||
      entry.displayName.toLowerCase() === name.toLowerCase(),
  );
}

function matchPost(userId: string, name: string, posts: GroupPost[]): GroupPost | undefined {
  const raw = decodeURIComponent(userId);
  return posts.find(
    (post) =>
      post.authorId === raw ||
      profileIdFromName(post.authorName) === raw ||
      post.authorName.toLowerCase() === name.toLowerCase(),
  );
}

function resolvePublicProfile(args: {
  userId: string;
  profile: UserProfile;
  leaderboard: LeaderboardEntry[];
  groupPosts: GroupPost[];
  milestones: MilestoneBadge[];
  streakDays: number;
  loggedDates: string[];
}): PublicProfile {
  const { userId, profile, leaderboard, groupPosts, milestones, streakDays, loggedDates } = args;
  const isMe = isCurrentUser(userId, profile);
  let name = isMe ? profile.name : '';
  let avatarUri = isMe ? profile.avatar : undefined;

  const leader = matchLeader(userId, name, leaderboard);
  if (leader) {
    name = name || leader.displayName;
    avatarUri = avatarUri || leader.avatar;
  }
  const post = matchPost(userId, name, groupPosts);
  if (post) {
    name = name || post.authorName;
    avatarUri = avatarUri || post.authorAvatar;
  }
  if (!name) name = nameFromProfileId(userId);

  const unlocked = milestones.filter((badge) => badge.unlocked).length;
  const myLongest = longestLoggedStreak(loggedDates);
  const hash = hashId(decodeURIComponent(userId));
  const badgesTotal = milestones.length > 0 ? milestones.length : BADGES_TOTAL;

  if (isMe) {
    return {
      userId,
      name,
      handle: handleFromName(name),
      avatarUri,
      currentStreak: streakDays || 238,
      longestStreak: myLongest || streakDays || 14,
      badgesUnlocked: unlocked || 10,
      badgesTotal,
      isMe,
    };
  }

  return {
    userId,
    name,
    handle: handleFromName(name),
    avatarUri,
    currentStreak: 80 + (hash % 180),
    longestStreak: Math.max(myLongest, 8 + (hash % 16)),
    badgesUnlocked: Math.max(unlocked, 6 + (hash % 7)),
    badgesTotal,
    isMe,
  };
}

function chunkRows<T>(items: T[], size: number): T[][] {
  const rows: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    rows.push(items.slice(i, i + size));
  }
  return rows;
}

/**
 * Public group member profile — Figma “Group / See Profile” (6051:31689).
 */
export default function GroupMemberProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ userId?: string }>();
  const userId = params.userId ?? 'member';
  const { state, streakDays } = useAppStore();

  const person = useMemo(() => {
    const loggedDates = state.foodLogs
      .filter((day) => day.entries.length > 0)
      .map((day) => day.date);
    return resolvePublicProfile({
      userId,
      profile: state.profile,
      leaderboard: state.leaderboard,
      groupPosts: state.groupPosts,
      milestones: state.milestones,
      streakDays,
      loggedDates,
    });
  }, [userId, state.profile, state.leaderboard, state.groupPosts, state.milestones, state.foodLogs, streakDays]);

  const badgeProgress = Math.max(
    0,
    Math.min(1, person.badgesUnlocked / Math.max(1, person.badgesTotal)),
  );
  const avatarSource = person.avatarUri ? { uri: person.avatarUri } : defaultAvatar;

  return (
      <View style={styles.root} testID="group-member-profile">
      <StatusBar style="dark" />
      <View style={[styles.topBar, { paddingTop: insets.top + spacing.xs }]}>
        <CircleIconButton
          source={iconBack}
          accessibilityLabel="Back"
          testID="group-profile-back"
          onPress={() => router.back()}
        />
      </View>

      <ScrollView
        contentContainerStyle={{ paddingBottom: insets.bottom + spacing.xxl }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.profileInfo}>
          <View style={styles.identity}>
            <View style={styles.avatarWrap}>
              <Image
                source={avatarSource}
                style={styles.avatar}
                contentFit="cover"
                accessibilityLabel={`${person.name} avatar`}
              />
              <View style={styles.streakPillAnchor} pointerEvents="none">
                <View style={styles.streakPill}>
                  <Text style={styles.streakPillText}>{`🔥 ${person.currentStreak}`}</Text>
                </View>
              </View>
            </View>
            <View style={styles.nameBlock}>
              <Text style={styles.displayName}>{person.name}</Text>
              <Text style={styles.handle}>{person.handle}</Text>
            </View>
          </View>

          <View style={styles.statRow}>
            <View style={styles.statCard}>
              <FlameIcon />
              <View style={styles.statCopy}>
                <Text style={styles.statValue}>{person.longestStreak} days</Text>
                <Text style={styles.statCaption}>Longest Streak</Text>
              </View>
            </View>
            <View style={styles.statCard}>
              <View style={styles.badgeStatIcon}>
                <Image
                  source={badgesStat}
                  style={styles.badgeStatImage}
                  contentFit="contain"
                  accessibilityLabel="Badges"
                />
              </View>
              <View style={styles.badgeStatCopy}>
                <Text style={styles.statValue}>
                  {person.badgesUnlocked}/{person.badgesTotal} Badges
                </Text>
                <View style={styles.progressTrack}>
                  <View style={[styles.progressFill, { width: `${badgeProgress * 100}%` }]} />
                </View>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Milestone</Text>
        </View>

        <View style={styles.badgeGrid}>
          {chunkRows(MILESTONE_BADGES, 3).map((row) => (
            <View key={row.map((badge) => badge.id).join('-')} style={styles.badgeRow}>
              {row.map((badge) => (
                <View key={badge.id} style={styles.badgeCell}>
                  <MilestoneBadge art={badge} />
                  <View style={styles.badgeLabels}>
                    <Text style={styles.badgeTitle}>{badge.title}</Text>
                    <Text style={styles.badgeCaption}>{badge.caption}</Text>
                  </View>
                </View>
              ))}
              {row.length < 3
                ? Array.from({ length: 3 - row.length }).map((_, index) => (
                    <View key={`spacer-${index}`} style={styles.badgeCell} />
                  ))
                : null}
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

function FlameIcon() {
  return (
    <View style={styles.flameBox} accessibilityLabel="Longest streak">
      <Image source={flame1} style={styles.flame1} contentFit="fill" />
      <Image source={flame2} style={styles.flame2} contentFit="fill" />
      <Image source={flame3} style={styles.flame3} contentFit="fill" />
    </View>
  );
}

function MilestoneBadge({ art }: { art: BadgeArt }) {
  return (
    <View style={styles.badgeArt} accessibilityLabel={art.title}>
      <Image source={art.shield} style={[styles.badgeLayer, art.shieldBox]} contentFit="fill" />
      <Image source={art.fill} style={[styles.badgeLayer, art.fillBox]} contentFit="fill" />
      {art.copy === 'dumpster' ? (
        <>
          <Image source={dumpsterHeart} style={styles.dumpsterHeart} contentFit="fill" />
          <Text style={styles.dumpsterValue}>{art.value}</Text>
        </>
      ) : art.copy === 'meals' ? (
        <Text style={styles.mealsValue}>{art.value}</Text>
      ) : (
        <View style={styles.streakCopy}>
          <Text style={styles.streakValue}>{art.value}</Text>
          <Text style={styles.streakLabel}>STREAK</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  topBar: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xs,
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileInfo: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    gap: spacing.xs,
  },
  identity: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radii.xl,
  },
  avatarWrap: {
    width: 100,
    height: 100,
    alignItems: 'center',
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  streakPillAnchor: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: -8,
    alignItems: 'center',
  },
  streakPill: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: STREAK_PILL_BORDER,
    borderRadius: radii.pill,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  streakPillText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: -0.12,
    color: colors.textPrimary,
  },
  nameBlock: {
    width: '100%',
    alignItems: 'center',
    gap: 2,
  },
  displayName: {
    fontFamily: 'Inter_500Medium',
    fontSize: 16,
    lineHeight: 22,
    letterSpacing: -0.18,
    color: colors.textPrimary,
    textAlign: 'center',
    width: '100%',
  },
  handle: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    lineHeight: 20,
    letterSpacing: -0.16,
    color: colors.textMuted,
    textAlign: 'center',
    width: '100%',
  },
  statRow: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  statCard: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    backgroundColor: colors.card,
    borderRadius: radii.xl,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  flameBox: {
    width: 40,
    height: 40,
  },
  flame1: {
    position: 'absolute',
    width: 20,
    height: 28.224,
    left: 10.2,
    top: 4.8,
  },
  flame2: {
    position: 'absolute',
    width: 13.3681,
    height: 18.819,
    left: 13.716,
    top: 14.184,
  },
  flame3: {
    position: 'absolute',
    width: 7.61083,
    height: 10.6435,
    left: 16.14,
    top: 22.344,
  },
  statCopy: {
    flex: 1,
    minWidth: 0,
    alignItems: 'flex-start',
    justifyContent: 'center',
    gap: 2,
  },
  statValue: {
    fontFamily: 'Inter_500Medium',
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: -0.12,
    color: colors.textPrimary,
  },
  statCaption: {
    fontFamily: 'Inter_400Regular',
    fontSize: 10,
    lineHeight: 12,
    color: colors.textMuted,
  },
  badgeStatIcon: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeStatImage: {
    width: 28,
    height: 28,
  },
  badgeStatCopy: {
    flex: 1,
    minWidth: 0,
    justifyContent: 'center',
    gap: 4,
  },
  progressTrack: {
    height: 4,
    width: '100%',
    backgroundColor: colors.background,
    overflow: 'hidden',
  },
  progressFill: {
    height: 4,
    backgroundColor: colors.primary,
  },
  sectionHeader: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  sectionTitle: {
    fontFamily: 'Inter_500Medium',
    fontSize: 16,
    lineHeight: 22,
    letterSpacing: -0.18,
    color: colors.textPrimary,
  },
  badgeGrid: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    gap: spacing.xs,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xxl,
  },
  badgeCell: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeArt: {
    width: BADGE_SIZE,
    height: BADGE_SIZE,
    overflow: 'hidden',
    flexShrink: 0,
  },
  badgeLayer: {
    position: 'absolute',
  },
  badgeLabels: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  badgeTitle: {
    fontFamily: 'Inter_500Medium',
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: -0.12,
    color: colors.textPrimary,
    textAlign: 'center',
    width: '100%',
  },
  badgeCaption: {
    fontFamily: 'Inter_400Regular',
    fontSize: 10,
    lineHeight: 12,
    color: colors.textMuted,
    textAlign: 'center',
    width: '100%',
  },
  streakCopy: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  streakValue: {
    fontFamily: 'Inter_700Bold',
    fontSize: 9.6,
    lineHeight: 12,
    color: colors.textInverse,
    textAlign: 'center',
    width: '100%',
    textShadowColor: 'rgba(0,0,0,0.25)',
    textShadowOffset: { width: 0, height: 3.2 },
    textShadowRadius: 3.2,
  },
  streakLabel: {
    fontFamily: 'Inter_700Bold',
    fontSize: 9.6,
    lineHeight: 12,
    letterSpacing: -0.384,
    color: colors.textInverse,
    fontStyle: 'italic',
    textAlign: 'center',
    width: '100%',
    textShadowColor: 'rgba(0,0,0,0.25)',
    textShadowOffset: { width: 0, height: 3.2 },
    textShadowRadius: 3.2,
  },
  mealsValue: {
    position: 'absolute',
    top: 24.8,
    width: '100%',
    fontFamily: 'Inter_700Bold',
    fontSize: 25.6,
    lineHeight: 30,
    letterSpacing: -1.024,
    color: colors.textInverse,
    fontStyle: 'italic',
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.25)',
    textShadowOffset: { width: 0, height: 3.2 },
    textShadowRadius: 3.2,
  },
  dumpsterHeart: {
    position: 'absolute',
    width: 40,
    height: 40,
    left: 20,
    top: 20,
  },
  dumpsterValue: {
    position: 'absolute',
    top: 28.8,
    width: '100%',
    fontFamily: 'Inter_700Bold',
    fontSize: 19.2,
    lineHeight: 22,
    letterSpacing: -0.768,
    color: colors.darkSurface,
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.25)',
    textShadowOffset: { width: 0, height: 3.2 },
    textShadowRadius: 3.2,
  },
});
