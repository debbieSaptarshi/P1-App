import React from 'react';
import { Pressable, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { useColors } from '@/hooks/useColors';

export interface CardProps {
  onPress?: () => void;
  style?: ViewStyle;
  children?: React.ReactNode;
  testID?: string;
}

export function Card({ onPress, style, children, testID }: CardProps) {
  const colors = useColors();
  if (onPress) {
    return (
      <Pressable
        accessibilityRole="button"
        onPress={onPress}
        testID={testID}
        style={({ pressed }) => [
          styles.card,
          { backgroundColor: colors.card, opacity: pressed ? 0.94 : 1 },
          style,
        ]}
      >
        {children}
      </Pressable>
    );
  }
  return (
    <View
      testID={testID}
      style={[styles.card, { backgroundColor: colors.card }, style]}
    >
      {children}
    </View>
  );
}

export interface SectionTitleProps {
  title: string;
  action?: string;
  onAction?: () => void;
}

export function SectionTitle({ title, action, onAction }: SectionTitleProps) {
  const colors = useColors();
  return (
    <View style={styles.sectionRow}>
      <Text style={[styles.sectionTitle, { color: colors.foreground }]}>{title}</Text>
      {action != null && (
        <Pressable onPress={onAction}>
          <Text style={[styles.sectionAction, { color: colors.mutedForeground }]}>
            {action}
          </Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 24,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 2,
  },
  sectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionTitle: {
    fontFamily: 'Inter_700Bold',
    fontSize: 18,
    letterSpacing: -0.2,
  },
  sectionAction: {
    fontFamily: 'Inter_500Medium',
    fontSize: 12,
  },
});
