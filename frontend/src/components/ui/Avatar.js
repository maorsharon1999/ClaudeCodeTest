import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { theme } from '../../theme';

export default function Avatar({ uri, name, size = 44, style }) {
  const initial = (name || '?')[0].toUpperCase();
  const borderRadius = size / 2;

  if (uri) {
    return (
      <Image
        source={{ uri }}
        style={[{ width: size, height: size, borderRadius }, style]}
      />
    );
  }

  return (
    <View
      style={[
        styles.fallback,
        { width: size, height: size, borderRadius },
        style,
      ]}
    >
      <Text style={[styles.initial, { fontSize: size * 0.4 }]}>{initial}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  fallback: {
    backgroundColor: theme.colors.bgElevated,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.borderDefault,
  },
  initial: {
    fontWeight: '700',
    color: theme.colors.textMuted,
  },
});
