import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  Linking,
  Animated,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { getProfile } from '../api/profile';
import { useAuth } from '../context/AuthContext';
import { theme } from '../theme';
import { fadeInUp, fadeInUpStyle } from '../utils/animations';
import SkyBackground from '../components/visual/SkyBackground';
import BubbleField from '../components/visual/BubbleField';
import GlassCard from '../components/visual/GlassCard';
import ScreenHeader from '../components/visual/ScreenHeader';
import SectionLabel from '../components/visual/SectionLabel';

const APP_VERSION = '1.0.0';
const PRIVACY_POLICY_URL = 'https://example.com/privacy';
const TERMS_URL = 'https://example.com/terms';
const FEEDBACK_EMAIL = 'feedback@bubble.app';

function SectionHeader({ title }) {
  return <Text style={styles.sectionHeader}>{title}</Text>;
}

function Row({ label, value, onPress, destructive, icon }) {
  const content = (
    <View style={styles.row}>
      <View style={styles.rowLeft}>
        {icon ? (
          <Ionicons
            name={icon}
            size={18}
            color={destructive ? theme.colors.error : theme.colors.textSecondary}
            style={styles.rowIcon}
          />
        ) : null}
        <Text style={[styles.rowLabel, destructive && styles.destructiveLabel]}>{label}</Text>
      </View>
      {value != null && <Text style={styles.rowValue}>{value}</Text>}
      {onPress && value == null && (
        <Ionicons name="chevron-forward" size={16} color={theme.colors.textFaint} />
      )}
    </View>
  );
  if (!onPress) return content;
  return (
    <TouchableOpacity onPress={onPress} accessibilityRole="button">
      {content}
    </TouchableOpacity>
  );
}

function RowDivider() {
  return <View style={styles.divider} />;
}

export default function SettingsScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { signOut, deleteAccount } = useAuth();
  const [displayName, setDisplayName] = useState('');

  const enterAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    fadeInUp(enterAnim).start();
  }, []);

  useEffect(() => {
    getProfile()
      .then(p => { if (p?.display_name) setDisplayName(p.display_name); })
      .catch(() => {});
  }, []);

  function handleSignOut() {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: signOut },
    ]);
  }

  function handleDeleteAccount() {
    Alert.alert(
      'Delete Account',
      'This permanently deletes your profile and all data. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Account',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteAccount();
            } catch {
              Alert.alert('Error', 'Could not delete account. Please try again.');
            }
          },
        },
      ]
    );
  }

  return (
    <SkyBackground variant="sky">
      <BubbleField />
      <View style={styles.screen}>
        <ScreenHeader title="Settings" onBack={() => navigation.goBack()} />
        <Animated.ScrollView
          style={[styles.container, fadeInUpStyle(enterAnim)]}
          contentContainerStyle={{ paddingBottom: insets.bottom + 100, padding: theme.spacing.xl }}
        >
          {/* Profile card */}
          <GlassCard style={styles.profileCard}>
            <View style={styles.profileAvatar}>
              <Ionicons name="person" size={26} color={theme.colors.skyDeep} />
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>{displayName || '—'}</Text>
              <Text style={styles.profileSub}>Your profile</Text>
            </View>
            <TouchableOpacity onPress={() => navigation.navigate('ProfileEdit')}>
              <Ionicons name="chevron-forward" size={18} color={theme.colors.inkMuted} />
            </TouchableOpacity>
          </GlassCard>

          <SectionLabel style={styles.sectionLabel}>Profile</SectionLabel>
          <GlassCard style={styles.groupCard}>
            <Row
              label="Edit Profile"
              icon="person-outline"
              onPress={() => navigation.navigate('ProfileEdit')}
            />
            <RowDivider />
            <Row label="Name" icon="text-outline" value={displayName || '—'} />
          </GlassCard>

          <SectionLabel style={styles.sectionLabel}>Safety</SectionLabel>
          <GlassCard style={styles.groupCard}>
            <Row
              label="Blocked Users"
              icon="shield-outline"
              onPress={() => navigation.navigate('BlockedUsers')}
            />
            <RowDivider />
            <Row
              label="Report a Problem"
              icon="mail-outline"
              onPress={() => Linking.openURL(`mailto:support@bubble.app?subject=Problem%20Report`)}
            />
          </GlassCard>

          <SectionLabel style={styles.sectionLabel}>About</SectionLabel>
          <GlassCard style={styles.groupCard}>
            <Row
              label="Privacy Policy"
              icon="document-outline"
              onPress={() => Linking.openURL(PRIVACY_POLICY_URL)}
            />
            <RowDivider />
            <Row
              label="Terms of Service"
              icon="document-text-outline"
              onPress={() => Linking.openURL(TERMS_URL)}
            />
            <RowDivider />
            <Row
              label="Send Feedback"
              icon="chatbubble-outline"
              onPress={() => Linking.openURL(`mailto:${FEEDBACK_EMAIL}?subject=Feedback`)}
            />
            <RowDivider />
            <Row label="Version" icon="information-circle-outline" value={APP_VERSION} />
          </GlassCard>

          <SectionLabel style={styles.sectionLabel}>Account</SectionLabel>
          <GlassCard style={styles.groupCard}>
            <TouchableOpacity onPress={handleSignOut} accessibilityRole="button">
              <View style={styles.row}>
                <View style={styles.rowLeft}>
                  <Ionicons
                    name="log-out-outline"
                    size={18}
                    color={theme.colors.skyDeep}
                    style={styles.rowIcon}
                  />
                  <Text style={styles.actionLabel}>Sign Out</Text>
                </View>
              </View>
            </TouchableOpacity>
          </GlassCard>

          <TouchableOpacity
            style={styles.deleteBtn}
            onPress={handleDeleteAccount}
            accessibilityRole="button"
            accessibilityLabel="Delete account"
          >
            <Ionicons name="trash-outline" size={16} color={theme.colors.error} style={{ marginRight: 8 }} />
            <Text style={styles.deleteBtnText}>Delete Account</Text>
          </TouchableOpacity>
        </Animated.ScrollView>
      </View>
    </SkyBackground>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  container: { flex: 1 },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.xl,
    gap: theme.spacing.md,
  },
  profileAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: theme.colors.glassTint,
    borderWidth: 1.5,
    borderColor: theme.colors.glassBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileInfo: { flex: 1 },
  profileName: {
    fontSize: 17,
    fontWeight: '800',
    color: theme.colors.ink,
    marginBottom: 2,
  },
  profileSub: {
    fontSize: 13,
    color: theme.colors.inkMuted,
  },
  sectionLabel: { marginBottom: theme.spacing.sm },
  groupCard: {
    padding: 0,
    marginBottom: theme.spacing.xl,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    minHeight: 48,
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  rowIcon: { marginRight: 12 },
  rowLabel: { fontSize: 16, color: theme.colors.ink },
  destructiveLabel: { color: theme.colors.error },
  rowValue: { fontSize: 15, color: theme.colors.inkMuted, fontWeight: '600' },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: theme.colors.glassBorder,
    marginLeft: 46,
  },
  actionLabel: { fontSize: 16, color: theme.colors.skyDeep, fontWeight: '600' },
  deleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    paddingVertical: 14,
    borderRadius: theme.radii.lg,
    backgroundColor: 'rgba(198,40,40,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(198,40,40,0.22)',
  },
  deleteBtnText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.error,
  },
});
