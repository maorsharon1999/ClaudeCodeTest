import React, { useState } from 'react';
import { View, Text, ActivityIndicator, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { updateProfile } from '../../api/profile';
import { useAuth } from '../../context/AuthContext';
import { theme } from '../../theme';
import SkyBackground from '../../components/visual/SkyBackground';
import BubbleField from '../../components/visual/BubbleField';
import LogoBubble from '../../components/visual/LogoBubble';
import GlassButton from '../../components/visual/GlassButton';
import GlassCard from '../../components/visual/GlassCard';

const NOTIFICATION_ROWS = [
  { label: 'New bubbles nearby', on: true },
  { label: 'Signals & matches', on: true },
  { label: 'Messages', on: true },
  { label: 'Weekly recap', on: false },
];

export default function NotificationsScreen({ route, navigation }) {
  const params = route.params || {};
  const { markProfileComplete } = useAuth();
  const [saving, setSaving] = useState(false);

  async function finishOnboarding() {
    setSaving(true);
    try {
      const profileData = {
        display_name: params.displayName,
        birth_date: params.birthDate,
        interests: params.interests?.length > 0 ? params.interests : undefined,
      };
      await updateProfile(profileData);
      markProfileComplete();
    } catch {
      // Still complete onboarding even if save fails — they can edit later
      markProfileComplete();
    } finally {
      setSaving(false);
    }
  }

  return (
    <SkyBackground variant="sky">
      <BubbleField />
      <View style={styles.inner}>
        <View style={styles.content}>
          {/* Logo with badge */}
          <View style={styles.logoWrap}>
            <LogoBubble size={130} />
            <View style={styles.badge}>
              <Text style={styles.badgeText}>3</Text>
            </View>
          </View>

          <Text style={styles.title}>Don't miss a{'\n'}bubble nearby.</Text>
          <Text style={styles.subtitle}>
            Get nudged when a bubble pops up in your neighbourhood or someone says hi. No spam, we promise.
          </Text>

          {/* Notification toggles in glass card */}
          <GlassCard style={styles.card}>
            {NOTIFICATION_ROWS.map((row, i) => (
              <View key={row.label} style={[styles.notifRow, i < NOTIFICATION_ROWS.length - 1 && styles.notifRowBorder]}>
                <Text style={styles.notifLabel}>{row.label}</Text>
                {/* Visual-only toggle (logic not changed) */}
                <View style={[styles.toggle, row.on && styles.toggleOn]}>
                  <View style={[styles.toggleKnob, row.on && styles.toggleKnobOn]} />
                </View>
              </View>
            ))}
          </GlassCard>
        </View>

        <View style={styles.footer}>
          <GlassButton
            label="Enable notifications"
            variant="primary"
            size="lg"
            onPress={finishOnboarding}
            disabled={saving}
            style={styles.cta}
          />
          <GlassButton
            label="Not now"
            variant="ghost"
            size="md"
            onPress={finishOnboarding}
            disabled={saving}
            style={styles.cta}
          />
          <View style={styles.progress}>
            {[0,1,2,3,4,5].map((i) => (
              <View key={i} style={[styles.dot, i === 5 && styles.dotActive]} />
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
  content: { flex: 1, alignItems: 'center', justifyContent: 'center', width: '100%' },
  logoWrap: {
    position: 'relative',
    marginBottom: 30,
  },
  badge: {
    position: 'absolute',
    top: -6,
    right: -6,
    minWidth: 28,
    height: 28,
    borderRadius: 14,
    paddingHorizontal: 8,
    backgroundColor: theme.colors.skyDeep,
    alignItems: 'center',
    justifyContent: 'center',
    ...theme.shadows.orb,
  },
  badgeText: { color: '#fff', fontWeight: '800', fontSize: 13 },
  title: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.8,
    color: theme.colors.ink,
    textAlign: 'center',
    marginBottom: 12,
    lineHeight: 32,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 21,
    color: theme.colors.inkSoft,
    textAlign: 'center',
    marginBottom: 24,
    maxWidth: 320,
  },
  card: { padding: 14, width: '100%' },
  notifRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 4,
  },
  notifRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.inkGhost,
  },
  notifLabel: { flex: 1, fontSize: 14, fontWeight: '600', color: theme.colors.ink },
  toggle: {
    width: 48,
    height: 28,
    borderRadius: 14,
    backgroundColor: theme.colors.inkGhost,
    borderWidth: 1.5,
    borderColor: theme.colors.glassBorder,
    position: 'relative',
    justifyContent: 'center',
  },
  toggleOn: {
    backgroundColor: theme.colors.glassTint,
    borderColor: theme.colors.glassBorder,
  },
  toggleKnob: {
    position: 'absolute',
    left: 3,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#fff',
    ...theme.shadows.card,
  },
  toggleKnobOn: { left: undefined, right: 3 },
  footer: { width: '100%', gap: 10 },
  cta: { width: '100%' },
  progress: { flexDirection: 'row', justifyContent: 'center', gap: 8, marginTop: 10 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: theme.colors.inkGhost },
  dotActive: { backgroundColor: theme.colors.skyDeep, width: 24 },
});
