import React, { useRef, useEffect } from 'react';
import { View, Text, Animated, StyleSheet, TouchableOpacity } from 'react-native';
import SkyBackground from '../../components/visual/SkyBackground';
import BubbleField from '../../components/visual/BubbleField';
import LogoBubble from '../../components/visual/LogoBubble';
import GlassButton from '../../components/visual/GlassButton';
import { theme } from '../../theme';

export default function WelcomeScreen({ navigation }) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, speed: 12, bounciness: 8 }),
    ]).start();
  }, []);

  return (
    <SkyBackground variant="sky">
      <BubbleField />
      <Animated.View style={[styles.inner, { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}>
        {/* Logo top */}
        <View style={styles.logoWrap}>
          <LogoBubble size={170} />
        </View>

        {/* Headline */}
        <View style={styles.hero}>
          <Text style={styles.title}>Your world,{'\n'}in bubbles.</Text>
          <Text style={styles.subtitle}>
            Pop into a moment. Float between rooms.{'\n'}Meet the people right around you.
          </Text>
        </View>

        {/* CTA bottom */}
        <View style={styles.footer}>
          <GlassButton
            label="Get Started"
            variant="primary"
            size="lg"
            onPress={() => navigation.navigate('IntroCarousel')}
            style={styles.cta}
          />
          <View style={styles.progress}>
            {[0,1,2,3,4,5].map((i) => (
              <View
                key={i}
                style={[
                  styles.dot,
                  i === 0 && styles.dotActive,
                  i === 0 && { backgroundColor: theme.colors.skyDeep },
                ]}
              />
            ))}
          </View>
          <TouchableOpacity
            onPress={() => navigation.navigate('IntroCarousel')}
            accessibilityRole="button"
          >
            <Text style={styles.skipLabel}>SKIP FOR NOW</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </SkyBackground>
  );
}

const styles = StyleSheet.create({
  inner: {
    flex: 1,
    paddingHorizontal: 32,
    paddingTop: 80,
    paddingBottom: 40,
    zIndex: 2,
  },
  logoWrap: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 40,
  },
  hero: {
    flex: 1,
  },
  title: {
    fontSize: 44,
    fontWeight: '800',
    letterSpacing: -1.2,
    color: theme.colors.ink,
    marginBottom: 16,
    lineHeight: 48,
  },
  subtitle: {
    fontSize: 17,
    lineHeight: 26,
    color: theme.colors.inkSoft,
  },
  footer: {
    gap: 14,
    marginTop: 20,
  },
  cta: {
    width: '100%',
  },
  progress: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginTop: 6,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.inkGhost,
  },
  dotActive: {
    width: 20,
  },
  skipLabel: {
    textAlign: 'center',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 2,
    color: theme.colors.inkFaint,
    marginTop: 6,
  },
});
