import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing } from '@/constants/tokens';
import { Button, Card, Header, RulerPicker } from '@/components/ui';
import { useAppStore, appStoreActions } from '@/hooks/useAppStore';

/**
 * Edit screen for body height. Range mirrors adult human heights.
 */
export default function HeightEditScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { state } = useAppStore();
  const [value, setValue] = useState<number>(state.profile.heightCm);

  const save = () => {
    appStoreActions.updateProfile({
      heightCm: value,
      updatedAt: new Date().toISOString(),
    });
    router.back();
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <Header
        title="Height"
        subtitle="Used for calorie and macro targets"
        rightIcon="check"
        onRightPress={save}
      />
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: spacing.lg,
          paddingBottom: insets.bottom + spacing.xxxl,
        }}
        showsVerticalScrollIndicator={false}
      >
        <Card>
          <Text style={styles.label}>Your height</Text>
          <View style={styles.row}>
            <Text style={styles.value}>{value}</Text>
            <Text style={styles.unit}>cm</Text>
          </View>
          <RulerPicker
            min={140}
            max={210}
            step={1}
            value={value}
            unit="cm"
            onChange={setValue}
          />
        </Card>

        <Button title="Save Height" onPress={save} leadingIcon="check" style={styles.saveCta} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  label: {
    fontFamily: 'Inter_500Medium',
    fontSize: 12,
    color: colors.textMuted,
    marginBottom: spacing.xxs,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: spacing.xs,
  },
  value: {
    fontFamily: 'Inter_700Bold',
    fontSize: 44,
    color: colors.textPrimary,
    letterSpacing: -1,
  },
  unit: {
    fontFamily: 'Inter_500Medium',
    fontSize: 16,
    color: colors.textMuted,
  },
  saveCta: { marginTop: spacing.xl },
});
