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
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { getNearbyBubbles, joinBubble } from '../api/bubbles';
import BubbleMapMarker from '../components/BubbleMapMarker';
import BubblePeekCard from '../components/BubblePeekCard';
import mapDarkStyle from '../components/MapDarkStyle.json';
import { IconButton } from '../components/ui';
import { pulseLoop } from '../utils/animations';
import { theme } from '../theme';

const SCREEN_HEIGHT = Dimensions.get('window').height;
const POLL_INTERVAL = 15000;

export default function RadarHomeScreen({ navigation }) {
  const [bubbles, setBubbles] = useState([]);
  const [selectedBubble, setSelectedBubble] = useState(null);
  const [myLocation, setMyLocation] = useState(null);
  const [joining, setJoining] = useState(false);
  const cardAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const pulseAnim = useRef(new Animated.Value(0.3)).current;
  const mapRef = useRef(null);
  const pollRef = useRef(null);

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        // Fallback: use a default region so the app isn't stuck
        const fallback = { latitude: 32.08, longitude: 34.78 }; // Tel Aviv default
        setMyLocation(fallback);
        return;
      }
      try {
        let loc = await Location.getLastKnownPositionAsync();
        if (!loc) {
          loc = await Promise.race([
            Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Low }),
            new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 10000)),
          ]);
        }
        const coords = { latitude: loc.coords.latitude, longitude: loc.coords.longitude };
        setMyLocation(coords);
        fetchBubbles(coords.latitude, coords.longitude);
      } catch {
        // Timeout or error — use fallback so the app renders
        const fallback = { latitude: 32.08, longitude: 34.78 };
        setMyLocation(fallback);
      }
    })();
  }, []);

  useEffect(() => {
    if (!myLocation) return;
    pollRef.current = setInterval(() => {
      fetchBubbles(myLocation.latitude, myLocation.longitude);
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
        showsUserLocation
        showsMyLocationButton={false}
      >
        {/* Pulsing ring at user's location */}
        <Marker
          coordinate={myLocation}
          anchor={{ x: 0.5, y: 0.5 }}
          tracksViewChanges={false}
          zIndex={0}
        >
          <Animated.View
            style={[styles.pulseRing, { opacity: pulseAnim }]}
            pointerEvents="none"
          />
        </Marker>

        {bubbles.map((b) => (
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
            <BubbleMapMarker
              category={b.category}
              memberCount={b.member_count}
            />
          </Marker>
        ))}
      </MapView>

      {/* Top bar overlay */}
      <View style={styles.topBar} pointerEvents="box-none">
        <Text style={styles.wordmark}>Bubble</Text>
        <View style={styles.topActions}>
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
});
