import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Linking,
  Animated,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../theme';
import { Header, Card } from '../components/ui';
import { fadeInUp, fadeInUpStyle } from '../utils/animations';

function SectionHeader({ title }) {
  return <Text style={styles.sectionHeader}>{title}</Text>;
}

function ActionRow({ icon, label, onPress, destructive }) {
  return (
    <TouchableOpacity
      style={styles.actionRow}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
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
      <Ionicons name="chevron-forward" size={16} color={theme.colors.textFaint} />
    </TouchableOpacity>
  );
}

function RowDivider() {
  return <View style={styles.rowDivider} />;
}

const SAFETY_TIPS = [
  {
    icon: 'shield-checkmark-outline',
    text: 'Your location is never shared precisely with other users',
  },
  {
    icon: 'eye-off-outline',
    text: 'You can control your visibility at any time',
  },
  {
    icon: 'hand-left-outline',
    text: 'Block or report anyone who makes you uncomfortable',
  },
  {
    icon: 'chatbubble-ellipses-outline',
    text: 'Bubble conversations are temporary and expire automatically',
  },
];

export default function SafetyCenterScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const enterAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    fadeInUp(enterAnim).start();
  }, []);

  return (
    <View style={styles.screen}>
      <Header title="Safety Center" onBack={() => navigation.goBack()} />
      <Animated.ScrollView
        style={[styles.scroll, fadeInUpStyle(enterAnim)]}
        contentContainerStyle={{ paddingBottom: insets.bottom + 32 }}
      >
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
  screen: {
    flex: 1,
    backgroundColor: theme.colors.bgDeep,
  },
  scroll: {
    flex: 1,
    backgroundColor: theme.colors.bgDeep,
  },
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
  iconWrapDestructive: {
    backgroundColor: 'rgba(255,92,92,0.12)',
  },
  actionLabel: {
    flex: 1,
    fontSize: 16,
    color: theme.colors.textPrimary,
  },
  actionLabelDestructive: {
    color: theme.colors.error,
  },
  rowDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: theme.colors.borderSubtle,
    marginLeft: 62,
  },
  tipsContainer: {
    paddingHorizontal: 16,
    gap: 10,
  },
  tipCard: {
    padding: 14,
  },
  tipRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
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
  tipText: {
    flex: 1,
    fontSize: 14,
    color: theme.colors.textBody,
    lineHeight: 20,
    paddingTop: 6,
  },
});
