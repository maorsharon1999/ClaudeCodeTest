import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Animated,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import { theme } from '../theme';
import { getNearbyBubbles, joinBubble } from '../api/bubbles';

const SCREEN_HEIGHT = Dimensions.get('window').height;
const POLL_INTERVAL = 15000;

const CATEGORY_ICONS = {
  Social: '🗣',
  Study: '📚',
  'Food & Drinks': '🍕',
  Sports: '⚽',
  Music: '🎵',
  Nightlife: '🌙',
  Outdoors: '🌿',
  Gaming: '🎮',
  Tech: '💻',
  Art: '🎨',
  Other: '📍',
};

function timeRemaining(expiresAt) {
  const diff = new Date(expiresAt) - new Date();
  if (diff <= 0) return 'Expired';
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

export default function BubbleMapView({ navigation }) {
  const [bubbles, setBubbles] = useState([]);
  const [selectedBubble, setSelectedBubble] = useState(null);
  const [myLocation, setMyLocation] = useState(null);
  const [joining, setJoining] = useState(false);
  const cardAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const mapRef = useRef(null);
  const pollRef = useRef(null);

  // Get location and fetch bubbles
  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const coords = { latitude: loc.coords.latitude, longitude: loc.coords.longitude };
      setMyLocation(coords);
      fetchBubbles(coords.latitude, coords.longitude);
    })();
  }, []);

  // Poll for nearby bubbles
  useEffect(() => {
    if (!myLocation) return;
    pollRef.current = setInterval(() => {
      fetchBubbles(myLocation.latitude, myLocation.longitude);
    }, POLL_INTERVAL);
    return () => clearInterval(pollRef.current);
  }, [myLocation]);

  async function fetchBubbles(lat, lng) {
    try {
      const result = await getNearbyBubbles(lat, lng);
      setBubbles(result || []);
    } catch {
      // ignore fetch errors
    }
  }

  function openCard(bubble) {
    setSelectedBubble(bubble);
    Animated.timing(cardAnim, { toValue: 0, duration: 280, useNativeDriver: true }).start();
  }

  function dismissCard() {
    Animated.timing(cardAnim, { toValue: SCREEN_HEIGHT, duration: 220, useNativeDriver: true })
      .start(() => setSelectedBubble(null));
  }

  async function handleJoin() {
    if (!selectedBubble || joining) return;
    setJoining(true);
    try {
      await joinBubble(selectedBubble.id);
      dismissCard();
      navigation.navigate('BubbleChat', {
        bubbleId: selectedBubble.id,
        bubbleTitle: selectedBubble.title,
      });
    } catch {
      // ignore
    } finally {
      setJoining(false);
    }
  }

  function centerOnMe() {
    if (!myLocation) return;
    mapRef.current?.animateToRegion({
      ...myLocation,
      latitudeDelta: 0.018,
      longitudeDelta: 0.018,
    }, 400);
  }

  if (!myLocation) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={theme.colors.brand} />
        <Text style={styles.loadingText}>Getting your location...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        initialRegion={{
          ...myLocation,
          latitudeDelta: 0.018,
          longitudeDelta: 0.018,
        }}
        showsUserLocation={true}
        showsMyLocationButton={false}
      >
        {bubbles.map((b) => (
          <Marker
            key={b.id}
            coordinate={{ latitude: b.jittered_lat || b.lat, longitude: b.jittered_lng || b.lng }}
            anchor={{ x: 0.5, y: 0.5 }}
            tracksViewChanges={false}
            onPress={() => openCard(b)}
          >
            <View style={styles.marker}>
              <Text style={styles.markerIcon}>{CATEGORY_ICONS[b.category] || '📍'}</Text>
              <View style={styles.markerBadge}>
                <Text style={styles.markerBadgeText}>
                  {b.member_count <= 2 ? 'A few' : b.member_count}
                </Text>
              </View>
            </View>
          </Marker>
        ))}
      </MapView>

      {/* Center-on-me button */}
      <TouchableOpacity style={styles.locateBtn} onPress={centerOnMe} accessibilityLabel="Center on my location">
        <Text style={styles.locateBtnIcon}>◎</Text>
      </TouchableOpacity>

      {/* Create bubble FAB */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('CreateBubble')}
        accessibilityRole="button"
        accessibilityLabel="Create a bubble"
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>

      {/* Tap-outside dismiss overlay */}
      {selectedBubble ? (
        <TouchableOpacity style={styles.dismissOverlay} onPress={dismissCard} activeOpacity={1} />
      ) : null}

      {/* Slide-up detail card */}
      {selectedBubble ? (
        <Animated.View style={[styles.card, theme.shadows.card, { transform: [{ translateY: cardAnim }] }]}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardIcon}>{CATEGORY_ICONS[selectedBubble.category] || '📍'}</Text>
            <View style={styles.cardHeaderInfo}>
              <Text style={styles.cardTitle} numberOfLines={2}>{selectedBubble.title}</Text>
              <View style={styles.cardMeta}>
                <View style={styles.categoryBadge}>
                  <Text style={styles.categoryBadgeText}>{selectedBubble.category}</Text>
                </View>
                <Text style={styles.cardMetaText}>
                  {selectedBubble.member_count <= 2 ? 'A few' : selectedBubble.member_count} people · {timeRemaining(selectedBubble.expires_at)} left
                </Text>
              </View>
            </View>
          </View>

          {selectedBubble.description ? (
            <Text style={styles.cardDesc} numberOfLines={3}>{selectedBubble.description}</Text>
          ) : null}

          {selectedBubble.distance_m != null && (
            <Text style={styles.cardDistance}>
              {selectedBubble.distance_m < 1000
                ? `${Math.round(selectedBubble.distance_m)}m away`
                : `${(selectedBubble.distance_m / 1000).toFixed(1)}km away`}
            </Text>
          )}

          <TouchableOpacity
            style={styles.joinBtn}
            onPress={handleJoin}
            disabled={joining}
            accessibilityRole="button"
            accessibilityLabel="Join this bubble"
          >
            {joining ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.joinBtnText}>Join Bubble</Text>
            )}
          </TouchableOpacity>
        </Animated.View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { ...StyleSheet.absoluteFillObject },
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.colors.bgBase },
  loadingText: { marginTop: 12, color: theme.colors.textMuted, fontSize: 15 },

  // Markers
  marker: { alignItems: 'center' },
  markerIcon: { fontSize: 28 },
  markerBadge: {
    backgroundColor: theme.colors.brand,
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 1,
    marginTop: 2,
    minWidth: 20,
    alignItems: 'center',
  },
  markerBadgeText: { color: '#fff', fontSize: 10, fontWeight: '700' },

  // Buttons
  locateBtn: {
    position: 'absolute',
    bottom: 92,
    right: 16,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: theme.colors.bgSubtle,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: theme.colors.borderSubtle,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  locateBtnIcon: { fontSize: 22, color: theme.colors.brand, lineHeight: 26 },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 16,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: theme.colors.brand,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    shadowColor: '#6C47FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  fabText: { fontSize: 28, color: '#fff', lineHeight: 32, fontWeight: '300' },

  // Overlay
  dismissOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'transparent' },

  // Card
  card: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: theme.colors.bgSubtle,
    borderTopLeftRadius: theme.radii.lg,
    borderTopRightRadius: theme.radii.lg,
    padding: 20,
    borderTopWidth: 1,
    borderColor: theme.colors.borderSubtle,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'flex-start' },
  cardIcon: { fontSize: 36, marginRight: 12 },
  cardHeaderInfo: { flex: 1 },
  cardTitle: { fontSize: 18, fontWeight: '700', color: theme.colors.textBody, marginBottom: 6 },
  cardMeta: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8 },
  categoryBadge: {
    backgroundColor: theme.colors.badgePurpleBg,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  categoryBadgeText: { fontSize: 12, fontWeight: '600', color: theme.colors.brand },
  cardMetaText: { fontSize: 12, color: theme.colors.textMuted },
  cardDesc: { fontSize: 14, color: theme.colors.textSecondary, lineHeight: 20, marginTop: 12 },
  cardDistance: { fontSize: 13, color: theme.colors.textMuted, marginTop: 8 },
  joinBtn: {
    height: 48,
    backgroundColor: theme.colors.brand,
    borderRadius: theme.radii.pill,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
  },
  joinBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
