import React, { useMemo, useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Header } from '@/components/ui';
import { colors, radii, spacing } from '@/constants/tokens';

type CaptureMode = 'photo' | 'video' | 'barcode';

const MODES: { id: CaptureMode; label: string }[] = [
  { id: 'photo', label: 'Photo' },
  { id: 'video', label: 'Video' },
  { id: 'barcode', label: 'Barcode' },
];

/**
 * Mock food-camera screen.
 *
 * The Expo project does not yet wire up a real camera viewfinder — this
 * screen renders a dark viewfinder placeholder with corner markers,
 * a capture button, and a Photo/Video/Barcode mode pill row so the
 * Figma design renders end-to-end during scaffolding.
 *
 * Tapping the capture button pops a haptic and routes to the matching
 * result page with a sample seed food so downstream `result/[foodId]`
 * flows can be exercised without a device.
 */
export default function FoodCameraScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [mode, setMode] = useState<CaptureMode>('photo');

  const helperCopy = useMemo(() => {
    switch (mode) {
      case 'video':
        return 'Hold still while we capture a short clip of your meal.';
      case 'barcode':
        return 'Switch to barcode mode to scan packaged products.';
      default:
        return 'Frame your meal inside the square to recognise it automatically.';
    }
  }, [mode]);

  const handleMode = (next: CaptureMode) => {
    Haptics.selectionAsync();
    setMode(next);
    if (next === 'barcode') {
      router.push('/scan/barcode');
    }
  };

  const handleCapture = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push('/scan/result/fd_chicken_breast');
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <Header
        transparent
        title="Scan meal"
        rightIcon="zap-off"
        onRightPress={() => Haptics.selectionAsync()}
      />

      <View style={styles.viewfinderWrap} testID="food-camera-viewfinder">
        <View style={styles.viewfinder}>
          {/* Faux dark gradient background */}
          <View style={styles.viewfinderShade} />
          <View style={styles.viewfinderShadeAlt} />

          {/* Center reticle plate */}
          <View style={styles.reticlePlate}>
            <Feather name="camera" size={42} color="rgba(255,255,255,0.65)" />
            <Text style={styles.reticleTitle}>Camera preview</Text>
            <Text style={styles.reticleSubtitle}>
              {helperCopy}
            </Text>
          </View>

          {/* Corner brackets */}
          <View style={[styles.corner, styles.cornerTL]} />
          <View style={[styles.corner, styles.cornerTR]} />
          <View style={[styles.corner, styles.cornerBL]} />
          <View style={[styles.corner, styles.cornerBR]} />
        </View>

        <Text style={styles.helper}>{helperCopy}</Text>
      </View>

      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + spacing.lg }]}>
        <View style={styles.modePills}>
          {MODES.map((m) => {
            const active = m.id === mode;
            return (
              <Pressable
                key={m.id}
                accessibilityRole="button"
                accessibilityLabel={`${m.label} mode`}
                accessibilityState={{ selected: active }}
                testID={`mode-${m.id}`}
                onPress={() => handleMode(m.id)}
                style={({ pressed }) => [
                  styles.modePill,
                  active && styles.modePillActive,
                  pressed && styles.pressed,
                ]}
              >
                <Text style={[styles.modePillText, active && styles.modePillTextActive]}>
                  {m.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <View style={styles.shutterRow}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Gallery"
            testID="camera-gallery"
            onPress={() => Haptics.selectionAsync()}
            style={({ pressed }) => [styles.sideButton, pressed && styles.pressed]}
          >
            <Feather name="image" size={22} color="#FFFFFF" />
          </Pressable>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Capture"
            testID="camera-capture"
            onPress={handleCapture}
            style={({ pressed }) => [styles.shutterOuter, pressed && styles.pressed]}
          >
            <View style={styles.shutterInner} />
          </Pressable>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Flip camera"
            testID="camera-flip"
            onPress={() => Haptics.selectionAsync()}
            style={({ pressed }) => [styles.sideButton, pressed && styles.pressed]}
          >
            <Feather name="refresh-ccw" size={22} color="#FFFFFF" />
          </Pressable>
        </View>
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
    borderRadius: radii.xl,
  },
  reticlePlate: {
    paddingHorizontal: spacing.xl,
    alignItems: 'center',
    gap: spacing.xs,
  },
  reticleTitle: {
    fontFamily: 'Inter_600SemiBold',
    color: '#FFFFFF',
    fontSize: 16,
    marginTop: spacing.sm,
  },
  reticleSubtitle: {
    fontFamily: 'Inter_400Regular',
    color: 'rgba(255,255,255,0.7)',
    fontSize: 13,
    textAlign: 'center',
    paddingHorizontal: spacing.lg,
    lineHeight: 18,
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
  },
  bottomBar: {
    backgroundColor: 'rgba(0,0,0,0.45)',
    paddingTop: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  modePills: {
    flexDirection: 'row',
    alignSelf: 'center',
    backgroundColor: 'rgba(255,255,255,0.10)',
    padding: 4,
    borderRadius: radii.pill,
    gap: 4,
  },
  modePill: {
    paddingVertical: 8,
    paddingHorizontal: spacing.md,
    borderRadius: radii.pill,
  },
  modePillActive: {
    backgroundColor: '#FFFFFF',
  },
  modePillText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 13,
    color: 'rgba(255,255,255,0.78)',
  },
  modePillTextActive: {
    color: '#0A0A0A',
  },
  shutterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.lg,
  },
  sideButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.10)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  shutterOuter: {
    width: 78,
    height: 78,
    borderRadius: 39,
    borderWidth: 4,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  shutterInner: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: '#FFFFFF',
  },
  pressed: { opacity: 0.6 },
});
