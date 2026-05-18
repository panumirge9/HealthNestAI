/**
 * HealthNestAI — Premium Design System
 * Inspired by Apple Health, Headspace, Google Fit
 * 8pt grid, consistent spacing, modern palette
 */

export const COLORS = {
  // Primary
  primary: '#10B981',        // Emerald 500
  primaryDark: '#059669',    // Emerald 600
  primaryLight: '#D1FAE5',   // Emerald 100
  primaryGlow: '#10B98120',  // Emerald with alpha

  // Neutrals
  bg: '#F9FAFB',             // Cool gray 50
  card: '#FFFFFF',
  text: '#111827',           // Gray 900
  textSecondary: '#6B7280',  // Gray 500
  textMuted: '#9CA3AF',      // Gray 400
  textLight: '#D1D5DB',      // Gray 300
  border: '#F3F4F6',         // Gray 100
  borderMedium: '#E5E7EB',   // Gray 200
  divider: '#F3F4F6',

  // Accents
  blue: '#3B82F6',
  blueBg: '#EFF6FF',
  purple: '#8B5CF6',
  purpleBg: '#F5F3FF',
  orange: '#F59E0B',
  orangeBg: '#FFFBEB',
  pink: '#EC4899',
  pinkBg: '#FDF2F8',

  // Semantic
  success: '#10B981',
  successBg: '#ECFDF5',
  warning: '#F59E0B',
  warningBg: '#FFFBEB',
  danger: '#EF4444',
  dangerBg: '#FEF2F2',
};

export const SPACING = {
  '2xs': 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
  '4xl': 40,
  '5xl': 48,
};

export const RADIUS = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  full: 999,
};

export const SHADOW = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 24,
    elevation: 8,
  },
};

export const FONT = {
  regular: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
  heavy: '800',
};

export const TYPE = {
  h1: { fontSize: 28, fontWeight: '700', letterSpacing: -0.5, color: COLORS.text },
  h2: { fontSize: 22, fontWeight: '700', letterSpacing: -0.3, color: COLORS.text },
  h3: { fontSize: 18, fontWeight: '600', color: COLORS.text },
  body: { fontSize: 15, fontWeight: '400', lineHeight: 22, color: COLORS.text },
  bodyMedium: { fontSize: 15, fontWeight: '500', color: COLORS.text },
  caption: { fontSize: 13, fontWeight: '400', color: COLORS.textSecondary },
  captionBold: { fontSize: 13, fontWeight: '600', color: COLORS.textSecondary },
  label: { fontSize: 11, fontWeight: '600', letterSpacing: 0.5, textTransform: 'uppercase', color: COLORS.textMuted },
  micro: { fontSize: 10, fontWeight: '600', color: COLORS.textMuted },
};
