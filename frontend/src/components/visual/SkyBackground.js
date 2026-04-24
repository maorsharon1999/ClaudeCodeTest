import React from 'react';
import { View, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../../theme';

const VARIANTS = {
  sky:   theme.colors.skyGrad,
  dawn:  theme.colors.dawnGrad,
  dusk:  theme.colors.duskGrad,
  night: theme.colors.nightGrad,
  mint:  theme.colors.mintGrad,
};

export default function SkyBackground({ variant = 'sky', children }) {
  const stops = VARIANTS[variant] || VARIANTS.sky;
  return (
    <LinearGradient
      colors={stops}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={StyleSheet.absoluteFill}
    >
      {/* Radial overlay approximation — top-left orb */}
      <View
        style={[
          styles.orb,
          {
            top: '5%',
            left: '-10%',
            width: 260,
            height: 260,
            backgroundColor: 'rgba(200,225,240,0.28)',
          },
        ]}
        pointerEvents="none"
      />
      {/* Radial overlay approximation — top-right orb */}
      <View
        style={[
          styles.orb,
          {
            top: '8%',
            right: '-8%',
            width: 220,
            height: 220,
            backgroundColor: 'rgba(180,210,225,0.22)',
          },
        ]}
        pointerEvents="none"
      />
      {children}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  orb: {
    position: 'absolute',
    borderRadius: 999,
  },
});
