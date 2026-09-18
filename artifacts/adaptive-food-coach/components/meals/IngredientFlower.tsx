import React from 'react';
import { Image, StyleSheet, Text, View, type ViewStyle } from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import { colors } from '@/constants/tokens';
import type { DishSegment, LastMealDish } from '@/constants/lastMeals';

const petalOuterBr = require('@/assets/images/nutrition/petal-outer-br.svg');
const petalInnerBr = require('@/assets/images/nutrition/petal-inner-br.svg');
const petalOuterTr = require('@/assets/images/nutrition/petal-outer-tr.svg');
const petalInnerTr = require('@/assets/images/nutrition/petal-inner-tr.svg');
const petalOuterTop = require('@/assets/images/nutrition/petal-outer-top.svg');
const petalInnerTop = require('@/assets/images/nutrition/petal-inner-top.svg');
const petalOuterTl = require('@/assets/images/nutrition/petal-outer-tl.svg');
const petalInnerTl = require('@/assets/images/nutrition/petal-inner-tl.svg');
const petalOuterBl = require('@/assets/images/nutrition/petal-outer-bl.svg');
const petalInnerBl = require('@/assets/images/nutrition/petal-inner-bl.svg');
const petalOuterBottom = require('@/assets/images/nutrition/petal-outer-bottom.svg');
const petalInnerBottom = require('@/assets/images/nutrition/petal-inner-bottom.svg');
const petalCenter = require('@/assets/images/nutrition/petal-center.svg');

function Layer({ size, children }: { size: number; children: React.ReactNode }) {
  return (
    <View
      style={[
        styles.layer,
        {
          width: size,
          height: size,
          marginLeft: -size / 2,
          marginTop: -size / 2,
        },
      ]}
    >
      {children}
    </View>
  );
}

function PetalSlice({
  source,
  inset,
}: {
  source: number;
  inset: ViewStyle;
}) {
  return (
    <View style={[styles.slice, inset]}>
      <ExpoImage source={source} style={styles.sliceFill} contentFit="fill" />
    </View>
  );
}

function SegmentLabel({
  segment,
  style,
}: {
  segment: DishSegment;
  style: ViewStyle;
}) {
  return (
    <View style={[styles.label, style]}>
      <Text style={styles.labelName}>{segment.name}</Text>
      <Text style={styles.labelPercent}>{segment.percent}%</Text>
    </View>
  );
}

export function IngredientFlower({ dish }: { dish: LastMealDish }) {
  const [chicken, potatoes, carrot, broccoli, shrimp, peas] = dish.segments;

  return (
    <View style={styles.frame} testID="ingredient-flower">
      <Layer size={362}>
        <PetalSlice source={petalOuterBr} inset={{ top: '50%', left: '56.92%', right: '0.59%', bottom: '9.87%' }} />
      </Layer>
      <Layer size={279}>
        <PetalSlice source={petalInnerBr} inset={{ top: '50%', left: '56.92%', right: '0.95%', bottom: '10.86%' }} />
      </Layer>
      <Layer size={362}>
        <PetalSlice source={petalOuterTr} inset={{ top: '9.87%', left: '56.92%', right: '0.59%', bottom: '50%' }} />
      </Layer>
      <Layer size={322}>
        <PetalSlice source={petalInnerTr} inset={{ top: '10.28%', left: '56.92%', right: '0.73%', bottom: '50%' }} />
      </Layer>
      <Layer size={362}>
        <PetalSlice source={petalOuterTop} inset={{ top: '0%', left: '28.04%', right: '28.04%', bottom: '60%' }} />
      </Layer>
      <Layer size={322}>
        <PetalSlice source={petalInnerTop} inset={{ top: '0%', left: '28.42%', right: '28.42%', bottom: '60%' }} />
      </Layer>
      <Layer size={362}>
        <PetalSlice source={petalOuterTl} inset={{ top: '9.87%', left: '0.59%', right: '56.92%', bottom: '50%' }} />
      </Layer>
      <Layer size={216}>
        <PetalSlice source={petalInnerTl} inset={{ top: '12.15%', left: '1.51%', right: '56.92%', bottom: '50%' }} />
      </Layer>
      <Layer size={362}>
        <PetalSlice source={petalOuterBl} inset={{ top: '50%', left: '0.59%', right: '56.92%', bottom: '9.87%' }} />
      </Layer>
      <Layer size={322}>
        <PetalSlice source={petalInnerBl} inset={{ top: '50%', left: '0.73%', right: '56.92%', bottom: '10.28%' }} />
      </Layer>
      <Layer size={362}>
        <PetalSlice source={petalOuterBottom} inset={{ top: '60%', left: '28.04%', right: '28.04%', bottom: '0%' }} />
      </Layer>
      <Layer size={235}>
        <PetalSlice source={petalInnerBottom} inset={{ top: '60%', left: '29.69%', right: '29.69%', bottom: '0%' }} />
      </Layer>
      <Layer size={110}>
        <ExpoImage source={petalCenter} style={styles.sliceFill} contentFit="fill" />
      </Layer>
      <Layer size={100}>
        <Image source={dish.heroImage} style={styles.hero} resizeMode="cover" />
      </Layer>

      {chicken ? <SegmentLabel segment={chicken} style={{ top: 40, left: '50%', marginLeft: -40, width: 80 }} /> : null}
      {potatoes ? <SegmentLabel segment={potatoes} style={{ top: 111, left: '50%', marginLeft: 66, width: 80 }} /> : null}
      {carrot ? <SegmentLabel segment={carrot} style={{ top: 251, left: '50%', marginLeft: 75, width: 80 }} /> : null}
      {shrimp ? <SegmentLabel segment={shrimp} style={{ top: 251, left: '50%', marginLeft: -158, width: 80 }} /> : null}
      {broccoli ? <SegmentLabel segment={broccoli} style={{ top: 322, left: '50%', marginLeft: -39, width: 80 }} /> : null}
      {peas ? <SegmentLabel segment={peas} style={{ top: 111, left: '50%', marginLeft: -158.5, width: 80 }} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  frame: {
    width: '100%',
    aspectRatio: 1,
    overflow: 'hidden',
  },
  layer: {
    position: 'absolute',
    left: '50%',
    top: '50%',
  },
  slice: {
    position: 'absolute',
  },
  sliceFill: {
    width: '100%',
    height: '100%',
  },
  hero: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  label: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  labelName: {
    fontFamily: 'Inter_500Medium',
    fontSize: 16,
    lineHeight: 22,
    letterSpacing: -0.18,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  labelPercent: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: -0.12,
    color: colors.textPrimary,
    textAlign: 'center',
  },
});
