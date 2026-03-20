import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  StyleSheet,
  Animated,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { getNearbyBubbles } from '../api/bubbles';
import * as Location from 'expo-location';
import { theme } from '../theme';

const CATEGORY_ICONS = {
  Social: '🗣', Study: '📚', 'Food & Drinks': '🍕', Sports: '⚽',
  Music: '🎵', Nightlife: '🌙', Outdoors: '🌿', Gaming: '🎮',
  Tech: '💻', Art: '🎨', Other: '📍',
};

function timeRemaining(expiresAt) {
  const diff = new Date(expiresAt) - new Date();
  if (diff <= 0) return 'Expired';
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  return h > 0 ? `${h}h ${m}m left` : `${m}m left`;
}

export default function ChatsScreen({ navigation }) {
  const [bubbles, setBubbles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const enterAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(enterAnim, { toValue: 1, duration: 320, useNativeDriver: true }).start();
  }, []);
  const enterStyle = {
    opacity: enterAnim,
    transform: [{ translateY: enterAnim.interpolate({ inputRange: [0, 1], outputRange: [16, 0] }) }],
  };

  const loadBubbles = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setError('Location permission required to find nearby bubbles.');
        return;
      }
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const result = await getNearbyBubbles(loc.coords.latitude, loc.coords.longitude);
      setBubbles(result || []);
    } catch {
      setError('Could not load bubbles. Please try again.');
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
    const icon = CATEGORY_ICONS[item.category] || '📍';
    return (
      <TouchableOpacity
        style={[styles.card, theme.shadows.card]}
        onPress={() => navigation.navigate('BubbleChat', { bubbleId: item.id, bubbleTitle: item.title })}
        accessibilityRole="button"
        accessibilityLabel={`Open bubble: ${item.title}`}
      >
        <View style={styles.cardTop}>
          <Text style={styles.cardIcon}>{icon}</Text>
          <View style={styles.cardInfo}>
            <Text style={styles.cardTitle} numberOfLines={1}>{item.title}</Text>
            <View style={styles.cardMeta}>
              <View style={styles.categoryBadge}>
                <Text style={styles.categoryBadgeText}>{item.category}</Text>
              </View>
              <Text style={styles.cardMetaText}>
                {item.member_count <= 2 ? 'A few' : item.member_count} people
              </Text>
            </View>
          </View>
          <Text style={styles.cardTime}>{timeRemaining(item.expires_at)}</Text>
        </View>
        {item.description ? (
          <Text style={styles.cardDesc} numberOfLines={1} ellipsizeMode="tail">{item.description}</Text>
        ) : null}
      </TouchableOpacity>
    );
  }

  return (
    <Animated.View style={[styles.container, enterStyle]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Nearby Bubbles</Text>
      </View>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      {loading && bubbles.length === 0 ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={theme.colors.brand} />
        </View>
      ) : (
        <FlatList
          data={bubbles}
          keyExtractor={(item) => item.id}
          contentContainerStyle={bubbles.length === 0 ? styles.emptyList : styles.list}
          renderItem={renderBubble}
          ListEmptyComponent={
            !loading ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>No bubbles nearby right now.</Text>
                <Text style={styles.emptySubtext}>Be the first to create one!</Text>
                <TouchableOpacity
                  style={styles.createBtn}
                  onPress={() => navigation.navigate('CreateBubble')}
                  accessibilityRole="button"
                >
                  <Text style={styles.createBtnText}>Create a Bubble</Text>
                </TouchableOpacity>
              </View>
            ) : null
          }
        />
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.bgBase },
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.bgDim,
  },
  headerTitle: { fontSize: 24, fontWeight: '800', color: theme.colors.brand },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  list: { padding: 16 },
  emptyList: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  emptyState: { alignItems: 'center' },
  emptyText: { fontSize: 16, color: theme.colors.textFaint, textAlign: 'center', marginBottom: 4 },
  emptySubtext: { fontSize: 14, color: theme.colors.textMuted, textAlign: 'center', marginBottom: 20 },
  createBtn: {
    backgroundColor: theme.colors.brand,
    borderRadius: theme.radii.pill,
    paddingVertical: 12,
    paddingHorizontal: 28,
  },
  createBtnText: { color: '#fff', fontWeight: '600', fontSize: 15 },
  errorText: { color: theme.colors.error, textAlign: 'center', padding: 12, fontSize: 13 },
  card: {
    backgroundColor: theme.colors.bgBase,
    borderRadius: theme.radii.md,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: theme.colors.borderSubtle,
  },
  cardTop: { flexDirection: 'row', alignItems: 'center' },
  cardIcon: { fontSize: 28, marginRight: 12 },
  cardInfo: { flex: 1 },
  cardTitle: { fontSize: 16, fontWeight: '700', color: theme.colors.textBody, marginBottom: 4 },
  cardMeta: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  categoryBadge: {
    backgroundColor: theme.colors.badgePurpleBg,
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  categoryBadgeText: { fontSize: 11, fontWeight: '600', color: theme.colors.brand },
  cardMetaText: { fontSize: 12, color: theme.colors.textMuted },
  cardTime: { fontSize: 12, color: theme.colors.textFaint, marginLeft: 8 },
  cardDesc: { fontSize: 14, color: theme.colors.textSecondary, marginTop: 8 },
});
