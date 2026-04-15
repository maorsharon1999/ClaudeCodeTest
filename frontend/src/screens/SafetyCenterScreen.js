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
import { Header, Card } from '../components/ui';
import { fadeInUp, fadeInUpStyle } from '../utils/animations';
import { getVisibility, setVisibility } from '../api/profile';

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
    <View style={styles.screen}>
      <Header title="Safety Center" onBack={() => navigation.goBack()} />
      <Animated.ScrollView
        style={[styles.scroll, fadeInUpStyle(enterAnim)]}
        contentContainerStyle={{ paddingBottom: insets.bottom + 32 }}
      >
        {/* Ghost Mode */}
        <SectionHeader title="PRIVACY MODE" />
        <View style={styles.section}>
          <ActionRow
            icon="eye-off-outline"
            label="Ghost Mode"
            rightElement={
              <Switch
                value={ghostMode}
                onValueChange={toggleGhostMode}
                trackColor={{ false: theme.colors.bgElevated, true: theme.colors.brand }}
                thumbColor="#fff"
              />
            }
          />
          <View style={styles.ghostDesc}>
            <Text style={styles.ghostDescText}>
              When enabled, you become invisible to all users
            </Text>
          </View>
        </View>

        {/* Visibility Controls */}
        <SectionHeader title="VISIBILITY CONTROLS" />
        <View style={styles.section}>
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
        </View>

        <View style={[styles.section, { marginTop: 12 }]}>
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
        </View>

        {/* Safety Tools */}
        <SectionHeader title="YOUR SAFETY TOOLS" />
        <View style={styles.section}>
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
        </View>

        <SectionHeader title="SAFETY TIPS" />
        <View style={styles.tipsContainer}>
          {SAFETY_TIPS.map((tip, index) => (
            <Card key={index} style={styles.tipCard}>
              <View style={styles.tipRow}>
                <View style={styles.tipIconWrap}>
                  <Ionicons name={tip.icon} size={20} color={theme.colors.brand} />
                </View>
                <Text style={styles.tipText}>{tip.text}</Text>
              </View>
            </Card>
          ))}
        </View>

        <SectionHeader title="EMERGENCY" />
        <View style={styles.section}>
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
        </View>
      </Animated.ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.colors.bgDeep },
  scroll: { flex: 1, backgroundColor: theme.colors.bgDeep },
  sectionHeader: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.textMuted,
    letterSpacing: 0.5,
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 6,
  },
  section: {
    backgroundColor: theme.colors.bgSurface,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.borderDefault,
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
    backgroundColor: theme.colors.brandMuted,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  iconWrapDestructive: { backgroundColor: 'rgba(255,92,92,0.12)' },
  actionLabel: { flex: 1, fontSize: 16, color: theme.colors.textPrimary },
  actionLabelDestructive: { color: theme.colors.error },
  rowDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: theme.colors.borderSubtle,
    marginLeft: 62,
  },
  ghostDesc: { paddingHorizontal: 62, paddingBottom: 12 },
  ghostDescText: { fontSize: 13, color: theme.colors.textMuted, lineHeight: 18 },
  controlLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.textSecondary,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 4,
  },
  tipsContainer: { paddingHorizontal: 16, gap: 10 },
  tipCard: { padding: 14 },
  tipRow: { flexDirection: 'row', alignItems: 'flex-start' },
  tipIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: theme.colors.brandMuted,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    flexShrink: 0,
  },
  tipText: { flex: 1, fontSize: 14, color: theme.colors.textBody, lineHeight: 20, paddingTop: 6 },
});
