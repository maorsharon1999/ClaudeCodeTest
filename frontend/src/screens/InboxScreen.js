import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Animated,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { getNearbyBubbles } from '../api/bubbles';
import { CATEGORY_ICONS } from '../constants/icons';
import { timeRemaining } from '../utils/timeFormatters';
import { Card, EmptyState, Badge } from '../components/ui';
import { SkeletonCard } from '../components/ui/SkeletonLoader';
import { theme } from '../theme';

const TABS = ['Active', 'Signals', 'Updates'];

export default function InboxScreen({ navigation }) {
  const [activeTab, setActiveTab] = useState(0);
  const [bubbles, setBubbles] = useState([]);
  const [loading, setLoading] = useState(true);

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

  useFocusEffect(
    useCallback(() => {
      loadBubbles();
    }, [loadBubbles])
  );

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
      {activeTab === 0 ? (
        loading ? (
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
        )
      ) : (
        <View style={styles.emptyTab}>
          <EmptyState
            icon={activeTab === 1 ? 'flash-outline' : 'megaphone-outline'}
            title={activeTab === 1 ? 'No signals yet' : 'No updates yet'}
            subtitle={activeTab === 1 ? 'Signals from nearby bubbles will appear here' : 'Activity updates will show up here'}
          />
        </View>
      )}
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
    paddingHorizontal: 20,
  },
  tab: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginRight: 8,
  },
  tabActive: {
    borderBottomWidth: 2,
    borderBottomColor: theme.colors.brand,
  },
  tabText: {
    fontSize: 14,
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
});
