import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../../theme';

const TONE_GRADIENTS = {
  a: ['#C8D9E8', '#B8C5D8'],  // sky
  b: ['#C5DBD2', '#B8D0C5'],  // mint
  c: ['#E8DAC5', '#DDC8AC'],  // sand/peach
  d: ['#CFCADB', '#BDB8CE'],  // lilac
  e: ['#D5D8DD', '#BEC4CC'],  // slate
  f: ['#CDD9D1', '#BDCCC4'],  // sage
};

export default function AvatarBubble({ size = 90, tone = 'a', initials, imageUri, style }) {
  const innerSize = size * 0.82;
  const innerOffset = size * 0.09;
  const gradColors = TONE_GRADIENTS[tone] || TONE_GRADIENTS.a;

  return (
    <View
      style={[
        {
          width: size,
          height: size,
          borderRadius: size / 2,
        },
        styles.outer,
        {
          shadowRadius: size * 0.25,
          shadowOffset: { width: 0, height: size * 0.06 },
        },
        style,
      ]}
    >
      {/* Inner gradient circle */}
      <LinearGradient
        colors={gradColors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[
          styles.inner,
          {
            width: innerSize,
            height: innerSize,
            borderRadius: innerSize / 2,
            top: innerOffset,
            left: innerOffset,
          },
        ]}
      >
        {imageUri ? (
          <Image
            source={{ uri: imageUri }}
            style={{ width: innerSize, height: innerSize, borderRadius: innerSize / 2 }}
          />
        ) : (
          initials ? (
            <Text
              style={{
                fontSize: size * 0.32,
                fontWeight: '700',
                color: theme.colors.inkSoft,
                fontFamily: '"Plus Jakarta Sans", system-ui',
              }}
            >
              {initials}
            </Text>
          ) : null
        )}
        {/* Specular highlight inside inner circle */}
        <View
          style={[
            styles.specular,
            {
              top: innerSize * 0.08,
              left: innerSize * 0.15,
              width: innerSize * 0.40,
              height: innerSize * 0.30,
              borderRadius: innerSize,
            },
          ]}
          pointerEvents="none"
        />
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  outer: {
    position: 'relative',
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.55)',
    shadowColor: 'rgba(140,165,195,1)',
    shadowOpacity: 0.30,
    elevation: 4,
  },
  inner: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  specular: {
    position: 'absolute',
    backgroundColor: 'rgba(255,255,255,0.80)',
    opacity: 0.75,
  },
});
