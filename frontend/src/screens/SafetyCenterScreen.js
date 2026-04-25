import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Switch,
  StyleSheet,
  Linking,
  Animated,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../theme';
import { fadeInUp, fadeInUpStyle } from '../utils/animations';
import { getVisibility, setVisibility } from '../api/profile';
import SkyBackground from '../components/visual/SkyBackground';
import BubbleField from '../components/visual/BubbleField';
import GlassCard from '../components/visual/GlassCard';
import ScreenHeader from '../components/visual/ScreenHeader';
import SectionLabel from '../components/visual/SectionLabel';

function SectionHeader({ title }) {
  return <Text style={styles.sectionHeader}>{title}</Text>;
}

function ActionRow({ icon, label, onPress, destructive, rightElement }) {
  return (
    <TouchableOpacity
      style={styles.actionRow}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      disabled={!onPress}
    >
      <View style={[styles.iconWrap, destructive && styles.iconWrapDestructive]}>
        <Ionicons
          name={icon}
          size={18}
          color={destructive ? theme.colors.error : theme.colors.brand}
        />
      </View>
      <Text style={[styles.actionLabel, destructive && styles.actionLabelDestructive]}>
        {label}
      </Text>
      {rightElement || <Ionicons name="chevron-forward" size={16} color={theme.colors.textFaint} />}
    </TouchableOpacity>
  );
}

function SelectableRow({ icon, label, selected, onPress }) {
  return (
    <TouchableOpacity style={styles.actionRow} onPress={onPress}>
      <View style={styles.iconWrap}>
        <Ionicons name={icon} size={18} color={theme.colors.brand} />
      </View>
      <Text style={styles.actionLabel}>{label}</Text>
      {selected && <Ionicons name="checkmark-circle" size={20} color={theme.colors.brand} />}
    </TouchableOpacity>
  );
}

function RowDivider() {
  return <View style={styles.rowDivider} />;
}

const SAFETY_TIPS = [
  { icon: 'shield-checkmark-outline', text: 'Your location is never shared precisely with other users' },
  { icon: 'eye-off-outline', text: 'You can control your visibility at any time' },
  { icon: 'hand-left-outline', text: 'Block or report anyone who makes you uncomfortable' },
  { icon: 'chatbubble-ellipses-outline', text: 'Bubble conversations are temporary and expire automatically' },
];

