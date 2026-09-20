import { Alert } from 'react-native';
import * as Crypto from 'expo-crypto';
import { api, errorMessage } from '@/services/api';
import { demoMode } from '@/services/supabase';
import { refreshCommunity } from '@/hooks/useAppStore';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import React, { useEffect, useMemo, useState } from 'react';
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

interface CommentDraft {
  id: string;
  author: string;
  body: string;
  createdAt: string;
}

const SAMPLE_REPLIES: Record<string, CommentDraft[]> = {
  pst_1: [
    { id: 'cm_1', author: 'Lin Chen', body: 'Awesome! What was breakfast?', createdAt: '2025-09-15T09:14:00.000Z' },
    { id: 'cm_2', author: 'Priya Shah', body: 'Tell me your snacks, I need ideas.', createdAt: '2025-09-15T09:32:00.000Z' },
  ],
  pst_2: [
    { id: 'cm_3', author: 'Aisha Khan', body: '🎉 PR! Next is sub-25, definitely possible.', createdAt: '2025-09-15T08:10:00.000Z' },
    { id: 'cm_4', author: 'Diego Alvarez', body: 'What shoes?', createdAt: '2025-09-15T09:00:00.000Z' },
  ],
  pst_3: [
    { id: 'cm_5', author: 'Carlos Rivera', body: 'Yes — Greek yogurt + lentils for protein.', createdAt: '2025-09-14T20:00:00.000Z' },
  ],
};

/**
 * Single feed post detail with mock comments stored in component state.
 * New replies are appended locally (no persistence) so the threaded
 * discussion feels real without a backing server.
 */
