import React from 'react';
import { View, StyleSheet } from 'react-native';
import { theme } from '../../theme';

export default function Divider({ style }) {
  return <View style={[styles.divider, style]} />;
}

const styles = StyleSheet.create({
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(14,26,36,0.10)',
  },
});
