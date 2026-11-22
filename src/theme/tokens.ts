/**
 * Design System Tokens — wall-et
 * PRD §3: Dark (default) & Light theme + semantik warna
 * Neumorphism: permukaan menyatu dengan background, kedalaman dari
 * dual-shadow (highlight terang + bayangan gelap).
 */

export type ThemeName = 'dark' | 'light';

export const COLORS = {
  // Dark (default)
  dark: {
    background: '#0B0F19',
    card: '#131A2A',
    surface: '#1B2435',
    border: '#232E3F',
    text: '#F8FAFC',
    textMuted: '#94A3B8',
    accent: '#10B981',
    accentLight: '#34D399',
    // Neumorphism
    neuSurface: '#131A2A',
    neuInset: '#0A0E17',
    neuHighlight: '#1F2B3F',
    neuShadow: '#04070D',
    neuEdge: '#1E2A3C',
  },
  // Light
  light: {
    background: '#F8FAFC',
    card: '#FFFFFF',
    surface: '#F1F5F9',
    border: '#E2E8F0',
    text: '#0F172A',
    textMuted: '#64748B',
    accent: '#059669',
    accentLight: '#34D399',
    // Neumorphism: permukaan HARUS lebih terang dari background agar
    // kartu terbaca menonjol, bukan cekung.
    neuSurface: '#FFFFFF',
    neuInset: '#EDF2F8',
    neuHighlight: '#FFFFFF',
    neuShadow: '#C9D5E4',
    neuEdge: '#E1E8F1',
  },
} as const;

// Semantik warna (shared, theme-independent)
export const SEMANTIC = {
  income: '#10B981',
  expense: '#F43F5E',
  transfer: '#3B82F6',
  warning: '#F59E0B',
  success: '#10B981',
  error: '#F43F5E',
  muted: '#94A3B8',
} as const;

export const TOKENS = {
  radius: 16,
  radiusSm: 10,
  radiusLg: 24,
  spacing: 16,
  spacingSm: 8,
  spacingLg: 24,
  borderWidth: 1,
  shadowDark: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  shadowLight: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  // Neumorphism geometry: offset & blur dipakai bersama komponen Neu*
  neu: {
    radius: 20,
    radiusSm: 14,
    radiusLg: 28,
    offset: 6,
    blur: 14,
    shadowOpacity: 0.55,
    highlightOpacity: 0.9,
    elevation: 6,
  },
} as const;

export function getTokens(theme: ThemeName) {
  return {
    ...COLORS[theme],
    ...SEMANTIC,
    ...TOKENS,
  };
}

export type ThemeTokens = ReturnType<typeof getTokens>;
