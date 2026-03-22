import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { theme } from '../../theme';

export default function Badge({ count, color = theme.colors.brand, small, style }) {
  if (count == null || count <= 0) return null;
  const display = count > 99 ? '99+' : String(count);

  return (
    <View
      style={[
        styles.badge,
        small && styles.small,
        { backgroundColor: color },
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
    borderRadius: 11,
    paddingHorizontal: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  small: {
    minWidth: 18,
    height: 18,
    borderRadius: 9,
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
