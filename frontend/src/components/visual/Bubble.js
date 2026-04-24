import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';

export default function Bubble({
  size = 80,
  top,
  left,
  right,
  bottom,
  delay = 0,
  duration = 14000,
  opacity = 0.8,
  drift = 20,
}) {
  const floatAnim = useRef(new Animated.Value(0)).current;
  const driftAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const floatLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: 1,
          duration: duration,
          delay,
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim, {
          toValue: 0,
          duration: duration,
          useNativeDriver: true,
        }),
      ])
    );

    const driftLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(driftAnim, {
          toValue: 1,
          duration: Math.round(duration * 0.7),
          delay: Math.round(delay * 0.5),
          useNativeDriver: true,
        }),
        Animated.timing(driftAnim, {
          toValue: 0,
          duration: Math.round(duration * 0.7),
          useNativeDriver: true,
        }),
      ])
    );

    floatLoop.start();
    driftLoop.start();

    return () => {
      floatLoop.stop();
      driftLoop.stop();
    };
  }, [delay, duration]);

  const translateY = floatAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -22],
  });

  const translateX = driftAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, drift],
  });

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.bubble,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          top,
          left,
          right,
          bottom,
          opacity,
          shadowRadius: size * 0.3,
          shadowOffset: { width: 0, height: size * 0.08 },
          transform: [{ translateY }, { translateX }],
        },
      ]}
    />
  );
}

const styles = StyleSheet.create({
  bubble: {
    position: 'absolute',
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.50)',
    shadowColor: 'rgba(140,165,195,1)',
    shadowOpacity: 0.25,
    elevation: 0,
  },
});
