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
import { EmptyState } from '../components/ui';
import { SkeletonCard } from '../components/ui/SkeletonLoader';
import { resolvePhotoUrl } from '../lib/photoUrl';
import { theme } from '../theme';
import SkyBackground from '../components/visual/SkyBackground';
import BubbleField from '../components/visual/BubbleField';
import GlassCard from '../components/visual/GlassCard';
import AvatarBubble from '../components/visual/AvatarBubble';
import SectionLabel from '../components/visual/SectionLabel';
import GlassButton from '../components/visual/GlassButton';
import CircleIconBtn from '../components/visual/CircleIconBtn';

const TABS = ['Active', 'Signals', 'DMs', 'Updates'];

const TONES = ['a', 'b', 'c', 'd', 'e', 'f'];
function toneForName(name) {
  if (!name) return 'a';
  return TONES[name.charCodeAt(0) % TONES.length];
}

export default function InboxScreen({ navigation }) {
  const [activeTab, setActiveTab] = useState(0);
  const [bubbles, setBubbles] = useState([]);
  const [loading, setLoading] = useState(true);

  const [incoming, setIncoming] = useState([]);
  const [outgoing, setOutgoing] = useState([]);
  const [signalsLoading, setSignalsLoading] = useState(false);

  const [threads, setThreads] = useState([]);
  const [threadsLoading, setThreadsLoading] = useState(false);

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

  function renderBubble({ item }) {
    const name = item.title || 'Bubble';
    return (
      <TouchableOpacity
        onPress={() => navigation.navigate('BubbleChat', {
          bubbleId: item.id,
          bubbleTitle: item.title,
        })}
        accessibilityRole="button"
        style={styles.cardSpacing}
      >
        <GlassCard radius={22} style={styles.rowCard}>
          <AvatarBubble size={48} tone={toneForName(name)} initials={name[0]} />
          <View style={styles.rowInfo}>
            <View style={styles.rowTopLine}>
              <Text style={styles.rowName} numberOfLines={1}>{name}</Text>
              <Text style={styles.rowTime}>{timeRemaining(item.expires_at)}</Text>
            </View>
            <Text style={styles.rowSub} numberOfLines={1}>
              {item.description || (item.member_count ? `${item.member_count} people` : 'Active bubble')}
            </Text>
          </View>
        </GlassCard>
      </TouchableOpacity>
    );
  }

  function renderSignalsTab() {
    if (signalsLoading) {
      return (
        <View style={styles.padded}>
          {[0, 1, 2].map((i) => <SkeletonCard key={i} />)}
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
        contentContainerStyle={styles.padded}
        renderItem={({ item }) => {
          if (item.type === 'header') {
            return <SectionLabel style={styles.sectionLabelSpacing}>{item.title}</SectionLabel>;
          }
          const photo = item.sender_photos?.[0] || item.recipient_photos?.[0];
          const name = item.sender_display_name || item.recipient_display_name || 'Someone';
          const isIncoming = item.section === 'incoming';
          return (
            <GlassCard radius={22} style={[styles.rowCard, styles.cardSpacing]}>
              <AvatarBubble
                size={48}
                tone={toneForName(name)}
                initials={name[0]}
                uri={photo ? resolvePhotoUrl(photo) : null}
              />
              <View style={styles.rowInfo}>
                <Text style={styles.rowName} numberOfLines={1}>{name}</Text>
                <Text style={styles.rowSub}>
                  {isIncoming ? 'Sent you a signal' : `Status: ${item.status || 'pending'}`}
                </Text>
              </View>
              {isIncoming && item.status === 'pending' && (
                <View style={styles.signalActions}>
                  <GlassButton
                    variant="primary"
                    size="sm"
                    onPress={() => handleAcceptSignal(item.id)}
                    style={styles.signalBtn}
                  >
                    <Ionicons name="checkmark" size={16} color="#fff" />
                  </GlassButton>
                  <CircleIconBtn onPress={() => handleDeclineSignal(item.id)}>
                    <Ionicons name="close" size={16} color={theme.colors.inkMuted} />
                  </CircleIconBtn>
                </View>
              )}
              {!isIncoming && (
                <View style={[
                  styles.statusPill,
                  item.status === 'accepted' && styles.statusPillAccepted,
                ]}>
                  <Text style={[
                    styles.statusText,
                    item.status === 'accepted' && styles.statusTextAccepted,
                  ]}>
                    {item.status || 'pending'}
                  </Text>
                </View>
              )}
            </GlassCard>
          );
        }}
      />
    );
  }

  function renderDMsTab() {
    if (threadsLoading) {
      return (
        <View style={styles.padded}>
          {[0, 1, 2].map((i) => <SkeletonCard key={i} />)}
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
        contentContainerStyle={styles.padded}
        renderItem={({ item }) => {
          const other = item.other_user || {};
          const photo = other.photos?.[0];
          const name = other.display_name || 'Someone';
          return (
            <TouchableOpacity
              onPress={() => navigation.navigate('DirectChat', {
                threadId: item.id,
                userName: name,
              })}
              style={styles.cardSpacing}
            >
              <GlassCard radius={22} style={styles.rowCard}>
                <View style={styles.onlineWrap}>
                  <AvatarBubble
                    size={48}
                    tone={toneForName(name)}
                    initials={name[0]}
                    uri={photo ? resolvePhotoUrl(photo) : null}
                  />
                </View>
                <View style={styles.rowInfo}>
                  <View style={styles.rowTopLine}>
                    <Text style={styles.rowName} numberOfLines={1}>{name}</Text>
                    {item.last_message?.created_at && (
                      <Text style={styles.rowTime}>
                        {new Date(item.last_message.created_at).toLocaleDateString()}
                      </Text>
                    )}
                  </View>
                  <Text style={styles.rowSub} numberOfLines={1}>
                    {item.last_message?.body || 'No messages yet'}
                  </Text>
                </View>
              </GlassCard>
            </TouchableOpacity>
          );
        }}
      />
    );
  }

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
        contentContainerStyle={styles.padded}
        renderItem={({ item }) => (
          <GlassCard radius={22} style={[styles.rowCard, styles.cardSpacing]}>
            <View style={styles.updateIcon}>
              <Ionicons name={item.icon || 'information-circle-outline'} size={20} color={theme.colors.skyDeep} />
            </View>
            <View style={styles.rowInfo}>
              <Text style={styles.rowName} numberOfLines={2}>{item.description}</Text>
              <Text style={styles.rowSub}>{item.time}</Text>
            </View>
          </GlassCard>
        )}
      />
    );
  }

  function renderTabContent() {
    switch (activeTab) {
      case 0:
        return loading ? (
          <View style={styles.padded}>
            {[0, 1, 2].map((i) => <SkeletonCard key={i} />)}
          </View>
        ) : (
          <FlatList
            data={bubbles}
            keyExtractor={(item) => item.id}
            renderItem={renderBubble}
            contentContainerStyle={bubbles.length === 0 ? styles.emptyList : styles.padded}
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
      <SkyBackground variant="dawn">
        <BubbleField seed={7} count={6} />
      </SkyBackground>

      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>Inbox</Text>
            <Text style={styles.headerSub}>Your signals and conversations</Text>
          </View>
          <CircleIconBtn onPress={() => {}}>
            <Ionicons name="search-outline" size={18} color={theme.colors.inkMuted} />
          </CircleIconBtn>
        </View>

        {/* Tab bar */}
        <View style={styles.tabRow}>
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
        <View style={styles.tabContent}>
          {renderTabContent()}
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: {
    position: 'absolute',
    inset: 0,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    flex: 1,
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 56 : 20,
    paddingHorizontal: 22,
    paddingBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: theme.colors.ink,
    letterSpacing: -1,
  },
  headerSub: {
    fontSize: 13,
    color: theme.colors.inkMuted,
    marginTop: 2,
  },
  tabRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingBottom: 4,
    gap: 4,
  },
  tab: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: theme.radii.pill,
  },
  tabActive: {
    backgroundColor: 'rgba(93,144,191,0.12)',
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.inkMuted,
  },
  tabTextActive: {
    color: theme.colors.skyDeep,
    fontWeight: '700',
  },
  tabContent: {
    flex: 1,
  },
  padded: {
    padding: 16,
    paddingBottom: 100,
  },
  emptyList: {
    flex: 1,
    justifyContent: 'center',
  },
  emptyTab: {
    flex: 1,
    justifyContent: 'center',
  },
  cardSpacing: {
    marginBottom: 10,
  },
  rowCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 12,
  },
  onlineWrap: {},
  rowInfo: {
    flex: 1,
    minWidth: 0,
  },
  rowTopLine: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  rowName: {
    fontSize: 15,
    fontWeight: '700',
    color: theme.colors.ink,
    flex: 1,
    marginRight: 8,
  },
  rowTime: {
    fontSize: 11,
    color: theme.colors.inkFaint,
  },
  rowSub: {
    fontSize: 13,
    color: theme.colors.inkSoft,
    overflow: 'hidden',
  },
  sectionLabelSpacing: {
    marginBottom: 8,
    marginTop: 4,
  },
  signalActions: {
    flexDirection: 'row',
    gap: 6,
  },
  signalBtn: {
    width: 36,
    height: 36,
    padding: 0,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 18,
  },
  statusPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: theme.radii.pill,
    backgroundColor: 'rgba(255,255,255,0.45)',
    borderWidth: 1,
    borderColor: theme.colors.glassBorder,
  },
  statusPillAccepted: {
    backgroundColor: 'rgba(90,185,146,0.12)',
    borderColor: theme.colors.live,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
    color: theme.colors.inkMuted,
    textTransform: 'capitalize',
  },
  statusTextAccepted: {
    color: theme.colors.live,
  },
  updateIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: theme.colors.brandMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