export default function SafetyCenterScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const enterAnim = useRef(new Animated.Value(0)).current;

  const [ghostMode, setGhostMode] = useState(false);
  const [whoCanSee, setWhoCanSee] = useState('everyone');
  const [whoCanSignal, setWhoCanSignal] = useState('everyone');

  useEffect(() => {
    fadeInUp(enterAnim).start();
    loadVisibility();
  }, []);

  async function loadVisibility() {
    try {
      const vis = await getVisibility();
      if (vis?.state === 'invisible') setGhostMode(true);
    } catch { /* ignore */ }
  }

  async function toggleGhostMode(value) {
    setGhostMode(value);
    try {
      await setVisibility(value ? 'invisible' : 'visible');
    } catch { /* ignore */ }
  }

  return (
    <SkyBackground variant="sky">
      <BubbleField />
      <View style={styles.screen}>
        <ScreenHeader title="Safety Center" onBack={() => navigation.goBack()} />
        <Animated.ScrollView
          style={[styles.scroll, fadeInUpStyle(enterAnim)]}
          contentContainerStyle={{ paddingBottom: insets.bottom + 100, padding: theme.spacing.xl }}
        >
          {/* Hero card */}
          <GlassCard style={styles.heroCard}>
            <View style={styles.heroIcon}>
              <Ionicons name="shield-checkmark" size={34} color={theme.colors.skyDeep} />
            </View>
            <Text style={styles.heroTitle}>You're in control.</Text>
            <Text style={styles.heroSub}>Everything you share is fuzzed, time-limited, and never reaches people outside your bubble.</Text>
          </GlassCard>

          {/* Ghost Mode */}
          <SectionLabel style={styles.sectionLabel}>Privacy Mode</SectionLabel>
          <GlassCard style={styles.groupCard}>
            <ActionRow
              icon="eye-off-outline"
              label="Ghost Mode"
              rightElement={
                <Switch
                  value={ghostMode}
                  onValueChange={toggleGhostMode}
                  trackColor={{ false: theme.colors.glassTint, true: theme.colors.skyDeep }}
                  thumbColor="#fff"
                />
              }
            />
            <View style={styles.ghostDesc}>
              <Text style={styles.ghostDescText}>
                When enabled, you become invisible to all users
              </Text>
            </View>
          </GlassCard>

          {/* Visibility Controls */}
          <SectionLabel style={styles.sectionLabel}>Visibility Controls</SectionLabel>
          <GlassCard style={styles.groupCard}>
            <Text style={styles.controlLabel}>Who can see me</Text>
            <SelectableRow
              icon="globe-outline"
              label="Everyone"
              selected={whoCanSee === 'everyone'}
              onPress={() => setWhoCanSee('everyone')}
            />
            <RowDivider />
            <SelectableRow
              icon="people-outline"
              label="Only people I've matched with"
              selected={whoCanSee === 'matches'}
              onPress={() => setWhoCanSee('matches')}
            />
          </GlassCard>

          <GlassCard style={[styles.groupCard, { marginTop: 0 }]}>
            <Text style={styles.controlLabel}>Who can signal me</Text>
            <SelectableRow
              icon="flash-outline"
              label="Everyone"
              selected={whoCanSignal === 'everyone'}
              onPress={() => setWhoCanSignal('everyone')}
            />
            <RowDivider />
            <SelectableRow
              icon="close-circle-outline"
              label="No one"
              selected={whoCanSignal === 'noone'}
              onPress={() => setWhoCanSignal('noone')}
            />
          </GlassCard>

          {/* Safety Tools */}
          <SectionLabel style={styles.sectionLabel}>Your Safety Tools</SectionLabel>
          <GlassCard style={styles.groupCard}>
            <ActionRow
              icon="ban-outline"
              label="Blocked Users"
              onPress={() => navigation.navigate('BlockedUsers')}
            />
            <RowDivider />
            <ActionRow
              icon="flag-outline"
              label="Report a Problem"
              onPress={() => Linking.openURL('mailto:support@bubble.app?subject=Problem%20Report')}
            />
          </GlassCard>

          <SectionLabel style={styles.sectionLabel}>Safety Tips</SectionLabel>
          <View style={styles.tipsContainer}>
            {SAFETY_TIPS.map((tip, index) => (
              <GlassCard key={index} style={styles.tipCard}>
                <View style={styles.tipRow}>
                  <View style={styles.tipIconWrap}>
                    <Ionicons name={tip.icon} size={20} color={theme.colors.skyDeep} />
                  </View>
                  <Text style={styles.tipText}>{tip.text}</Text>
                </View>
              </GlassCard>
            ))}
          </View>

          <SectionLabel style={styles.sectionLabel}>Emergency</SectionLabel>
          <GlassCard style={styles.groupCard}>
            <ActionRow
              icon="mail-outline"
              label="Contact Support"
              onPress={() => Linking.openURL('mailto:support@bubble.app?subject=Support%20Request')}
            />
            <RowDivider />
            <ActionRow
              icon="call-outline"
              label="Call Emergency Services"
              onPress={() => Linking.openURL('tel:911')}
              destructive
            />
          </GlassCard>
        </Animated.ScrollView>
      </View>
    </SkyBackground>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  scroll: { flex: 1 },
  heroCard: {
    padding: theme.spacing.xl,
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
  },
  heroIcon: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: theme.colors.glassTint,
    borderWidth: 1.5,
    borderColor: theme.colors.glassBorder,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.md,
    ...theme.shadows.orb,
  },
  heroTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: theme.colors.ink,
    marginBottom: 6,
    textAlign: 'center',
  },
  heroSub: {
    fontSize: 13,
    color: theme.colors.inkMuted,
    textAlign: 'center',
    lineHeight: 19,
  },
  sectionLabel: { marginBottom: theme.spacing.sm },
  groupCard: {
    padding: 0,
    marginBottom: theme.spacing.xl,
    overflow: 'hidden',
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    minHeight: 52,
  },
  iconWrap: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: 'rgba(93,144,191,0.10)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  iconWrapDestructive: { backgroundColor: 'rgba(198,40,40,0.10)' },
  actionLabel: { flex: 1, fontSize: 16, color: theme.colors.ink },
  actionLabelDestructive: { color: theme.colors.error },
  rowDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: theme.colors.glassBorder,
    marginLeft: 62,
  },
  ghostDesc: { paddingHorizontal: 62, paddingBottom: 12 },
  ghostDescText: { fontSize: 13, color: theme.colors.inkMuted, lineHeight: 18 },
  controlLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.colors.inkMuted,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  tipsContainer: { gap: 10, marginBottom: theme.spacing.xl },
  tipCard: { padding: 14 },
  tipRow: { flexDirection: 'row', alignItems: 'flex-start' },
  tipIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: 'rgba(93,144,191,0.10)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    flexShrink: 0,
  },
  tipText: { flex: 1, fontSize: 14, color: theme.colors.inkSoft, lineHeight: 20, paddingTop: 6 },
});
