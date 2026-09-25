import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '@/constants/tokens';
import { legalUrls, openLegalUrl } from '@/constants/legal';

export function LegalConsent({
  accepted,
  onChange,
  tone = 'light',
  requireAccept = true,
}: {
  accepted: boolean;
  onChange: (value: boolean) => void;
  tone?: 'light' | 'dark';
  requireAccept?: boolean;
}) {
  const inverse = tone === 'dark';
  const linkColor = inverse ? '#93C5FD' : colors.primary;
  const textColor = inverse ? '#94A3B8' : colors.textMuted;

  return (
    <View style={styles.row}>
      {requireAccept ? (
        <Pressable
          accessibilityRole="checkbox"
          accessibilityState={{ checked: accepted }}
          accessibilityLabel="Agree to the Privacy Policy and Terms of Use"
          onPress={() => onChange(!accepted)}
          hitSlop={8}
          style={[
            styles.box,
            inverse && styles.boxDark,
            accepted && (inverse ? styles.boxDarkChecked : styles.boxChecked),
          ]}
        >
          {accepted ? <Text style={[styles.tick, inverse && styles.tickDark]}>✓</Text> : null}
        </Pressable>
      ) : null}
      <Text style={[styles.copy, { color: textColor }]}>
        {requireAccept ? 'I am 18 or older and agree to the ' : 'By continuing you agree to the '}
        <Text style={[styles.link, { color: linkColor }]} onPress={() => void openLegalUrl(legalUrls.privacy)}>
          Privacy Policy
        </Text>
        {' and '}
        <Text style={[styles.link, { color: linkColor }]} onPress={() => void openLegalUrl(legalUrls.terms)}>
          Terms of Use
        </Text>
        .
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, paddingHorizontal: 4 },
  box: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  boxDark: { borderColor: '#334155', backgroundColor: colors.onboardingSurface },
  boxChecked: { backgroundColor: colors.textPrimary, borderColor: colors.textPrimary },
  boxDarkChecked: { backgroundColor: colors.onboardingSelected, borderColor: colors.onboardingSelected },
  tick: { color: '#FFFFFF', fontSize: 13, fontFamily: 'Inter_600SemiBold', lineHeight: 16 },
  tickDark: { color: '#000000' },
  copy: { flex: 1, fontFamily: 'Poppins_500Medium', fontSize: 12, lineHeight: 18 },
  link: { textDecorationLine: 'underline' },
});
