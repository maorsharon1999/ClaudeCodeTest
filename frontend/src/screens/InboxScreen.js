import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Animated,
  Alert,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { getNearbyBubbles } from '../api/bubbles';
import { getIncomingSignals, getOutgoingSignals, respondSignal } from '../api/signals';
import { getThreads } from '../api/chat';
import { CATEGORY_ICONS } from '../constants/icons';
import { timeRemaining } from '../utils/timeFormatters';
import { Card, Avatar, EmptyState, Badge, Button } from '../components/ui';
import { SkeletonCard } from '../components/ui/SkeletonLoader';
import { resolvePhotoUrl } from '../lib/photoUrl';
import { theme } from '../theme';

const TABS = ['Active', 'Signals', 'DMs', 'Updates'];

export default function InboxScreen({ navigation }) {
  const [activeTab, setActiveTab] = useState(0);
  const [bubbles, setBubbles] = useState([]);
  const [loading, setLoading] = useState(true);

  // Signals state
  const [incoming, setIncoming] = useState([]);
  const [outgoing, setOutgoing] = useState([]);
  const [signalsLoading, setSignalsLoading] = useState(false);

  // DMs state
  const [threads, setThreads] = useState([]);
  const [threadsLoading, setThreadsLoading] = useState(false);

  // Updates state (placeholder)
  const [updates] = useState([]);

  const enterAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(enterAnim, { toValue: 1, duration: 320, useNativeDriver: true }).start();
  }, []);

  const loadBubbles = useCallback(async () => {
    setLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const result = await getNearbyBubbles(loc.coords.latitude, loc.coords.longitude);
      setBubbles(result || []);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  const loadSignals = useCallback(async () => {
    setSignalsLoading(true);
    try {
      const [inc, out] = await Promise.all([getIncomingSignals(), getOutgoingSignals()]);
      setIncoming(inc || []);
      setOutgoing(out || []);
    } catch {
      // ignore
    } finally {
      setSignalsLoading(false);
    }
  }, []);

  const loadThreads = useCallback(async () => {
    setThreadsLoading(true);
    try {
      const result = await getThreads();
      setThreads(result || []);
    } catch {
      // ignore
    } finally {
      setThreadsLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (activeTab === 0) loadBubbles();
      else if (activeTab === 1) loadSignals();
      else if (activeTab === 2) loadThreads();
    }, [activeTab, loadBubbles, loadSignals, loadThreads])
  );

  async function handleAcceptSignal(signalId) {
    try {
      await respondSignal(signalId, 'accept');
      Alert.alert('Matched!', 'You can now start chatting.');
      loadSignals();
    } catch {
      Alert.alert('Error', 'Could not accept signal.');
    }
  }

  async function handleDeclineSignal(signalId) {
    try {
      await respondSignal(signalId, 'decline');
      loadSignals();
    } catch {
      // ignore
    }
  }

  // --- Tab 0: Active Bubbles ---
  function renderBubble({ item }) {
    const iconName = CATEGORY_ICONS[item.category] || CATEGORY_ICONS.Other;
    return (
      <TouchableOpacity
        onPress={() => navigation.navigate('BubbleChat', {
          bubbleId: item.id,
          bubbleTitle: item.title,
        })}
        accessibilityRole="button"
      >
        <Card style={styles.card}>
          <View style={styles.cardTop}>
            <View style={styles.iconCircle}>
              <Ionicons name={iconName} size={20} color={theme.colors.brand} />
            </View>
            <View style={styles.cardInfo}>
              <Text style={styles.cardTitle} numberOfLines={1}>{item.title}</Text>
              <View style={styles.cardMeta}>
                <Badge count={item.member_count > 2 ? item.member_count : null} small />
                <Text style={styles.metaText}>
                  {item.member_count <= 2 ? 'A few' : item.member_count} people
                </Text>
              </View>
            </View>
            <Text style={styles.cardTime}>{timeRemaining(item.expires_at)}</Text>
          </View>
          {item.description ? (
            <Text style={styles.cardDesc} numberOfLines={1}>{item.description}</Text>
          ) : null}
        </Card>
      </TouchableOpacity>
    );
  }

  // --- Tab 1: Signals ---
  function renderSignalsTab() {
    if (signalsLoading) {
      return (
        <View style={styles.skeletonList}>
          {[0,1,2].map((i) => <SkeletonCard key={i} />)}
        </View>
      );
    }

    if (incoming.length === 0 && outgoing.length === 0) {
      return (
        <View style={styles.emptyTab}>
          <EmptyState
            icon="flash-outline"
            title="No signals yet"
            subtitle="Signals from nearby bubbles will appear here"
          />
        </View>
      );
    }

    return (
      <FlatList
        data={[
          ...(incoming.length > 0 ? [{ type: 'header', title: 'Incoming' }] : []),
          ...incoming.map(s => ({ ...s, section: 'incoming' })),
          ...(outgoing.length > 0 ? [{ type: 'header', title: 'Sent' }] : []),
          ...outgoing.map(s => ({ ...s, section: 'outgoing' })),
        ]}
        keyExtractor={(item, i) => item.id || `header-${i}`}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => {
          if (item.type === 'header') {
            return <Text style={styles.sectionHeader}>{item.title}</Text>;
          }
          const photo = item.sender_photos?.[0] || item.recipient_photos?.[0];
          const name = item.sender_display_name || item.recipient_display_name || 'Someone';
          const isIncoming = item.section === 'incoming';

          return (
            <Card style={styles.card}>
              <View style={styles.cardTop}>
                <Avatar
                  uri={photo ? resolvePhotoUrl(photo) : null}
                  name={name}
                  size={40}
                  style={{ marginRight: 12 }}
                />
                <View style={styles.cardInfo}>
                  <Text style={styles.cardTitle} numberOfLines={1}>{name}</Text>
                  <Text style={styles.metaText}>
                    {isIncoming ? 'Sent you a signal' : `Status: ${item.status || 'pending'}`}
                  </Text>
                </View>
                {isIncoming && item.status === 'pending' && (
                  <View style={styles.signalActions}>
                    <TouchableOpacity
                      style={styles.acceptBtn}
                      onPress={() => handleAcceptSignal(item.id)}
                    >
                      <Ionicons name="checkmark" size={18} color="#fff" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.declineBtn}
                      onPress={() => handleDeclineSignal(item.id)}
                    >
                      <Ionicons name="close" size={18} color={theme.colors.textMuted} />
                    </TouchableOpacity>
                  </View>
                )}
                {!isIncoming && (
                  <View style={[styles.statusBadge, item.status === 'accepted' && styles.statusAccepted]}>
                    <Text style={[styles.statusText, item.status === 'accepted' && styles.statusTextAccepted]}>
                      {item.status || 'pending'}
                    </Text>
                  </View>
                )}
              </View>
            </Card>
          );
        }}
      />
    );
  }

  // --- Tab 2: DMs ---
  function renderDMsTab() {
    if (threadsLoading) {
      return (
        <View style={styles.skeletonList}>
          {[0,1,2].map((i) => <SkeletonCard key={i} />)}
        </View>
      );
    }

    if (threads.length === 0) {
      return (
        <View style={styles.emptyTab}>
          <EmptyState
            icon="chatbubble-outline"
            title="No messages yet"
            subtitle="Match with someone to start a conversation"
          />
        </View>
      );
    }

    return (
      <FlatList
        data={threads}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => {
          const otherUser = item.other_user || {};
          const photo = otherUser.photos?.[0];
          return (
            <TouchableOpacity
              onPress={() => navigation.navigate('DirectChat', {
                threadId: item.id,
                userName: otherUser.display_name || 'Someone',
              })}
            >
              <Card style={styles.card}>
                <View style={styles.cardTop}>
                  <Avatar
                    uri={photo ? resolvePhotoUrl(photo) : null}
                    name={otherUser.display_name}
                    size={44}
                    style={{ marginRight: 12 }}
                  />
                  <View style={styles.cardInfo}>
                    <Text style={styles.cardTitle} numberOfLines={1}>
                      {otherUser.display_name || 'Someone'}
                    </Text>
                    <Text style={styles.metaText} numberOfLines={1}>
                      {item.last_message?.body || 'No messages yet'}
                    </Text>
                  </View>
                  {item.last_message?.created_at && (
                    <Text style={styles.cardTime}>
                      {new Date(item.last_message.created_at).toLocaleDateString()}
                    </Text>
                  )}
                </View>
              </Card>
            </TouchableOpacity>
          );
        }}
      />
    );
  }

  // --- Tab 3: Updates ---
  function renderUpdatesTab() {
    if (updates.length === 0) {
      return (
        <View style={styles.emptyTab}>
          <EmptyState
            icon="megaphone-outline"
            title="No updates yet"
            subtitle="Activity updates will show up here"
          />
        </View>
      );
    }

    return (
      <FlatList
        data={updates}
        keyExtractor={(item, i) => item.id || `update-${i}`}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <Card style={styles.card}>
            <View style={styles.cardTop}>
              <View style={styles.iconCircle}>
                <Ionicons name={item.icon || 'information-circle-outline'} size={20} color={theme.colors.brand} />
              </View>
              <View style={styles.cardInfo}>
                <Text style={styles.cardTitle} numberOfLines={2}>{item.description}</Text>
                <Text style={styles.metaText}>{item.time}</Text>
              </View>
            </View>
          </Card>
        )}
      />
    );
  }

  function renderTabContent() {
    switch (activeTab) {
      case 0:
        return loading ? (
          <View style={styles.skeletonList}>
            {[0,1,2].map((i) => <SkeletonCard key={i} />)}
          </View>
        ) : (
          <FlatList
            data={bubbles}
            keyExtractor={(item) => item.id}
            renderItem={renderBubble}
            contentContainerStyle={bubbles.length === 0 ? styles.emptyList : styles.list}
            ListEmptyComponent={
              <EmptyState
                icon="chatbubbles-outline"
                title="No active bubbles"
                subtitle="Join a bubble to start chatting"
                ctaTitle="Explore Nearby"
                onCtaPress={() => navigation.navigate('RadarStack')}
              />
            }
          />
        );
      case 1: return renderSignalsTab();
      case 2: return renderDMsTab();
      case 3: return renderUpdatesTab();
      default: return null;
    }
  }

  return (
    <Animated.View style={[styles.flex, { opacity: enterAnim }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Inbox</Text>
      </View>

      {/* Tabs */}
      <View style={styles.tabBar}>
        {TABS.map((tab, i) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === i && styles.tabActive]}
            onPress={() => setActiveTab(i)}
          >
            <Text style={[styles.tabText, activeTab === i && styles.tabTextActive]}>
              {tab}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Content */}
      {renderTabContent()}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: theme.colors.bgDeep },
  header: {
    paddingTop: Platform.OS === 'ios' ? 56 : 16,
    paddingHorizontal: 20,
    paddingBottom: 12,
    backgroundColor: theme.colors.bgSurface,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.textPrimary,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: theme.colors.bgSurface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.borderDefault,
    paddingHorizontal: 12,
  },
  tab: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginRight: 4,
  },
  tabActive: {
    borderBottomWidth: 2,
    borderBottomColor: theme.colors.brand,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.textMuted,
  },
  tabTextActive: {
    color: theme.colors.brand,
  },
  list: { padding: 16 },
  emptyList: { flex: 1, justifyContent: 'center' },
  skeletonList: { padding: 16 },
  emptyTab: { flex: 1, justifyContent: 'center' },
  card: { marginBottom: 12 },
  cardTop: { flexDirection: 'row', alignItems: 'center' },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.brandMuted,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  cardInfo: { flex: 1 },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: theme.colors.textPrimary,
    marginBottom: 4,
  },
  cardMeta: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  metaText: { fontSize: 12, color: theme.colors.textMuted },
  cardTime: { fontSize: 12, color: theme.colors.textFaint, marginLeft: 8 },
  cardDesc: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    marginTop: 8,
  },
  sectionHeader: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
    marginTop: 8,
  },
  signalActions: {
    flexDirection: 'row',
    gap: 8,
  },
  acceptBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.colors.brand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  declineBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.colors.bgElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: theme.radii.pill,
    backgroundColor: theme.colors.bgElevated,
  },
  statusAccepted: {
    backgroundColor: theme.colors.brandMuted,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
    color: theme.colors.textMuted,
    textTransform: 'capitalize',
  },
  statusTextAccepted: {
    color: theme.colors.brand,
  },
});
