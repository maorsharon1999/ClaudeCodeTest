import React, { useRef } from 'react';
import { View, TouchableOpacity, Animated, StyleSheet, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../theme';
import {
  HomeIcon,
  SearchIcon,
  CamIcon,
  ChatIcon,
  ProfileIcon,
} from '../components/visual/icons';

// BlurView with safe fallback for devices where expo-blur is unavailable
let BlurView = null;
try {
  BlurView = require('expo-blur').BlurView;
} catch (_) {}

const TAB_ICONS = [HomeIcon, SearchIcon, CamIcon, ChatIcon, ProfileIcon];

const TAB_CONFIG = [
  { name: 'RadarStack', label: 'Radar' },
  { name: 'ExploreStack', label: 'Explore' },
  { name: 'CreateStack', label: 'Create' },
  { name: 'InboxStack', label: 'Inbox' },
  { name: 'ProfileStack', label: 'Profile' },
];

// Iridescent shine gradient for active slot — matches bubble.jsx BUBBLE_SHINE
const ACTIVE_GRADIENT = [
  'rgba(200,225,240,0.85)',
  'rgba(210,230,225,0.85)',
  'rgba(235,225,210,0.85)',
];

function TabSlot({ Icon, focused, onPress, label }) {
  const scale = useRef(new Animated.Value(1)).current;

  const handlePress = () => {
    Animated.sequence([
      Animated.spring(scale, { toValue: 0.88, useNativeDriver: true, speed: 40, bounciness: 0 }),
      Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 20, bounciness: 8 }),
    ]).start();
    onPress();
  };

  const iconColor = focused ? '#0E1A24' : 'rgba(14,26,36,0.60)';

  return (
    <TouchableOpacity
      onPress={handlePress}
      style={styles.slotTouchable}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected: focused }}
      activeOpacity={1}
    >
      <Animated.View
        style={[
          styles.slot,
          focused && styles.slotActive,
          { transform: [{ scale }] },
        ]}
      >
        {focused && (
          <LinearGradient
            colors={ACTIVE_GRADIENT}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[StyleSheet.absoluteFill, { borderRadius: 24 }]}
          />
        )}
        <Icon size={22} color={iconColor} />
        {focused && <View style={styles.activeDot} />}
      </Animated.View>
    </TouchableOpacity>
  );
}

export default function CustomTabBar({ state, navigation }) {
  const TabBarContent = (
    <View style={styles.bar}>
      {/* Inner top highlight */}
      <View style={styles.topHighlight} pointerEvents="none" />

      {TAB_CONFIG.map((config, index) => {
        const Icon = TAB_ICONS[index];
        return (
          <TabSlot
            key={config.name}
            Icon={Icon}
            focused={state.index === index}
            label={config.label}
            onPress={() => {
              const route = state.routes[index];
              const event = navigation.emit({
                type: 'tabPress',
                target: route.key,
                canPreventDefault: true,
              });
              if (!event.defaultPrevented) {
                navigation.navigate(route.name);
              }
            }}
          />
        );
      })}
    </View>
  );

  if (BlurView) {
    return (
      <View style={styles.container} pointerEvents="box-none">
        <BlurView intensity={55} tint="light" style={styles.blurFill} />
        <View style={styles.tintOverlay} pointerEvents="none" />
        {TabBarContent}
      </View>
    );
  }

  // Fallback: solid frosted appearance without blur
  return (
    <View style={[styles.container, styles.fallbackBg]}>
      {TabBarContent}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 18,
    left: 16,
    right: 16,
    height: 64,
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.65)',
    shadowColor: 'rgba(100,125,160,1)',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.22,
    shadowRadius: 32,
    elevation: 8,
    overflow: 'hidden',
  },
  blurFill: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 999,
  },
  tintOverlay: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.45)',
  },
  fallbackBg: {
    backgroundColor: 'rgba(255,255,255,0.92)',
  },
  bar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 6,
  },
  topHighlight: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.80)',
    zIndex: 10,
  },
  slotTouchable: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  slot: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  slotActive: {
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.60)',
    // Inner shadow approximated via shadow props (iOS) — Android gets elevation
    shadowColor: 'rgba(255,255,255,1)',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 5,
    elevation: 2,
  },
  activeDot: {
    position: 'absolute',
    bottom: -8,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: theme.colors.skyDeep,
  },
});
