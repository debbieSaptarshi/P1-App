import React, { useEffect, useMemo, useRef } from 'react';
import {
  Dimensions,
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { colors } from '@/constants/tokens';

const TICK = 8;
const STEP = 0.1;

export function OnboardingRuler({
  min,
  max,
  value,
  onChange,
}: {
  min: number;
  max: number;
  value: number;
  onChange: (value: number) => void;
}) {
  const width = Dimensions.get('window').width;
  const ref = useRef<ScrollView>(null);
  const ticks = useMemo(() => {
    const next: number[] = [];
    for (let v = min; v <= max + 0.0001; v = Number((v + STEP).toFixed(1))) next.push(v);
    return next;
  }, [min, max]);
  const pad = width / 2 - 1;

  useEffect(() => {
    const idx = Math.round((value - min) / STEP);
    ref.current?.scrollTo({ x: Math.max(0, idx) * TICK, animated: false });
    // Mount-only: avoid fighting the user while they drag.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [min]);

  const handleEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const idx = Math.round(event.nativeEvent.contentOffset.x / TICK);
    const clamped = Math.max(0, Math.min(ticks.length - 1, idx));
    onChange(ticks[clamped] ?? value);
    ref.current?.scrollTo({ x: clamped * TICK, animated: true });
  };

  return (
    <View style={styles.wrap}>
      <View pointerEvents="none" style={styles.tint} />
      <ScrollView
        ref={ref}
        horizontal
        showsHorizontalScrollIndicator={false}
        snapToInterval={TICK}
        decelerationRate="fast"
        onMomentumScrollEnd={handleEnd}
        contentContainerStyle={{ paddingHorizontal: pad, alignItems: 'flex-end' }}
      >
        {ticks.map((tick) => {
          const major = Math.abs(tick % 1) < 0.001;
          return (
            <View key={String(tick)} style={styles.slot}>
              <View style={[styles.tick, major ? styles.major : styles.minor]} />
            </View>
          );
        })}
      </ScrollView>
      <View pointerEvents="none" style={styles.center} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { height: 100, width: '100%', justifyContent: 'flex-end' },
  tint: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: '50%',
    backgroundColor: 'transparent',
  },
  slot: { width: TICK, height: 100, alignItems: 'center', justifyContent: 'flex-end' },
  tick: { backgroundColor: colors.textPrimary },
  minor: { width: 1, height: 50 },
  major: { width: 1.5, height: 100 },
  center: {
    position: 'absolute',
    alignSelf: 'center',
    width: 2,
    height: 100,
    backgroundColor: colors.textPrimary,
  },
});
