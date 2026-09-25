import React, { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { Button, Header } from '@/components/ui';
import { errorMessage } from '@/services/api';
import {
  HOME_LAYOUTS,
  resolveHomeLayout,
  type HomeLayoutId,
} from '@/constants/homeLayouts';
import { resolveProgram } from '@/constants/programs';
import { colors, radii, spacing } from '@/constants/tokens';
import { appStoreActions, useAppStore } from '@/hooks/useAppStore';

export default function PersonaliseHomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { state } = useAppStore();
  const program = resolveProgram(state.preferences.programId);
  const current = resolveHomeLayout(state.preferences.homeLayout ?? program.defaultLayout);
  const [selected, setSelected] = useState<HomeLayoutId>(current);
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (saving) return;
    setSaving(true);
    try {
      await appStoreActions.updatePreferences({ homeLayout: selected });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.back();
    } catch (error) {
      Alert.alert('Unable to save home layout', errorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <Header
        title="Personalise your home"
        subtitle={`${program.title} sets the default. You can still pick a layout.`}
        rightIcon="check"
        onRightPress={save}
      />
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: spacing.lg,
          paddingBottom: insets.bottom + spacing.xxxl,
          gap: spacing.sm,
        }}
        showsVerticalScrollIndicator={false}
      >
        {HOME_LAYOUTS.map((layout) => {
          const active = selected === layout.id;
          return (
            <Pressable
              key={layout.id}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              accessibilityLabel={layout.title}
              testID={`home-layout-${layout.id}`}
              onPress={() => {
                Haptics.selectionAsync();
                setSelected(layout.id);
              }}
              style={({ pressed }) => [
                styles.card,
                active && styles.cardActive,
                pressed && styles.pressed,
              ]}
            >
              <LayoutPreview id={layout.id} active={active} />
              <View style={styles.cardBody}>
                <View style={styles.cardTitleRow}>
                  <Feather
                    name={layout.icon}
                    size={16}
                    color={active ? colors.primary : colors.textPrimary}
                  />
                  <Text style={[styles.cardTitle, active && styles.cardTitleActive]}>
                    {layout.title}
                  </Text>
                </View>
                <Text style={styles.cardTagline}>{layout.tagline}</Text>
                <Text style={styles.cardDescription}>{layout.description}</Text>
              </View>
              <View style={[styles.check, active && styles.checkActive]}>
                {active ? <Feather name="check" size={14} color={colors.textInverse} /> : null}
              </View>
            </Pressable>
          );
        })}
        <Button
          title="Use this home"
          leadingIcon="check"
          onPress={save}
          loading={saving}
          style={styles.save}
          testID="use-home-layout"
        />
      </ScrollView>
    </View>
  );
}

function LayoutPreview({ id, active }: { id: HomeLayoutId; active: boolean }) {
  const accent = active ? colors.primary : '#CBD5E1';
  return (
    <View style={styles.preview}>
      <View style={[styles.previewBar, { backgroundColor: accent }]} />
      {id === 'overview' ? (
        <>
          <View style={styles.previewHero} />
          <View style={styles.previewRow}>
            <View style={styles.previewTile} />
            <View style={styles.previewTile} />
            <View style={styles.previewTile} />
          </View>
        </>
      ) : null}
      {id === 'journal' ? (
        <>
          <View style={styles.previewLine} />
          <View style={styles.previewLine} />
          <View style={[styles.previewLine, styles.previewLineShort]} />
        </>
      ) : null}
      {id === 'plan' ? (
        <>
          <View style={styles.previewHero} />
          <View style={styles.previewLine} />
        </>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  card: {
    backgroundColor: colors.card,
    borderRadius: radii.xl,
    padding: spacing.sm,
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
  preview: {
    width: 72,
    height: 88,
    borderRadius: 14,
    backgroundColor: colors.formFill,
    padding: 8,
    gap: 6,
  },
  previewBar: {
    height: 6,
    width: 28,
    borderRadius: 3,
  },
  previewHero: {
    height: 22,
    borderRadius: 6,
    backgroundColor: colors.darkSurface,
  },
  previewRow: { flexDirection: 'row', gap: 4 },
  previewTile: {
    flex: 1,
    height: 18,
    borderRadius: 4,
    backgroundColor: '#E2E8F0',
  },
  previewLine: {
    height: 14,
    borderRadius: 4,
    backgroundColor: '#E2E8F0',
  },
  previewLineShort: { width: '70%' },
  cardBody: { flex: 1, minWidth: 0, gap: 2 },
  cardTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
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
    marginTop: 2,
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
