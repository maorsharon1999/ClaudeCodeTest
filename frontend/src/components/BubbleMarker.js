/**
 * BubbleMarker — Gold Standard bubble map marker.
 *
 * Spatial UI Standard compliance:
 *   ✅ Base   — circular View with semi-transparent glass background (theme.colors.bgGlass)
 *   ✅ Core   — circular Image centered via absolute fill; initials fallback
 *   ✅ Border — 2pt solid stroke using theme.colors.brand / theme.colors.cyan
 *   ✅ Anim   — Animated ripple (expand+fade) + breathe (scale) with useNativeDriver:true
 *
 * Map Interaction: wrap in <Marker tracksViewChanges={true}> to prevent flicker.
 *
 * Props:
 *   profilePictureUrl / photoUrl  — photo URI
 *   name                          — display name (initials fallback)
 *   isCurrentUser                 — uses theme.colors.cyan accent when true
 *   size                          — photo diameter in dp (default 52)
 */
import React, { useEffect, useRef } from 'react';
import { Animated, View, Image, Text, StyleSheet } from 'react-native';
import { theme } from '../theme';

export default function BubbleMarker({
  profilePictureUrl,
  photoUrl,
  name,
  isCurrentUser = false,
  size = 52,
}) {
  const photo  = profilePictureUrl || photoUrl;
  const accent = isCurrentUser ? theme.colors.cyan : theme.colors.brand;

  const rippleScale   = useRef(new Animated.Value(1)).current;
  const rippleOpacity = useRef(new Animated.Value(0.7)).current;
  const breathe       = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const rippleAnim = Animated.loop(
      Animated.parallel([
        Animated.timing(rippleScale,   { toValue: 1.9, duration: 2400, useNativeDriver: true }),
        Animated.timing(rippleOpacity, { toValue: 0,   duration: 2400, useNativeDriver: true }),
      ])
    );

    const breatheAnim = Animated.loop(
      Animated.sequence([
        Animated.timing(breathe, { toValue: 1.1, duration: 1500, useNativeDriver: true }),
        Animated.timing(breathe, { toValue: 1.0,  duration: 1500, useNativeDriver: true }),
      ])
    );

    rippleAnim.start();
    breatheAnim.start();
    return () => { rippleAnim.stop(); breatheAnim.stop(); };
  }, []);

  const initials = name
    ? name.trim().split(/\s+/).map((w) => w[0]).join('').slice(0, 2).toUpperCase()
    : '?';

  // Derived sizes — all relative to `size` prop
  const rippleBase = size + 20;          // ring origin before scale
  const shellSize  = size + 10;          // glass shell diameter
  const totalSize  = rippleBase * 2;     // wrapper must contain max ripple extent

  return (
    <View style={[styles.wrapper, { width: totalSize, height: totalSize }]}>

      {/* ── Layer 1: expanding ripple ring ─────────────────────────────── */}
      <Animated.View
        pointerEvents="none"
        style={[
          styles.ripple,
          {
            width: rippleBase, height: rippleBase,
            borderRadius: rippleBase / 2,
            borderColor: accent,
            opacity: rippleOpacity,
            transform: [{ scale: rippleScale }],
          },
        ]}
      />

      {/* ── Layer 2: static ambient glow halo ──────────────────────────── */}
      <View
        pointerEvents="none"
        style={[
          styles.halo,
          theme.shadows.orb,
          {
            width: shellSize + 16, height: shellSize + 16,
            borderRadius: (shellSize + 16) / 2,
            borderColor: accent,
          },
        ]}
      />

      {/* ── Layer 3: breathing glass shell (no overflow:hidden — kills anim on Android) */}
      <Animated.View
        style={[
          styles.shell,
          {
            width: shellSize, height: shellSize,
            borderRadius: shellSize / 2,
            transform: [{ scale: breathe }],
          },
        ]}
      >
        {/* ── Layer 4: 2pt theme-colored border + clipped photo circle ─── */}
        {/* Standard: 2pt solid stroke (theme primary color) */}
        <View
          style={[
            styles.photoBorder,
            {
              width: size + 4, height: size + 4,
              borderRadius: (size + 4) / 2,
              borderColor: accent,
            },
          ]}
        >
          {/* Core: circular Image centered via absolute fill */}
          <View style={[styles.photoClip, { width: size, height: size, borderRadius: size / 2 }]}>
            {photo ? (
              <Image source={{ uri: photo }} style={StyleSheet.absoluteFill} resizeMode="cover" />
            ) : (
              <View style={[styles.initialsContainer, { backgroundColor: accent }]}>
                <Text style={[styles.initialsText, { fontSize: size * 0.32 }]}>{initials}</Text>
              </View>
            )}
          </View>
        </View>

        {/* ── Layer 5: top-left glass shine (clipped by own borderRadius) ─ */}
        <View
          pointerEvents="none"
          style={[
            styles.shine,
            { width: shellSize * 0.50, height: shellSize * 0.36 },
          ]}
        />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Ripple: positioned absolutely at center, expands via scale animation
  ripple: {
    position: 'absolute',
    borderWidth: 2,
    backgroundColor: 'transparent',
  },

  // Halo: static glow ring using theme.shadows.orb
  halo: {
    position: 'absolute',
    borderWidth: 1,
    backgroundColor: 'transparent',
    opacity: 0.4,
  },

  // Glass shell: semi-transparent base (theme.colors.bgGlass) — NO overflow:hidden
  shell: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.bgGlass,
    borderWidth: 1,
    borderColor: theme.colors.borderSubtle,
  },

  // 2pt solid border — Standard requirement
  photoBorder: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
  },

  // Photo clip: overflow:hidden here only (not on Animated shell)
  photoClip: {
    overflow: 'hidden',
    backgroundColor: theme.colors.bgElevated,
  },

  initialsContainer: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },

  initialsText: {
    fontWeight: '700',
    color: theme.colors.bgDeep,
    letterSpacing: 0.5,
  },

  // Glass shine: organic highlight, self-clipped by its own border-radius
  shine: {
    position: 'absolute',
    top: 5,
    left: 5,
    borderTopLeftRadius: 999,
    borderTopRightRadius: 50,
    borderBottomRightRadius: 30,
    backgroundColor: theme.colors.bgGlass,
    transform: [{ rotate: '-10deg' }],
    opacity: 0.5,
  },
});
