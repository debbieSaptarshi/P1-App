import { localDate } from '@/services/dates';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { CircleIconButton } from '@/components/meals/CircleIconButton';
import { CircularSaucer } from '@/components/meals/CircularSaucer';
import {
  ALL_SAMPLE_FOODS,
  MESS_FOODS,
  NEARBY_CANTEEN_FOODS,
  NEARBY_RESTAURANT_FOODS,
  SAVED_SAMPLE_FOODS,
} from '@/constants/logFoodCatalog';
import { colors, radii, spacing } from '@/constants/tokens';
import { recipeToFoodItem, savedFoodToFoodItem } from './_helpers';
import { useAppStore } from '@/hooks/useAppStore';
import { MemberPicker } from '@/components/meals/MemberPicker';
import type { FoodItem } from '@/types';

const iconBack = require('@/assets/images/log-food/icon-back.svg');
const iconPlusHeader = require('@/assets/images/log-food/icon-plus-header.svg');
const iconSearch = require('@/assets/images/log-food/icon-search.svg');
const iconDot = require('@/assets/images/log-food/icon-dot.svg');
const iconPlusWhite = require('@/assets/images/log-food/icon-plus-white.svg');

type LogFoodTab = 'all' | 'mess' | 'nearby' | 'restaurants' | 'saved';

const TABS: { id: LogFoodTab; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'mess', label: 'Hostel mess' },
  { id: 'nearby', label: 'Campus canteens' },
  { id: 'restaurants', label: 'Nearby' },
  { id: 'saved', label: 'Saved Foods' },
];

function parseTab(value: string | string[] | undefined): LogFoodTab {
  const raw = Array.isArray(value) ? value[0] : value;
  if (raw === 'mess' || raw === 'fridge' || raw === 'home') return 'mess';
  if (raw === 'nearby' || raw === 'canteen') return 'nearby';
  if (raw === 'restaurants' || raw === 'zomato') return 'restaurants';
  if (raw === 'saved') return raw;
  return 'all';
}

/**
 * Log Food — Figma “Log food / All” through “Log food / Saved Food”.
 *
 * Category tabs stay on this screen (including Saved Foods). Search
 * filters the active tab. Row plus quick-logs lunch for today.
 */
