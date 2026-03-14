import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  Animated,
  StyleSheet,
  Dimensions,
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { theme } from '../theme';

const SCREEN_HEIGHT = Dimensions.get('window').height;

export default function BubbleMapView({ users, myLocation, signalledIds, onSignal }) {
  const [selectedUser, setSelectedUser] = useState(null);
  const cardAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;

  function openCard(user) {
    setSelectedUser(user);
    Animated.timing(cardAnim, {
      toValue: 0,
      duration: 280,
      useNativeDriver: true,
    }).start();
  }

  function dismissCard() {
    Animated.timing(cardAnim, {
      toValue: SCREEN_HEIGHT,
      duration: 220,
      useNativeDriver: true,
    }).start(() => setSelectedUser(null));
  }

  function handleSignal(userId) {
    onSignal(userId);
    dismissCard();
  }

  return (
    <View style={styles.container}>
      <MapView
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        initialRegion={{
          latitude: myLocation.latitude,
          longitude: myLocation.longitude,
          latitudeDelta: 0.018,
          longitudeDelta: 0.018,
        }}
        showsUserLocation={false}
        showsMyLocationButton={false}
      >
        {/* My Location soft dot */}
        <Marker coordinate={myLocation} anchor={{ x: 0.5, y: 0.5 }}>
          <View style={[styles.myDot, theme.shadows.orb]} />
        </Marker>

        {/* Nearby user markers */}
        {users.map((user) => {
          const isNearby = user.proximity_bucket === 'nearby';
          const initial = user.display_name?.[0]?.toUpperCase() ?? '?';
          return (
            <Marker
              key={user.user_id}
              coordinate={{
                latitude: user.jittered_lat,
                longitude: user.jittered_lng,
              }}
              anchor={{ x: 0.5, y: 0.5 }}
              onPress={() => openCard(user)}
            >
              <View
                style={[
                  styles.markerCircle,
                  isNearby ? styles.markerNearby : styles.markerSameArea,
                  isNearby ? theme.shadows.orb : theme.shadows.card,
                ]}
              >
                {user.photos?.[0] ? (
                  <Image source={{ uri: user.photos[0] }} style={styles.markerImage} />
                ) : (
                  <Text style={styles.markerInitial}>{initial}</Text>
                )}
              </View>
            </Marker>
          );
        })}
      </MapView>

      {/* Tap-outside overlay — sits behind the card, above the map */}
      {selectedUser ? (
        <TouchableOpacity
          style={styles.dismissOverlay}
          onPress={dismissCard}
          activeOpacity={1}
        />
      ) : null}

      {/* Slide-up detail card */}
      {selectedUser ? (
        <Animated.View
          style={[styles.card, theme.shadows.card, { transform: [{ translateY: cardAnim }] }]}
        >
          <View style={styles.cardInner}>
            {selectedUser.photos?.[0] ? (
              <Image source={{ uri: selectedUser.photos[0] }} style={styles.cardPhoto} />
            ) : (
              <View style={[styles.cardPhoto, styles.cardPhotoFallback]}>
                <Text style={styles.cardPhotoInitial}>
                  {selectedUser.display_name?.[0]?.toUpperCase() ?? '?'}
                </Text>
              </View>
            )}

            <View style={styles.cardInfo}>
              <View style={styles.cardNameRow}>
                <Text style={styles.cardName}>
                  {selectedUser.display_name}, {selectedUser.age}
                </Text>
                <View
                  style={[
                    styles.badge,
                    selectedUser.proximity_bucket === 'nearby'
                      ? styles.badgeNearby
                      : styles.badgeSameArea,
                  ]}
                >
                  <Text
                    style={[
                      styles.badgeText,
                      selectedUser.proximity_bucket === 'nearby'
                        ? styles.badgeTextNearby
                        : styles.badgeTextSameArea,
                    ]}
                  >
                    {selectedUser.proximity_bucket === 'nearby' ? 'Nearby' : 'Same area'}
                  </Text>
                </View>
              </View>

              {selectedUser.bio ? (
                <Text style={styles.cardBio} numberOfLines={3} ellipsizeMode="tail">
                  {selectedUser.bio}
                </Text>
              ) : null}

              <TouchableOpacity
                style={[
                  styles.signalBtn,
                  signalledIds.has(selectedUser.user_id) && styles.signalBtnSent,
                ]}
                onPress={() => handleSignal(selectedUser.user_id)}
                disabled={signalledIds.has(selectedUser.user_id)}
                accessibilityRole="button"
                accessibilityLabel={
                  signalledIds.has(selectedUser.user_id) ? 'Signal sent' : 'Send signal'
                }
              >
                <Text style={styles.signalBtnText}>
                  {signalledIds.has(selectedUser.user_id) ? 'Sent \u2713' : 'Signal'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </Animated.View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  // My location: semi-transparent white dot with brand border and orb glow
  myDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    borderWidth: 2,
    borderColor: theme.colors.brand,
  },
  // User markers
  markerCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.bgDim,
  },
  markerNearby: {
    borderColor: '#6C47FF',
  },
  markerSameArea: {
    borderColor: '#aaa',
  },
  markerImage: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  markerInitial: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.textBody,
  },
  // Dismiss overlay (behind card, above map)
  dismissOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'transparent',
  },
  // Slide-up card
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
  cardInner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  cardPhoto: {
    width: 72,
    height: 72,
    borderRadius: theme.radii.md,
    marginRight: theme.spacing.md,
    backgroundColor: theme.colors.bgDim,
  },
  cardPhotoFallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardPhotoInitial: {
    fontSize: 28,
    fontWeight: '700',
    color: theme.colors.textMuted,
  },
  cardInfo: {
    flex: 1,
  },
  cardNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  cardName: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.textBody,
    flex: 1,
    marginRight: 8,
  },
  cardBio: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    lineHeight: 20,
    marginBottom: 12,
  },
  badge: {
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  badgeNearby: { backgroundColor: theme.colors.badgePurpleBg },
  badgeSameArea: { backgroundColor: theme.colors.bgDim },
  badgeText: { fontSize: 12, fontWeight: '600' },
  badgeTextNearby: { color: theme.colors.brand },
  badgeTextSameArea: { color: theme.colors.textMuted },
  signalBtn: {
    alignSelf: 'flex-start',
    backgroundColor: theme.colors.brand,
    borderRadius: theme.radii.pill,
    paddingVertical: 9,
    paddingHorizontal: 22,
  },
  signalBtnSent: {
    backgroundColor: theme.colors.disabled,
  },
  signalBtnText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
});