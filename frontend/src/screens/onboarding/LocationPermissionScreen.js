import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../theme';
import SkyBackground from '../../components/visual/SkyBackground';
import BubbleField from '../../components/visual/BubbleField';
import LogoBubble from '../../components/visual/LogoBubble';
import AvatarBubble from '../../components/visual/AvatarBubble';
import GlassButton from '../../components/visual/GlassButton';

export default function LocationPermissionScreen({ route, navigation }) {
  const params = route.params || {};

  async function handleEnable() {
    await Location.requestForegroundPermissionsAsync();
    navigation.navigate('Notifications', params);
  }

  function handleSkip() {
    navigation.navigate('Notifications', params);
  }

  return (
    <SkyBackground variant="sky">
      <BubbleField />
      <View style={styles.inner}>
        {/* Radar illustration */}
        <View style={styles.content}>
          <View style={styles.radarWrap}>
            {/* Dashed rings */}
            {[1, 1.5, 2].map((m, i) => (
              <View
                key={i}
                style={[
                  styles.ring,
                  {
                    width: 100 * m,
                    height: 100 * m,
                    borderRadius: 100 * m / 2,
                    marginLeft: -(100 * m) / 2,
                    marginTop: -(100 * m) / 2,
                  },
                ]}
              />
            ))}
            {/* Center logo */}
            <View style={styles.radarCenter}>
              <LogoBubble size={110} />
            </View>
            {/* Nearby markers */}
            <View style={[styles.nearbyMarker, { top: 20, right: 40 }]}>
              <AvatarBubble size={38} tone="c" name="☕" />
            </View>
            <View style={[styles.nearbyMarker, { bottom: 30, left: 20 }]}>
              <AvatarBubble size={44} tone="b" name="M" />
            </View>
            <View style={[styles.nearbyMarker, { bottom: 10, right: 50 }]}>
              <AvatarBubble size={36} tone="d" name="T" />
            </View>
          </View>

          <Text style={styles.title}>Bubble needs{'\n'}to know where you float.</Text>
          <Text style={styles.subtitle}>
            We only use it to show bubbles nearby. Your exact location is never shared — it's fuzzed to a 200m radius.
          </Text>
        </View>

        <View style={styles.footer}>
          <GlassButton label="Allow location" variant="primary" size="lg" onPress={handleEnable} style={styles.cta} />
          <GlassButton label="Maybe later" variant="ghost" size="md" onPress={handleSkip} style={styles.cta} />
          <View style={styles.progress}>
            {[0,1,2,3,4,5].map((i) => (
              <View key={i} style={[styles.dot, i === 4 && styles.dotActive]} />
            ))}
          </View>
        </View>
      </View>
    </SkyBackground>
  );
}

const styles = StyleSheet.create({
  inner: {
    flex: 1,
    paddingHorizontal: 28,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 32,
    zIndex: 2,
    alignItems: 'center',
  },
  content: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  radarWrap: {
    width: 230,
    height: 230,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 28,
  },
  ring: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: 'rgba(14,26,36,0.15)',
  },
  radarCenter: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginLeft: -55,
    marginTop: -55,
  },
  nearbyMarker: { position: 'absolute' },
  title: {
    fontSize: 30,
    fontWeight: '800',
    letterSpacing: -0.8,
    color: theme.colors.ink,
    textAlign: 'center',
    marginBottom: 12,
    lineHeight: 34,
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 23,
    color: theme.colors.inkSoft,
    textAlign: 'center',
    maxWidth: 320,
  },
  footer: { width: '100%', gap: 10, paddingBottom: 0 },
  cta: { width: '100%' },
  progress: { flexDirection: 'row', justifyContent: 'center', gap: 8, marginTop: 10 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: theme.colors.inkGhost },
  dotActive: { backgroundColor: theme.colors.skyDeep, width: 24 },
});
