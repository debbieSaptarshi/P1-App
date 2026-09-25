import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { colors } from '@/constants/tokens';
import type { CareMember } from '@/lib/careOnboarding';

export function MemberPicker({
  members,
  selectedId,
  onSelect,
}: {
  members: CareMember[];
  selectedId?: string;
  onSelect: (id: string) => void;
}) {
  if (members.length < 2) return null;
  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>Whose meal is this?</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
        {members.map((member) => {
          const on = member.id === selectedId;
          return (
            <Pressable
              key={member.id}
              accessibilityRole="button"
              accessibilityState={{ selected: on }}
              onPress={() => onSelect(member.id)}
              style={[styles.chip, on && styles.chipOn]}
            >
              <Text style={[styles.chipLabel, on && styles.chipLabelOn]}>{member.displayName}</Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 8, marginBottom: 12 },
  label: {
    fontFamily: 'Inter_500Medium',
    fontSize: 13,
    color: colors.textMuted,
  },
  row: { gap: 8, paddingRight: 16 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipOn: { backgroundColor: colors.planTitle, borderColor: colors.planTitle },
  chipLabel: { fontFamily: 'Inter_600SemiBold', fontSize: 13, color: colors.textPrimary },
  chipLabelOn: { color: '#FFFFFF' },
});
