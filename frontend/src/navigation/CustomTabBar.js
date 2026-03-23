import React, { useRef } from 'react';
import { View, TouchableOpacity, Text, Animated, StyleSheet, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { theme } from '../theme';
import { ICONS } from '../constants/icons';

const TAB_CONFIG = [
  { name: 'RadarStack', label: 'Radar', icon: ICONS.radar, iconActive: ICONS.radarActive },
  { name: 'ExploreStack', label: 'Explore', icon: ICONS.explore, iconActive: ICONS.exploreActive },
  { name: 'CreateStack', label: 'Create', icon: ICONS.create, iconActive: ICONS.createActive, isCenter: true },
  { name: 'InboxStack', label: 'Inbox', icon: ICONS.inbox, iconActive: ICONS.inboxActive },
  { name: 'ProfileStack', label: 'Profile', icon: ICONS.profile, iconActive: ICONS.profileActive },
];

function TabButton({ config, focused, onPress }) {
  const scale = useRef(new Animated.Value(1)).current;

  const handlePress = () => {
    Animated.sequence([
      Animated.spring(scale, { toValue: 1.1, useNativeDriver: true, speed: 40, bounciness: 12 }),
      Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 20, bounciness: 6 }),
    ]).start();
    onPress();
  };

  if (config.isCenter) {
    return (
      <TouchableOpacity
        style={styles.centerBtn}
        onPress={handlePress}
        accessibilityRole="button"
        accessibilityLabel="Create bubble"
      >
        <View style={styles.centerBtnInner}>
          <Ionicons name="add" size={28} color="#fff" />
        </View>
      </TouchableOpacity>
    );
  }

  const iconName = focused ? config.iconActive : config.icon;
  const color = focused ? theme.colors.brand : theme.colors.textMuted;

  return (
    <TouchableOpacity
      style={styles.tab}
      onPress={handlePress}
      accessibilityRole="button"
      accessibilityLabel={config.label}
      accessibilityState={{ selected: focused }}
    >
      <Animated.View style={{ transform: [{ scale: focused ? scale : 1 }] }}>
        <Ionicons name={iconName} size={24} color={color} />
      </Animated.View>
      <Text style={[styles.tabLabel, { color }]}>{config.label}</Text>
    </TouchableOpacity>
  );
}

export default function CustomTabBar({ state, navigation }) {
  const insets = useSafeAreaInsets();

  return (
    <BlurView
      intensity={40}
      tint="light"
      style={[styles.container, { paddingBottom: Math.max(insets.bottom, 8) }]}
    >
      <View style={styles.bar}>
        {TAB_CONFIG.map((config, index) => (
          <TabButton
            key={config.name}
            config={config}
            focused={state.index === index}
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
        ))}
      </View>
    </BlurView>
  );
}

const styles = StyleSheet.create({
  container: {
    borderTopWidth: 1,
    borderTopColor: theme.colors.borderDefault,
    shadowColor: '#0050A0',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 4,
  },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingTop: 6,
  },
  tab: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
    minWidth: 56,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '600',
    marginTop: 2,
  },
  centerBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -16,
  },
  centerBtnInner: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: theme.colors.brand,
    alignItems: 'center',
    justifyContent: 'center',
    ...theme.shadows.glow,
  },
});
