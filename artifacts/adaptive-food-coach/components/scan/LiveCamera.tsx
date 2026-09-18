import React, { forwardRef } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {
  CameraView,
  useCameraPermissions,
  type BarcodeScanningResult,
  type BarcodeType,
} from 'expo-camera';

const BARCODE_TYPES: BarcodeType[] = [
  'ean13',
  'ean8',
  'upc_a',
  'upc_e',
  'code128',
  'code39',
  'qr',
];

type LiveCameraProps = {
  torch?: boolean;
  zoom?: number;
  scanBarcodes?: boolean;
  onBarcodeScanned?: (result: BarcodeScanningResult) => void;
  children?: React.ReactNode;
};

export const LiveCamera = forwardRef<CameraView, LiveCameraProps>(function LiveCamera(
  { torch = false, zoom = 0, scanBarcodes = false, onBarcodeScanned, children },
  ref,
) {
  const [permission, requestPermission] = useCameraPermissions();

  if (!permission) {
    return (
      <View style={styles.fill}>
        <ActivityIndicator color="#FFFFFF" />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.permission}>
        <Text style={styles.permissionTitle}>Camera access needed</Text>
        <Text style={styles.permissionBody}>
          Allow the camera to scan meals, barcodes, and nutrition labels.
        </Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Allow camera"
          testID="camera-permission-allow"
          onPress={() => {
            void requestPermission();
          }}
          style={({ pressed }) => [styles.allowButton, pressed && styles.pressed]}
        >
          <Text style={styles.allowLabel}>Allow camera</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.fill}>
      <CameraView
        ref={ref}
        style={StyleSheet.absoluteFill}
        facing="back"
        mode="picture"
        enableTorch={torch}
        zoom={zoom}
        autofocus="on"
        barcodeScannerSettings={
          scanBarcodes ? { barcodeTypes: BARCODE_TYPES } : undefined
        }
        onBarcodeScanned={scanBarcodes ? onBarcodeScanned : undefined}
      />
      {children}
    </View>
  );
});

const styles = StyleSheet.create({
  fill: {
    flex: 1,
    backgroundColor: '#000000',
  },
  permission: {
    flex: 1,
    backgroundColor: '#0A0A0A',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    gap: 12,
  },
  permissionTitle: {
    fontFamily: 'Inter_700Bold',
    fontSize: 20,
    color: '#FFFFFF',
    textAlign: 'center',
  },
  permissionBody: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    lineHeight: 20,
    color: 'rgba(255,255,255,0.72)',
    textAlign: 'center',
  },
  allowButton: {
    marginTop: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 999,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  allowLabel: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 15,
    color: '#0F172A',
  },
  pressed: {
    opacity: 0.7,
  },
});
