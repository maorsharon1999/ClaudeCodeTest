import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { theme } from '../../theme';

export default function Chip({ label, selected, onPress, icon, style }) {
  return (
    <TouchableOpacity
      style={[styles.chip, selected && styles.chipActive, style]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
    >
      {icon}
      <Text style={[styles.text, selected && styles.textActive, icon && { marginLeft: 6 }]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  chip: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: theme.radii.pill,
    borderWidth: 1,
    borderColor: theme.colors.borderDefault,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  chipActive: {
    borderColor: theme.colors.brand,
    backgroundColor: theme.colors.brandMuted,
  },
  text: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  textActive: {
    color: theme.colors.brand,
    fontWeight: '600',
  },
});
