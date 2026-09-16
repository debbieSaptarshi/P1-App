import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, radii, spacing } from '@/constants/tokens';
import { Button, Card, Header, ModalSheet } from '@/components/ui';
import { appStoreActions } from '@/hooks/useAppStore';

export type SubscriptionTierKey = 'free' | 'pro' | 'family';
export const SUBSCRIPTION_STORAGE_KEY = '@adaptive_food_coach/subscription_v1';

interface Tier {
  key: SubscriptionTierKey;
  name: string;
  blurb: string;
  priceMonthly: string;
  bullets: string[];
  cta: string;
  accent: string;
}

const TIERS: Tier[] = [
  {
    key: 'free',
    name: 'Free',
    blurb: 'Get started with the essentials.',
    priceMonthly: '$0',
    bullets: ['Basic food logging', 'Daily dashboard', 'Up to 2 accountability groups'],
    cta: 'Stay on Free',
    accent: colors.border,
  },
  {
    key: 'pro',
    name: 'Pro',
    blurb: 'Unlimited insights and AI coaching.',
    priceMonthly: '$9.99 / mo',
    bullets: ['Meal interpretation', 'Weekly review', 'All groups + challenges', 'Photo log improvements'],
    cta: 'Choose Pro',
    accent: colors.primary,
  },
  {
    key: 'family',
    name: 'Family',
    blurb: 'Up to 5 accounts under one plan.',
    priceMonthly: '$14.99 / mo',
    bullets: ['Every Pro feature', 'Shared grocery list', 'Grouped weekly check-ins', 'Care-team notes'],
    cta: 'Choose Family',
    accent: colors.accentPurple,
  },
];

/**
 * Subscription tier picker. Stores the selected tier in AsyncStorage
 * directly — there is no `subscription` slot on `UserProfile`, and the
 * brief asks me to keep file ownership strict so I avoid extending the
 * shared types from this screen.
 */
export default function SubscriptionEditScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [currentTier, setCurrentTier] = useState<SubscriptionTierKey>('free');
  const [pendingTier, setPendingTier] = useState<SubscriptionTierKey | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(SUBSCRIPTION_STORAGE_KEY);
        if (mounted && raw) {
          setCurrentTier(isTier(raw) ? raw : 'free');
        }
      } catch (err) {
        if (__DEV__) {
          console.warn('Failed to read subscription tier', err);
        }
      } finally {
        if (mounted) setHydrated(true);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const confirmTier = async () => {
    if (!pendingTier) return;
    setCurrentTier(pendingTier);
    try {
      await AsyncStorage.setItem(SUBSCRIPTION_STORAGE_KEY, pendingTier);
    } catch (err) {
      if (__DEV__) {
        console.warn('Failed to persist subscription tier', err);
      }
    }
    if (pendingTier !== 'free') {
      // Update last-modified timestamp so the rest of the app can react.
      appStoreActions.updateProfile({ updatedAt: new Date().toISOString() });
    }
    setPendingTier(null);
    router.back();
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <Header title="Subscription" subtitle="Pick the plan that fits you" />
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: spacing.lg,
          paddingBottom: insets.bottom + spacing.xxxl,
        }}
        showsVerticalScrollIndicator={false}
      >
        {!hydrated && (
          <Text style={styles.loadingHint} accessibilityLabel="Loading subscription">
            Reading current plan…
          </Text>
        )}
        {TIERS.map((tier) => {
          const selected = tier.key === currentTier;
          return (
            <Card
              key={tier.key}
              style={selected ? { ...styles.tier, ...styles.tierSelected } : styles.tier}
            >
              <View style={styles.tierHeader}>
                <View style={styles.tierNameRow}>
                  <Text style={styles.tierName}>{tier.name}</Text>
                  {selected && (
                    <View style={styles.currentPill}>
                      <Text style={styles.currentPillText}>Current</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.tierPrice}>{tier.priceMonthly}</Text>
              </View>
              <Text style={styles.tierBlurb}>{tier.blurb}</Text>
              <View style={styles.bullets}>
                {tier.bullets.map((b) => (
                  <View key={b} style={styles.bulletRow}>
                    <Feather name="check" size={14} color={tier.accent} />
                    <Text style={styles.bulletText}>{b}</Text>
                  </View>
                ))}
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`${tier.cta} ${tier.name}`}
                testID={`subscription-cta-${tier.key}`}
                onPress={() => setPendingTier(tier.key)}
                style={({ pressed }) => [
                  styles.tierCta,
                  selected && styles.tierCtaSelected,
                  pressed && styles.pressed,
                ]}
              >
                <Text style={[styles.tierCtaLabel, selected && styles.tierCtaLabelSelected]}>
                  {selected ? 'Manage plan' : tier.cta}
                </Text>
              </Pressable>
            </Card>
          );
        })}

        <Button
          variant="ghost"
          title="Restore Purchases"
          leadingIcon="refresh-cw"
          style={styles.restore}
          onPress={() => {
            if (__DEV__) console.log('[subscription] restore pressed');
          }}
        />
        <Text style={styles.disclaimer}>
          Plans renew automatically until canceled. You can change or cancel any
          time from your store subscription settings.
        </Text>
      </ScrollView>

      <ModalSheet
        visible={pendingTier !== null}
        onClose={() => setPendingTier(null)}
        title={confirmTitleFor(pendingTier)}
      >
        <Text style={styles.confirmBody}>
          You’re switching to <Text style={styles.confirmBold}>{pendingTier ? capitalize(pendingTier) : ''}</Text>.
          Your billing cycle will start today.
        </Text>
        <View style={styles.confirmRow}>
          <Button variant="outline" title="Not yet" onPress={() => setPendingTier(null)} style={styles.confirmBtn} />
          <Button
            title="Confirm"
            onPress={confirmTier}
            style={styles.confirmBtn}
            testID="subscription-confirm"
          />
        </View>
      </ModalSheet>
    </View>
  );
}

