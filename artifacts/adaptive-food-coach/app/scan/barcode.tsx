import React, { useRef, useState } from 'react';
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
import type { CameraView } from 'expo-camera';
import { Button, Header } from '@/components/ui';
import { LiveCamera } from '@/components/scan/LiveCamera';
import { colors, radii, spacing } from '@/constants/tokens';
import { Alert } from 'react-native';
import { lookupBarcode } from '@/services/ai';
import { errorMessage } from '@/services/api';
import { useAppStore } from '@/hooks/useAppStore';

export default function BarcodeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const cameraRef = useRef<CameraView>(null);
  const lock = useRef(false);
  const { state } = useAppStore();
  const [query, setQuery] = useState('');
  const [flashOn, setFlashOn] = useState(false);

  const openResult = (foodId: string) => {
    router.push({ pathname: '/scan/result/[foodId]', params: { foodId } });
  };

  const handleScanned = async (data: string) => {
    if (lock.current) return;
    lock.current = true;
    try { await lookupBarcode(data); router.push('/scan/review'); }
    catch (error) { Alert.alert('Product not found', errorMessage(error)); }
    finally { lock.current = false; }
  };
  const handleSearch = () => {
    if (/^\d{8,14}$/.test(query.trim())) { void handleScanned(query.trim()); return; }
    const food = state.foodDatabase.find(f => f.name.toLowerCase().includes(query.trim().toLowerCase()));
    if (food && query.trim()) openResult(food.id);
    else Alert.alert('No match', 'Enter a barcode, scan a label, or add a custom food.');
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <Header
        transparent
        title="Scan barcode"
        rightIcon={flashOn ? 'zap' : 'zap-off'}
        onRightPress={() => {
          Haptics.selectionAsync();
          setFlashOn((value) => !value);
        }}
      />

      <View style={styles.viewfinderWrap} testID="barcode-viewfinder">
        <View style={styles.viewfinder}>
          <LiveCamera
            ref={cameraRef}
            torch={flashOn}
            scanBarcodes
            onBarcodeScanned={({ data }) => handleScanned(data)}
          >
            <View style={styles.barcodeWindow} pointerEvents="none">
              <View style={styles.scanLine} />
            </View>
            <View style={[styles.corner, styles.cornerTL]} />
            <View style={[styles.corner, styles.cornerTR]} />
            <View style={[styles.corner, styles.cornerBL]} />
            <View style={[styles.corner, styles.cornerBR]} />
          </LiveCamera>
        </View>

        <Text style={styles.helper}>
          Center the barcode inside the frame. We’ll match it to our food
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
  },
  barcodeWindow: {
    position: 'absolute',
    left: '11%',
    right: '11%',
    top: '32%',
    height: 160,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.35)',
    justifyContent: 'center',
  },
  scanLine: {
    height: 2,
    backgroundColor: '#4ADE80',
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
