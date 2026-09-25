import React, { useEffect, useRef } from 'react';
import {
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { colors } from '@/constants/tokens';

const ITEM_HEIGHT = 38;

export function OnboardingWheel({
  values,
  value,
  onChange,
  width,
  align = 'center',
}: {
  values: string[];
  value: string;
  onChange: (value: string) => void;
  width?: number;
  align?: 'center' | 'flex-end';
}) {
  const ref = useRef<ScrollView>(null);
  const selectedIndex = Math.max(0, values.indexOf(value));

  useEffect(() => {
    ref.current?.scrollTo({ y: selectedIndex * ITEM_HEIGHT, animated: false });
  }, [selectedIndex, values]);

  const handleEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const idx = Math.round(event.nativeEvent.contentOffset.y / ITEM_HEIGHT);
    const clamped = Math.max(0, Math.min(values.length - 1, idx));
    onChange(values[clamped] ?? values[0] ?? '');
    ref.current?.scrollTo({ y: clamped * ITEM_HEIGHT, animated: true });
  };

  return (
    <View style={[styles.wrap, width != null && { width }]}>
      <ScrollView
        ref={ref}
        showsVerticalScrollIndicator={false}
        snapToInterval={ITEM_HEIGHT}
        decelerationRate="fast"
        onMomentumScrollEnd={handleEnd}
        contentContainerStyle={styles.content}
      >
        {values.map((item, index) => {
          const selected = index === selectedIndex;
          return (
            <View key={`${item}-${index}`} style={styles.item}>
              <View style={[styles.pill, selected && styles.pillOn, width != null && selected && { width }]}>
                <Text style={[styles.text, align === 'flex-end' && styles.right, selected ? styles.sel : fadeStyle(Math.abs(index - selectedIndex))]}>
                  {item}
                </Text>
              </View>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

function fadeStyle(distance: number) {
  if (distance === 1) return styles.near;
  if (distance === 2) return styles.mid;
  return styles.far;
}

const styles = StyleSheet.create({
  wrap: { height: ITEM_HEIGHT * 9, overflow: 'hidden' },
  content: { paddingVertical: ITEM_HEIGHT * 4 },
  item: { height: ITEM_HEIGHT, justifyContent: 'center', alignItems: 'center' },
  pill: {
    paddingHorizontal: 24,
    paddingVertical: 8,
    borderRadius: 999,
    minWidth: 101,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillOn: { backgroundColor: colors.darkSurface },
  text: {
    fontFamily: 'Inter_400Regular',
    fontSize: 16,
    lineHeight: 22,
    letterSpacing: -0.18,
    textAlign: 'center',
    color: colors.textPrimary,
  },
  right: { textAlign: 'right' },
  sel: {
    fontFamily: 'Inter_500Medium',
    fontSize: 16,
    lineHeight: 22,
    color: colors.textInverse,
  },
  near: { color: colors.textPrimary, opacity: 0.85 },
  mid: { color: colors.textPrimary, opacity: 0.55 },
  far: { color: colors.textPrimary, opacity: 0.28 },
});
