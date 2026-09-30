import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { colors, radii } from '@/constants/tokens';

function ProgressRing({
  progress,
  size,
  emoji,
}: {
  progress: number;
  size: number;
  emoji: string;
}) {
  const strokeWidth = 6;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.max(0, Math.min(100, Number.isFinite(progress) ? progress : 0));
  const drawn = (clamped / 100) * circumference;
  const angle = ((clamped / 100) * 360 - 90) * (Math.PI / 180);
  const thumbX = size / 2 + radius * Math.cos(angle);
  const thumbY = size / 2 + radius * Math.sin(angle);

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#E2E8F0"
          strokeWidth={strokeWidth}
          fill="none"
        />
        {clamped > 0.5 ? (
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="#1570EF"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            fill="none"
            strokeDasharray={`${drawn} ${circumference}`}
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
          />
        ) : null}
        {clamped > 0.5 ? (
          <Circle cx={thumbX} cy={thumbY} r={6} fill="#1570EF" />
        ) : null}
      </Svg>
      <Text style={styles.ringEmoji}>{emoji}</Text>
    </View>
  );
}

export function NutrientRingCard({
  value,
  unit,
  label,
  progress,
  emoji,
}: {
  value: string | number;
  unit: string;
  label: string;
  progress: number;
  emoji: string;
}) {
  return (
    <View style={styles.card}>
      <View style={styles.textBlock}>
        <Text style={styles.value}>
          {value}
          {unit ? <Text style={styles.unit}> {unit}</Text> : null}
        </Text>
        <Text style={styles.label}>{label}</Text>
      </View>
      <View style={styles.ringWrap}>
        <ProgressRing progress={progress} size={83} emoji={emoji} />
      </View>
    </View>
  );
}

export function NutrientRingRow({
  cards,
}: {
  cards: {
    id: string;
    value: string | number;
    unit: string;
    label: string;
    progress: number;
    emoji: string;
  }[];
}) {
  return (
    <View style={styles.row}>
      {cards.map((card) => (
        <NutrientRingCard
          key={card.id}
          value={card.value}
          unit={card.unit}
          label={card.label}
          progress={card.progress}
          emoji={card.emoji}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 8,
  },
  card: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: radii.xl,
    padding: 16,
    gap: 10,
    minWidth: 0,
    minHeight: 162,
  },
  textBlock: {
    gap: 2,
  },
  value: {
    fontSize: 24,
    lineHeight: 30,
    fontFamily: 'Inter_500Medium',
    letterSpacing: -0.15,
    color: colors.textPrimary,
  },
  unit: {
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: -0.12,
    color: colors.textPrimary,
  },
  label: {
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: -0.12,
    color: '#94A3B8',
    fontFamily: 'Inter_400Regular',
  },
  ringWrap: {
    height: 83,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringEmoji: {
    position: 'absolute',
    fontSize: 20,
    lineHeight: 24,
  },
});
