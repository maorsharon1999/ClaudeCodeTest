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
import { Header } from '../components/ui';
import { fadeInUp, fadeInUpStyle } from '../utils/animations';

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
    <View style={styles.screen}>
      <Header title="Settings" onBack={() => navigation.goBack()} />
      <Animated.ScrollView
        style={[styles.container, fadeInUpStyle(enterAnim)]}
        contentContainerStyle={{ paddingBottom: insets.bottom + 32 }}
      >
        <SectionHeader title="PROFILE" />
        <View style={styles.section}>
          <Row
            label="Edit Profile"
            icon="person-outline"
            onPress={() => navigation.navigate('ProfileEdit')}
          />
          <RowDivider />
          <Row label="Name" icon="text-outline" value={displayName || '—'} />
        </View>

        <SectionHeader title="SAFETY" />
        <View style={styles.section}>
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
        </View>

        <SectionHeader title="ABOUT" />
        <View style={styles.section}>
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
        </View>

        <SectionHeader title="ACCOUNT" />
        <View style={styles.section}>
          <TouchableOpacity onPress={handleSignOut} accessibilityRole="button">
            <View style={styles.row}>
              <View style={styles.rowLeft}>
                <Ionicons
                  name="log-out-outline"
                  size={18}
                  color={theme.colors.brand}
                  style={styles.rowIcon}
                />
                <Text style={styles.actionLabel}>Sign Out</Text>
              </View>
            </View>
          </TouchableOpacity>
        </View>

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
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: theme.colors.bgDeep,
  },
  container: {
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
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    minHeight: 48,
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  rowIcon: {
    marginRight: 12,
  },
  rowLabel: {
    fontSize: 16,
    color: theme.colors.textPrimary,
  },
  destructiveLabel: {
    color: theme.colors.error,
  },
  rowValue: {
    fontSize: 16,
    color: theme.colors.textMuted,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: theme.colors.borderSubtle,
    marginLeft: 50,
  },
  actionLabel: {
    fontSize: 16,
    color: theme.colors.brand,
  },
  deleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 20,
    marginTop: 32,
    paddingVertical: 14,
    borderRadius: theme.radii.md,
    backgroundColor: 'rgba(255,92,92,0.1)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.error,
  },
  deleteBtnText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.error,
  },
});