function isTier(value: string): value is SubscriptionTierKey {
  return value === 'free' || value === 'pro' || value === 'family';
}

function confirmTitleFor(tier: SubscriptionTierKey | null): string {
  if (!tier) return 'Confirm';
  return tier === 'free' ? 'Stay on Free?' : `Switch to ${capitalize(tier)}?`;
}

function capitalize(value: string): string {
  if (!value) return value;
  return value[0]!.toUpperCase() + value.slice(1);
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  tier: { marginBottom: spacing.md },
  tierSelected: { borderWidth: 1.5, borderColor: colors.primary },
  tierHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  tierNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  tierName: {
    fontFamily: 'Inter_700Bold',
    fontSize: 22,
    color: colors.textPrimary,
    letterSpacing: -0.4,
  },
  currentPill: {
    paddingVertical: 2,
    paddingHorizontal: spacing.xs,
    borderRadius: radii.pill,
    backgroundColor: colors.primarySoft,
  },
  currentPillText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 11,
    color: colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  tierPrice: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 15,
    color: colors.textMuted,
  },
  tierBlurb: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    color: colors.textMuted,
    marginBottom: spacing.sm,
  },
  bullets: { gap: 4, marginBottom: spacing.sm },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  bulletText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    color: colors.textPrimary,
  },
  tierCta: {
    alignSelf: 'flex-start',
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: radii.pill,
    backgroundColor: colors.primarySoft,
  },
  tierCtaSelected: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tierCtaLabel: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 13,
    color: colors.primary,
  },
  tierCtaLabelSelected: {
    color: colors.textPrimary,
  },
  pressed: { opacity: 0.7 },
  restore: { marginTop: spacing.md },
  disclaimer: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: colors.textMuted,
    marginTop: spacing.md,
    lineHeight: 18,
    textAlign: 'center',
  },
  loadingHint: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: colors.textMuted,
    marginBottom: spacing.xs,
  },
  confirmBody: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: colors.textPrimary,
    lineHeight: 20,
    marginBottom: spacing.md,
  },
  confirmBold: {
    fontFamily: 'Inter_600SemiBold',
  },
  confirmRow: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  confirmBtn: { flex: 1 },
});
