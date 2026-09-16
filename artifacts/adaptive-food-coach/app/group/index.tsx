import { router } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import React, { useMemo, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, radii, spacing } from '@/constants/tokens';
import { Button, Card, Header, SectionTitle } from '@/components/ui';
import { appStoreActions, useAppStore } from '@/hooks/useAppStore';
import type { AccountabilityGroup } from '@/types';

const CATEGORY_LABEL: Record<AccountabilityGroup['category'], string> = {
  weight_loss: 'Weight Loss',
  nutrition: 'Nutrition',
  exercise: 'Exercise',
  general: 'General',
};

/**
 * Group directory. Lists every accountability group with member counts,
 * an inline filter, and a Join / Leave CTA wired through the store.
 */
export default function GroupsIndexScreen() {
  const insets = useSafeAreaInsets();
  const { state } = useAppStore();
  const [filter, setFilter] = useState('');
  const [category, setCategory] = useState<'all' | AccountabilityGroup['category']>('all');

  const groups = useMemo(() => {
    const f = filter.trim().toLowerCase();
    return state.groups.filter((g) => {
      if (category !== 'all' && g.category !== category) return false;
      if (!f) return true;
      return g.name.toLowerCase().includes(f) || g.description.toLowerCase().includes(f);
    });
  }, [state.groups, filter, category]);

  const CATEGORY_CHIPS: Array<{ key: typeof category; label: string }> = [
    { key: 'all', label: 'All' },
    { key: 'weight_loss', label: 'Weight Loss' },
    { key: 'nutrition', label: 'Nutrition' },
    { key: 'exercise', label: 'Exercise' },
    { key: 'general', label: 'General' },
  ];

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <Header title="Groups" subtitle="Find your people" />
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: spacing.lg,
          paddingBottom: insets.bottom + spacing.xxxl,
        }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.searchBox}>
          <Feather name="search" size={16} color={colors.textMuted} />
          <TextInput
            value={filter}
            onChangeText={setFilter}
            placeholder="Search groups"
            placeholderTextColor={colors.textPlaceholder}
            style={styles.searchInput}
            accessibilityLabel="Search groups"
            testID="group-search"
          />
          {filter.length > 0 && (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Clear search"
              onPress={() => setFilter('')}
              style={styles.clearBtn}
              testID="group-search-clear"
            >
              <Feather name="x" size={14} color={colors.textMuted} />
            </Pressable>
          )}
        </View>

        <View style={styles.chipRow}>
          {CATEGORY_CHIPS.map((chip) => {
            const active = category === chip.key;
            return (
              <Pressable
                key={chip.key}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                testID={`group-filter-${chip.key}`}
                onPress={() => setCategory(chip.key)}
                style={({ pressed }) => [
                  styles.chip,
                  active && styles.chipActive,
                  pressed && styles.chipPressed,
                ]}
              >
                <Text style={[styles.chipLabel, active && styles.chipLabelActive]}>
                  {chip.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <View style={styles.utilityRow}>
          <View style={{ flex: 1 }}>
            <SectionTitle title="Directory" />
          </View>
          <Button
            variant="ghost"
            title="Leaderboard"
            leadingIcon="bar-chart-2"
            onPress={() => router.push('/group/leaderboard')}
            style={styles.utilityBtn}
            testID="group-leaderboard-link"
          />
          <Button
            variant="ghost"
            title="Challenges"
            leadingIcon="zap"
            onPress={() => router.push('/group/challenges')}
            style={styles.utilityBtn}
            testID="group-challenges-link"
          />
        </View>

        {groups.length === 0 ? (
          <Card style={styles.empty}>
            <Feather name="users" size={24} color={colors.textMuted} />
            <Text style={styles.emptyTitle}>No groups match</Text>
            <Text style={styles.emptyBody}>
              Try clearing the search or selecting a different category.
            </Text>
          </Card>
        ) : (
          groups.map((group) => (
            <GroupRow key={group.id} group={group} />
          ))
        )}
      </ScrollView>
    </View>
  );
}

function GroupRow({ group }: { group: AccountabilityGroup }) {
  const toggle = () => {
    if (group.joined) {
      appStoreActions.leaveGroup(group.id);
    } else {
      appStoreActions.joinGroup(group.id);
    }
  };
  return (
    <Card style={styles.groupCard}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Open ${group.name}`}
        testID={`group-open-${group.id}`}
        onPress={() => router.push(`/group/${group.id}`)}
        style={styles.groupMain}
      >
        <View style={styles.groupHeader}>
          <Text style={styles.groupName}>{group.name}</Text>
          {group.joined && (
            <View style={styles.joinedPill}>
              <Text style={styles.joinedPillText}>Joined</Text>
            </View>
          )}
        </View>
        <Text style={styles.groupDescription}>{group.description}</Text>
        <View style={styles.groupMetaRow}>
          <Feather name="users" size={12} color={colors.textMuted} />
          <Text style={styles.groupMeta}>{group.members.toLocaleString()} members</Text>
          <View style={styles.dot} />
          <Text style={styles.groupMeta}>{CATEGORY_LABEL[group.category]}</Text>
        </View>
      </Pressable>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={group.joined ? `Leave ${group.name}` : `Join ${group.name}`}
        testID={`group-toggle-${group.id}`}
        onPress={toggle}
        style={({ pressed }) => [
          styles.toggleBtn,
          group.joined && styles.toggleBtnJoined,
          pressed && styles.pressed,
        ]}
      >
        <Text style={[styles.toggleBtnLabel, group.joined && styles.toggleBtnLabelJoined]}>
          {group.joined ? 'Leave' : 'Join'}
        </Text>
      </Pressable>
    </Card>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    height: 48,
    backgroundColor: colors.card,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontFamily: 'Inter_400Regular',
    fontSize: 15,
    color: colors.textPrimary,
    paddingVertical: 0,
  },
  clearBtn: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  chip: {
    paddingVertical: spacing.xxs,
    paddingHorizontal: spacing.sm,
    borderRadius: radii.pill,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipPressed: { opacity: 0.75 },
  chipLabel: {
    fontFamily: 'Inter_500Medium',
    fontSize: 12,
    color: colors.textPrimary,
  },
  chipLabelActive: { color: colors.textInverse },
  utilityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  utilityBtn: { paddingHorizontal: 0, paddingVertical: 0, height: 32 },
  empty: { alignItems: 'center', gap: spacing.xs, paddingVertical: spacing.lg },
  emptyTitle: { fontFamily: 'Inter_700Bold', fontSize: 16, color: colors.textPrimary },
  emptyBody: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    color: colors.textMuted,
    textAlign: 'center',
  },
  groupCard: { marginBottom: spacing.sm, paddingVertical: spacing.sm },
  groupMain: { gap: 4 },
  groupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  groupName: {
    fontFamily: 'Inter_700Bold',
    fontSize: 16,
    color: colors.textPrimary,
    flexShrink: 1,
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
  groupDescription: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    color: colors.textMuted,
    marginVertical: 2,
  },
  groupMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: spacing.xs,
  },
  groupMeta: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: colors.textMuted,
  },
  dot: {
    width: 3,
    height: 3,
    borderRadius: 2,
    backgroundColor: colors.textMuted,
    marginHorizontal: spacing.xs,
  },
  toggleBtn: {
    alignSelf: 'flex-start',
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: radii.pill,
    backgroundColor: colors.primary,
    marginTop: spacing.sm,
  },
  toggleBtnJoined: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  toggleBtnLabel: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 13,
    color: colors.textInverse,
  },
  toggleBtnLabelJoined: {
    color: colors.textPrimary,
  },
  pressed: { opacity: 0.85 },
});
