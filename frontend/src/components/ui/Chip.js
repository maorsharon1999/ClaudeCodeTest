import React from 'react';
import { View, StyleSheet } from 'react-native';
import GlassChip from '../visual/GlassChip';

export default function Chip({ label, selected, onPress, icon, children, style }) {
  return (
    <GlassChip selected={selected} onPress={onPress} style={[styles.chip, style]}>
      {icon ? <View style={styles.iconWrap}>{icon}</View> : null}
      {label || children}
    </GlassChip>
  );
}

const styles = StyleSheet.create({
  chip: {
    marginBottom: 4,
  },
  iconWrap: {
    marginRight: 6,
  },
});
