import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';

const flameG1 = require('@/assets/images/milestones/flame-g1.svg');
const flameG2 = require('@/assets/images/milestones/flame-g2.svg');
const flameG3 = require('@/assets/images/milestones/flame-g3.svg');
const shareFlameA = require('@/assets/images/milestones/share/flame-a.svg');
const shareFlameB = require('@/assets/images/milestones/share/flame-b.svg');
const shareFlameC = require('@/assets/images/milestones/share/flame-c.svg');

export function FlameMark({
  size = 100,
  variant = 'catalog',
}: {
  size?: number;
  variant?: 'catalog' | 'share';
}) {
  const a = variant === 'share' ? shareFlameA : flameG1;
  const b = variant === 'share' ? shareFlameB : flameG2;
  const c = variant === 'share' ? shareFlameC : flameG3;

  return (
    <View style={{ width: size, height: size }}>
      <Image source={a} style={StyleSheet.absoluteFill} contentFit="contain" />
      <Image source={b} style={StyleSheet.absoluteFill} contentFit="contain" />
      <Image source={c} style={StyleSheet.absoluteFill} contentFit="contain" />
    </View>
  );
}
