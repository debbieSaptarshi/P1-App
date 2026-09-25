import React from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { Button, Header } from '@/components/ui';
import { errorMessage } from '@/services/api';
import { PROGRAMS, resolveProgram, type ProgramId } from '@/constants/programs';
import { colors, radii, spacing } from '@/constants/tokens';
import { appStoreActions, useAppStore } from '@/hooks/useAppStore';

export default function Subscription() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { state } = useAppStore();
  const current = resolveProgram(state.preferences.programId);

  const subscribe = async (programId: ProgramId) => {
    try {
      await appStoreActions.subscribeToProgram(programId);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace('/(tabs)');
    } catch (error) {
      Alert.alert('Unable to update programme', errorMessage(error));
    }
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <Header
        title="Your programme"
        subtitle="Home changes to match the plan you join"
      />
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: spacing.lg,
          paddingBottom: insets.bottom + spacing.xxxl,
          gap: spacing.sm,
        }}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.lead}>
          PCOS, diabetes and other lifestyle programmes reshape the home screen — remaining metrics, next actions, and the default layout.
        </Text>
        {PROGRAMS.map((program) => {
          const active = current.id === program.id;
          return (
            <Pressable
              key={program.id}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              accessibilityLabel={program.title}
              testID={`program-${program.id}`}
              onPress={() => {
                Haptics.selectionAsync();
                void subscribe(program.id);
              }}
              style={({ pressed }) => [
                styles.card,
                active && styles.cardActive,
                pressed && styles.pressed,
              ]}
            >
              <View style={styles.cardBody}>
                <Text style={[styles.cardTitle, active && styles.cardTitleActive]}>
                  {program.title}
                </Text>
                <Text style={styles.cardTagline}>
                  Home: {program.defaultLayout === 'overview' ? 'Health overview' : program.defaultLayout === 'journal' ? 'Food journal' : "Today's plan"}
                </Text>
                <Text style={styles.cardDescription}>{program.description}</Text>
              </View>
              <View style={[styles.check, active && styles.checkActive]}>
                {active ? <Feather name="check" size={14} color={colors.textInverse} /> : null}
              </View>
            </Pressable>
          );
        })}
        <Button
          title="Back to home"
          leadingIcon="home"
          onPress={() => router.replace('/(tabs)')}
          style={styles.save}
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  lead: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    lineHeight: 20,
    color: colors.textMuted,
    marginBottom: spacing.sm,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: radii.xl,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  cardActive: {
    borderColor: colors.primary,
    backgroundColor: '#F8FBFF',
  },
  pressed: { opacity: 0.84 },
  cardBody: { flex: 1, minWidth: 0, gap: 4 },
  cardTitle: {
    fontFamily: 'Inter_700Bold',
    fontSize: 16,
    color: colors.textPrimary,
  },
  cardTitleActive: { color: colors.primary },
  cardTagline: {
    fontFamily: 'Inter_500Medium',
    fontSize: 13,
    color: colors.textPrimary,
  },
  cardDescription: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    lineHeight: 16,
    color: colors.textMuted,
  },
  check: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  save: { marginTop: spacing.md },
});
