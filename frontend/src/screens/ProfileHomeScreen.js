import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  FlatList,
  Image,
  TouchableOpacity,
  StyleSheet,
  Platform,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { getProfile, getVisibility } from '../api/profile';
import { getNearbyBubbles } from '../api/bubbles';
import { resolvePhotoUrl } from '../lib/photoUrl';
import { fadeInUp, fadeInUpStyle } from '../utils/animations';
import { CATEGORY_ICONS } from '../constants/icons';
import { Avatar, Button, Chip, Card, IconButton } from '../components/ui';
import { theme } from '../theme';
import SkyBackground from '../components/visual/SkyBackground';
import BubbleField from '../components/visual/BubbleField';

export default function ProfileHomeScreen({ navigation }) {
  const [profile, setProfile] = useState(null);
  const [visibility, setVisibilityState] = useState(null);
  const [activeBubbles, setActiveBubbles] = useState([]);
  const [loading, setLoading] = useState(true);
  const enterAnim = useRef(new Animated.Value(0)).current;

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  async function loadData() {
    try {
      const [data, vis] = await Promise.all([getProfile(), getVisibility().catch(() => null)]);
      setProfile(data);
      setVisibilityState(vis);

      // Load active bubbles nearby
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
          const bubbles = await getNearbyBubbles(loc.coords.latitude, loc.coords.longitude);
          setActiveBubbles(bubbles || []);
        }
      } catch { /* ignore */ }

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
  const isVisible = visibility?.state === 'visible';
  const memberSince = profile?.created_at
    ? new Date(profile.created_at).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })
    : null;

  return (
    <SkyBackground variant="dawn">
      <BubbleField seed={3} />
      <View style={styles.flex}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Profile</Text>
          <View style={styles.headerActions}>
            <IconButton
              name="notifications-outline"
              size={20}
              color={theme.colors.inkMuted}
              onPress={() => navigation.navigate('NotificationsCenter')}
              bgColor="rgba(255,255,255,0.55)"
              buttonSize={38}
            />
            <IconButton
              name="settings-outline"
              size={22}
              color={theme.colors.inkMuted}
              onPress={() => navigation.navigate('Settings')}
              bgColor="rgba(255,255,255,0.55)"
              buttonSize={38}
            />
          </View>
        </View>

        <ScrollView contentContainerStyle={styles.content}>
          <Animated.View style={fadeInUpStyle(enterAnim)}>
            {/* Hero photo */}
            <View style={styles.hero}>
              <View style={styles.avatarWrap}>
                <Avatar
                  uri={photoUrl}
                  name={profile?.display_name}
                  size={100}
                  style={styles.avatar}
                />
                <View style={[styles.visibilityDot, isVisible ? styles.dotOnline : styles.dotOffline]} />
              </View>
              <Text style={styles.name}>
                {profile?.display_name || 'Anonymous'}
                {age ? `, ${age}` : ''}
              </Text>
              {profile?.bio ? (
                <Text style={styles.bio}>{profile.bio}</Text>
              ) : null}
            </View>

            {/* Stats row */}
            <View style={styles.statsRow}>
              {memberSince && (
                <View style={styles.stat}>
                  <Ionicons name="calendar-outline" size={16} color={theme.colors.inkMuted} />
                  <Text style={styles.statText}>Since {memberSince}</Text>
                </View>
              )}
              <View style={styles.stat}>
                <Ionicons name="radio-outline" size={16} color={theme.colors.inkMuted} />
                <Text style={styles.statText}>{activeBubbles.length} bubbles nearby</Text>
              </View>
              <View style={styles.stat}>
                <View style={[styles.statusIndicator, isVisible ? styles.statusOnline : styles.statusOffline]} />
                <Text style={styles.statText}>{isVisible ? 'Visible' : 'Invisible'}</Text>
              </View>
            </View>

            {/* Active Bubbles */}
            {activeBubbles.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Active Nearby</Text>
                <FlatList
                  horizontal
                  data={activeBubbles.slice(0, 8)}
                  keyExtractor={(item) => item.id}
                  showsHorizontalScrollIndicator={false}
                  renderItem={({ item }) => {
                    const iconName = CATEGORY_ICONS[item.category] || CATEGORY_ICONS.Other;
                    return (
                      <TouchableOpacity
                        onPress={() => navigation.navigate('RadarStack', {
                          screen: 'BubbleChat',
                          params: { bubbleId: item.id, bubbleTitle: item.title },
                        })}
                      >
                        <View style={styles.bubbleCard}>
                          <Ionicons name={iconName} size={20} color={theme.colors.skyDeep} />
                          <Text style={styles.bubbleCardTitle} numberOfLines={1}>{item.title}</Text>
                        </View>
                      </TouchableOpacity>
                    );
                  }}
                />
              </View>
            )}

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
                icon={<Ionicons name="create-outline" size={18} color={theme.colors.ink} />}
              />
              <Button
                title="Safety Center"
                onPress={() => navigation.navigate('SafetyCenter')}
                variant="ghost"
                icon={<Ionicons name="shield-checkmark-outline" size={18} color={theme.colors.inkSoft} />}
                style={styles.safetyBtn}
              />
            </View>
          </Animated.View>
        </ScrollView>
      </View>
    </SkyBackground>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
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
    paddingTop: Platform.OS === 'ios' ? 56 : 20,
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: theme.colors.ink,
    letterSpacing: -1,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 6,
  },
  content: { padding: 22, paddingBottom: 100 },
  hero: { alignItems: 'center', marginBottom: 20 },
  avatarWrap: { position: 'relative', marginBottom: 16 },
  avatar: {},
  visibilityDot: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 3,
    borderColor: theme.colors.bgDeep,
  },
  dotOnline: { backgroundColor: theme.colors.live },
  dotOffline: { backgroundColor: theme.colors.inkFaint },
  name: {
    fontSize: 26,
    fontWeight: '800',
    color: theme.colors.ink,
    letterSpacing: -0.5,
    marginBottom: 6,
  },
  bio: {
    fontSize: 15,
    color: theme.colors.inkSoft,
    textAlign: 'center',
    lineHeight: 22,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: 16,
    marginBottom: 24,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: theme.colors.glassBorder,
  },
  stat: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  statText: { fontSize: 12, color: theme.colors.inkMuted },
  statusIndicator: { width: 8, height: 8, borderRadius: 4 },
  statusOnline: { backgroundColor: theme.colors.live },
  statusOffline: { backgroundColor: theme.colors.inkFaint },
  section: { marginBottom: 24 },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.inkMuted,
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  bubbleCard: {
    width: 130,
    marginRight: 10,
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 10,
    gap: 8,
    backgroundColor: 'rgba(255,255,255,0.65)',
    borderRadius: theme.radii.lg,
    borderWidth: 1.5,
    borderColor: theme.colors.glassBorder,
    ...theme.shadows.card,
  },
  bubbleCardTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.ink,
    textAlign: 'center',
  },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { marginBottom: 4 },
  photoRow: { flexDirection: 'row', gap: 8 },
  photoThumb: {
    width: 80,
    height: 80,
    borderRadius: theme.radii.md,
    borderWidth: 1,
    borderColor: theme.colors.glassBorder,
  },
  actions: { marginTop: 8, gap: 12 },
  safetyBtn: { marginTop: 4 },
});
