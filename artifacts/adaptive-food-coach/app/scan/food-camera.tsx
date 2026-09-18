import React, { useCallback, useRef, useState } from 'react';
import {
  Alert,
  Dimensions,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import { CameraView, scanFromURLAsync } from 'expo-camera';
import { LiveCamera } from '@/components/scan/LiveCamera';
import {
  SCAN_BARCODE_FALLBACK_ID,
  SCAN_FOOD_FALLBACK_ID,
  SCAN_LABEL_FALLBACK_ID,
  resolveBarcodeFoodId,
} from '@/constants/scanLookup';

const iconClose = require('@/assets/images/scan/icon-close.svg');
const iconHelp = require('@/assets/images/scan/icon-help.svg');
const iconScanFood = require('@/assets/images/scan/icon-scan-food.svg');
const iconBarcode = require('@/assets/images/scan/icon-barcode.svg');
const iconFoodLabel = require('@/assets/images/scan/icon-food-label.svg');
const iconFlash = require('@/assets/images/scan/icon-flash.svg');
const iconGallery = require('@/assets/images/scan/icon-gallery.svg');
const shutterRing = require('@/assets/images/scan/shutter-ring.svg');
const cornerTl = require('@/assets/images/scan/corner-tl.svg');
const cornerTr = require('@/assets/images/scan/corner-tr.svg');
const cornerBl = require('@/assets/images/scan/corner-bl.svg');
const cornerBr = require('@/assets/images/scan/corner-br.svg');

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const DESIGN_W = 402;
const DESIGN_H = 874;
const FRAME_LEFT = (20 / DESIGN_W) * SCREEN_WIDTH;
const FRAME_TOP = (247 / DESIGN_H) * SCREEN_HEIGHT;
const FRAME_WIDTH = (362 / DESIGN_W) * SCREEN_WIDTH;
const FRAME_HEIGHT = (380 / DESIGN_H) * SCREEN_HEIGHT;
const CORNER_SIZE = 52;
const OVERLAY = 'rgba(26,26,26,0.75)';

type ScanMode = 'food' | 'barcode' | 'label';
type ZoomLevel = '0.5' | '1x';

const MODES: { id: ScanMode; label: string; icon: number }[] = [
  { id: 'food', label: 'Scan Food', icon: iconScanFood },
  { id: 'barcode', label: 'Barcode', icon: iconBarcode },
  { id: 'label', label: 'Food Label', icon: iconFoodLabel },
];

const HELP_COPY: Record<ScanMode, string> = {
  food: 'Fill the frame with your meal, then tap the shutter. We’ll match it to a food in your database.',
  barcode: 'Line up the barcode inside the frame. We’ll look it up as soon as it reads.',
  label: 'Align the nutrition facts label, then tap the shutter.',
};

export default function FoodCameraScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const cameraRef = useRef<CameraView>(null);
  const barcodeLock = useRef(false);
  const [mode, setMode] = useState<ScanMode>('food');
  const [zoom, setZoom] = useState<ZoomLevel>('1x');
  const [flashOn, setFlashOn] = useState(false);
  const [capturing, setCapturing] = useState(false);

  const openResult = useCallback(
    (foodId: string, photoUri?: string) => {
      router.push({
        pathname: '/scan/result/[foodId]',
        params: photoUri
          ? { foodId, photoUri }
          : { foodId },
      });
    },
    [router],
  );

  const handleMode = (next: ScanMode) => {
    Haptics.selectionAsync();
    barcodeLock.current = false;
    setMode(next);
  };

  const handleBarcode = (code: string) => {
    if (barcodeLock.current) return;
    barcodeLock.current = true;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    openResult(resolveBarcodeFoodId(code) ?? SCAN_BARCODE_FALLBACK_ID);
  };

  const handleCapture = async () => {
    if (capturing) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setCapturing(true);
    try {
      const photo = await cameraRef.current?.takePictureAsync({
        quality: 0.7,
        skipProcessing: true,
      });
      if (mode === 'label') {
        openResult(SCAN_LABEL_FALLBACK_ID, photo?.uri);
        return;
      }
      if (mode === 'barcode') {
        if (photo?.uri) {
          try {
            const codes = await scanFromURLAsync(photo.uri);
            const first = codes[0]?.data;
            if (first) {
              handleBarcode(first);
              return;
            }
          } catch {
            // iOS gallery/photo barcode scan only supports QR; fall through.
          }
        }
        openResult(SCAN_BARCODE_FALLBACK_ID, photo?.uri);
        return;
      }
      openResult(SCAN_FOOD_FALLBACK_ID, photo?.uri);
    } catch {
      const fallback =
        mode === 'label'
          ? SCAN_LABEL_FALLBACK_ID
          : mode === 'barcode'
            ? SCAN_BARCODE_FALLBACK_ID
            : SCAN_FOOD_FALLBACK_ID;
      openResult(fallback);
    } finally {
      setCapturing(false);
    }
  };

  const handleGallery = async () => {
    Haptics.selectionAsync();
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Photos needed', 'Allow photo access to pick a meal, barcode, or label image.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
    });
    if (result.canceled || !result.assets[0]?.uri) return;
    const uri = result.assets[0].uri;
    if (mode === 'barcode') {
      try {
        const codes = await scanFromURLAsync(uri);
        const first = codes[0]?.data;
        if (first) {
          handleBarcode(first);
          return;
        }
      } catch {
        // Continue with fallback match.
      }
      openResult(SCAN_BARCODE_FALLBACK_ID, uri);
      return;
    }
    openResult(mode === 'label' ? SCAN_LABEL_FALLBACK_ID : SCAN_FOOD_FALLBACK_ID, uri);
  };

  return (
    <View style={styles.root}>
      <LiveCamera
        ref={cameraRef}
        torch={flashOn}
        zoom={zoom === '0.5' ? 0 : 0.12}
        scanBarcodes={mode === 'barcode'}
        onBarcodeScanned={({ data }) => handleBarcode(data)}
      >
        <View style={[styles.overlay, { top: 0, left: 0, right: 0, height: FRAME_TOP }]} pointerEvents="none" />
        <View
          style={[styles.overlay, { top: FRAME_TOP, left: 0, width: FRAME_LEFT, height: FRAME_HEIGHT }]}
          pointerEvents="none"
        />
        <View
          style={[
            styles.overlay,
            {
              top: FRAME_TOP,
              left: FRAME_LEFT + FRAME_WIDTH,
              right: 0,
              height: FRAME_HEIGHT,
            },
          ]}
          pointerEvents="none"
        />
        <View
          style={[styles.overlay, { top: FRAME_TOP + FRAME_HEIGHT, left: 0, right: 0, bottom: 0 }]}
          pointerEvents="none"
        />

        <View
          pointerEvents="none"
          style={[
            styles.frame,
            { top: FRAME_TOP, left: FRAME_LEFT, width: FRAME_WIDTH, height: FRAME_HEIGHT },
          ]}
        >
          <Image source={cornerTl} style={styles.cornerTl} contentFit="contain" />
          <Image source={cornerTr} style={styles.cornerTr} contentFit="contain" />
          <Image source={cornerBl} style={styles.cornerBl} contentFit="contain" />
          <Image source={cornerBr} style={styles.cornerBr} contentFit="contain" />
        </View>
      </LiveCamera>

      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <CircleControl
          source={iconClose}
          accessibilityLabel="Close scanner"
          testID="scan-close"
          onPress={() => router.back()}
        />
        <CircleControl
          source={iconHelp}
          accessibilityLabel="Scanner help"
          testID="scan-help"
          onPress={() => {
            Haptics.selectionAsync();
            Alert.alert(
              mode === 'food' ? 'Scan food' : mode === 'barcode' ? 'Scan barcode' : 'Scan label',
              HELP_COPY[mode],
            );
          }}
        />
      </View>

      <View style={[styles.bottom, { paddingBottom: Math.max(insets.bottom, 12) }]}>
        <View style={styles.zoomPill}>
          {(['0.5', '1x'] as const).map((level) => {
            const selected = zoom === level;
            return (
              <Pressable
                key={level}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                testID={`zoom-${level}`}
                onPress={() => {
                  Haptics.selectionAsync();
                  setZoom(level);
                }}
                style={[styles.zoomOption, selected && styles.zoomOptionActive]}
              >
                <Text style={[styles.zoomText, selected && styles.zoomTextActive]}>
                  {level}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <View style={styles.modeRow}>
          {MODES.map((item) => {
            const selected = mode === item.id;
            return (
              <Pressable
                key={item.id}
                accessibilityRole="button"
                accessibilityLabel={item.label}
                accessibilityState={{ selected }}
                testID={`mode-${item.id}`}
                onPress={() => handleMode(item.id)}
                style={({ pressed }) => [
                  styles.modeCard,
                  selected ? styles.modeCardActive : styles.modeCardIdle,
                  pressed && styles.pressed,
                ]}
              >
                <Image
                  source={item.icon}
                  style={styles.modeIcon}
                  contentFit="contain"
                  tintColor={selected ? '#0F172A' : '#FFFFFF'}
                />
                <Text style={[styles.modeLabel, selected && styles.modeLabelActive]}>
                  {item.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <View style={styles.shutterRow}>
          <CircleControl
            source={iconFlash}
            active={flashOn}
            accessibilityLabel={flashOn ? 'Turn flash off' : 'Turn flash on'}
            testID="scan-flash"
            onPress={() => {
              Haptics.selectionAsync();
              setFlashOn((value) => !value);
            }}
          />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Capture"
            accessibilityState={{ disabled: capturing }}
            testID="camera-capture"
            disabled={capturing}
            onPress={() => {
              void handleCapture();
            }}
            style={({ pressed }) => [styles.shutterHit, pressed && styles.pressed]}
          >
            <Image source={shutterRing} style={styles.shutterRing} contentFit="contain" />
          </Pressable>
          <CircleControl
            source={iconGallery}
            accessibilityLabel="Open gallery"
            testID="camera-gallery"
            onPress={() => {
              void handleGallery();
            }}
          />
        </View>
      </View>
    </View>
  );
}

function CircleControl({
  source,
  onPress,
  accessibilityLabel,
  testID,
  active,
}: {
  source: number;
  onPress: () => void;
  accessibilityLabel: string;
  testID: string;
  active?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      testID={testID}
      onPress={onPress}
      style={({ pressed }) => [
        styles.circleButton,
        active && styles.circleButtonActive,
        pressed && styles.pressed,
      ]}
    >
      <Image source={source} style={styles.circleIcon} contentFit="contain" />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#000000',
  },
  overlay: {
    position: 'absolute',
    backgroundColor: OVERLAY,
  },
  frame: {
    position: 'absolute',
  },
  cornerTl: {
    position: 'absolute',
    top: -5,
    left: -5,
    width: CORNER_SIZE,
    height: CORNER_SIZE,
  },
  cornerTr: {
    position: 'absolute',
    top: -5,
    right: -5,
    width: CORNER_SIZE,
    height: CORNER_SIZE,
    transform: [{ scaleX: -1 }],
  },
  cornerBl: {
    position: 'absolute',
    bottom: -5,
    left: -5,
    width: CORNER_SIZE,
    height: CORNER_SIZE,
    transform: [{ rotate: '-90deg' }],
  },
  cornerBr: {
    position: 'absolute',
    bottom: -5,
    right: -5,
    width: CORNER_SIZE,
    height: CORNER_SIZE,
    transform: [{ rotate: '90deg' }],
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  bottom: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingTop: 12,
  },
  zoomPill: {
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: OVERLAY,
    borderRadius: 999,
    padding: 2,
    marginBottom: 16,
  },
  zoomOption: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
  },
  zoomOptionActive: {
    backgroundColor: '#FFFFFF',
  },
  zoomText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 10,
    lineHeight: 12,
    color: '#FFFFFF',
    textAlign: 'center',
  },
  zoomTextActive: {
    color: '#0F172A',
  },
  modeRow: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  modeCard: {
    flex: 1,
    borderRadius: 12,
    padding: 8,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  modeCardActive: {
    backgroundColor: '#FFFFFF',
  },
  modeCardIdle: {
    backgroundColor: OVERLAY,
  },
  modeIcon: {
    width: 16,
    height: 16,
  },
  modeLabel: {
    fontFamily: 'Inter_400Regular',
    fontSize: 10,
    lineHeight: 12,
    color: '#FFFFFF',
  },
  modeLabelActive: {
    color: '#0F172A',
  },
  shutterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  circleButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: OVERLAY,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  circleButtonActive: {
    backgroundColor: 'rgba(255, 214, 10, 0.85)',
  },
  circleIcon: {
    width: 20,
    height: 20,
  },
  shutterHit: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shutterRing: {
    width: 44,
    height: 44,
  },
  pressed: {
    opacity: 0.7,
  },
});
