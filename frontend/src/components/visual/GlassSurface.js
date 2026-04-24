import React from 'react';
import { View, StyleSheet } from 'react-native';
import { BlurView } from 'expo-blur';
import { theme } from '../../theme';

export default function GlassSurface({
  children,
  style,
  radius = 28,
  tint,
  dark = false,
}) {
  const bgTint = dark
    ? 'rgba(30,42,56,0.55)'
    : tint || theme.colors.glassTint;

  const borderColor = dark
    ? 'rgba(255,255,255,0.12)'
    : theme.colors.glassBorder;

  return (
    <View
      style={[
        styles.outer,
        {
          borderRadius: radius,
          borderColor,
          ...theme.shadows.orb,
          shadowColor: 'rgba(100,125,160,1)',
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.15,
          shadowRadius: 28,
          elevation: 6,
        },
        style,
      ]}
    >
      <BlurView
        intensity={55}
        tint="light"
        style={[StyleSheet.absoluteFill, { borderRadius: radius, overflow: 'hidden' }]}
      />
      {/* Glass tint overlay */}
      <View
        style={[
          StyleSheet.absoluteFill,
          {
            borderRadius: radius,
            backgroundColor: bgTint,
          },
        ]}
        pointerEvents="none"
      />
      {/* Inner top highlight */}
      {!dark && (
        <View
          style={[
            styles.highlight,
            { borderRadius: radius - 2 },
          ]}
          pointerEvents="none"
        />
      )}
      <View style={{ borderRadius: radius, overflow: 'hidden' }}>
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outer: {
    borderWidth: 1,
    position: 'relative',
  },
  highlight: {
    position: 'absolute',
    top: 1,
    left: 16,
    right: 16,
    height: 40,
    backgroundColor: 'rgba(255,255,255,0.45)',
    // Fade bottom via opacity — approximates gradient
    opacity: 0.7,
  },
});
