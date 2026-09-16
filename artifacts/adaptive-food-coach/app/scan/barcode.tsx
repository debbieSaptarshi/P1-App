import React, { useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Button, Header } from '@/components/ui';
import { colors, radii, spacing } from '@/constants/tokens';

/**
 * Mock barcode scanner screen.
 *
 * Renders a dark viewfinder with a horizontal-stripe reticle and
 * supports manual lookup by entering a barcode (or product name).
 * A real scanner module is not yet wired in — the screen exists so
 * the barcode -> result flow can be exercised end-to-end.
 */
export default function BarcodeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState('');
  const [flashOn, setFlashOn] = useState(false);

  const handleSearch = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push('/scan/result/fd_blueberries');
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <Header
        transparent
        title="Scan barcode"
        rightIcon={flashOn ? 'zap' : 'zap-off'}
        onRightPress={() => {
          Haptics.selectionAsync();
          setFlashOn((v) => !v);
        }}
      />

      <View style={styles.viewfinderWrap} testID="barcode-viewfinder">
        <View style={styles.viewfinder}>
          <View style={styles.viewfinderShade} />
          <View style={styles.viewfinderShadeAlt} />

          {/* Horizontal barcode window */}
          <View style={styles.barcodeWindow}>
            <View style={styles.barcodeStripeRow}>
              {[3, 6, 2, 8, 4, 5, 2, 7, 3, 5, 4, 2, 6, 3, 4, 5, 2, 3, 6, 4, 2, 5, 3, 4, 6].map(
                (w, idx) => (
                  <View
                    key={idx}
                    style={[
                      styles.barcodeStripe,
                      { width: w, backgroundColor: idx % 2 === 0 ? '#FFFFFF' : '#1B1B1F' },
                    ]}
                  />
                ),
              )}
            </View>
            <View style={styles.scanLine} />
          </View>

          {/* Corner brackets */}
          <View style={[styles.corner, styles.cornerTL]} />
          <View style={[styles.corner, styles.cornerTR]} />
          <View style={[styles.corner, styles.cornerBL]} />
          <View style={[styles.corner, styles.cornerBR]} />
        </View>

        <Text style={styles.helper}>
          Center the barcode inside the frame. We&apos;ll match it to our food
          database automatically.
        </Text>
      </View>

      <View style={[styles.searchCard, { paddingBottom: insets.bottom + spacing.lg }]}>
        <Text style={styles.searchLabel}>Search product</Text>
        <View style={styles.searchRow}>
          <Feather name="search" size={18} color={colors.textMuted} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Enter barcode or product name"
            placeholderTextColor={colors.textPlaceholder}
            style={styles.searchInput}
            returnKeyType="search"
            onSubmitEditing={handleSearch}
            accessibilityLabel="Barcode search input"
            testID="barcode-search-input"
          />
          {query.length > 0 && (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Clear search"
              testID="barcode-search-clear"
              onPress={() => {
                Haptics.selectionAsync();
                setQuery('');
              }}
              style={({ pressed }) => [styles.clearBtn, pressed && styles.pressed]}
            >
              <Feather name="x" size={16} color={colors.textMuted} />
            </Pressable>
          )}
        </View>

        <Button
          title="Look up product"
          onPress={handleSearch}
          leadingIcon="search"
          variant="primary"
          size="lg"
          testID="barcode-search-submit"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#0A0A0A',
  },
  viewfinderWrap: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.lg,
  },
  viewfinder: {
    flex: 1,
    borderRadius: radii.xl,
    overflow: 'hidden',
    backgroundColor: '#111113',
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewfinderShade: {
    ...StyleSheet.absoluteFill,
    backgroundColor: '#1B1B1F',
  },
  viewfinderShadeAlt: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  barcodeWindow: {
    width: '78%',
    height: 160,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: radii.md,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  barcodeStripeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 110,
    paddingHorizontal: spacing.md,
    gap: 2,
  },
  barcodeStripe: {
    height: '100%',
    borderRadius: 1,
  },
  scanLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: '#4ADE80',
    top: '50%',
  },
  corner: {
    position: 'absolute',
    width: 28,
    height: 28,
    borderColor: '#FFFFFF',
  },
  cornerTL: {
    top: spacing.lg,
    left: spacing.lg,
    borderTopWidth: 3,
    borderLeftWidth: 3,
    borderTopLeftRadius: radii.sm,
  },
  cornerTR: {
    top: spacing.lg,
    right: spacing.lg,
    borderTopWidth: 3,
    borderRightWidth: 3,
    borderTopRightRadius: radii.sm,
  },
  cornerBL: {
    bottom: spacing.lg,
    left: spacing.lg,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
    borderBottomLeftRadius: radii.sm,
  },
  cornerBR: {
    bottom: spacing.lg,
    right: spacing.lg,
    borderBottomWidth: 3,
    borderRightWidth: 3,
    borderBottomRightRadius: radii.sm,
  },
  helper: {
    fontFamily: 'Inter_500Medium',
    color: 'rgba(255,255,255,0.78)',
    fontSize: 13,
    textAlign: 'center',
    marginTop: spacing.md,
    paddingHorizontal: spacing.xl,
    lineHeight: 18,
  },
  searchCard: {
    backgroundColor: colors.card,
    paddingTop: spacing.lg,
    paddingHorizontal: spacing.lg,
    borderTopLeftRadius: radii.xl,
    borderTopRightRadius: radii.xl,
    gap: spacing.sm,
  },
  searchLabel: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 13,
    color: colors.textMuted,
    marginBottom: spacing.xs,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    height: 52,
    marginBottom: spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontFamily: 'Inter_400Regular',
    fontSize: 15,
    color: colors.textPrimary,
    paddingHorizontal: spacing.xs,
  },
  clearBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.card,
  },
  pressed: { opacity: 0.6 },
});
