import React, { useEffect, useRef } from 'react';
import { Animated, View, StyleSheet } from 'react-native';

export default function LogoBubble({ size = 120 }) {
  const breathe = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(breathe, {
          toValue: 1.04,
          duration: 2500,
          useNativeDriver: true,
        }),
        Animated.timing(breathe, {
          toValue: 1,
          duration: 2500,
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, []);

  return (
    <Animated.View
      style={[
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          transform: [{ scale: breathe }],
        },
        styles.bubble,
        {
          shadowRadius: size * 0.4,
          shadowOffset: { width: 0, height: size * 0.08 },
          borderWidth: 1.5,
        },
      ]}
    >
      {/* Inner highlight orb */}
      <View
        style={{
          position: 'absolute',
          top: size * 0.10,
          left: size * 0.16,
          width: size * 0.38,
          height: size * 0.28,
          borderRadius: size,
          backgroundColor: 'rgba(255,255,255,0.70)',
          opacity: 0.8,
        }}
        pointerEvents="none"
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  bubble: {
    backgroundColor: 'transparent',
    borderColor: 'rgba(255,255,255,0.60)',
    shadowColor: 'rgba(140,170,200,1)',
    shadowOpacity: 0.40,
    elevation: 8,
  },
});
