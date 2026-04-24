import React, { useEffect, useRef } from 'react';
import { Animated, Text, View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../theme';

export default function Toast({ message, visible, icon, duration = 2500 }) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(-20)).current;

  useEffect(() => {
    if (visible && message) {
      Animated.parallel([
        Animated.timing(opacity, { toValue: 1, duration: 250, useNativeDriver: true }),
        Animated.spring(translateY, { toValue: 0, useNativeDriver: true, speed: 20, bounciness: 8 }),
      ]).start(() => {
        setTimeout(() => {
          Animated.timing(opacity, { toValue: 0, duration: 200, useNativeDriver: true }).start();
        }, duration);
      });
    }
  }, [visible, message]);

  if (!message) return null;

  return (
    <Animated.View style={[styles.toast, { opacity, transform: [{ translateY }] }]}>
      {/* Glass tint overlay */}
      <View style={styles.tint} pointerEvents="none" />
      {icon ? (
        <Ionicons name={icon} size={16} color={theme.colors.ink} style={styles.icon} />
      ) : null}
      <Text style={styles.text}>{message}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  toast: {
    position: 'absolute',
    bottom: 60,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(255,255,255,0.85)',
    borderRadius: theme.radii.md,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.60)',
    overflow: 'hidden',
    ...theme.shadows.card,
  },
  tint: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.85)',
    borderRadius: theme.radii.md,
  },
  icon: {
    marginRight: 8,
    zIndex: 1,
  },
  text: {
    flex: 1,
    fontSize: 14,
    color: theme.colors.ink,
    zIndex: 1,
  },
});
