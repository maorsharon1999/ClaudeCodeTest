import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import Bubble from './Bubble';

function seededRng(seed) {
  return (n) => {
    const x = Math.sin((seed + 1) * (n + 1) * 12.9898) * 43758.5453;
    return x - Math.floor(x);
  };
}

export default function BubbleField({ seed = 0, dense = false }) {
  const bubbles = useMemo(() => {
    const rng = seededRng(seed);
    const count = dense ? 16 : 10;
    return Array.from({ length: count }, (_, i) => ({
      size: 18 + rng(i) * (dense ? 100 : 130),
      top: `${rng(i + 10) * 100}%`,
      left: `${rng(i + 20) * 100}%`,
      delay: rng(i + 30) * 16000,
      duration: (10 + rng(i + 40) * 14) * 1000,
      opacity: 0.5 + rng(i + 50) * 0.35,
      drift: 15 + rng(i + 60) * 30,
    }));
  }, [seed, dense]);

  return (
    <View style={styles.container} pointerEvents="none">
      {bubbles.map((b, i) => (
        <Bubble key={i} {...b} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
});
