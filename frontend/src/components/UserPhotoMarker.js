import React, { useEffect, useRef, useState } from 'react';
import { Animated, View, Image, Text, StyleSheet, Platform, Easing } from 'react-native';

const BRAND_BLUE = '#0072CE';
const SELF_TEAL = '#00C9A7';

export default function UserPhotoMarker({ photoUrl, name, isCurrentUser = false, size = 48 }) {
  const breathe = useRef(new Animated.Value(1)).current;
  const bubbleScale = useRef(new Animated.Value(0.8)).current;
  const bubbleOpacity = useRef(new Animated.Value(0.6)).current;
  const bubbleRotate = useRef(new Animated.Value(0)).current;
  const ring2Scale = useRef(new Animated.Value(0.9)).current;
  const ring2Opacity = useRef(new Animated.Value(0.3)).current;
  const [imageLoaded, setImageLoaded] = useState(false);

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(breathe, {
          toValue: 1.05,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(breathe, {
          toValue: 1.0,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, []);

  // Animated bubble ring: scales in/out and rotates continuously
  useEffect(() => {
    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(bubbleScale, {
          toValue: 1.15,
          duration: 2400,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(bubbleScale, {
          toValue: 0.85,
          duration: 2400,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    );

    const opacityLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(bubbleOpacity, {
          toValue: 0.25,
          duration: 2400,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(bubbleOpacity, {
          toValue: 0.6,
          duration: 2400,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    );

    const rotateLoop = Animated.loop(
      Animated.timing(bubbleRotate, {
        toValue: 1,
        duration: 8000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );

    // Second ring animations (offset timing for organic feel)
    const ring2PulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(ring2Scale, {
          toValue: 1.22,
          duration: 3000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(ring2Scale, {
          toValue: 0.9,
          duration: 3000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    );

    const ring2OpacityLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(ring2Opacity, {
          toValue: 0.12,
          duration: 3000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(ring2Opacity, {
          toValue: 0.35,
          duration: 3000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    );

    pulseLoop.start();
    opacityLoop.start();
    rotateLoop.start();
    ring2PulseLoop.start();
    ring2OpacityLoop.start();
    return () => {
      pulseLoop.stop();
      opacityLoop.stop();
      rotateLoop.stop();
      ring2PulseLoop.stop();
      ring2OpacityLoop.stop();
    };
  }, []);

  const ringColor = isCurrentUser ? SELF_TEAL : BRAND_BLUE;
  const ringWidth = 3;
  const innerBorder = 1.5;
  const total = size + (ringWidth + innerBorder) * 2;
  const innerSize = total - ringWidth * 2;
  const bubbleRingSize = total + 24;
  // Wrapper must be large enough to contain max scaled ring (1.22x) without clipping
  const maxScale = 1.25;
  const wrapperSize = Math.ceil(bubbleRingSize * maxScale) + 4;

  const initials = name
    ? name.trim().split(/\s+/).map(w => w[0]).join('').slice(0, 2).toUpperCase()
    : '?';

  const spin = bubbleRotate.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  // Center offsets for absolute-positioned rings
  const ring1Offset = (wrapperSize - bubbleRingSize) / 2;
  const ring2Size = bubbleRingSize - 6;
  const ring2Offset = (wrapperSize - ring2Size) / 2;

  return (
    <View style={[styles.outerWrapper, { width: wrapperSize, height: wrapperSize }]}>
      {/* Animated bubble ring behind the photo */}
      <Animated.View
        style={[
          styles.bubbleRing,
          {
            top: ring1Offset,
            left: ring1Offset,
            width: bubbleRingSize,
            height: bubbleRingSize,
            borderRadius: bubbleRingSize / 2,
            borderColor: ringColor,
            opacity: bubbleOpacity,
            transform: [{ scale: bubbleScale }, { rotate: spin }],
          },
        ]}
        pointerEvents="none"
      />
      {/* Second offset bubble ring for organic feel */}
      <Animated.View
        style={[
          styles.bubbleRingInner,
          {
            top: ring2Offset,
            left: ring2Offset,
            width: ring2Size,
            height: ring2Size,
            borderRadius: ring2Size / 2,
            borderColor: ringColor,
            opacity: ring2Opacity,
            transform: [
              { scale: ring2Scale },
              { rotate: spin },
            ],
          },
        ]}
        pointerEvents="none"
      />

      {/* Photo marker */}
      <Animated.View style={[styles.wrapper, { transform: [{ scale: breathe }] }]}>
        <View
          style={[
            styles.ring,
            {
              width: total,
              height: total,
              borderRadius: total / 2,
              borderWidth: ringWidth,
              borderColor: ringColor,
            },
            isCurrentUser ? styles.shadowTeal : styles.shadowBlue,
          ]}
        >
          <View
            style={[
              styles.innerBorder,
              {
                borderRadius: innerSize / 2,
                borderWidth: innerBorder,
              },
            ]}
          >
            {photoUrl ? (
              <Image
                source={{ uri: photoUrl }}
                style={styles.photo}
                onLoad={() => setImageLoaded(true)}
              />
            ) : (
              <View style={[styles.initialsContainer, { backgroundColor: ringColor }]}>
                <Text style={[styles.initialsText, { fontSize: size * 0.35 }]}>{initials}</Text>
              </View>
            )}
            <View style={styles.shine} pointerEvents="none" />
          </View>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  outerWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  bubbleRing: {
    position: 'absolute',
    borderWidth: 2.5,
  },
  bubbleRingInner: {
    position: 'absolute',
    borderWidth: 1.5,
  },
  wrapper: {
    alignItems: 'center',
  },
  ring: {},
  shadowBlue: Platform.select({
    ios: {
      shadowColor: BRAND_BLUE,
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.4,
      shadowRadius: 6,
    },
    android: { elevation: 6 },
  }),
  shadowTeal: Platform.select({
    ios: {
      shadowColor: SELF_TEAL,
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.4,
      shadowRadius: 6,
    },
    android: { elevation: 6 },
  }),
  innerBorder: {
    flex: 1,
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
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 0.5,
  },
  shine: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '72%',
    height: '45%',
    borderTopLeftRadius: 999,
    borderTopRightRadius: 999,
    borderBottomRightRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.25)',
    transform: [{ rotate: '-8deg' }, { translateX: -2 }],
  },
});
