import React from 'react';
import { TouchableOpacity, Text, View, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../../theme';

export default function GlassChip({ children, selected = false, onPress, style }) {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.75} style={[styles.chip, style]}>
      {selected ? (
        <LinearGradient
          colors={['rgba(200,225,240,0.90)', 'rgba(210,230,225,0.90)', 'rgba(235,225,210,0.85)']}
          start={{ x: 0.3, y: 0.28 }}
          end={{ x: 1, y: 1 }}
          style={[StyleSheet.absoluteFill, { borderRadius: theme.radii.pill }]}
        />
      ) : (
        <View
          style={[StyleSheet.absoluteFill, { borderRadius: theme.radii.pill, backgroundColor: 'rgba(255,255,255,0.30)' }]}
        />
      )}
      <Text style={[styles.label, { color: selected ? theme.colors.ink : theme.colors.inkMuted }]}>
        {children}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  chip: {
    height: 30,
    paddingHorizontal: 14,
    borderRadius: theme.radii.pill,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.60)',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    shadowColor: 'rgba(140,165,195,1)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 1,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    fontFamily: '"Plus Jakarta Sans", system-ui',
  },
});
