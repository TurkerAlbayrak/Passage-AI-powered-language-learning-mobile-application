/**
 * Passage design system — modern, minimal, calm.
 * A crisp near-white canvas, soft neutral grays, deep ink text, and a single
 * confident indigo accent (with a quiet teal for secondary moments).
 */

export const colors = {
  // Surfaces
  background: '#F7F8FA', // cool light canvas
  surface: '#FFFFFF',
  surfaceAlt: '#F1F3F6',
  surfaceSunken: '#ECEFF3',

  // Text
  ink: '#15171E',
  inkSoft: '#5A6170',
  inkFaint: '#9AA1AE',
  onAccent: '#FFFFFF',

  // Brand
  primary: '#5B5BF0', // modern indigo
  primarySoft: '#EDEDFE',
  accent: '#10B0A6', // quiet teal
  accentSoft: '#E3F6F4',

  // Feedback
  success: '#12A06A',
  successSoft: '#E4F6EE',
  warning: '#E0930B',
  warningSoft: '#FCF1DC',
  danger: '#E2524F',
  dangerSoft: '#FCE9E8',

  // Lines
  border: '#ECEEF2',
  borderStrong: '#DEE1E7',
  highlight: '#E7E7FE', // tapped/saved-word highlight (soft indigo)
};

export const levelColors: Record<string, { bg: string; fg: string }> = {
  A1: { bg: '#E4F6EE', fg: '#12A06A' },
  A2: { bg: '#E3F6F4', fg: '#10B0A6' },
  B1: { bg: '#EDEDFE', fg: '#5B5BF0' },
  B2: { bg: '#EFE8FD', fg: '#8B5CF6' },
  C1: { bg: '#FCF1DC', fg: '#C07C0A' },
  C2: { bg: '#FCE9E8', fg: '#D24A47' },
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 36,
};

export const radius = {
  sm: 10,
  md: 14,
  lg: 20,
  xl: 28,
  pill: 999,
};

export const typography = {
  display: { fontSize: 32, fontWeight: '800' as const, letterSpacing: -0.6 },
  title: { fontSize: 23, fontWeight: '700' as const, letterSpacing: -0.4 },
  heading: { fontSize: 18, fontWeight: '700' as const, letterSpacing: -0.2 },
  body: { fontSize: 16, fontWeight: '400' as const },
  bodyStrong: { fontSize: 16, fontWeight: '600' as const },
  caption: { fontSize: 13, fontWeight: '500' as const },
  small: { fontSize: 12, fontWeight: '500' as const },
};

export const shadow = {
  card: {
    shadowColor: '#1B2330',
    shadowOpacity: 0.05,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 1,
  },
  floating: {
    shadowColor: '#1B2330',
    shadowOpacity: 0.14,
    shadowRadius: 28,
    shadowOffset: { width: 0, height: 12 },
    elevation: 8,
  },
};
