import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  Image,
  ActivityIndicator,
  TouchableOpacity,
  StyleSheet,
  Linking,
  RefreshControl,
  Animated,
} from 'react-native';
import * as Location from 'expo-location';
import { updateLocation, getNearbyUsers } from '../api/discovery';
import { sendSignal, getOutgoingSignals } from '../api/signals';
import Toast from '../components/Toast';
import BubbleMapView from '../components/BubbleMapView';
import { theme } from '../theme';

export default function DiscoveryScreen() {
  const [users, setUsers] = useState([]);
  const [permissionStatus, setPermissionStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [signalledIds, setSignalledIds] = useState(new Set());
  const [toastMsg, setToastMsg] = useState('');
  const [toastKey, setToastKey] = useState(0);
  const [viewMode, setViewMode] = useState('list');
  const [myLocation, setMyLocation] = useState(null);

  // Entrance animation
  const enterAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(enterAnim, { toValue: 1, duration: 320, useNativeDriver: true }).start();
  }, []);
  const enterStyle = {
    opacity: enterAnim,
    transform: [{ translateY: enterAnim.interpolate({ inputRange: [0, 1], outputRange: [16, 0] }) }],
  };

  function showToast(msg) {
    setToastMsg(msg);
    setToastKey((k) => k + 1);
  }

  const refresh = useCallback(async (showRefreshing = false) => {
    if (showRefreshing) setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      const pos = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
        timeInterval: 8000,
        distanceInterval: 0,
      });
      setMyLocation({ latitude: pos.coords.latitude, longitude: pos.coords.longitude });
      await updateLocation(pos.coords.latitude, pos.coords.longitude);
      const nearby = await getNearbyUsers();
      setUsers(nearby);
      setLastUpdated(new Date());
      try {
        const outgoing = await getOutgoingSignals();
        setSignalledIds(new Set(outgoing.map((s) => s.recipient.user_id)));
      } catch {
        // non-fatal: leave signalledIds as-is
      }
    } catch (err) {
      setError('Could not load nearby users. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      setPermissionStatus(status);
      if (status === 'granted') {
        await refresh();
      }
    })();
  }, [refresh]);

  useEffect(() => {
    if (permissionStatus !== 'granted') return;
    const interval = setInterval(() => refresh(), 60_000);
    return () => clearInterval(interval);
  }, [permissionStatus, refresh]);

  async function handleSignal(userId) {
    setSignalledIds((prev) => new Set([...prev, userId]));
    try {
      await sendSignal(userId);
    } catch (err) {
      setSignalledIds((prev) => {
        const next = new Set(prev);
        next.delete(userId);
        return next;
      });
      showToast('Could not send signal. Try again.');
    }
  }

  if (permissionStatus === null) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={theme.colors.brand} />
      </View>
    );
  }

  if (permissionStatus === 'denied') {
    return (
      <View style={styles.center}>
        <Text style={styles.permissionTitle}>Location Required</Text>
        <Text style={styles.permissionBody}>
          Bubble uses your location to show who's nearby. Your exact location is never shared.
        </Text>
        <TouchableOpacity style={styles.settingsBtn} onPress={() => Linking.openSettings()}>
          <Text style={styles.settingsBtnText}>Open Settings</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const formatTime = (date) => {
    if (!date) return '--:--';
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <Animated.View style={[styles.container, enterStyle]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Nearby</Text>
        <Text style={styles.headerSub}>Last updated: {formatTime(lastUpdated)}</Text>
        {/* Segmented List / Map toggle */}
        <View style={styles.segmentRow}>
          <TouchableOpacity
            style={[styles.segmentPill, viewMode === 'list' && styles.segmentPillActive]}
            onPress={() => setViewMode('list')}
            accessibilityRole="button"
            accessibilityLabel="List view"
          >
            <Text style={[styles.segmentText, viewMode === 'list' && styles.segmentTextActive]}>
              List
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.segmentPill, viewMode === 'map' && styles.segmentPillActive]}
            onPress={() => setViewMode('map')}
            accessibilityRole="button"
            accessibilityLabel="Map view"
          >
            <Text style={[styles.segmentText, viewMode === 'map' && styles.segmentTextActive]}>
              Map
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {viewMode === 'map' && myLocation ? (
        <BubbleMapView
          users={users}
          myLocation={myLocation}
          signalledIds={signalledIds}
          onSignal={handleSignal}
        />
      ) : viewMode === 'map' && !myLocation ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={theme.colors.brand} />
        </View>
      ) : loading && users.length === 0 ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={theme.colors.brand} />
        </View>
      ) : (
        <FlatList
          data={users}
          keyExtractor={(item) => item.user_id}
          contentContainerStyle={users.length === 0 ? styles.emptyList : styles.list}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => refresh(true)}
              colors={[theme.colors.brand]}
              tintColor={theme.colors.brand}
            />
          }
          ListEmptyComponent={
            <Text style={styles.emptyText}>No one nearby right now</Text>
          }
          renderItem={({ item }) => (
            <View style={[styles.card, theme.shadows.card]}>
              <View style={styles.cardHeader}>
                <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                  {item.photos?.[0] ? (
                    <Image source={{ uri: item.photos[0] }} style={styles.cardThumb} />
                  ) : (
                    <View style={[styles.cardThumb, styles.cardThumbFallback]}>
                      <Text style={styles.cardThumbInitial}>
                        {item.display_name?.[0]?.toUpperCase()}
                      </Text>
                    </View>
                  )}
                  <View style={{ flex: 1 }}>
                    <Text style={styles.cardName}>
                      {item.display_name}, {item.age}
                    </Text>
                  </View>
                </View>
                <View style={[
                  styles.badge,
                  item.proximity_bucket === 'nearby' ? styles.badgeNearby : styles.badgeSameArea,
                ]}>
                  <Text style={[
                    styles.badgeText,
                    item.proximity_bucket === 'nearby' ? styles.badgeTextNearby : styles.badgeTextSameArea,
                  ]}>
                    {item.proximity_bucket === 'nearby' ? 'Nearby' : 'Same area'}
                  </Text>
                </View>
              </View>
              {item.bio ? (
                <Text style={styles.cardBio} numberOfLines={2} ellipsizeMode="tail">
                  {item.bio}
                </Text>
              ) : null}
              <TouchableOpacity
                style={[styles.signalBtn, signalledIds.has(item.user_id) && styles.signalBtnSent]}
                onPress={() => handleSignal(item.user_id)}
                disabled={signalledIds.has(item.user_id)}
                accessibilityRole="button"
                accessibilityLabel={signalledIds.has(item.user_id) ? 'Signal sent' : 'Send signal'}
              >
                <Text style={styles.signalBtnText}>
                  {signalledIds.has(item.user_id) ? 'Sent \u2713' : 'Signal'}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        />
      )}

      {error ? <Text style={styles.errorText}>{error}</Text> : null}
      <Toast key={toastKey} message={toastMsg} visible={!!toastMsg} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.bgBase },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.bgDim,
  },
  headerTitle: { fontSize: 24, fontWeight: '800', color: theme.colors.brand },
  headerSub: { fontSize: 12, color: theme.colors.textFaint, marginTop: 2 },
  segmentRow: {
    flexDirection: 'row',
    marginTop: 10,
    backgroundColor: theme.colors.bgDim,
    borderRadius: theme.radii.pill,
    padding: 3,
    alignSelf: 'flex-start',
  },
  segmentPill: {
    paddingVertical: 5,
    paddingHorizontal: 18,
    borderRadius: theme.radii.pill,
  },
  segmentPillActive: {
    backgroundColor: theme.colors.brand,
  },
  segmentText: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.textSecondary,
  },
  segmentTextActive: {
    color: '#fff',
  },
  list: { padding: 16 },
  emptyList: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  emptyText: { fontSize: 16, color: theme.colors.textFaint, textAlign: 'center' },
  card: {
    backgroundColor: theme.colors.bgSubtle,
    borderRadius: theme.radii.md,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: theme.colors.borderSubtle,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  cardThumb: {
    width: 52,
    height: 52,
    borderRadius: theme.radii.sm,
    marginRight: theme.spacing.md,
  },
  cardThumbFallback: {
    backgroundColor: theme.colors.bgDim,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardThumbInitial: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.textMuted,
  },
  cardName: { fontSize: 17, fontWeight: '700', color: theme.colors.textBody },
  cardBio: { fontSize: 14, color: '#666', marginTop: 8, lineHeight: 20 },
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
  permissionTitle: { fontSize: 20, fontWeight: '700', color: theme.colors.textBody, marginBottom: 12, textAlign: 'center' },
  permissionBody: { fontSize: 15, color: '#666', textAlign: 'center', lineHeight: 22, marginBottom: 24 },
  settingsBtn: {
    backgroundColor: theme.colors.brand,
    borderRadius: theme.radii.pill,
    paddingVertical: 12,
    paddingHorizontal: 28,
  },
  settingsBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  errorText: { color: '#c00', textAlign: 'center', padding: 12, fontSize: 13 },
  signalBtn: {
    marginTop: 10,
    alignSelf: 'flex-start',
    backgroundColor: theme.colors.brand,
    borderRadius: theme.radii.pill,
    paddingVertical: 8,
    paddingHorizontal: 20,
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
