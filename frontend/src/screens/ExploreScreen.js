import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
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
import { getProfile } from '../api/profile';
import { CATEGORY_ICONS } from '../constants/icons';
import { timeRemaining, formatDistance } from '../utils/timeFormatters';
import { Card, EmptyState } from '../components/ui';
import { SkeletonCard } from '../components/ui/SkeletonLoader';
import { fadeInUpStyle, staggeredEntrance } from '../utils/animations';
import { theme } from '../theme';
import SkyBackground from '../components/visual/SkyBackground';
import BubbleField from '../components/visual/BubbleField';

const ALL_CATEGORIES = [
  'Social', 'Study', 'Food & Drinks', 'Sports', 'Music',
  'Nightlife', 'Outdoors', 'Gaming', 'Tech', 'Art', 'Other',
];

// Maximum number of cards tracked for stagger animation per section render
const MAX_STAGGER = 20;

export default function ExploreScreen({ navigation }) {
  const [bubbles, setBubbles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState(null);
  const [profile, setProfile] = useState(null);

  const enterAnim = useRef(new Animated.Value(0)).current;
  // One anim value per card slot — reused across renders
  const cardAnims = useRef(
    Array.from({ length: MAX_STAGGER }, () => new Animated.Value(0))
  ).current;

  useEffect(() => {
    Animated.timing(enterAnim, { toValue: 1, duration: 320, useNativeDriver: true }).start();
  }, []);

  const loadBubbles = useCallback(async () => {
    setLoading(true);
    // Reset card anims so re-loads get a fresh stagger
    cardAnims.forEach((a) => a.setValue(0));
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
  }, [cardAnims]);

  useFocusEffect(
    useCallback(() => {
      loadBubbles();
    }, [loadBubbles])
  );

  // Fire staggered entrance once bubbles load
  useEffect(() => {
    if (!loading && bubbles.length > 0) {
      const count = Math.min(bubbles.length, MAX_STAGGER);
      staggeredEntrance(cardAnims.slice(0, count), { staggerDelay: 50, duration: 280 }).start();
    }
  }, [loading, bubbles.length, cardAnims]);

  // Filter bubbles by search and category
  const filtered = bubbles.filter((b) => {
    const matchesSearch = !search || b.title.toLowerCase().includes(search.toLowerCase());
    const matchesCat = !filterCat || b.category === filterCat;
    return matchesSearch && matchesCat;
  });

  // Sections
  const popular = [...filtered].sort((a, b) => (b.member_count || 0) - (a.member_count || 0)).slice(0, 5);
  const endingSoon = [...filtered].sort((a, b) => new Date(a.expires_at) - new Date(b.expires_at)).slice(0, 5);

  function renderBubbleCard(item, globalIndex) {
    const iconName = CATEGORY_ICONS[item.category] || CATEGORY_ICONS.Other;
    const animIndex = Math.min(globalIndex, MAX_STAGGER - 1);
    const anim = cardAnims[animIndex];
    return (
      <Animated.View key={item.id} style={fadeInUpStyle(anim, 12)}>
        <TouchableOpacity
          onPress={() => navigation.navigate('BubbleDetails', { bubbleId: item.id })}
          accessibilityRole="button"
        >
          <View style={styles.bubbleCard}>
            <View style={styles.cardTop}>
              <View style={styles.iconCircle}>
                <Ionicons name={iconName} size={18} color={theme.colors.skyDeep} />
              </View>
              <View style={styles.cardInfo}>
                <Text style={styles.cardTitle} numberOfLines={1}>{item.title}</Text>
                <Text style={styles.cardMeta}>
                  {item.member_count <= 2 ? 'A few' : item.member_count} people · {timeRemaining(item.expires_at)}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={theme.colors.inkFaint} />
            </View>
            {item.description ? (
              <Text style={styles.cardDesc} numberOfLines={1}>{item.description}</Text>
            ) : null}
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  }

  return (
    <SkyBackground variant="dawn">
      <BubbleField seed={23} />
      <Animated.View style={[styles.flex, { opacity: enterAnim }]}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Explore</Text>
          <Text style={styles.headerSubtitle}>Bubbles within 1 km</Text>
        </View>

        {/* Search */}
        <View style={styles.searchBar}>
          <Ionicons name="search-outline" size={18} color={theme.colors.inkMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search bubbles..."
            placeholderTextColor={theme.colors.inkFaint}
            value={search}
            onChangeText={setSearch}
          />
          {search ? (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Ionicons name="close-circle" size={18} color={theme.colors.inkMuted} />
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Category filter */}
        <FlatList
          horizontal
          data={ALL_CATEGORIES}
          keyExtractor={(c) => c}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.catRow}
          renderItem={({ item: cat }) => {
            const iconName = CATEGORY_ICONS[cat] || CATEGORY_ICONS.Other;
            const active = filterCat === cat;
            return (
              <TouchableOpacity
                style={[styles.catChip, active && styles.catChipActive]}
                onPress={() => setFilterCat(active ? null : cat)}
              >
                <Ionicons name={iconName} size={14} color={active ? theme.colors.skyDeep : theme.colors.inkMuted} />
                <Text style={[styles.catChipText, active && styles.catChipTextActive]}>{cat}</Text>
              </TouchableOpacity>
            );
          }}
        />

        {/* Content */}
        {loading ? (
          <View style={styles.skeletonList}>
            {[0,1,2].map((i) => <SkeletonCard key={i} />)}
          </View>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon="compass-outline"
            title="No bubbles found"
            subtitle={search ? 'Try a different search' : 'Be the first to create one!'}
            ctaTitle="Create Bubble"
            onCtaPress={() => navigation.navigate('CreateStack')}
            style={styles.emptyState}
          />
        ) : (
          <FlatList
            data={[
              { type: 'section', title: 'Popular Now', data: popular },
              { type: 'section', title: 'Ending Soon', data: endingSoon },
              { type: 'section', title: 'All Nearby', data: filtered },
            ]}
            keyExtractor={(item, i) => `section-${i}`}
            contentContainerStyle={{ paddingBottom: 100 }}
            renderItem={({ item: section, index: sectionIndex }) => {
              const sectionOffsets = [0, popular.length, popular.length + endingSoon.length];
              const offset = sectionOffsets[sectionIndex] || 0;
              return (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>{section.title}</Text>
                  {section.data.map((item, i) => renderBubbleCard(item, offset + i))}
                </View>
              );
            }}
          />
        )}
      </Animated.View>
    </SkyBackground>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  header: {
    paddingTop: Platform.OS === 'ios' ? 56 : 20,
    paddingHorizontal: 22,
    paddingBottom: 10,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: theme.colors.ink,
    letterSpacing: -1,
  },
  headerSubtitle: {
    fontSize: 13,
    color: theme.colors.inkMuted,
    marginTop: 2,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 8,
    paddingHorizontal: 14,
    height: 46,
    backgroundColor: 'rgba(255,255,255,0.62)',
    borderRadius: theme.radii.pill,
    borderWidth: 1.5,
    borderColor: theme.colors.glassBorder,
    gap: 8,
    ...theme.shadows.card,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: theme.colors.ink,
  },
  catRow: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
  },
  catChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: theme.radii.pill,
    borderWidth: 1.5,
    borderColor: theme.colors.glassBorder,
    backgroundColor: 'rgba(255,255,255,0.55)',
  },
  catChipActive: {
    borderColor: theme.colors.skyDeep,
    backgroundColor: 'rgba(93,144,191,0.12)',
  },
  catChipText: { fontSize: 12, color: theme.colors.inkMuted },
  catChipTextActive: { color: theme.colors.skyDeep, fontWeight: '600' },
  skeletonList: { padding: 16 },
  emptyState: { flex: 1 },
  section: { paddingHorizontal: 16, marginBottom: 8 },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.inkMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 10,
    marginTop: 16,
  },
  bubbleCard: {
    backgroundColor: 'rgba(255,255,255,0.65)',
    borderRadius: theme.radii.xl,
    borderWidth: 1.5,
    borderColor: theme.colors.glassBorder,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 10,
    ...theme.shadows.card,
  },
  cardTop: { flexDirection: 'row', alignItems: 'center' },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(93,144,191,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  cardInfo: { flex: 1 },
  cardTitle: { fontSize: 15, fontWeight: '700', color: theme.colors.ink, marginBottom: 2 },
  cardMeta: { fontSize: 12, color: theme.colors.inkMuted },
  cardDesc: { fontSize: 13, color: theme.colors.inkSoft, marginTop: 6 },
});
