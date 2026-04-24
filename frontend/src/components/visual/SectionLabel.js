import React from 'react';
import { Text, StyleSheet } from 'react-native';
import { theme } from '../../theme';

export default function SectionLabel({ children, style }) {
  return (
    <Text style={[styles.label, style]}>
      {typeof children === 'string' ? children.toUpperCase() : children}
    </Text>
  );
}

const styles = StyleSheet.create({
  label: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 1.5,
    color: theme.colors.inkMuted,
    marginBottom: 10,
    fontFamily: '"Plus Jakarta Sans", system-ui',
  },
});
