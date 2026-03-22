import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Animated,
  StyleSheet,
  Dimensions,
  Platform,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { getNearbyBubbles, joinBubble } from '../api/bubbles';
import { setVisibility, getProfile } from '../api/profile';
import { getNearbyUsers } from '../api/discovery';
import BubbleMapMarker from '../components/BubbleMapMarker';
import BubbleAreaOverlay from '../components/BubbleAreaOverlay';
import BubbleAreaMarker from '../components/BubbleAreaMarker';
import UserPhotoMarker from '../components/UserPhotoMarker';
import BubblePeekCard from '../components/BubblePeekCard';
import mapDarkStyle from '../components/MapDarkStyle.json';
import { IconButton } from '../components/ui';
import { pulseLoop } from '../utils/animations';
import { resolvePhotoUrl } from '../lib/photoUrl';
import { CATEGORY_ICONS } from '../constants/icons';
import { theme } from '../theme';

const ALL_CATEGORIES = [
  'Social', 'Study', 'Food & Drinks', 'Sports', 'Music',
  'Nightlife', 'Outdoors', 'Gaming', 'Tech', 'Art', 'Other',
];

const SCREEN_HEIGHT = Dimensions.get('window').height;
const POLL_INTERVAL = 15000;

export default function RadarHomeScreen({ navigation }) {
  const [bubbles, setBubbles] = useState([]);
  const [selectedBubble, setSelectedBubble] = useState(null);
  const [myLocation, setMyLocation] = useState(null);
  const [joining, setJoining] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [filterCat, setFilterCat] = useState(null);
  const [nearbyUsers, setNearbyUsers] = useState([]);
  const [myProfile, setMyProfile] = useState(null);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  async function handleVisibilityToggle() {
    const next = !isVisible;
    setIsVisible(next);
    try {
      await setVisibility(next ? 'visible' : 'invisible');
    } catch {
      // revert on failure
      setIsVisible(!next);
    }
  }

  const filteredBubbles = filterCat ? bubbles.filter((b) => b.category === filterCat) : bubbles;
  const cardAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const pulseAnim = useRef(new Animated.Value(0.3)).current;
  const mapRef = useRef(null);
  const pollRef = useRef(null);

  // Fetch current user profile for photo marker
  useEffect(() => {
    getProfile().then(p => setMyProfile(p)).catch(() => {});
  }, []);

  useEffect(() => {
    const fallback = { latitude: 32.08, longitude: 34.78 }; // Tel Aviv default

    async function resolveLocation() {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setMyLocation(fallback);
        return;
      }
      // Wrap entire location sequence in an 8s timeout so nothing can hang forever
      const loc = await Promise.race([
        (async () => {
          const last = await Location.getLastKnownPositionAsync();
          if (last) return last;
          return Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Low });
        })(),
        new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 8000)),
      ]);
      const coords = { latitude: loc.coords.latitude, longitude: loc.coords.longitude };
      setMyLocation(coords);
      fetchBubbles(coords.latitude, coords.longitude);
    }

    resolveLocation().catch(() => setMyLocation(fallback));
  }, []);

  useEffect(() => {
    if (!myLocation) return;
    fetchNearbyUsers();
    pollRef.current = setInterval(() => {
      fetchBubbles(myLocation.latitude, myLocation.longitude);
      fetchNearbyUsers();
    }, POLL_INTERVAL);
    return () => clearInterval(pollRef.current);
  }, [myLocation]);

  // Start pulse loop as soon as we have location
  useEffect(() => {
    if (!myLocation) return;
    const anim = pulseLoop(pulseAnim, { minOpacity: 0.15, maxOpacity: 0.55, duration: 900 });
    anim.start();
    return () => anim.stop();
  }, [myLocation, pulseAnim]);

  async function fetchBubbles(lat, lng) {
    try {
      const result = await getNearbyBubbles(lat, lng);
      setBubbles(result || []);
    } catch {
      // ignore
    }
  }

  async function fetchNearbyUsers() {
    try {
      const users = await getNearbyUsers();
      setNearbyUsers(users || []);
    } catch {
      // ignore — endpoint may not be wired yet
    }
  }

  function openCard(bubble) {
    setSelectedBubble(bubble);
    Animated.spring(cardAnim, {
      toValue: 0,
      useNativeDriver: true,
      damping: 20,
      stiffness: 200,
    }).start();
  }

  function dismissCard() {
    Animated.timing(cardAnim, {
      toValue: SCREEN_HEIGHT,
      duration: 220,
      useNativeDriver: true,
    }).start(() => setSelectedBubble(null));
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

  function handleDetails() {
    if (!selectedBubble) return;
    dismissCard();
    navigation.navigate('BubbleDetails', { bubbleId: selectedBubble.id });
  }

  function centerOnMe() {
    if (!myLocation) return;
    mapRef.current?.animateToRegion(
      { ...myLocation, latitudeDelta: 0.018, longitudeDelta: 0.018 },
      400
    );
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
        customMapStyle={mapDarkStyle}
        initialRegion={{
          ...myLocation,
          latitudeDelta: 0.018,
          longitudeDelta: 0.018,
        }}
        showsUserLocation={false}
        showsMyLocationButton={false}
      >
        {/* Bubble area overlays (below markers) — tappable */}
        {filteredBubbles.map((b) => (
          <BubbleAreaOverlay
            key={`area-${b.id}`}
            bubble={b}
            selected={selectedBubble?.id === b.id}
            onPress={() => openCard(b)}
          />
        ))}

        {/* Current user photo marker */}
        <Marker
          coordinate={myLocation}
          anchor={{ x: 0.5, y: 0.5 }}
          tracksViewChanges={false}
          zIndex={10}
        >
          <UserPhotoMarker
            photoUrl={myProfile?.photos?.[0] ? resolvePhotoUrl(myProfile.photos[0]) : null}
            name={myProfile?.display_name || '?'}
            isCurrentUser
            size={44}
          />
        </Marker>

        {/* Nearby user photo markers */}
        {nearbyUsers.map((u) => (
          <Marker
            key={u.id || u.user_id}
            coordinate={{
              latitude: u.lat,
              longitude: u.lng,
            }}
            anchor={{ x: 0.5, y: 0.5 }}
            tracksViewChanges={false}
            zIndex={5}
          >
            <UserPhotoMarker
              photoUrl={u.photos?.[0] ? resolvePhotoUrl(u.photos[0]) : null}
              name={u.display_name || '?'}
              size={40}
            />
          </Marker>
        ))}

        {/* Bubble center markers */}
        {filteredBubbles.map((b) => {
          const hasShape = b.shape_type && b.shape_type !== 'circle' && b.shape_coords;
          return (
            <Marker
              key={b.id}
              coordinate={{
                latitude: b.jittered_lat || b.lat,
                longitude: b.jittered_lng || b.lng,
              }}
              anchor={{ x: 0.5, y: 0.5 }}
              tracksViewChanges={false}
              onPress={() => openCard(b)}
            >
              {hasShape ? (
                <BubbleAreaMarker
                  category={b.category}
                  memberCount={b.member_count}
                />
              ) : (
                <BubbleMapMarker
                  category={b.category}
                  memberCount={b.member_count}
                />
              )}
            </Marker>
          );
        })}
      </MapView>

      {/* Top bar overlay */}
      <View style={styles.topBar} pointerEvents="box-none">
        <View>
          <Text style={styles.wordmark}>Bubble</Text>
          <Text style={styles.greeting}>{greeting}</Text>
        </View>
        <View style={styles.topActions}>
          <IconButton
            name={isVisible ? 'eye-outline' : 'eye-off-outline'}
            size={20}
            color={isVisible ? theme.colors.brand : theme.colors.textMuted}
            onPress={handleVisibilityToggle}
            bgColor={theme.colors.bgSurface}
            buttonSize={38}
          />
          <IconButton
            name="notifications-outline"
            size={20}
            color={theme.colors.textSecondary}
            onPress={() => navigation.navigate('InboxStack')}
            bgColor={theme.colors.bgSurface}
            buttonSize={38}
          />
        </View>
      </View>

      {/* Filter chip row */}
      <View style={styles.chipRowContainer} pointerEvents="box-none">
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipRowContent}
          pointerEvents="auto"
        >
          {ALL_CATEGORIES.map((cat) => {
            const iconName = CATEGORY_ICONS[cat] || CATEGORY_ICONS.Other;
            const active = filterCat === cat;
            return (
              <TouchableOpacity
                key={cat}
                style={[styles.filterChip, active && styles.filterChipActive]}
                onPress={() => setFilterCat(active ? null : cat)}
              >
                <Ionicons
                  name={iconName}
                  size={13}
                  color={active ? theme.colors.brand : theme.colors.textMuted}
                />
                <Text style={[styles.filterChipText, active && styles.filterChipTextActive]}>
                  {cat}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Bottom controls */}
      <IconButton
        name="locate-outline"
        size={22}
        color={theme.colors.brand}
        onPress={centerOnMe}
        bgColor={theme.colors.bgSurface}
        style={styles.locateBtn}
      />

      {/* Tap-outside dismiss overlay */}
      {selectedBubble ? (
        <TouchableOpacity
          style={styles.dismissOverlay}
          onPress={dismissCard}
          activeOpacity={1}
        />
      ) : null}

      {/* Peek card */}
      {selectedBubble ? (
        <Animated.View
          style={[styles.cardWrapper, { transform: [{ translateY: cardAnim }] }]}
        >
          <BubblePeekCard
            bubble={selectedBubble}
            onJoin={handleJoin}
            onDetails={handleDetails}
            joining={joining}
          />
        </Animated.View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.bgDeep },
  map: { ...StyleSheet.absoluteFillObject },
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.bgDeep,
  },
  loadingText: {
    marginTop: 12,
    color: theme.colors.textMuted,
    fontSize: 15,
  },
  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 56 : 24,
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  wordmark: {
    fontSize: 28,
    fontWeight: '700',
    color: theme.colors.brand,
    letterSpacing: -0.5,
  },
  topActions: {
    flexDirection: 'row',
    gap: 8,
  },
  locateBtn: {
    position: 'absolute',
    bottom: 24,
    right: 16,
  },
  dismissOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'transparent',
  },
  cardWrapper: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  pulseRing: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 2,
    borderColor: theme.colors.brand,
    backgroundColor: 'transparent',
  },
  greeting: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  chipRowContainer: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 110 : 78,
    left: 0,
    right: 0,
  },
  chipRowContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 6,
    paddingHorizontal: 11,
    borderRadius: theme.radii.pill,
    borderWidth: 1,
    borderColor: theme.colors.borderDefault,
    backgroundColor: 'rgba(10,10,20,0.82)',
  },
  filterChipActive: {
    borderColor: theme.colors.brand,
    backgroundColor: theme.colors.brandMuted,
  },
  filterChipText: {
    fontSize: 12,
    color: theme.colors.textMuted,
  },
  filterChipTextActive: {
    color: theme.colors.brand,
    fontWeight: '600',
  },
});
