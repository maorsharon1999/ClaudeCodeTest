import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  StyleSheet,
  Linking,
  RefreshControl,
} from 'react-native';
import * as Location from 'expo-location';
import { updateLocation, getNearbyUsers } from '../api/discovery';

export default function DiscoveryScreen() {
  const [users, setUsers] = useState([]);
  const [permissionStatus, setPermissionStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const refresh = useCallback(async (showRefreshing = false) => {
    if (showRefreshing) setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      const pos = await Location.getCurrentPositionAsync({});
      await updateLocation(pos.coords.latitude, pos.coords.longitude);
      const nearby = await getNearbyUsers();
      setUsers(nearby);
      setLastUpdated(new Date());
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
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Nearby</Text>
        <Text style={styles.headerSub}>Last updated: {formatTime(lastUpdated)}</Text>
      </View>

      {loading && users.length === 0 ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#6C47FF" />
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
              colors={['#6C47FF']}
              tintColor="#6C47FF"
            />
          }
          ListEmptyComponent={
            <Text style={styles.emptyText}>No one nearby right now</Text>
          }
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardName}>
                  {item.display_name}, {item.age}
                </Text>
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
            </View>
          )}
        />
      )}

      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  headerTitle: { fontSize: 24, fontWeight: '800', color: '#6C47FF' },
  headerSub: { fontSize: 12, color: '#aaa', marginTop: 2 },
  list: { padding: 16 },
  emptyList: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  emptyText: { fontSize: 16, color: '#aaa', textAlign: 'center' },
  card: {
    backgroundColor: '#fafafa',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#ebebeb',
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  cardName: { fontSize: 17, fontWeight: '700', color: '#222' },
  cardBio: { fontSize: 14, color: '#666', marginTop: 8, lineHeight: 20 },
  badge: {
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  badgeNearby: { backgroundColor: '#EDE9FF' },
  badgeSameArea: { backgroundColor: '#f0f0f0' },
  badgeText: { fontSize: 12, fontWeight: '600' },
  badgeTextNearby: { color: '#6C47FF' },
  badgeTextSameArea: { color: '#888' },
  permissionTitle: { fontSize: 20, fontWeight: '700', color: '#222', marginBottom: 12, textAlign: 'center' },
  permissionBody: { fontSize: 15, color: '#666', textAlign: 'center', lineHeight: 22, marginBottom: 24 },
  settingsBtn: {
    backgroundColor: '#6C47FF',
    borderRadius: 24,
    paddingVertical: 12,
    paddingHorizontal: 28,
  },
  settingsBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  errorText: { color: '#c00', textAlign: 'center', padding: 12, fontSize: 13 },
});
