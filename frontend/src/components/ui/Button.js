import React, { useRef } from 'react';
import { TouchableOpacity, Text, ActivityIndicator, Animated, StyleSheet } from 'react-native';
import { theme } from '../../theme';

const VARIANTS = {
  primary: {
    bg: theme.colors.brand,
    text: '#fff',
    border: 'transparent',
  },
  secondary: {
    bg: theme.colors.brandMuted,
    text: theme.colors.brand,
    border: 'transparent',
  },
  outline: {
    bg: 'transparent',
    text: theme.colors.textPrimary,
    border: theme.colors.borderDefault,
  },
  ghost: {
    bg: 'transparent',
    text: theme.colors.textSecondary,
    border: 'transparent',
  },
  danger: {
    bg: 'rgba(255,92,92,0.12)',
    text: theme.colors.error,
    border: theme.colors.error,
  },
};

export default function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  icon,
  style,
}) {
  const scale = useRef(new Animated.Value(1)).current;
  const v = VARIANTS[variant] || VARIANTS.primary;

  const onPressIn = () =>
    Animated.spring(scale, { toValue: 0.96, useNativeDriver: true, speed: 40, bounciness: 0 }).start();
  const onPressOut = () =>
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 20, bounciness: 6 }).start();

  const height = size === 'sm' ? 40 : size === 'lg' ? 56 : 48;
  const fontSize = size === 'sm' ? 14 : size === 'lg' ? 17 : 15;

  return (
    <Animated.View style={[{ transform: [{ scale }] }, style]}>
      <TouchableOpacity
        style={[
          styles.base,
          {
            height,
            backgroundColor: v.bg,
            borderColor: v.border,
            borderWidth: v.border !== 'transparent' ? 1 : 0,
            opacity: disabled ? 0.45 : 1,
          },
        ]}
        onPress={onPress}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        disabled={disabled || loading}
        accessibilityRole="button"
      >
        {loading ? (
          <ActivityIndicator color={v.text} size="small" />
        ) : (
          <>
            {icon}
            <Text style={[styles.text, { fontSize, color: v.text, marginLeft: icon ? 8 : 0 }]}>
              {title}
            </Text>
          </>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: theme.radii.md,
    paddingHorizontal: 20,
  },
  text: {
    fontWeight: '600',
  },
});
