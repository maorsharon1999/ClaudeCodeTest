import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Animated,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getBubble, getBubbleMembers, joinBubble, reportBubble } from '../api/bubbles';
import { CATEGORY_ICONS } from '../constants/icons';
import { timeRemaining, formatDistance } from '../utils/timeFormatters';
import { fadeInUp, fadeInUpStyle } from '../utils/animations';
import { Avatar, Header, Button, ErrorState } from '../components/ui';
import SignalModal from '../components/SignalModal';
import { resolvePhotoUrl } from '../lib/photoUrl';
import { theme } from '../theme';
import SkyBackground from '../components/visual/SkyBackground';
import BubbleField from '../components/visual/BubbleField';

export default function BubbleDetailsScreen({ route, navigation }) {
  const { bubbleId } = route.params;
  const [bubble, setBubble] = useState(null);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState(null);
  const [signalUser, setSignalUser] = useState(null);

  const enterAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    loadData();
  }, [bubbleId]);

  async function loadData() {
    setLoading(true);
    setError(null);
    try {
      const [b, mems] = await Promise.all([
        getBubble(bubbleId),
        getBubbleMembers(bubbleId),
      ]);
      setBubble(b);
      setMembers(mems);
      fadeInUp(enterAnim).start();
    } catch {
      setError('Could not load bubble details.');
    } finally {
      setLoading(false);
    }
  }

  async function handleJoin() {
    if (joining) return;
    setJoining(true);
    try {
      await joinBubble(bubbleId);
      navigation.navigate('BubbleChat', {
        bubbleId,
        bubbleTitle: bubble?.title,
      });
    } catch {
      Alert.alert('Error', 'Could not join bubble. Please try again.');
    } finally {
      setJoining(false);
    }
  }

  function handleReport() {
    Alert.alert('Report Bubble', 'Report this bubble for inappropriate content?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Report',
        style: 'destructive',
        onPress: async () => {
          try {
            await reportBubble(bubbleId, 'Reported from details');
            Alert.alert('Reported', 'Thank you. We will review this bubble.');
          } catch { /* ignore */ }
        },
      },
    ]);
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={theme.colors.skyDeep} />
      </View>
    );
  }

  if (error || !bubble) {
    return (
      <View style={styles.center}>
        <Header title="Bubble Details" onBack={() => navigation.goBack()} />
        <ErrorState message={error || 'Bubble not found.'} onRetry={loadData} />
      </View>
    );
  }

  const iconName = CATEGORY_ICONS[bubble.category] || CATEGORY_ICONS.Other;
  const isExpired = new Date(bubble.expires_at) < new Date();

  return (
    <SkyBackground variant="dawn">
      <BubbleField seed={25} />
      <View style={styles.flex}>
        <Header title="Bubble Details" onBack={() => navigation.goBack()} />
        <ScrollView contentContainerStyle={styles.content}>
          <Animated.View style={fadeInUpStyle(enterAnim)}>
            {/* Hero */}
            <View style={styles.hero}>
              <View style={styles.heroIcon}>
                <Ionicons name={iconName} size={36} color={theme.colors.skyDeep} />
              </View>
              <Text style={styles.heroTitle}>{bubble.title}</Text>
              <View style={styles.heroBadge}>
                <Text style={styles.heroBadgeText}>{bubble.category}</Text>
              </View>
            </View>

            {/* Stats row */}
            <View style={styles.statsRow}>
              <View style={styles.stat}>
                <Ionicons name="people-outline" size={18} color={theme.colors.inkMuted} />
                <Text style={styles.statText}>
                  {bubble.member_count <= 2 ? 'A few' : bubble.member_count} people
                </Text>
              </View>
              <View style={styles.stat}>
                <Ionicons name="time-outline" size={18} color={theme.colors.inkMuted} />
                <Text style={styles.statText}>{timeRemaining(bubble.expires_at)}</Text>
              </View>
              {bubble.distance_m != null && (
                <View style={styles.stat}>
                  <Ionicons name="location-outline" size={18} color={theme.colors.inkMuted} />
                  <Text style={styles.statText}>{formatDistance(bubble.distance_m)}</Text>
                </View>
              )}
            </View>

            {/* Description */}
            {bubble.description ? (
              <Text style={styles.description}>{bubble.description}</Text>
            ) : null}

            {/* Members */}
            {members.length > 0 && (
              <View style={styles.membersSection}>
                <Text style={styles.sectionTitle}>Members</Text>
                {members.slice(0, 8).map((m) => (
                  <TouchableOpacity
                    key={m.user_id}
                    style={styles.memberRow}
                    onPress={() => setSignalUser({
                      id: m.user_id,
                      display_name: m.display_name,
                      photos: m.photos,
                    })}
                  >
                    <Avatar
                      uri={m.photos?.[0] ? resolvePhotoUrl(m.photos[0]) : null}
                      name={m.display_name}
                      size={40}
                      style={styles.memberAvatar}
                    />
                    <Text style={styles.memberName}>{m.display_name || 'Someone'}</Text>
                    <View style={styles.signalIcon}>
                      <Ionicons name="flash-outline" size={16} color={theme.colors.skyDeep} />
                    </View>
                  </TouchableOpacity>
                ))}
                {members.length > 8 && (
                  <View style={styles.moreMembers}>
                    <Text style={styles.moreMembersText}>+{members.length - 8} more</Text>
                  </View>
                )}
              </View>
            )}

            <SignalModal
              visible={!!signalUser}
              user={signalUser}
              onClose={() => setSignalUser(null)}
              onSuccess={() => setSignalUser(null)}
            />

            {/* Actions */}
            <View style={styles.actions}>
              {!isExpired && (
                <Button
                  title="Join Bubble"
                  onPress={handleJoin}
                  loading={joining}
                  size="lg"
                  style={styles.joinBtn}
                />
              )}
              {isExpired && (
                <View style={styles.expiredBanner}>
                  <Ionicons name="time-outline" size={20} color={theme.colors.inkMuted} />
                  <Text style={styles.expiredText}>This bubble has ended</Text>
                </View>
              )}
              <TouchableOpacity style={styles.reportBtn} onPress={handleReport}>
                <Ionicons name="flag-outline" size={16} color={theme.colors.inkMuted} />
                <Text style={styles.reportText}>Report</Text>
              </TouchableOpacity>
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
  content: { padding: 24, paddingBottom: 100 },
  hero: { alignItems: 'center', marginBottom: 24 },
  heroIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(93,144,191,0.12)',
    borderWidth: 1.5,
    borderColor: theme.colors.glassBorder,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    ...theme.shadows.orb,
  },
  heroTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: theme.colors.ink,
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  heroBadge: {
    backgroundColor: 'rgba(93,144,191,0.12)',
    borderRadius: theme.radii.pill,
    borderWidth: 1,
    borderColor: theme.colors.skyDeep,
    paddingHorizontal: 14,
    paddingVertical: 4,
  },
  heroBadgeText: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.skyDeep,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
    marginBottom: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: theme.colors.glassBorder,
  },
  stat: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  statText: { fontSize: 13, color: theme.colors.inkMuted },
  description: {
    fontSize: 15,
    color: theme.colors.inkSoft,
    lineHeight: 22,
    marginBottom: 24,
  },
  membersSection: {
    backgroundColor: 'rgba(255,255,255,0.62)',
    borderRadius: theme.radii.xl,
    borderWidth: 1.5,
    borderColor: theme.colors.glassBorder,
    padding: 16,
    marginBottom: 24,
    ...theme.shadows.card,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.inkMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 12,
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  memberAvatar: { marginRight: 12 },
  memberName: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    color: theme.colors.ink,
  },
  signalIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(93,144,191,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  moreMembers: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  moreMembersText: { fontSize: 13, color: theme.colors.inkMuted },
  actions: { marginTop: 8 },
  joinBtn: { marginBottom: 16 },
  expiredBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 16,
    backgroundColor: 'rgba(255,255,255,0.55)',
    borderRadius: theme.radii.xl,
    borderWidth: 1,
    borderColor: theme.colors.glassBorder,
    marginBottom: 16,
  },
  expiredText: { fontSize: 15, color: theme.colors.inkMuted },
  reportBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    padding: 12,
  },
  reportText: { fontSize: 14, color: theme.colors.inkMuted },
});
