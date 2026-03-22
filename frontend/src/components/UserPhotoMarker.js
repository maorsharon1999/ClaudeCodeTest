import React, { useEffect, useRef, useState } from 'react';
import { Animated, View, Image, Text, StyleSheet, Platform } from 'react-native';

const BRAND_PURPLE = '#7B61FF';
const SELF_TEAL = '#00C9A7';

export default function UserPhotoMarker({ photoUrl, name, isCurrentUser = false, size = 48 }) {
  const breathe = useRef(new Animated.Value(1)).current;
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

  const ringColor = isCurrentUser ? SELF_TEAL : BRAND_PURPLE;
  const ringWidth = 3;
  const innerBorder = 1.5;
  const total = size + (ringWidth + innerBorder) * 2;
  const innerSize = total - ringWidth * 2;

  const initials = name
    ? name.trim().split(/\s+/).map(w => w[0]).join('').slice(0, 2).toUpperCase()
    : '?';

  return (
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
          isCurrentUser ? styles.shadowTeal : styles.shadowPurple,
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
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
  },
  ring: {},
  shadowPurple: Platform.select({
    ios: {
      shadowColor: BRAND_PURPLE,
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
