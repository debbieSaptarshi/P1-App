import React, { useEffect } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { colors, radii, spacing } from '@/constants/tokens';

export interface ModalSheetProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  children?: React.ReactNode;
  height?: number | string;
  dismissable?: boolean;
}

export function ModalSheet({
  visible,
  onClose,
  title,
  children,
  height = '70%',
  dismissable = true,
}: ModalSheetProps) {
  const insets = useSafeAreaInsets();
  const translateY = useSharedValue(300);
  const backdrop = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      translateY.value = withTiming(0, { duration: 280 });
      backdrop.value = withTiming(1, { duration: 240 });
    } else {
      translateY.value = withTiming(300, { duration: 200 });
      backdrop.value = withTiming(0, { duration: 200 });
    }
  }, [visible, translateY, backdrop]);

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: backdrop.value,
  }));

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={() => dismissable && onClose()}
      statusBarTranslucent
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}
      >
        <View style={styles.wrapper}>
          <Animated.View style={[styles.backdrop, backdropStyle]}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Close"
              testID="modal-backdrop"
              onPress={() => dismissable && onClose()}
              style={StyleSheet.absoluteFill}
            />
          </Animated.View>

          <Animated.View
            style={[
              styles.sheet,
              { height: height as number | `${number}%`, paddingBottom: insets.bottom + spacing.lg },
              sheetStyle,
            ]}
            testID="modal-sheet"
          >
            <View style={styles.handle} />
            {(title != null || dismissable) && (
              <View style={styles.header}>
                {title != null ? (
                  <Text style={styles.title}>{title}</Text>
                ) : (
                  <View />
                )}
                {dismissable && (
                  <Pressable
                    onPress={onClose}
                    accessibilityRole="button"
                    accessibilityLabel="Close"
                    testID="modal-close"
                    style={({ pressed }) => [styles.closeBtn, pressed && styles.pressed]}
                  >
                    <Feather name="x" size={20} color={colors.textPrimary} />
                  </Pressable>
                )}
              </View>
            )}
            <View style={styles.body}>{children}</View>
          </Animated.View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  wrapper: { flex: 1, justifyContent: 'flex-end' },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.scrim,
  },
  sheet: {
    backgroundColor: colors.card,
    borderTopLeftRadius: radii.xl,
    borderTopRightRadius: radii.xl,
    paddingTop: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  handle: {
    width: 36,
    height: 4,
    backgroundColor: colors.border,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: spacing.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: spacing.md,
  },
  title: {
    fontFamily: 'Inter_700Bold',
    fontSize: 18,
    color: colors.textPrimary,
    letterSpacing: -0.2,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
  pressed: { opacity: 0.7 },
  body: { flexShrink: 1 },
});
