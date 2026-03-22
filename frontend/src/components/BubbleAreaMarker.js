import React, { useRef, useEffect } from 'react';
import { View, Text, Animated, StyleSheet, Easing } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CATEGORY_ICONS } from '../constants/icons';
import { theme } from '../theme';

export default function BubbleAreaMarker({ category, memberCount, animate = true }) {
  const iconName = CATEGORY_ICONS[category] || CATEGORY_ICONS.Other;
  const breathe = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!animate) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(breathe, {
          toValue: 1.06,
          duration: 3000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(breathe, {
          toValue: 1.0,
          duration: 3000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [animate]);

  const countDisplay = memberCount <= 2 ? '' : String(memberCount);

  return (
    <Animated.View style={[styles.container, { transform: [{ scale: breathe }] }]}>
      <View style={styles.glowRing} />
      <View style={styles.iconCircle}>
        <Ionicons name={iconName} size={22} color={theme.colors.brand} />
      </View>
      {countDisplay ? (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{countDisplay}</Text>
        </View>
      ) : null}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 56,
    height: 56,
  },
  glowRing: {
    position: 'absolute',
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(123,97,255,0.15)',
    borderWidth: 1.5,
    borderColor: 'rgba(123,97,255,0.3)',
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.bgElevated,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: theme.colors.brand,
  },
  badge: {
    position: 'absolute',
    top: -2,
    right: 0,
    backgroundColor: theme.colors.brand,
    borderRadius: 8,
    paddingHorizontal: 5,
    paddingVertical: 1,
    minWidth: 18,
    alignItems: 'center',
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },
});
