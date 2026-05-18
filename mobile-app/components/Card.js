import { View } from 'react-native';
import { COLORS, RADIUS, SPACING, SHADOW } from '../lib/theme';

export default function Card({ children, style, variant = 'default', padded = true }) {
  const variants = {
    default: { backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.border },
    elevated: { backgroundColor: COLORS.card, ...SHADOW.md },
    ghost: { backgroundColor: 'transparent' },
  };

  return (
    <View style={[
      {
        borderRadius: RADIUS.xl,
        padding: padded ? SPACING.xl : 0,
        marginBottom: SPACING.lg,
        ...variants[variant],
      },
      style,
    ]}>
      {children}
    </View>
  );
}
