import React from 'react';
import { View, StyleSheet } from 'react-native';
import { theme } from '../../theme';

export default function Card({ children, glass, style }) {
  if (glass) {
    return (
      <View style={[styles.card, styles.glassBlur, theme.shadows.card, style]}>
        {children}
      </View>
    );
  }

  return (
    <View style={[styles.card, theme.shadows.card, style]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.bgSurface,
    borderRadius: theme.radii.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: theme.colors.borderDefault,
    overflow: 'hidden',
  },
  glassBlur: {
    backgroundColor: 'rgba(255,255,255,0.60)',
    borderColor: 'rgba(0,114,206,0.12)',
  },
});
