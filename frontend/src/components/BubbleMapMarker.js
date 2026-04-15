import React, { useRef, useEffect } from 'react';
import { View, Text, Animated, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CATEGORY_ICONS } from '../constants/icons';
import { theme } from '../theme';

export default function BubbleMapMarker({ category, memberCount, animate = true }) {
  const iconName = CATEGORY_ICONS[category] || CATEGORY_ICONS.Other;
  const breathe = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!animate) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(breathe, {
          toValue: 1.08,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(breathe, {
          toValue: 1,
          duration: 2000,
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
      <View style={styles.pulseRing} />
      <View style={styles.iconCircle}>
        <Ionicons name={iconName} size={20} color={theme.colors.brand} />
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
    width: 52,
    height: 52,
  },
  pulseRing: {
    position: 'absolute',
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(0,114,206,0.12)',
  },
  iconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
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
