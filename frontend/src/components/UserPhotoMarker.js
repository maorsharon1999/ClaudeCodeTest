import React, { useState } from 'react';
import { View, Image, Text, StyleSheet, Platform } from 'react-native';

const BRAND_BLUE = '#0072CE';
const SELF_TEAL = '#00C9A7';

export default function UserPhotoMarker({ photoUrl, name, isCurrentUser = false, size = 48 }) {
  const [imageLoaded, setImageLoaded] = useState(false);

  const ringColor = isCurrentUser ? SELF_TEAL : BRAND_BLUE;
  const ringWidth = 4;
  const whiteBorder = 2;
  const outerSize = size + (ringWidth + whiteBorder) * 2;
  const innerSize = size + whiteBorder * 2;

  const initials = name
    ? name.trim().split(/\s+/).map(w => w[0]).join('').slice(0, 2).toUpperCase()
    : '?';

  return (
    <View style={styles.wrapper}>
      {/* Colored ring — solid background circle, not border */}
      <View
        style={[
          styles.outerRing,
          {
            width: outerSize,
            height: outerSize,
            borderRadius: outerSize / 2,
            backgroundColor: ringColor,
          },
          isCurrentUser ? styles.shadowTeal : styles.shadowBlue,
        ]}
      >
        {/* White border layer */}
        <View
          style={[
            styles.whiteBorder,
            {
              width: innerSize,
              height: innerSize,
              borderRadius: innerSize / 2,
            },
          ]}
        >
          {/* Photo or initials */}
          <View
            style={[
              styles.photoContainer,
              {
                width: size,
                height: size,
                borderRadius: size / 2,
              },
            ]}
          >
            {photoUrl ? (
              <Image
                source={{ uri: photoUrl }}
                style={[styles.photo, { borderRadius: size / 2 }]}
                onLoad={() => setImageLoaded(true)}
              />
            ) : (
              <View style={[styles.initialsContainer, { backgroundColor: ringColor, borderRadius: size / 2 }]}>
                <Text style={[styles.initialsText, { fontSize: size * 0.35 }]}>{initials}</Text>
              </View>
            )}
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
  },
  outerRing: {
    alignItems: 'center',
    justifyContent: 'center',
  },
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
  whiteBorder: {
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoContainer: {
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
});
