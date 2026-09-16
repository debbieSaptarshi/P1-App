import React, { useEffect, useRef } from 'react';
import {
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { colors, spacing } from '@/constants/tokens';

export interface WheelPickerProps {
  values: string[];
  value?: string;
  onChange?: (value: string) => void;
  itemHeight?: number;
  visibleItemCount?: number;
}

export function WheelPicker({
  values,
  value,
  onChange,
  itemHeight = 44,
  visibleItemCount = 5,
}: WheelPickerProps) {
  const ref = useRef<ScrollView>(null);
  const sidePadding = (visibleItemCount - 1) / 2;

  useEffect(() => {
    if (!value || !ref.current) return;
    const idx = Math.max(0, values.indexOf(value));
    ref.current.scrollTo({ y: idx * itemHeight, animated: false });
  }, [value, values, itemHeight]);

  const handleEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const idx = Math.round(e.nativeEvent.contentOffset.y / itemHeight);
    const clamped = Math.max(0, Math.min(values.length - 1, idx));
    if (onChange) onChange(values[clamped] ?? values[0] ?? '');
    ref.current?.scrollTo({ y: clamped * itemHeight, animated: true });
  };

  return (
    <View
      style={[styles.container, { height: itemHeight * visibleItemCount }]}
      testID="wheel-picker"
    >
      <ScrollView
        ref={ref}
        showsVerticalScrollIndicator={false}
        snapToInterval={itemHeight}
        decelerationRate="fast"
        onMomentumScrollEnd={handleEnd}
        contentContainerStyle={{ paddingVertical: itemHeight * sidePadding }}
      >
        {values.map((v, i) => (
          <View key={`${v}-${i}`} style={[styles.item, { height: itemHeight }]}>
            <Text
              style={[
                styles.itemText,
                { color: v === value ? colors.textPrimary : colors.textPlaceholder },
                v === value && styles.itemTextActive,
              ]}
            >
              {v}
            </Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  item: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 22,
  },
  itemTextActive: {
    fontFamily: 'Inter_700Bold',
    fontSize: 28,
    letterSpacing: -0.5,
  },
});
