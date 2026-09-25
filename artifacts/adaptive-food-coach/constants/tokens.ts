/**
 * Design tokens for the Adaptive Food Coach mobile app.
 * Mirrors the Figma "Light Mode" design system.
 */

export const colors = {
  // Brand
  primary: '#1570EF', // Action / Upload blue
  primarySoft: 'rgba(21, 112, 239, 0.12)',

  // Surfaces
  background: '#F5F5F5', // App canvas
  card: '#FFFFFF', // Light card surface
  darkSurface: '#0A0A0A', // Stat / hero card background
  darkSurfaceAlt: '#1C1C1E',

  // Text
  textPrimary: '#0F172A',
  textMuted: '#64748B',
  textPlaceholder: '#94A3B8',
  textInverse: '#FFFFFF',

  // Borders / dividers
  border: '#E5E5EA',
  input: '#E5E5EA',

  // Accents
  accentGreen: '#4ADE80',
  accentOrange: '#FF6A1A',
  accentRed: '#FF3B30',
  accentPurple: '#7C3AED',
  accentPink: '#EA1763',
  formFill: '#F0F0F0',
  formPlaceholder: '#808080',
  onboardingBg: '#F5F5F5',
  onboardingSurface: '#FFFFFF',
  onboardingSelected: '#0A0A0A',
  progressBlue: '#2E90FA',
  planBg: '#F5F5F5',
  planSurface: '#FFFFFF',
  planStroke: '#FFFFFF',
  planTrack: '#FFFFFF',
  planMuted: '#64748B',
  planBorder: '#F5F5F5',
  planTitle: '#0F172A',
  planFaded: '#64748B',
  planFadedFar: '#94A3B8',
  planHighlight: '#0A0A0A',
  macroProtein: '#CC7B74',
  macroCarbs: '#FEBC2F',
  macroFat: '#0088FF',
  planPink: '#EA1763',
  planPurple: '#7C45EE',
  planPinkSoft: '#FDE8EF',
  planPurpleSoft: '#EFE8FD',
  planCheckOrange: '#EA8917',
  splashOrange: '#FF6A1A',
  splashRed: '#FF3B30',
  splashRose: '#EA1763',
  splashPink: '#FF4D8D',

  // Translucent overlays
  scrim: 'rgba(0,0,0,0.68)',
  glassPlate: 'rgba(255,255,255,0.16)',
} as const;

export const radii = {
  xs: 8,
  sm: 12,
  md: 16,
  lg: 20,
  xl: 24,
  pill: 999,
} as const;

export const spacing = {
  xxs: 4,
  xs: 8,
  sm: 12,
  md: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
  xxxl: 40,
} as const;

export const sizes = {
  buttonHeight: 52,
  inputHeight: 52,
  iconBadge: 40,
  touchTarget: 44,
  avatar: 48,
  dockHeight: 64,
} as const;

export const typography = {
  display: { size: 32, family: 'Inter_700Bold' as const, line: 38 },
  h1: { size: 28, family: 'Inter_700Bold' as const, line: 34 },
  h2: { size: 22, family: 'Inter_700Bold' as const, line: 28 },
  title: { size: 18, family: 'Inter_700Bold' as const, line: 24 },
  body: { size: 15, family: 'Inter_400Regular' as const, line: 22 },
  bodyMedium: { size: 15, family: 'Inter_500Medium' as const, line: 22 },
  caption: { size: 12, family: 'Inter_500Medium' as const, line: 16 },
  micro: { size: 10, family: 'Inter_500Medium' as const, line: 14 },
} as const;

export const shadows = {
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 2,
  },
  hero: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 10,
  },
  fab: {
    shadowColor: '#0A7AFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
} as const;