export default function PostDetailScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ postId?: string }>();
  const id = params.postId ?? 'pst_1';
  const { state, hydrated } = useAppStore();
  const [comments, setComments] = useState<CommentDraft[]>([]);
  const [draft, setDraft] = useState('');
  const [nextOffset, setNextOffset] = useState<number | null>(null);
  const loadComments = async (offset = 0) => {
    if (demoMode) return;
    try { const result = await api<{comments:CommentDraft[];nextOffset:number|null}>(`/community/posts/${id}/comments?offset=${offset}`); setComments(prev => offset ? [...prev, ...result.comments] : result.comments); setNextOffset(result.nextOffset); }
    catch (error) { Alert.alert('Unable to load comments', errorMessage(error)); }
  };
  useEffect(() => { void loadComments(); }, [id]);

  const livePost = state.groupPosts.find((p) => p.id === id);
  const fallback = useMemo<CommentDraft[]>(
    () => demoMode ? (SAMPLE_REPLIES[id] ?? defaultComments()) : [],
    [id],
  );
  const allComments = [...comments, ...fallback].sort((a, b) =>
    a.createdAt < b.createdAt ? -1 : 1,
  );

  if (!livePost) {
    return (
      <View style={[styles.root, { backgroundColor: colors.background }]}>
        <Header title="Post" />
        <Card style={styles.empty}>
          <Feather name="alert-circle" size={24} color={colors.textMuted} />
          <Text style={styles.emptyTitle}>Post not found</Text>
          <Text style={styles.emptyBody}>
            The post you’re looking for may have been removed by its author.
          </Text>
          <Button
            title="Back"
            onPress={() => router.back()}
            style={styles.backCta}
            testID="post-back-cta"
          />
        </Card>
      </View>
    );
  }

  const submit = async () => {
    const trimmed = draft.trim();
    if (!trimmed) return;
    if (!demoMode) {
      try { await api(`/community/posts/${id}/comments`, { method: 'POST', body: { id: Crypto.randomUUID(), body: trimmed } }); setDraft(''); await loadComments(); await refreshCommunity(); }
      catch (error) { Alert.alert('Unable to comment', errorMessage(error)); }
      return;
    }
    setComments((prev) => [
      ...prev,
      {
        id: `local_${Date.now()}`,
        author: state.profile.name,
        body: trimmed,
        createdAt: new Date().toISOString(),
      },
    ]);
    setDraft('');
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <Header title="Post" subtitle={`@${livePost.groupId.replace('grp_', '')}`} />
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
          {/* Hero post */}
          <Card style={styles.postCard}>
            <View style={styles.headerRow}>
              <View style={styles.avatar}>
                <Feather name="user" size={16} color={colors.textPrimary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.author}>{livePost.authorName}</Text>
                <Text style={styles.meta}>{formatDateTime(livePost.createdAt)}</Text>
              </View>
            </View>
            <Text style={styles.body}>{livePost.body}</Text>
            {!demoMode && livePost.authorId !== state.profile.id ? <View style={{ flexDirection: 'row', gap: 20, marginTop: 16 }}>
              <Pressable onPress={async () => { try { await api(`/community/posts/${id}/report`, { method: 'POST', body: { reason: 'Reported by a community member for review' } }); Alert.alert('Report received', 'This post has been queued for review.'); } catch (e) { Alert.alert('Could not report', errorMessage(e)); } }}><Text>Report post</Text></Pressable>
              <Pressable onPress={async () => { try { await api(`/community/users/${livePost.authorId}/block`, { method: 'PUT', body: { blocked: true } }); await refreshCommunity(); router.back(); } catch (e) { Alert.alert('Could not block', errorMessage(e)); } }}><Text>Block author</Text></Pressable>
            </View> : null}
            {!demoMode && livePost.authorId === state.profile.id ? <Button title="Delete my post" onPress={async () => { try { await api(`/community/posts/${id}`, { method: 'DELETE' }); await refreshCommunity(); router.back(); } catch (e) { Alert.alert('Could not delete post', errorMessage(e)); } }} /> : null}
            <View style={styles.actions}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={livePost.liked ? 'Unlike' : 'Like'}
                accessibilityState={{ selected: !!livePost.liked }}
                onPress={() => appStoreActions.likePost(livePost.id)}
                testID={`post-detail-like-${livePost.id}`}
                style={({ pressed }) => [
                  styles.actionBtn,
                  livePost.liked && styles.actionBtnActive,
                  pressed && styles.pressed,
                ]}
              >
                <Feather
                  name="heart"
                  size={16}
                  color={livePost.liked ? colors.accentRed : colors.primary}
                />
                <Text style={[styles.actionLabel, livePost.liked && styles.actionLabelActive]}>
                  {livePost.reactions} reactions
                </Text>
              </Pressable>
              <View style={styles.actionBtn}>
                <Feather name="message-square" size={16} color={colors.textMuted} />
                <Text style={styles.actionLabel}>{allComments.length} comments</Text>
              </View>
            </View>
          </Card>

          <Text style={styles.commentHeader}>Comments</Text>
          {allComments.length === 0 ? (
            <Card style={styles.empty}>
              <Feather name="message-square" size={22} color={colors.textMuted} />
              <Text style={styles.emptyTitle}>Be first to reply</Text>
            </Card>
          ) : (
            allComments.map((c) => <CommentRow key={c.id} comment={c} />)
          )}
          {!hydrated && (
            <Text style={styles.loadingHint}>Loading more comments…</Text>
          )}
          {nextOffset !== null ? <Button title="Load more replies" onPress={() => void loadComments(nextOffset)} /> : null}
        </ScrollView>

        <View style={[styles.compose, { paddingBottom: insets.bottom + spacing.sm }]}>
          <View style={styles.composeRow}>
            <TextInput
              style={styles.composeInput}
              value={draft}
              onChangeText={setDraft}
              placeholder="Add a friendly note…"
              placeholderTextColor={colors.textPlaceholder}
              accessibilityLabel="Comment"
              testID="post-detail-comment-input"
            />
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Send comment"
              testID="post-detail-comment-send"
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

function CommentRow({ comment }: { comment: CommentDraft }) {
  const isMine = comment.id.startsWith('local_');
  return (
    <Card style={styles.comment}>
      <View style={styles.commentHeaderRow}>
        <View style={styles.commentAvatar}>
          <Feather name="user" size={12} color={colors.textPrimary} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.commentAuthor}>
            {comment.author}
            {isMine && <Text style={styles.commentYou}> · You</Text>}
          </Text>
          <Text style={styles.commentMeta}>{relTime(comment.createdAt)}</Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Reply to ${comment.author}`}
          testID={`comment-reply-${comment.id}`}
          onPress={() => {
            if (__DEV__) console.log('[post] reply', comment.id);
          }}
          style={styles.commentAction}
        >
          <Feather name="corner-up-left" size={14} color={colors.primary} />
        </Pressable>
      </View>
      <Text style={styles.commentBody}>{comment.body}</Text>
    </Card>
  );
}

function defaultComments(): CommentDraft[] {
  return [];
}

function formatDateTime(iso: string): string {
  if (!iso || Number.isNaN(Date.parse(iso))) return '—';
  const d = new Date(iso);
  return d.toLocaleString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
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
  postCard: { marginBottom: spacing.md, gap: spacing.sm },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  author: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 15,
    color: colors.textPrimary,
  },
  meta: {
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
  },
  body: {
    fontFamily: 'Inter_400Regular',
    fontSize: 16,
    color: colors.textPrimary,
    lineHeight: 23,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: radii.pill,
    backgroundColor: colors.background,
  },
  actionBtnActive: { backgroundColor: colors.primarySoft },
  actionLabel: {
    fontFamily: 'Inter_500Medium',
    fontSize: 12,
    color: colors.textMuted,
  },
  actionLabelActive: { color: colors.accentRed },
  pressed: { opacity: 0.75 },
  commentHeader: {
    fontFamily: 'Inter_700Bold',
    fontSize: 14,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: spacing.xs,
  },
  comment: { marginBottom: spacing.xs, gap: spacing.xs },
  commentHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  commentAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  commentAuthor: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 13,
    color: colors.textPrimary,
  },
  commentYou: {
    fontFamily: 'Inter_500Medium',
    fontSize: 11,
    color: colors.primary,
  },
  commentMeta: {
    fontFamily: 'Inter_400Regular',
    fontSize: 10,
    color: colors.textMuted,
  },
  commentBody: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: colors.textPrimary,
    lineHeight: 20,
  },
  commentAction: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingHint: {
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
    color: colors.textMuted,
    textAlign: 'center',
  },
  empty: { alignItems: 'center', gap: spacing.xs, paddingVertical: spacing.lg },
  emptyTitle: { fontFamily: 'Inter_700Bold', fontSize: 15, color: colors.textPrimary },
  emptyBody: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    color: colors.textMuted,
    textAlign: 'center',
  },
  backCta: { marginTop: spacing.md, width: 160 },
  compose: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xs,
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  composeRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: colors.card,
    borderRadius: radii.lg,
    padding: spacing.xs,
    gap: spacing.xs,
  },
  composeInput: {
    flex: 1,
    minHeight: 40,
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
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
});
