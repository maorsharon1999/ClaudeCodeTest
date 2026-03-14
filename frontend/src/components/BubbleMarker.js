import React, { useEffect, useRef } from 'react';
import { Animated, View, Image, Text, StyleSheet, Platform } from 'react-native';

const SIZE = 56;
const RING = 3;
const INNER_BORDER = 1.5;
const TOTAL = SIZE + (RING + INNER_BORDER) * 2;

// Brand colors
const BRAND_PURPLE = '#6C47FF';
const SELF_TEAL = '#00C9A7';

export default function BubbleMarker({ photoUrl, name, isCurrentUser = false }) {
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1.08,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 1.0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const initials = name
    ? name
        .trim()
        .split(/\s+/)
        .map((w) => w[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
    : '?';

  const ringColor = isCurrentUser ? SELF_TEAL : BRAND_PURPLE;
  const pinColor = isCurrentUser ? SELF_TEAL : BRAND_PURPLE;

  return (
    <Animated.View style={[styles.wrapper, { transform: [{ scale: pulse }] }]}>
      {/* Outer colored ring */}
      <View
        style={[
          styles.ring,
          { borderColor: ringColor },
          isCurrentUser ? styles.shadowTeal : styles.shadowPurple,
        ]}
      >
        {/* White inner border layer */}
        <View style={styles.innerBorder}>
          {/* Content: photo or initials fallback */}
          {photoUrl ? (
            <Image source={{ uri: photoUrl }} style={styles.photo} />
          ) : (
            <View style={[styles.initialsContainer, { backgroundColor: ringColor }]}>
              <Text style={styles.initialsText}>{initials}</Text>
            </View>
          )}

          {/* 3D shine overlay — top-left highlight simulating a glass sphere */}
          <View style={styles.shine} pointerEvents="none" />
        </View>
      </View>

      {/* Downward-pointing pin tip */}
      <View
        style={[
          styles.pin,
          {
            borderTopColor: pinColor,
          },
        ]}
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    // No overflow:hidden here — the pin must be visible outside the ring
  },

  ring: {
    width: TOTAL,
    height: TOTAL,
    borderRadius: TOTAL / 2,
    borderWidth: RING,
    // shadow applied via conditional style below
  },

  shadowPurple: Platform.select({
    ios: {
      shadowColor: BRAND_PURPLE,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.45,
      shadowRadius: 8,
    },
    android: { elevation: 8 },
  }),

  shadowTeal: Platform.select({
    ios: {
      shadowColor: SELF_TEAL,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.45,
      shadowRadius: 8,
    },
    android: { elevation: 8 },
  }),

  innerBorder: {
    flex: 1,
    borderRadius: (TOTAL - RING * 2) / 2,
    borderWidth: INNER_BORDER,
    borderColor: 'rgba(255,255,255,0.9)',
    overflow: 'hidden',
  },

  photo: {
    width: '100%',
    height: '100%',
  },

  initialsContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  initialsText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 0.5,
  },

  // Top-left semicircle highlight — the illusion of 3D gloss without a gradient library.
  // Positioned absolutely at the top-left; the borderRadius clips it into the circular frame.
  shine: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: SIZE * 0.72,
    height: SIZE * 0.45,
    borderTopLeftRadius: SIZE / 2,
    borderTopRightRadius: SIZE * 0.35,
    borderBottomRightRadius: SIZE * 0.5,
    backgroundColor: 'rgba(255,255,255,0.32)',
    // Slight rotation makes the highlight feel more natural
    transform: [{ rotate: '-8deg' }, { translateX: -2 }],
  },

  // Downward triangle pin
  pin: {
    width: 0,
    height: 0,
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderTopWidth: 10,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    // borderTopColor set inline per-instance
    marginTop: -1, // tight seam with the ring
  },
});
