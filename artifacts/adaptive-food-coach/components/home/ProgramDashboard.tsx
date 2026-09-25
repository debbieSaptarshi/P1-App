import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';

import {
  formatRemaining,
  remainingFor,
  type ProgramDefinition,
  type RemainingTotals,
} from '@/constants/programs';
import { colors, radii } from '@/constants/tokens';

export function ProgramDashboard({
  program,
  totals,
}: {
  program: ProgramDefinition;
  totals: RemainingTotals;
}) {
  const hero = remainingFor(program.heroMetric, totals);
  return (
    <View style={styles.stack} testID={`program-dashboard-${program.id}`}>
      <View style={styles.heroCard}>
        <Text style={styles.heroValue}>
          {formatRemaining(hero.left, hero.goal, hero.unit)}
          <Text style={styles.heroLabel}> {hero.label}</Text>
        </Text>
        <View style={styles.track}>
          <View style={[styles.fill, { width: `${Math.max(0, Math.min(100, hero.progress))}%` }]} />
        </View>
      </View>
      <View style={styles.macroRow}>
        {program.macroCards.map((card) => {
          const metric = remainingFor(card, totals);
          return (
            <View key={card.id} style={styles.macroCard}>
              <Text style={styles.macroValue}>
                {formatRemaining(metric.left, metric.goal, metric.unit)}
              </Text>
              <Text style={styles.macroLabel} numberOfLines={1}>
                {metric.label.replace(' Left', '')} {metric.emoji} Left
              </Text>
              <View style={styles.track}>
                <View style={[styles.fill, { width: `${Math.max(0, Math.min(100, metric.progress))}%` }]} />
              </View>
            </View>
          );
        })}
      </View>
      {program.actionRow === 'scan-database' ? <ScanDatabaseRow /> : <TrackComposer placeholder={program.composerPlaceholder} />}
    </View>
  );
}

export function ProgramFocusCard({ program }: { program: ProgramDefinition }) {
  if (program.id === 'general') return null;
  return (
    <View style={styles.focusCard} testID={`program-focus-${program.id}`}>
      <Text style={styles.focusTitle}>{program.focusTitle}</Text>
      <Text style={styles.focusHint}>{program.focusHint}</Text>
    </View>
  );
}

function ScanDatabaseRow() {
  const router = useRouter();
  return (
    <View style={styles.actionRow}>
      <ActionChip
        label="Scan Food"
        icon="maximize"
        testID="home-scan-food"
        onPress={() => {
          Haptics.selectionAsync();
          router.push('/scan/food-camera');
        }}
      />
      <ActionChip
        label="Food Database"
        icon="search"
        testID="home-food-database"
        onPress={() => {
          Haptics.selectionAsync();
          router.push('/log-food');
        }}
      />
    </View>
  );
}

function TrackComposer({ placeholder }: { placeholder: string }) {
  const router = useRouter();
  const [text, setText] = useState('');
  const submit = () => {
    Haptics.selectionAsync();
    const message = text.trim();
    setText('');
    router.push(message ? { pathname: '/track', params: { text: message } } : '/track');
  };
  return (
    <View style={styles.composer} testID="home-track-composer">
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Scan a meal"
        onPress={() => {
          Haptics.selectionAsync();
          router.push({ pathname: '/track', params: { openCamera: '1' } });
        }}
        style={({ pressed }) => [styles.composerIcon, pressed && styles.pressed]}
      >
        <Feather name="camera" size={18} color="#64748B" />
      </Pressable>
      <TextInput
        value={text}
        onChangeText={setText}
        placeholder={placeholder}
        placeholderTextColor="#94A3B8"
        style={styles.composerInput}
        returnKeyType="send"
        onSubmitEditing={submit}
        testID="home-track-input"
      />
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Dictate"
        onPress={() => {
          Haptics.selectionAsync();
          router.push({ pathname: '/track', params: { openVoice: '1' } });
        }}
        style={({ pressed }) => [styles.composerIcon, pressed && styles.pressed]}
      >
        <Feather name="mic" size={18} color="#64748B" />
      </Pressable>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Send"
        testID="home-track-send"
        onPress={submit}
        style={({ pressed }) => [styles.sendBtn, pressed && styles.pressed]}
      >
        <Feather name="arrow-up" size={16} color="#FFFFFF" />
      </Pressable>
    </View>
  );
}

function ActionChip({
  label,
  icon,
  onPress,
  testID,
}: {
  label: string;
  icon: keyof typeof Feather.glyphMap;
  onPress: () => void;
  testID: string;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      testID={testID}
      onPress={onPress}
      style={({ pressed }) => [styles.actionChip, pressed && styles.pressed]}
    >
      <Text style={styles.actionLabel}>{label}</Text>
      <View style={styles.actionIcon}>
        <Feather name={icon} size={16} color="#FFFFFF" />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  stack: { gap: 16 },
  heroCard: {
    backgroundColor: colors.card,
    borderRadius: radii.xl,
    padding: 16,
    gap: 10,
  },
  heroValue: {
    fontFamily: 'Inter_500Medium',
    fontSize: 24,
    lineHeight: 30,
    letterSpacing: -0.15,
    color: colors.textPrimary,
  },
  heroLabel: {
    fontFamily: 'Inter_400Regular',
    fontSize: 16,
    lineHeight: 22,
    letterSpacing: -0.18,
    color: colors.textPrimary,
  },
  macroRow: { flexDirection: 'row', gap: 8 },
  macroCard: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: radii.xl,
    padding: 16,
    gap: 10,
    minWidth: 0,
  },
  macroValue: {
    fontFamily: 'Inter_500Medium',
    fontSize: 16,
    lineHeight: 22,
    letterSpacing: -0.18,
    color: colors.textPrimary,
  },
  macroLabel: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    lineHeight: 16,
    color: '#94A3B8',
  },
  track: {
    height: 9,
    borderRadius: 11,
    backgroundColor: '#E2E8F0',
    overflow: 'hidden',
  },
  fill: {
    height: 9,
    borderRadius: 12,
    backgroundColor: colors.primary,
  },
  actionRow: { flexDirection: 'row', gap: 12 },
  actionChip: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: radii.xl,
    paddingHorizontal: 16,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  actionLabel: {
    flex: 1,
    fontFamily: 'Inter_500Medium',
    fontSize: 14,
    lineHeight: 20,
    color: colors.textPrimary,
  },
  actionIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.darkSurface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  composer: {
    backgroundColor: colors.card,
    borderRadius: radii.pill,
    minHeight: 48,
    paddingLeft: 14,
    paddingRight: 6,
    paddingVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  composerIcon: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  composerInput: {
    flex: 1,
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: colors.textPrimary,
    paddingVertical: 8,
  },
  sendBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.darkSurface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  focusCard: {
    backgroundColor: colors.darkSurface,
    borderRadius: radii.xl,
    padding: 16,
    gap: 8,
    marginBottom: 8,
  },
  focusTitle: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 16,
    color: colors.textInverse,
  },
  focusHint: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    lineHeight: 18,
    color: '#CBD5E1',
  },
  pressed: { opacity: 0.72 },
});
