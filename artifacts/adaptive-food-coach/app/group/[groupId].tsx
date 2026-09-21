import { Alert } from 'react-native';
import * as Crypto from 'expo-crypto';
import { api, errorMessage } from '@/services/api';
import { demoMode } from '@/services/supabase';
import { refreshCommunity } from '@/hooks/useAppStore';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import React, { useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, radii, spacing } from '@/constants/tokens';
import { Button, Card, Header } from '@/components/ui';
import { appStoreActions, useAppStore } from '@/hooks/useAppStore';
import type { GroupPost } from '@/types';
import { groupProfileHref, profileIdFromName } from './_profileNav';

/**
 * Group detail view: hero card + scoped feed + a compose box.
 *
 * The compose box stages a new `GroupPost` in local state and pushes it
 * onto the global feed via a small `addGroupPost` helper. We don't
 * persist arbitrary user content by design — the comment thread stays
 * in local state until we add a server.
 */
export default function GroupDetailScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ groupId: string }>();
  const groupId = params.groupId;
  const { state } = useAppStore();
  const [draft, setDraft] = useState('');
  // Locally-composed posts are layer on top of the seed feed; we don't
  // persist user-authored content by design.
  const [localPosts, setLocalPosts] = useState<GroupPost[]>([]);

  const group = useMemo(
    () => state.groups.find((g) => g.id === groupId),
    [state.groups, groupId],
  );

  const posts = useMemo(
    () =>
      [
        ...state.groupPosts.filter((p) => p.groupId === groupId),
        ...localPosts.filter((p) => p.groupId === groupId),
      ].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1)),
    [state.groupPosts, localPosts, groupId],
  );

  if (!group) {
    return (
      <View style={[styles.root, { backgroundColor: colors.background }]}>
        <Header title="Group" />
        <Card style={styles.notFound}>
          <Feather name="alert-circle" size={24} color={colors.textMuted} />
          <Text style={styles.notFoundTitle}>Group not found</Text>
          <Button
            title="Back to groups"
            onPress={() => router.back()}
            style={styles.backCta}
            testID="group-back"
          />
        </Card>
      </View>
    );
  }

  const toggleJoin = () => {
    if (group.joined) {
      appStoreActions.leaveGroup(group.id);
    } else {
      appStoreActions.joinGroup(group.id);
    }
  };

  const submit = async () => {
    const trimmed = draft.trim();
    if (!trimmed) return;
    if (!demoMode) {
      try { await api(`/community/groups/${group.id}/posts`, { method: 'POST', body: { id: Crypto.randomUUID(), body: trimmed } }); setDraft(''); await refreshCommunity(); }
      catch (error) { Alert.alert('Unable to post', errorMessage(error)); }
      return;
    }
    const newPost: GroupPost = {
      id: `local_${Date.now()}`,
      groupId: group.id,
      authorId: state.profile.id,
      authorName: state.profile.name,
      body: trimmed,
      createdAt: new Date().toISOString(),
      reactions: 0,
      comments: 0,
    };
    setLocalPosts((prev) => [newPost, ...prev]);
    setDraft('');
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <Header
        title={group.name}
        subtitle={group.category.replace('_', ' ')}
      />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={{
            paddingHorizontal: spacing.lg,
            paddingBottom: insets.bottom + 120,
          }}
          showsVerticalScrollIndicator={false}
        >
          {/* Hero card */}
          <Card style={styles.heroCard}>
            <View style={styles.heroHeader}>
              <View style={styles.heroIcon}>
                <Feather name="users" size={22} color={colors.primary} />
              </View>
              <View style={styles.heroHeaderText}>
                <Text style={styles.heroName}>{group.name}</Text>
                <Text style={styles.heroMembers}>
                  {group.members.toLocaleString()} members
                  {group.joined ? ' · You joined' : ''}
                </Text>
              </View>
            </View>
            <Text style={styles.heroDescription}>{group.description}</Text>
            <View style={styles.heroActions}>
              <Button
                title={group.joined ? 'Leave group' : 'Join group'}
                leadingIcon={group.joined ? 'user-minus' : 'user-plus'}
                onPress={toggleJoin}
                variant={group.joined ? 'outline' : 'primary'}
                style={styles.heroCta}
                testID={`group-detail-toggle-${group.id}`}
              />
              <Button
                title="View leaderboard"
                variant="ghost"
                leadingIcon="bar-chart-2"
                onPress={() => router.push('/group/leaderboard')}
                style={styles.heroCta}
                testID="group-detail-leaderboard"
              />
            </View>
          </Card>

          {/* Scoped feed */}
          <View style={styles.feedHeader}>
            <Text style={styles.feedTitle}>Feed</Text>
            <Text style={styles.feedCount}>{posts.length} post{posts.length === 1 ? '' : 's'}</Text>
          </View>

          {posts.length === 0 ? (
            <Card style={styles.empty}>
              <Feather name="message-circle" size={22} color={colors.textMuted} />
              <Text style={styles.emptyTitle}>Nothing here yet</Text>
              <Text style={styles.emptyBody}>Be the first to share how today is going.</Text>
            </Card>
          ) : (
            posts.map((post) => (
              <PostRow
                key={post.id}
                post={post}
                onOpen={() => router.push(`/group/post/${post.id}`)}
                onOpenProfile={() =>
                  router.push(
                    groupProfileHref(post.authorId ?? profileIdFromName(post.authorName)),
                  )
                }
              />
            ))
          )}
        </ScrollView>

        {/* Compose box */}
        <View
          style={[
            styles.compose,
            { paddingBottom: insets.bottom + spacing.sm },
          ]}
        >
          <View style={styles.composeInput}>
            <TextInput
              style={styles.composeText}
              value={draft}
              onChangeText={setDraft}
              placeholder={`Share something to ${group.name}…`}
              placeholderTextColor={colors.textPlaceholder}
              multiline
              accessibilityLabel="Compose post"
              testID="group-compose-input"
            />
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Send post"
              testID="group-compose-send"
              onPress={submit}
              disabled={draft.trim().length === 0}
              style={({ pressed }) => [
                styles.sendBtn,
                draft.trim().length === 0 && styles.sendBtnDisabled,
                pressed && styles.pressed,
              ]}
            >
              <Feather name="send" size={16} color={colors.textInverse} />
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

interface PostRowProps {
  post: GroupPost;
  onOpen: () => void;
  onOpenProfile: () => void;
}

function PostRow({ post, onOpen, onOpenProfile }: PostRowProps) {
  const isLocal = post.id.startsWith('local_');
  return (
    <Card style={styles.postCard}>
      <View style={styles.postHeader}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`See ${post.authorName}'s profile`}
          testID={`group-post-profile-${post.id}`}
          onPress={onOpenProfile}
          style={styles.postIdentity}
        >
          <View style={styles.postAvatar}>
            <Feather name="user" size={14} color={colors.textPrimary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.postAuthor}>
              {post.authorName}
              {isLocal && <Text style={styles.youTag}> · You</Text>}
            </Text>
            <Text style={styles.postMeta}>{relTime(post.createdAt)}</Text>
          </View>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Open post"
          testID={`group-post-open-${post.id}`}
          onPress={onOpen}
        >
          <Feather name="chevron-right" size={16} color={colors.textMuted} />
        </Pressable>
      </View>
      <Text style={styles.postBody}>{post.body}</Text>
      <View style={styles.postActions}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={post.liked ? 'Unlike' : 'Like'}
          accessibilityState={{ selected: !!post.liked }}
          testID={`group-post-like-${post.id}`}
          onPress={() => appStoreActions.likePost(post.id)}
          style={({ pressed }) => [styles.actionChip, pressed && styles.pressed]}
        >
          <Feather
            name="heart"
            size={14}
            color={post.liked ? colors.accentRed : colors.primary}
          />
          <Text style={[styles.actionLabel, post.liked && styles.actionLabelActive]}>
            {post.reactions}
          </Text>
        </Pressable>
        <View style={styles.actionChip}>
          <Feather name="message-square" size={14} color={colors.textMuted} />
          <Text style={styles.actionLabel}>{post.comments}</Text>
        </View>
      </View>
    </Card>
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
  heroCard: { marginBottom: spacing.md, gap: spacing.sm },
  heroHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  heroIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroHeaderText: { flex: 1 },
  heroName: {
    fontFamily: 'Inter_700Bold',
    fontSize: 18,
    color: colors.textPrimary,
  },
  heroMembers: {
    fontFamily: 'Inter_500Medium',
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  heroDescription: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: colors.textPrimary,
    lineHeight: 20,
  },
  heroActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  heroCta: { flex: 1 },
  feedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: spacing.xs,
  },
  feedTitle: {
    fontFamily: 'Inter_700Bold',
    fontSize: 15,
    color: colors.textPrimary,
  },
  feedCount: {
    fontFamily: 'Inter_500Medium',
    fontSize: 12,
    color: colors.textMuted,
  },
  postCard: { marginBottom: spacing.sm },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  postIdentity: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  postAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  postAuthor: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
    color: colors.textPrimary,
  },
  postMeta: {
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
  },
  youTag: {
    fontFamily: 'Inter_500Medium',
    fontSize: 11,
    color: colors.primary,
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
  actionLabel: {
    fontFamily: 'Inter_500Medium',
    fontSize: 12,
    color: colors.textMuted,
  },
  actionLabelActive: { color: colors.accentRed },
  empty: { alignItems: 'center', gap: spacing.xs, paddingVertical: spacing.lg },
  emptyTitle: { fontFamily: 'Inter_700Bold', fontSize: 15, color: colors.textPrimary },
  emptyBody: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    color: colors.textMuted,
    textAlign: 'center',
  },
  notFound: { alignItems: 'center', gap: spacing.xs, paddingVertical: spacing.lg },
  notFoundTitle: { fontFamily: 'Inter_700Bold', fontSize: 16, color: colors.textPrimary },
  backCta: { marginTop: spacing.md, width: 220 },
  compose: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xs,
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  composeInput: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: colors.card,
    borderRadius: radii.lg,
    padding: spacing.xs,
    gap: spacing.xs,
  },
  composeText: {
    flex: 1,
    minHeight: 40,
    maxHeight: 120,
    fontFamily: 'Inter_400Regular',
    fontSize: 15,
    color: colors.textPrimary,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.xs,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: { backgroundColor: colors.textPlaceholder },
  pressed: { opacity: 0.75 },
});
