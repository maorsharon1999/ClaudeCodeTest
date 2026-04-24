import React, { useRef } from 'react';
import { Animated, TouchableWithoutFeedback, View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../../theme';

const HEIGHTS = { sm: 40, md: 50, lg: 58 };
const FONT_SIZES = { sm: 14, md: 16, lg: 17 };

export default function GlassButton({
  children,
  variant = 'primary',
  size = 'md',
  onPress,
  style,
  disabled = false,
}) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.97,
      useNativeDriver: true,
      speed: 20,
      bounciness: 4,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      speed: 20,
      bounciness: 4,
    }).start();
  };

  const h = HEIGHTS[size] || HEIGHTS.md;
  const fontSize = FONT_SIZES[size] || FONT_SIZES.md;
  const textColor = variant === 'ink' ? 'rgba(255,255,255,0.95)' : theme.colors.ink;

  const inkGradient = ['#1F2A38', '#2A3648'];
  const primaryGradient = ['rgba(200,225,240,0.85)', 'rgba(210,230,225,0.85)', 'rgba(235,225,210,0.85)'];
  const ghostBg = 'rgba(255,255,255,0.45)';

  const borderColor = variant === 'ink'
    ? 'rgba(255,255,255,0.12)'
    : 'rgba(255,255,255,0.70)';

  return (
    <TouchableWithoutFeedback
      onPress={disabled ? undefined : onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
    >
      <Animated.View
        style={[
          styles.base,
          {
            height: h,
            borderRadius: theme.radii.pill,
            borderColor,
            opacity: disabled ? 0.5 : 1,
            transform: [{ scale: scaleAnim }],
          },
          style,
        ]}
      >
        {variant === 'primary' && (
          <LinearGradient
            colors={primaryGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[StyleSheet.absoluteFill, { borderRadius: theme.radii.pill }]}
          />
        )}
        {variant === 'ink' && (
          <LinearGradient
            colors={inkGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[StyleSheet.absoluteFill, { borderRadius: theme.radii.pill }]}
          />
        )}
        {variant === 'ghost' && (
          <View
            style={[
              StyleSheet.absoluteFill,
              { borderRadius: theme.radii.pill, backgroundColor: ghostBg },
            ]}
          />
        )}
        {/* Inner top highlight for non-ink */}
        {variant !== 'ink' && (
          <View
            style={[
              styles.highlight,
              { borderRadius: theme.radii.pill },
            ]}
            pointerEvents="none"
          />
        )}
        <View style={styles.content}>
          {typeof children === 'string' ? (
            <Text style={[styles.label, { fontSize, color: textColor }]}>
              {children}
            </Text>
          ) : (
            children
          )}
        </View>
      </Animated.View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  base: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 26,
    borderWidth: 1.5,
    overflow: 'hidden',
    shadowColor: 'rgba(100,125,160,1)',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.20,
    shadowRadius: 22,
    elevation: 4,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    zIndex: 1,
  },
  label: {
    fontWeight: '700',
    fontFamily: '"Plus Jakarta Sans", system-ui',
  },
  highlight: {
    position: 'absolute',
    top: 2,
    left: 10,
    right: 10,
    height: '45%',
    backgroundColor: 'rgba(255,255,255,0.60)',
    opacity: 0.7,
  },
});
