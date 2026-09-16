import React from 'react';
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

/**
 * Mock "scan nutrition label" screen.
 *
 * Renders a dark viewfinder with a nutrition-facts card overlay so
 * the user can align the label of a packaged food within the frame.
 * Capturing routes to the matching result page so the label -> result
 * flow can be exercised.
 */
export default function LabelScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const handleCapture = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push('/scan/result/fd_greek_yogurt');
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <Header
        transparent
        title="Scan label"
        rightIcon="zap-off"
        onRightPress={() => Haptics.selectionAsync()}
      />

      <View style={styles.viewfinderWrap} testID="label-viewfinder">
        <View style={styles.viewfinder}>
          <View style={styles.viewfinderShade} />
          <View style={styles.viewfinderShadeAlt} />

          {/* Nutrition facts placeholder card */}
          <View style={styles.labelCard}>
            <Text style={styles.labelTitle}>Nutrition Facts</Text>
            <View style={styles.labelDivider} />
            <LabelRow label="Serving size" value="170 g" />
            <LabelRow label="Calories" value="100" />
            <View style={styles.labelDivider} />
            <LabelRow label="Total Fat" value="0.7 g" />
            <LabelRow label="Sodium" value="61 mg" />
            <LabelRow label="Total Carbs" value="6 g" />
            <LabelRow label="Protein" value="17 g" />
          </View>

          {/* Corner brackets */}
          <View style={[styles.corner, styles.cornerTL]} />
          <View style={[styles.corner, styles.cornerTR]} />
          <View style={[styles.corner, styles.cornerBL]} />
          <View style={[styles.corner, styles.cornerBR]} />
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
          testID="label-capture"
          onPress={handleCapture}
          style={({ pressed }) => [styles.shutterOuter, pressed && styles.pressed]}
        >
          <View style={styles.shutterInner} />
        </Pressable>
      </View>
    </View>
  );
}

function LabelRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.labelRow}>
      <Text style={styles.labelRowLabel}>{label}</Text>
      <Text style={styles.labelRowValue}>{value}</Text>
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
  labelCard: {
    width: '70%',
    backgroundColor: '#FFFFFF',
    borderRadius: radii.md,
    padding: spacing.md,
  },
  labelTitle: {
    fontFamily: 'Inter_700Bold',
    color: '#0A0A0A',
    fontSize: 16,
    marginBottom: spacing.xs,
  },
  labelDivider: {
    height: 1,
    backgroundColor: 'rgba(0,0,0,0.18)',
    marginVertical: spacing.xs,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 2,
  },
  labelRowLabel: {
    fontFamily: 'Inter_500Medium',
    color: '#0A0A0A',
    fontSize: 12,
  },
  labelRowValue: {
    fontFamily: 'Inter_600SemiBold',
    color: '#0A0A0A',
    fontSize: 12,
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
