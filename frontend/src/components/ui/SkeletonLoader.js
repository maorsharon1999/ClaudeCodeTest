import React, { useRef, useEffect } from 'react';
import { View, Animated, StyleSheet } from 'react-native';
import { theme } from '../../theme';

function SkeletonPulse({ width, height, borderRadius = theme.radii.sm, style }) {
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.7, duration: 800, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.3, duration: 800, useNativeDriver: true }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, []);

  return (
    <Animated.View
      style={[
        styles.skeleton,
        { width, height, borderRadius, opacity },
        style,
      ]}
    />
  );
}

export function SkeletonCard({ style }) {
  return (
    <View style={[styles.card, style]}>
      <View style={styles.cardRow}>
        <SkeletonPulse width={44} height={44} borderRadius={22} />
        <View style={styles.cardContent}>
          <SkeletonPulse width="70%" height={16} />
          <SkeletonPulse width="40%" height={12} style={{ marginTop: 8 }} />
        </View>
      </View>
      <SkeletonPulse width="90%" height={12} style={{ marginTop: 12 }} />
    </View>
  );
}

export function SkeletonMessage({ style }) {
  return (
    <View style={[styles.messageRow, style]}>
      <SkeletonPulse width={32} height={32} borderRadius={16} />
      <View style={styles.messageContent}>
        <SkeletonPulse width={80} height={12} />
        <SkeletonPulse width={180} height={14} style={{ marginTop: 6 }} />
      </View>
    </View>
  );
}

export default SkeletonPulse;

const styles = StyleSheet.create({
  skeleton: {
    backgroundColor: '#C5D2DC',
  },
  card: {
    backgroundColor: theme.colors.bgSurface,
    borderRadius: theme.radii.lg,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: theme.colors.borderDefault,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardContent: {
    flex: 1,
    marginLeft: 12,
  },
  messageRow: {
    flexDirection: 'row',
    marginBottom: 14,
  },
  messageContent: {
    flex: 1,
    marginLeft: 10,
  },
});
