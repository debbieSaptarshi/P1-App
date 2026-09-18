import { router } from 'expo-router';
import React, { useMemo } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { CircleIconButton } from '@/components/meals/CircleIconButton';
import { GROUP_AVATARS } from '@/constants/groupsCatalog';
import { colors, radii, spacing } from '@/constants/tokens';
import { appStoreActions, useAppStore } from '@/hooks/useAppStore';
import type { AccountabilityGroup } from '@/types';

const iconBell = require('@/assets/images/groups/icon-bell.svg');
const iconPlusPrivate = require('@/assets/images/groups/icon-plus-private.svg');
const iconPlusJoin = require('@/assets/images/groups/icon-plus-join.svg');

/**
 * Groups tab — Figma “Group / Your Group” (6128:8510).
 *
 * Your Groups lists joined communities; Discover lists the rest with a
 * join control. The tab bar is owned by `(tabs)/_layout` (not rebuilt).
 */
export default function CommunityScreen() {
  const insets = useSafeAreaInsets();
  const { state } = useAppStore();

  const yourGroups = useMemo(
    () => state.groups.filter((group) => group.joined),
    [state.groups],
  );
  const discoverGroups = useMemo(
    () => state.groups.filter((group) => !group.joined),
    [state.groups],
  );

  const openActivity = () => {
    const withUnread = yourGroups.find((group) => (group.unreadCount ?? 0) > 0);
    const target = withUnread ?? yourGroups[0];
    if (target) {
      router.push(`/group/${target.id}`);
      return;
    }
    router.push('/group');
  };

  return (
    <View style={styles.root}>
      <ScrollView
        contentContainerStyle={{
          paddingTop: insets.top + spacing.xs,
          paddingBottom: insets.bottom + 120,
        }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.pageHeader}>
          <Text style={styles.pageTitle}>Groups</Text>
          <CircleIconButton
            source={iconBell}
            accessibilityLabel="Group notifications"
            testID="groups-bell"
            onPress={openActivity}
          />
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Your Groups</Text>
        </View>
        <View style={styles.list}>
          {yourGroups.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyTitle}>No groups yet</Text>
              <Text style={styles.emptyBody}>
                Join a group below to see it here.
              </Text>
            </View>
          ) : (
            yourGroups.map((group) => (
              <GroupCard key={group.id} group={group} variant="joined" />
            ))
          )}
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Discover Groups</Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Private group"
            testID="groups-private"
            onPress={() => router.push('/group')}
            style={({ pressed }) => [styles.privateBtn, pressed && styles.pressed]}
          >
            <View style={styles.privateIconBox}>
              <Image
                source={iconPlusPrivate}
                style={styles.privateIcon}
                contentFit="contain"
              />
            </View>
            <Text style={styles.privateLabel}>Private Group</Text>
          </Pressable>
        </View>
        <View style={styles.list}>
          {discoverGroups.map((group) => (
            <GroupCard key={group.id} group={group} variant="discover" />
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

function formatMembers(count: number): string {
  return `${count.toLocaleString()} ${count === 1 ? 'Member' : 'Members'}`;
}

function formatUnread(count: number): string {
  return count > 9 ? '9+' : String(count);
}

function GroupCard({
  group,
  variant,
}: {
  group: AccountabilityGroup;
  variant: 'joined' | 'discover';
}) {
  const avatar = GROUP_AVATARS[group.id];
  const unread = group.unreadCount ?? 0;

  const join = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    appStoreActions.joinGroup(group.id);
  };

  return (
    <View style={styles.card}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Open ${group.name}`}
        testID={`group-open-${group.id}`}
        onPress={() => router.push(`/group/${group.id}`)}
        style={({ pressed }) => [styles.cardMain, pressed && styles.pressed]}
      >
        <View style={styles.avatarBox}>
          {avatar ? (
            <Image source={avatar} style={styles.avatar} contentFit="cover" />
          ) : (
            <View style={[styles.avatar, styles.avatarFallback]} />
          )}
        </View>
        <View style={styles.info}>
          <View style={styles.titleBlock}>
            <Text style={styles.groupName} numberOfLines={1}>
              {group.name}
            </Text>
            <Text style={styles.memberCount}>{formatMembers(group.members)}</Text>
          </View>
          <Text style={styles.caption} numberOfLines={2}>
            {group.description}
          </Text>
        </View>
        {variant === 'joined' && unread > 0 ? (
          <View style={styles.unreadBadge} testID={`group-unread-${group.id}`}>
            <Text style={styles.unreadLabel}>{formatUnread(unread)}</Text>
          </View>
        ) : null}
      </Pressable>
      {variant === 'discover' ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Join ${group.name}`}
          testID={`group-toggle-${group.id}`}
          onPress={join}
          hitSlop={8}
          style={({ pressed }) => [styles.joinBtn, pressed && styles.pressed]}
        >
          <View style={styles.joinIconBox}>
            <Image
              source={iconPlusJoin}
              style={styles.joinIcon}
              contentFit="contain"
            />
          </View>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  pageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    gap: spacing.md,
  },
  pageTitle: {
    flex: 1,
    fontFamily: 'Inter_500Medium',
    fontSize: 32,
    lineHeight: 38,
    letterSpacing: -0.2,
    color: colors.textPrimary,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    gap: spacing.md,
  },
  sectionTitle: {
    flex: 1,
    fontFamily: 'Inter_500Medium',
    fontSize: 20,
    lineHeight: 24,
    color: colors.textPrimary,
  },
  privateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  privateIconBox: {
    width: 16,
    height: 16,
  },
  privateIcon: {
    width: 16,
    height: 16,
  },
  privateLabel: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: -0.12,
    color: colors.textMuted,
    textAlign: 'right',
  },
  list: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    gap: spacing.xs,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.card,
    borderRadius: radii.xl,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  cardMain: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  avatarBox: {
    width: 72,
    height: 72,
    borderRadius: 36,
    overflow: 'hidden',
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
  },
  avatarFallback: {
    backgroundColor: colors.border,
  },
  info: {
    flex: 1,
    minWidth: 0,
    gap: spacing.xxs,
  },
  titleBlock: {
    gap: 2,
  },
  groupName: {
    fontFamily: 'Inter_500Medium',
    fontSize: 16,
    lineHeight: 22,
    letterSpacing: -0.18,
    color: colors.textPrimary,
  },
  memberCount: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    lineHeight: 20,
    letterSpacing: -0.16,
    color: colors.textPrimary,
  },
  caption: {
    fontFamily: 'Inter_400Regular',
    fontSize: 10,
    lineHeight: 12,
    color: colors.textMuted,
  },
  unreadBadge: {
    backgroundColor: colors.darkSurface,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.xxs,
    overflow: 'hidden',
  },
  unreadLabel: {
    fontFamily: 'Inter_500Medium',
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: -0.12,
    color: colors.textInverse,
  },
  joinBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.darkSurface,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  joinIconBox: {
    width: 16,
    height: 16,
  },
  joinIcon: {
    width: 16,
    height: 16,
  },
  emptyCard: {
    backgroundColor: colors.card,
    borderRadius: radii.xl,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    gap: spacing.xxs,
  },
  emptyTitle: {
    fontFamily: 'Inter_500Medium',
    fontSize: 16,
    lineHeight: 22,
    color: colors.textPrimary,
  },
  emptyBody: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    lineHeight: 20,
    color: colors.textMuted,
  },
  pressed: { opacity: 0.85 },
});
