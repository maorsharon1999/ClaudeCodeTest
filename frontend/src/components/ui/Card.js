import React from 'react';
import { View, StyleSheet } from 'react-native';
import { theme } from '../../theme';

export default function Card({ children, glass, style }) {
  return (
    <View
      style={[
        styles.card,
        theme.shadows.card,
        glass && styles.glass,
        style,
      ]}
    >
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
  },
  glass: {
    backgroundColor: theme.colors.bgGlass,
  },
});
