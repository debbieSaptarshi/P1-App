import React, { useRef, useState } from 'react';
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
import type { CameraView } from 'expo-camera';
import { Header } from '@/components/ui';
import { LiveCamera } from '@/components/scan/LiveCamera';
import { SCAN_LABEL_FALLBACK_ID } from '@/constants/scanLookup';
import { radii, spacing } from '@/constants/tokens';

export default function LabelScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const cameraRef = useRef<CameraView>(null);
  const [flashOn, setFlashOn] = useState(false);
  const [capturing, setCapturing] = useState(false);

  const handleCapture = async () => {
    if (capturing) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setCapturing(true);
    try {
      const photo = await cameraRef.current?.takePictureAsync({
        quality: 0.7,
        skipProcessing: true,
      });
      router.push({
        pathname: '/scan/result/[foodId]',
        params: photo?.uri
          ? { foodId: SCAN_LABEL_FALLBACK_ID, photoUri: photo.uri }
          : { foodId: SCAN_LABEL_FALLBACK_ID },
      });
    } catch {
      router.push({
        pathname: '/scan/result/[foodId]',
        params: { foodId: SCAN_LABEL_FALLBACK_ID },
      });
    } finally {
      setCapturing(false);
    }
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <Header
        transparent
        title="Scan label"
        rightIcon={flashOn ? 'zap' : 'zap-off'}
        onRightPress={() => {
          Haptics.selectionAsync();
          setFlashOn((value) => !value);
        }}
      />

      <View style={styles.viewfinderWrap} testID="label-viewfinder">
        <View style={styles.viewfinder}>
          <LiveCamera ref={cameraRef} torch={flashOn}>
            <View style={styles.labelGuide} pointerEvents="none" />
            <View style={[styles.corner, styles.cornerTL]} />
            <View style={[styles.corner, styles.cornerTR]} />
            <View style={[styles.corner, styles.cornerBL]} />
            <View style={[styles.corner, styles.cornerBR]} />
          </LiveCamera>
        </View>

        <Text style={styles.helper}>
          Align the label inside the frame and hold steady.
        </Text>
      </View>

      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + spacing.lg }]}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Manual entry"
          testID="label-manual-entry"
          onPress={() => {
            Haptics.selectionAsync();
            router.push('/log-food/add-custom');
          }}
          style={({ pressed }) => [styles.linkButton, pressed && styles.pressed]}
        >
          <Feather name="edit-2" size={16} color="#FFFFFF" />
          <Text style={styles.linkLabel}>Enter manually</Text>
        </Pressable>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Capture label"
          accessibilityState={{ disabled: capturing }}
          testID="label-capture"
          disabled={capturing}
          onPress={() => {
            void handleCapture();
          }}
          style={({ pressed }) => [styles.shutterOuter, pressed && styles.pressed]}
        >
          <View style={styles.shutterInner} />
        </Pressable>
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
  labelGuide: {
    position: 'absolute',
    left: '12%',
    right: '12%',
    top: '18%',
    bottom: '18%',
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.4)',
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  linkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  linkLabel: {
    fontFamily: 'Inter_500Medium',
    color: '#FFFFFF',
    fontSize: 14,
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
