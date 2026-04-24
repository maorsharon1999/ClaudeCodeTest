import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { theme } from '../../theme';

export default function Badge({ count, children, color, small, style }) {
  const value = count != null ? count : children;
  if (value == null || value <= 0) return null;
  const display = typeof value === 'number' && value > 99 ? '99+' : String(value);

  return (
    <View
      style={[
        styles.badge,
        small && styles.small,
        color ? { backgroundColor: color } : null,
        style,
      ]}
    >
      <Text style={[styles.text, small && styles.textSmall]}>{display}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    minWidth: 22,
    height: 22,
    borderRadius: theme.radii.pill,
    paddingHorizontal: 6,
    paddingVertical: 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.skyDeep,
  },
  small: {
    minWidth: 18,
    height: 18,
    paddingHorizontal: 4,
  },
  text: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
  textSmall: {
    fontSize: 9,
  },
});