export default function LogFoodIndexScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ tab?: string }>();
  const { state, actions } = useAppStore();
  const [query, setQuery] = useState('');
  const [tab, setTab] = useState<LogFoodTab>(() => parseTab(params.tab));

  useEffect(() => {
    void actions.refreshCareHousehold();
  }, [actions]);

  useEffect(() => {
    setTab(parseTab(params.tab));
  }, [params.tab]);

  const recents = useMemo(() => {
    const seen = new Set<string>();
    const result: FoodItem[] = [];
    for (const daily of [...state.foodLogs].sort((a, b) => (a.date < b.date ? 1 : -1))) {
      for (const entry of daily.entries) {
        if (!seen.has(entry.food.id)) {
          seen.add(entry.food.id);
          result.push(entry.food);
        }
        if (result.length >= 6) return result;
      }
    }
    return result;
  }, [state.foodLogs]);

  const savedFoods = useMemo(() => {
    const fromBookmarks = state.savedFoods.map(savedFoodToFoodItem);
    const fromRecipes = state.mealRecipes.map(recipeToFoodItem);
    const merged = [...fromBookmarks, ...fromRecipes];
    return merged.length > 0 ? merged : SAVED_SAMPLE_FOODS;
  }, [state.mealRecipes, state.savedFoods]);

  const tabFoods = useMemo(() => {
    switch (tab) {
      case 'mess':
        return MESS_FOODS;
      case 'nearby':
        return NEARBY_CANTEEN_FOODS;
      case 'restaurants':
        return NEARBY_RESTAURANT_FOODS;
      case 'saved':
        return savedFoods;
      default:
        return recents.length > 0 ? recents : ALL_SAMPLE_FOODS;
    }
  }, [tab, recents, savedFoods]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return tabFoods;
    return tabFoods.filter((f) => f.name.toLowerCase().includes(q) || f.brand?.toLowerCase().includes(q));
  }, [query, tabFoods]);

  const goAddCustom = useCallback(() => {
    Haptics.selectionAsync();
    router.push('/log-food/add-custom');
  }, [router]);

  const handleQuickLog = useCallback(
    (food: FoodItem) => {
      const today = localDate();
      actions.logFood({
        date: today,
        mealType: 'lunch',
        food,
        quantity: 1,
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    },
    [actions],
  );

  const handleOpenDetail = useCallback(
    (food: FoodItem) => {
      Haptics.selectionAsync();
      router.push(`/scan/result/${food.id}`);
    },
    [router],
  );

  const ctaLabel = tab === 'all' ? 'Add Manual' : 'Add Food';

  return (
    <View style={styles.root}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={[styles.header, { paddingTop: insets.top + spacing.xs }]}>
        <CircleIconButton
          source={iconBack}
          accessibilityLabel="Back"
          testID="logfood-back"
          onPress={() => router.back()}
        />
        <Text style={styles.headerTitle}>Log Food</Text>
        <CircleIconButton
          source={iconPlusHeader}
          filled={false}
          accessibilityLabel="Add custom food"
          testID="logfood-header-plus"
          onPress={goAddCustom}
        />
      </View>

      <View style={{ paddingHorizontal: spacing.lg }}>
        <MemberPicker
          members={state.careHousehold.members}
          selectedId={state.careHousehold.selectedMemberId}
          onSelect={(id) => void actions.selectCareMember(id)}
        />
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.tabsRow}
        style={styles.tabsScroll}
        testID="logfood-tabs"
      >
        {TABS.map((item) => {
          const active = tab === item.id;
          return (
            <Pressable
              key={item.id}
              accessibilityRole="tab"
              accessibilityState={{ selected: active }}
              testID={`logfood-tab-${item.id}`}
              onPress={() => {
                Haptics.selectionAsync();
                setTab(item.id);
                router.setParams({ tab: item.id });
              }}
              style={[styles.tab, active && styles.tabActive]}
            >
              <Text style={[styles.tabLabel, active && styles.tabLabelActive]}>
                {item.label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <View style={styles.searchWrap}>
        <View style={styles.searchPill}>
          <View style={styles.searchIcon}>
            <Image source={iconSearch} style={styles.searchIconImg} contentFit="contain" />
          </View>
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Describe what you eat"
            placeholderTextColor={colors.textPlaceholder}
            style={styles.searchInput}
            autoCorrect={false}
            accessibilityLabel="Food search input"
            testID="logfood-search-input"
          />
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.list,
          { paddingBottom: insets.bottom + 88 },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {tab === 'all' && query.length === 0 ? (
          <Text style={styles.sectionTitle}>Recently Logged</Text>
        ) : null}

        {filtered.length === 0 ? (
          <Text style={styles.empty}>No matches in this list.</Text>
        ) : (
          filtered.map((food) => (
            <FoodRow
              key={`${tab}-${food.id}`}
              food={food}
              onQuickLog={() => handleQuickLog(food)}
              onOpenDetail={() => handleOpenDetail(food)}
            />
          ))
        )}
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + spacing.sm }]}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={ctaLabel}
          testID="logfood-cta"
          onPress={goAddCustom}
          style={({ pressed }) => [styles.cta, pressed && styles.pressed]}
        >
          <Text style={styles.ctaLabel}>{ctaLabel}</Text>
        </Pressable>
      </View>
    </View>
  );
}

function FoodRow({
  food,
  onQuickLog,
  onOpenDetail,
}: {
  food: FoodItem;
  onQuickLog: () => void;
  onOpenDetail: () => void;
}) {
  return (
    <View style={styles.card} testID={`logfood-row-${food.id}`}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`View ${food.name}`}
        onPress={onOpenDetail}
        style={({ pressed }) => [styles.cardInfo, pressed && styles.pressed]}
      >
        {food.image ? <CircularSaucer source={{ uri: food.image }} size={84} /> : null}
        <View style={styles.cardCopy}>
          <Text style={styles.foodName}>{food.name}</Text>
          {food.brand ? <Text style={styles.meta}>{food.brand}</Text> : null}
          <View style={styles.metaRow}>
            <Text style={styles.meta}>🔥 {Math.round(food.calories)} cal</Text>
            <Image source={iconDot} style={styles.dot} contentFit="contain" />
            <Text style={styles.meta}>{food.servingSize}</Text>
          </View>
        </View>
      </Pressable>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Add ${food.name} to log`}
        testID={`logfood-quick-${food.id}`}
        onPress={onQuickLog}
        style={({ pressed }) => [styles.quickAdd, pressed && styles.pressed]}
      >
        <View style={styles.quickAddIcon}>
          <Image source={iconPlusWhite} style={styles.quickAddIconImg} contentFit="contain" />
        </View>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xs,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontFamily: 'Inter_500Medium',
    fontSize: 16,
    lineHeight: 22,
    letterSpacing: -0.18,
    color: colors.textPrimary,
  },
  tabsScroll: {
    flexGrow: 0,
    flexShrink: 0,
    height: 38,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  tabsRow: {
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    gap: spacing.md,
    minHeight: 38,
  },
  tab: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  tabActive: {
    borderBottomWidth: 2,
    borderBottomColor: colors.textPrimary,
  },
  tabLabel: {
    fontFamily: 'Inter_400Regular',
    fontSize: 16,
    lineHeight: 22,
    letterSpacing: -0.18,
    color: colors.textPlaceholder,
    textAlign: 'center',
  },
  tabLabelActive: {
    color: colors.textPrimary,
  },
  searchWrap: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  searchPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    height: 48,
    padding: spacing.sm,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: radii.pill,
  },
  searchIcon: {
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchIconImg: {
    width: 20,
    height: 20,
  },
  searchInput: {
    flex: 1,
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    lineHeight: 20,
    letterSpacing: -0.16,
    color: colors.textPrimary,
    padding: 0,
  },
  list: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    gap: spacing.xs,
  },
  sectionTitle: {
    fontFamily: 'Inter_500Medium',
    fontSize: 16,
    lineHeight: 22,
    letterSpacing: -0.18,
    color: colors.textPrimary,
    paddingVertical: spacing.sm,
  },
  empty: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    lineHeight: 20,
    color: colors.textMuted,
    paddingVertical: spacing.md,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.card,
    borderRadius: radii.xl,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  cardInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minWidth: 0,
  },
  cardCopy: {
    flex: 1,
    gap: spacing.xs,
    minWidth: 0,
  },
  foodName: {
    fontFamily: 'Inter_500Medium',
    fontSize: 16,
    lineHeight: 22,
    letterSpacing: -0.18,
    color: colors.textPrimary,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  meta: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: -0.12,
    color: colors.textMuted,
  },
  dot: {
    width: 4,
    height: 4,
  },
  quickAdd: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.darkSurface,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  quickAddIcon: {
    width: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickAddIconImg: {
    width: 16,
    height: 16,
  },
  footer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
  },
  cta: {
    backgroundColor: colors.darkSurface,
    borderRadius: radii.pill,
    padding: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaLabel: {
    fontFamily: 'Inter_500Medium',
    fontSize: 16,
    lineHeight: 22,
    letterSpacing: -0.18,
    color: colors.textInverse,
  },
  pressed: { opacity: 0.7 },
});
