import { View, TextInput, Text } from 'react-native';
import { COLORS, RADIUS, SPACING, TYPE } from '../lib/theme';
import { useState } from 'react';

export default function Input({ label, value, onChangeText, placeholder, error, ...rest }) {
  const [focused, setFocused] = useState(false);

  return (
    <View style={{ marginBottom: SPACING.lg }}>
      {label && <Text style={[TYPE.label, { marginBottom: 6 }]}>{label}</Text>}
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={COLORS.textLight}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{
          backgroundColor: COLORS.bg,
          borderWidth: 1.5,
          borderColor: focused ? COLORS.primary : error ? COLORS.danger : COLORS.border,
          borderRadius: RADIUS.lg,
          paddingHorizontal: SPACING.lg,
          paddingVertical: 14,
          fontSize: 15,
          color: COLORS.text,
        }}
        {...rest}
      />
      {error && <Text style={{ fontSize: 12, color: COLORS.danger, marginTop: 4 }}>{error}</Text>}
    </View>
  );
}
