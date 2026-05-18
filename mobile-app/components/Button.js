import { TouchableOpacity, Text, ActivityIndicator, View } from 'react-native';
import { COLORS, RADIUS, SPACING, FONT, SHADOW, TYPE } from '../lib/theme';

export default function Button({ label, onPress, loading, variant = 'primary', icon, size = 'md', style, disabled, fullWidth }) {
  const sizes = {
    sm: { paddingVertical: 10, paddingHorizontal: 16, fontSize: 13 },
    md: { paddingVertical: 14, paddingHorizontal: 20, fontSize: 15 },
    lg: { paddingVertical: 16, paddingHorizontal: 24, fontSize: 16 },
  };

  const variants = {
    primary: {
      bg: COLORS.primary,
      fg: '#FFFFFF',
      border: 'transparent',
      shadow: SHADOW.sm,
    },
    secondary: {
      bg: COLORS.primaryLight,
      fg: COLORS.primaryDark,
      border: 'transparent',
      shadow: {},
    },
    ghost: {
      bg: COLORS.card,
      fg: COLORS.text,
      border: COLORS.borderMedium,
      shadow: {},
    },
    danger: {
      bg: COLORS.dangerBg,
      fg: COLORS.danger,
      border: '#FCA5A5',
      shadow: {},
    },
  };

  const v = variants[variant];
  const s = sizes[size];

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={loading || disabled}
      activeOpacity={0.7}
      style={[
        {
          backgroundColor: v.bg,
          paddingVertical: s.paddingVertical,
          paddingHorizontal: s.paddingHorizontal,
          borderRadius: RADIUS.lg,
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'row',
          gap: SPACING.sm,
          borderWidth: v.border !== 'transparent' ? 1 : 0,
          borderColor: v.border,
          opacity: disabled ? 0.5 : 1,
          ...(fullWidth ? { width: '100%' } : {}),
          ...v.shadow,
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={v.fg} />
      ) : (
        <>
          {icon}
          <Text style={{ color: v.fg, fontSize: s.fontSize, fontWeight: FONT.semibold }}>{label}</Text>
        </>
      )}
    </TouchableOpacity>
  );
}
