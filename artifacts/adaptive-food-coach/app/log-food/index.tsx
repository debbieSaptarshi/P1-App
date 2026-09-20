import { localDate } from '@/services/dates';
import React, { useCallback, useMemo, useState } from 'react';
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
import { Stack, useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { CircleIconButton } from '@/components/meals/CircleIconButton';
import {
  ALL_SAMPLE_FOODS,
  AT_HOME_FOODS,
  OFFICE_CANTEEN_FOODS,
  ZOMATO_FOODS,
} from '@/constants/logFoodCatalog';
import { colors, radii, spacing } from '@/constants/tokens';
import { useAppStore } from '@/hooks/useAppStore';
import type { FoodItem } from '@/types';

const iconBack = require('@/assets/images/log-food/icon-back.svg');
const iconPlusHeader = require('@/assets/images/log-food/icon-plus-header.svg');
const iconSearch = require('@/assets/images/log-food/icon-search.svg');
const iconDot = require('@/assets/images/log-food/icon-dot.svg');
const iconPlusWhite = require('@/assets/images/log-food/icon-plus-white.svg');

type LogFoodTab = 'all' | 'home' | 'canteen' | 'zomato';

const TABS: { id: LogFoodTab; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'home', label: 'At Home' },
  { id: 'canteen', label: 'Office Canteen' },
  { id: 'zomato', label: 'Zomato' },
];

/**
 * Log Food — Figma “Log food / All” and “Log food / My Food” chrome.
 *
 * Source tabs swap the list. Search filters the active tab. Row plus
 * quick-logs lunch for today; tapping the name opens quantity confirm.
 */
export default function LogFoodIndexScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { state, actions } = useAppStore();
  const [query, setQuery] = useState('');
  const [tab, setTab] = useState<LogFoodTab>('all');

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

  const tabFoods = useMemo(() => {
    switch (tab) {
      case 'home':
        return AT_HOME_FOODS;
      case 'canteen':
        return OFFICE_CANTEEN_FOODS;
      case 'zomato':
        return ZOMATO_FOODS;
      default:
        return recents.length > 0 ? recents : ALL_SAMPLE_FOODS;
    }
  }, [tab, recents]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return tabFoods;
    return tabFoods.filter((f) => f.name.toLowerCase().includes(q));
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
        <Text style={styles.foodName}>{food.name}</Text>
        <View style={styles.metaRow}>
          <Text style={styles.meta}>🔥 {Math.round(food.calories)} cal</Text>
          <Image source={iconDot} style={styles.dot} contentFit="contain" />
          <Text style={styles.meta}>{food.servingSize}</Text>
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
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  tabsRow: {
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
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
    gap: spacing.xs,
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
