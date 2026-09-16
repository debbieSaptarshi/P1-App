import { router } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, radii, spacing } from '@/constants/tokens';
import { Button, Card, Header } from '@/components/ui';
import { appStoreActions, useAppStore } from '@/hooks/useAppStore';
import type { Challenge } from '@/types';

/**
 * Stand-alone challenges view. Shows joined / available challenges with
 * a CTA per row and a hero card highlighting the next big milestone.
 */
export default function GroupChallengesScreen() {
  const insets = useSafeAreaInsets();
  const { state } = useAppStore();

  const joined = state.challenges.filter((c) => c.joined);
  const available = state.challenges.filter((c) => !c.joined);

  const nextDeadline = state.challenges.reduce<Challenge | null>(
    (acc, cur) => (!acc || cur.daysRemaining < acc.daysRemaining ? cur : acc),
    null,
  );

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <Header
        title="Challenges"
        subtitle="Stay accountable together"
        rightIcon="bar-chart-2"
        onRightPress={() => router.push('/group/leaderboard')}
      />
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: spacing.lg,
          paddingBottom: insets.bottom + spacing.xxxl,
        }}
        showsVerticalScrollIndicator={false}
      >
        {nextDeadline && (
          <Card
            style={
              joined.length >= 1
                ? { ...styles.hero, ...styles.heroJoined }
                : styles.hero
            }
          >
            <View style={styles.heroHeader}>
              <View style={styles.heroIcon}>
                <Feather name="zap" size={22} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.heroLabel}>Next up</Text>
                <Text style={styles.heroTitle}>{nextDeadline.title}</Text>
              </View>
            </View>
            <Text style={styles.heroDescription}>{nextDeadline.description}</Text>
            <View style={styles.heroMeta}>
              <View style={styles.heroMetaItem}>
                <Feather name="users" size={12} color={colors.textMuted} />
                <Text style={styles.heroMetaText}>
                  {nextDeadline.participants.toLocaleString()} participants
                </Text>
              </View>
              <View style={styles.heroMetaItem}>
                <Feather name="clock" size={12} color={colors.textMuted} />
                <Text style={styles.heroMetaText}>
                  {nextDeadline.daysRemaining} days left
                </Text>
              </View>
              <View style={styles.heroMetaItem}>
                <Feather name="award" size={12} color={colors.textMuted} />
                <Text style={styles.heroMetaText}>{nextDeadline.reward}</Text>
              </View>
            </View>
          </Card>
        )}

        {joined.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Joined</Text>
            {joined.map((c) => (
              <ChallengeRow key={c.id} challenge={c} />
            ))}
          </>
        )}

        {available.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Available</Text>
            {available.map((c) => (
              <ChallengeRow key={c.id} challenge={c} />
            ))}
          </>
        )}

        <Button
          variant="ghost"
          title="Browse Groups"
          leadingIcon="users"
          onPress={() => router.push('/group')}
          style={styles.browseCta}
          testID="challenges-browse-groups"
        />
      </ScrollView>
    </View>
  );
}

function ChallengeRow({ challenge }: { challenge: Challenge }) {
  const progress = Math.max(
    0,
    Math.min(1, challenge.joined ? 0.45 : 0.15),
  );
  return (
    <Card style={styles.challenge}>
      <View style={styles.challengeHeader}>
        <View style={{ flex: 1 }}>
          <Text style={styles.challengeTitle}>{challenge.title}</Text>
          <Text style={styles.challengeDescription}>{challenge.description}</Text>
        </View>
        {challenge.joined && (
          <View style={styles.joinedPill}>
            <Text style={styles.joinedPillText}>Joined</Text>
          </View>
        )}
      </View>
      <View style={styles.progressBarBox}>
        <View style={styles.progressTrack}>
          <View
            style={[
              styles.progressFill,
              { width: `${Math.round(progress * 100)}%` },
            ]}
          />
        </View>
        <Text style={styles.progressLabel}>
          {challenge.joined ? 'In progress' : 'Not started'}
        </Text>
      </View>
      <View style={styles.metaRow}>
        <View style={styles.metaItem}>
          <Feather name="users" size={12} color={colors.textMuted} />
          <Text style={styles.metaText}>
            {challenge.participants.toLocaleString()} joined
          </Text>
        </View>
        <View style={styles.metaItem}>
          <Feather name="calendar" size={12} color={colors.textMuted} />
          <Text style={styles.metaText}>
            {challenge.daysRemaining} days left
          </Text>
        </View>
      </View>
      <View style={styles.rewardRow}>
        <Feather name="award" size={13} color={colors.accentOrange} />
        <Text style={styles.rewardText}>Reward: {challenge.reward}</Text>
      </View>
      {!challenge.joined && (
        <Button
          title="Join challenge"
          leadingIcon="zap"
          onPress={() => appStoreActions.joinChallenge(challenge.id)}
          style={styles.joinCta}
          testID={`challenge-row-join-${challenge.id}`}
        />
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  hero: { marginBottom: spacing.lg },
  heroJoined: { borderWidth: 1.5, borderColor: colors.primary },
  heroHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  heroIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroLabel: {
    fontFamily: 'Inter_500Medium',
    fontSize: 11,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  heroTitle: {
    fontFamily: 'Inter_700Bold',
    fontSize: 18,
    color: colors.textPrimary,
  },
  heroDescription: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: colors.textPrimary,
    lineHeight: 20,
  },
  heroMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginTop: spacing.sm,
  },
  heroMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  heroMetaText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: colors.textMuted,
  },
  sectionTitle: {
    fontFamily: 'Inter_700Bold',
    fontSize: 14,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: spacing.xs,
    marginTop: spacing.xs,
  },
  challenge: { marginBottom: spacing.sm, gap: spacing.xs },
  challengeHeader: {
    flexDirection: 'row',
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
    marginTop: 2,
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
  progressBarBox: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  progressTrack: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.input,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 3,
  },
  progressLabel: {
    fontFamily: 'Inter_500Medium',
    fontSize: 11,
    color: colors.textMuted,
    minWidth: 88,
    textAlign: 'right',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: colors.textMuted,
  },
  rewardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  rewardText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 13,
    color: colors.textPrimary,
  },
  joinCta: { marginTop: spacing.xs },
  browseCta: { marginTop: spacing.lg },
});
