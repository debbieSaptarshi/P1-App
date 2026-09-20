import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing } from '@/constants/tokens';
import { Button, Card, Header, ProgressBar, RulerPicker, TextField } from '@/components/ui';
import { useAppStore, appStoreActions } from '@/hooks/useAppStore';

/**
 * Edit screen for daily step goal. Steps are stored on `profile.dailyStepGoal`.
 * We also persist the existing `nutrientGoals` so that updating the step
 * count doesn't accidentally wipe out other nutrition targets.
 */
export default function StepsEditScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { state } = useAppStore();
  const [value, setValue] = useState<number>(state.profile.dailyStepGoal);

  const now = new Date();
  const today = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;
  const [steps, setSteps] = useState(String(state.steps.find(s => s.date === today)?.count ?? 0));
  const progress = Math.min(1, value / 15000);

  const save = () => {
    appStoreActions.updateProfile({
      dailyStepGoal: value,
      nutrientGoals: state.profile.nutrientGoals,
      updatedAt: new Date().toISOString(),
    });
    router.back();
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <Header
        title="Daily Steps"
        subtitle="Aim for steady, not heroic"
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
          <Text style={styles.label}>Step goal</Text>
          <View style={styles.row}>
            <Text style={styles.value}>{value.toLocaleString()}</Text>
            <Text style={styles.unit}>steps</Text>
          </View>
          <RulerPicker
            min={1000}
            max={20000}
            step={500}
            value={value}
            unit="steps"
            onChange={setValue}
          />
          <ProgressBar progress={progress} color={colors.primary} />
          <Text style={styles.helper}>
            {progress >= 1
              ? 'You will be moving plenty — make sure to recover well.'
              : 'Most guidance suggests 7–10k steps per day for general health.'}
          </Text>
        </Card>

        <TextField label="Today's steps (manual entry)" keyboardType="number-pad" value={steps} onChangeText={setSteps} />
        <Button title="Save today's steps" disabled={!/^\d+$/.test(steps) || Number(steps) > 100000} onPress={() => void appStoreActions.setSteps(today, Number(steps))} />
        <Button title="Save Goal" onPress={save} leadingIcon="check" style={styles.saveCta} />
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
    fontSize: 40,
    color: colors.textPrimary,
    letterSpacing: -1,
  },
  unit: {
    fontFamily: 'Inter_500Medium',
    fontSize: 16,
    color: colors.textMuted,
  },
  helper: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: colors.textMuted,
    marginTop: spacing.sm,
  },
  saveCta: { marginTop: spacing.xl },
});
