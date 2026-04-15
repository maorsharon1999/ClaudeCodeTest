import React, { useState } from 'react';
import { View, Text, ActivityIndicator, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { updateProfile } from '../../api/profile';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/ui';
import { theme } from '../../theme';

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
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.iconCircle}>
          <Ionicons name="notifications" size={40} color={theme.colors.accent} />
        </View>
        <Text style={styles.title}>Stay in the Loop</Text>
        <Text style={styles.subtitle}>
          Get notified when new bubbles pop up nearby{'\n'}
          or when someone joins your bubble.
        </Text>
      </View>

      <View style={styles.footer}>
        <Button
          title="Enable Notifications"
          onPress={finishOnboarding}
          loading={saving}
          size="lg"
        />
        <Button
          title="Maybe Later"
          onPress={finishOnboarding}
          variant="ghost"
          loading={saving}
          style={styles.skipBtn}
        />
        <View style={styles.progress}>
          {[0,1,2,3,4,5].map((i) => (
            <View key={i} style={[styles.dot, i === 5 && styles.dotActive]} />
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.bgDeep,
    padding: 24,
    paddingTop: Platform.OS === 'ios' ? 64 : 32,
    justifyContent: 'space-between',
  },
  content: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,108,71,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  title: { ...theme.typography.titleMd, color: theme.colors.textPrimary, textAlign: 'center', marginBottom: 12 },
  subtitle: { fontSize: 15, color: theme.colors.textSecondary, textAlign: 'center', lineHeight: 22 },
  footer: { paddingBottom: 32 },
  skipBtn: { marginTop: 8 },
  progress: { flexDirection: 'row', justifyContent: 'center', gap: 8, marginTop: 20 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: theme.colors.bgElevated },
  dotActive: { backgroundColor: theme.colors.brand, width: 24 },
});
