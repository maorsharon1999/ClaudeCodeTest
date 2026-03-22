import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
  StyleSheet,
  Platform,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { getProfile } from '../api/profile';
import { resolvePhotoUrl } from '../lib/photoUrl';
import { fadeInUp, fadeInUpStyle } from '../utils/animations';
import { Avatar, Button, Chip, IconButton } from '../components/ui';
import { theme } from '../theme';

export default function ProfileHomeScreen({ navigation }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const enterAnim = useRef(new Animated.Value(0)).current;

  useFocusEffect(
    useCallback(() => {
      loadProfile();
    }, [])
  );

  async function loadProfile() {
    try {
      const data = await getProfile();
      setProfile(data);
      fadeInUp(enterAnim).start();
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={theme.colors.brand} />
      </View>
    );
  }

  const photoUrl = profile?.photos?.[0] ? resolvePhotoUrl(profile.photos[0]) : null;
  const age = profile?.birth_date
    ? Math.floor((Date.now() - new Date(profile.birth_date).getTime()) / 31557600000)
    : null;

  return (
    <View style={styles.flex}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Profile</Text>
        <IconButton
          name="settings-outline"
          size={22}
          color={theme.colors.textSecondary}
          onPress={() => navigation.navigate('Settings')}
          bgColor="transparent"
          buttonSize={38}
        />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Animated.View style={fadeInUpStyle(enterAnim)}>
          {/* Hero photo */}
          <View style={styles.hero}>
            <Avatar
              uri={photoUrl}
              name={profile?.display_name}
              size={100}
              style={styles.avatar}
            />
            <Text style={styles.name}>
              {profile?.display_name || 'Anonymous'}
              {age ? `, ${age}` : ''}
            </Text>
            {profile?.bio ? (
              <Text style={styles.bio}>{profile.bio}</Text>
            ) : null}
          </View>

          {/* Interests */}
          {profile?.interests?.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Interests</Text>
              <View style={styles.chipRow}>
                {profile.interests.map((tag) => (
                  <Chip key={tag} label={tag} selected style={styles.chip} />
                ))}
              </View>
            </View>
          )}

          {/* Photos */}
          {profile?.photos?.length > 1 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Photos</Text>
              <View style={styles.photoRow}>
                {profile.photos.map((p, i) => (
                  <Image
                    key={i}
                    source={{ uri: resolvePhotoUrl(p) }}
                    style={styles.photoThumb}
                  />
                ))}
              </View>
            </View>
          )}

          {/* Actions */}
          <View style={styles.actions}>
            <Button
              title="Edit Profile"
              onPress={() => navigation.navigate('ProfileEdit')}
              variant="outline"
              icon={<Ionicons name="create-outline" size={18} color={theme.colors.textPrimary} />}
            />
            <Button
              title="Safety Center"
              onPress={() => navigation.navigate('SafetyCenter')}
              variant="ghost"
              icon={<Ionicons name="shield-checkmark-outline" size={18} color={theme.colors.textSecondary} />}
              style={styles.safetyBtn}
            />
          </View>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: theme.colors.bgDeep },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.bgDeep,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 56 : 16,
    paddingHorizontal: 20,
    paddingBottom: 12,
    backgroundColor: theme.colors.bgSurface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.borderDefault,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.textPrimary,
  },
  content: { padding: 24, paddingBottom: 48 },
  hero: { alignItems: 'center', marginBottom: 28 },
  avatar: { marginBottom: 16 },
  name: {
    ...theme.typography.titleLg,
    color: theme.colors.textPrimary,
    marginBottom: 6,
  },
  bio: {
    fontSize: 15,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  section: { marginBottom: 24 },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.textMuted,
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { marginBottom: 4 },
  photoRow: { flexDirection: 'row', gap: 8 },
  photoThumb: {
    width: 80,
    height: 80,
    borderRadius: theme.radii.md,
  },
  actions: { marginTop: 8, gap: 12 },
  safetyBtn: { marginTop: 4 },
});
