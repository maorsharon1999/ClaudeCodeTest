import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  Linking,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getProfile } from '../api/profile';
import { useAuth } from '../context/AuthContext';
import { theme } from '../theme';

const APP_VERSION = '1.0.0';
const PRIVACY_POLICY_URL = 'https://example.com/privacy';
const TERMS_URL = 'https://example.com/terms';
const FEEDBACK_EMAIL = 'feedback@bubble.app';

function SectionHeader({ title }) {
  return <Text style={styles.sectionHeader}>{title}</Text>;
}

function Row({ label, value, onPress, destructive }) {
  const content = (
    <View style={styles.row}>
      <Text style={[styles.rowLabel, destructive && styles.destructiveLabel]}>{label}</Text>
      {value != null && <Text style={styles.rowValue}>{value}</Text>}
      {onPress && !value && <Text style={styles.rowChevron}>›</Text>}
    </View>
  );
  if (!onPress) return content;
  return (
    <TouchableOpacity onPress={onPress} accessibilityRole="button">
      {content}
    </TouchableOpacity>
  );
}

function Divider() {
  return <View style={styles.divider} />;
}

export default function SettingsScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { signOut, deleteAccount } = useAuth();
  const [displayName, setDisplayName] = useState('');

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
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingBottom: insets.bottom + 32 }}
    >
      <SectionHeader title="PROFILE" />
      <View style={styles.section}>
        <Row label="Edit Profile" onPress={() => navigation.navigate('ProfileEdit')} />
        <Divider />
        <Row label="Name" value={displayName || '—'} />
      </View>

      <SectionHeader title="SAFETY" />
      <View style={styles.section}>
        <Row label="Blocked Users" onPress={() => navigation.navigate('BlockedUsers')} />
        <Divider />
        <Row
          label="Report a Problem"
          onPress={() => Linking.openURL(`mailto:support@bubble.app?subject=Problem%20Report`)}
        />
      </View>

      <SectionHeader title="ABOUT" />
      <View style={styles.section}>
        <Row label="Privacy Policy" onPress={() => Linking.openURL(PRIVACY_POLICY_URL)} />
        <Divider />
        <Row label="Terms of Service" onPress={() => Linking.openURL(TERMS_URL)} />
        <Divider />
        <Row
          label="Send Feedback"
          onPress={() => Linking.openURL(`mailto:${FEEDBACK_EMAIL}?subject=Feedback`)}
        />
        <Divider />
        <Row label="Version" value={APP_VERSION} />
      </View>

      <SectionHeader title="ACCOUNT" />
      <View style={styles.section}>
        <TouchableOpacity onPress={handleSignOut} accessibilityRole="button">
          <View style={styles.row}>
            <Text style={styles.actionLabel}>Sign Out</Text>
          </View>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={styles.deleteBtn}
        onPress={handleDeleteAccount}
        accessibilityRole="button"
        accessibilityLabel="Delete account"
      >
        <Text style={styles.deleteBtnText}>Delete Account</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.bgWash,
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
    backgroundColor: theme.colors.bgBase,
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
  rowChevron: {
    fontSize: 20,
    color: theme.colors.textFaint,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: theme.colors.borderSubtle,
    marginLeft: 20,
  },
  actionLabel: {
    fontSize: 16,
    color: theme.colors.brand,
  },
  deleteBtn: {
    marginHorizontal: 20,
    marginTop: 32,
    paddingVertical: 14,
    borderRadius: theme.radii.md,
    backgroundColor: '#FFF0F0',
    alignItems: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.error,
  },
  deleteBtnText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.error,
  },
});
