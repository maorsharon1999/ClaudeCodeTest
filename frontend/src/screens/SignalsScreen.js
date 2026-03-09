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
import { getIncomingSignals, getOutgoingSignals, respondSignal } from '../api/signals';

function Toast({ message, visible }) {
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
        Animated.delay(2200),
        Animated.timing(opacity, { toValue: 0, duration: 300, useNativeDriver: true }),
      ]).start();
    }
  }, [visible, message, opacity]);

  return (
    <Animated.View style={[toastStyles.toast, { opacity }]} pointerEvents="none">
      <Text style={toastStyles.toastText}>{message}</Text>
    </Animated.View>
  );
}

export default function SignalsScreen() {
  const [incoming, setIncoming] = useState([]);
  const [outgoing, setOutgoing] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [toastMsg, setToastMsg] = useState('');
  const [toastKey, setToastKey] = useState(0);

  function showToast(msg) {
    setToastMsg(msg);
    setToastKey((k) => k + 1);
  }

  const loadSignals = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [incomingData, outgoingData] = await Promise.all([
        getIncomingSignals(),
        getOutgoingSignals(),
      ]);
      setIncoming(incomingData);
      setOutgoing(outgoingData);
    } catch (err) {
      setError('Could not load signals. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadSignals();
    }, [loadSignals])
  );

  async function handleApprove(signal) {
    const prevIncoming = incoming;
    const prevOutgoing = outgoing;
    setIncoming((prev) => prev.filter((s) => s.id !== signal.id));
    setOutgoing((prev) => [...prev, { ...signal, state: 'approved', recipient: signal.sender }]);
    try {
      await respondSignal(signal.id, 'approve');
    } catch (err) {
      setIncoming(prevIncoming);
      setOutgoing(prevOutgoing);
      showToast('Could not approve. Try again.');
    }
  }

  async function handleDecline(signal) {
    const prevIncoming = incoming;
    setIncoming((prev) => prev.filter((s) => s.id !== signal.id));
    try {
      await respondSignal(signal.id, 'decline');
    } catch (err) {
      setIncoming(prevIncoming);
      showToast('Could not decline. Try again.');
    }
  }

  const matched = outgoing.filter((s) => s.state === 'approved');
  const pending = outgoing.filter((s) => s.state === 'pending');

  function ProximityBadge({ bucket }) {
    const isNearby = bucket === 'nearby';
    return (
      <View style={[styles.badge, isNearby ? styles.badgeNearby : styles.badgeSameArea]}>
        <Text style={[styles.badgeText, isNearby ? styles.badgeTextNearby : styles.badgeTextSameArea]}>
          {isNearby ? 'Nearby' : 'Same area'}
        </Text>
      </View>
    );
  }

  function renderIncomingCard({ item }) {
    const user = item.sender || {};
    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardName}>
            {user.display_name}{user.age ? ', ' + user.age : ''}
          </Text>
          <ProximityBadge bucket={item.proximity_bucket} />
        </View>
        {user.bio ? (
          <Text style={styles.cardBio} numberOfLines={2} ellipsizeMode="tail">
            {user.bio}
          </Text>
        ) : null}
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={styles.approveBtn}
            onPress={() => handleApprove(item)}
            accessibilityRole="button"
            accessibilityLabel="Approve signal"
          >
            <Text style={styles.approveBtnText}>{'Approve \u2713'}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.declineBtn}
            onPress={() => handleDecline(item)}
            accessibilityRole="button"
            accessibilityLabel="Decline signal"
          >
            <Text style={styles.declineBtnText}>{'Decline \u2717'}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  function renderMatchedCard({ item }) {
    const user = item.recipient || {};
    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardName}>
            {user.display_name}{user.age ? ', ' + user.age : ''}
          </Text>
          <ProximityBadge bucket={item.proximity_bucket} />
        </View>
        <Text style={styles.matchedLabel}>Matched</Text>
      </View>
    );
  }

  function renderPendingCard({ item }) {
    const user = item.recipient || {};
    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardName}>
            {user.display_name}{user.age ? ', ' + user.age : ''}
          </Text>
          <ProximityBadge bucket={item.proximity_bucket} />
        </View>
        <Text style={styles.waitingLabel}>Waiting</Text>
      </View>
    );
  }

  const showIncomingSection = incoming.length > 0 || loading;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Signals</Text>
      </View>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      {showIncomingSection && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Incoming</Text>
          {loading && incoming.length === 0 ? (
            <ActivityIndicator size="small" color="#6C47FF" style={styles.spinner} />
          ) : incoming.length === 0 ? (
            <Text style={styles.emptyText}>No new signals yet.</Text>
          ) : (
            <FlatList
              data={incoming}
              keyExtractor={(item) => item.id}
              renderItem={renderIncomingCard}
              scrollEnabled={false}
            />
          )}
        </View>
      )}

      {matched.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Matched</Text>
          <FlatList
            data={matched}
            keyExtractor={(item) => item.id}
            renderItem={renderMatchedCard}
            scrollEnabled={false}
          />
        </View>
      )}

      {pending.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Pending</Text>
          <FlatList
            data={pending}
            keyExtractor={(item) => item.id}
            renderItem={renderPendingCard}
            scrollEnabled={false}
          />
        </View>
      )}

      {!loading && incoming.length === 0 && matched.length === 0 && pending.length === 0 && !error && (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No new signals yet.</Text>
        </View>
      )}

      <Toast key={toastKey} message={toastMsg} visible={!!toastMsg} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  headerTitle: { fontSize: 24, fontWeight: '800', color: '#6C47FF' },
  section: { paddingHorizontal: 16, paddingTop: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#333', marginBottom: 10 },
  spinner: { marginVertical: 16 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#ebebeb',
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  cardName: { fontSize: 17, fontWeight: '700', color: '#222' },
  cardBio: { fontSize: 14, color: '#666', marginTop: 8, lineHeight: 20 },
  actionRow: { flexDirection: 'row', marginTop: 12, gap: 10 },
  approveBtn: {
    backgroundColor: '#4CAF50',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  approveBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  declineBtn: {
    backgroundColor: '#fff',
    borderColor: '#ddd',
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  declineBtnText: { color: '#333', fontWeight: '600', fontSize: 14 },
  matchedLabel: { marginTop: 6, fontSize: 13, fontWeight: '700', color: '#4CAF50' },
  waitingLabel: { marginTop: 6, fontSize: 13, fontWeight: '600', color: '#888' },
  badge: { borderRadius: 12, paddingHorizontal: 10, paddingVertical: 3 },
  badgeNearby: { backgroundColor: '#EDE9FF' },
  badgeSameArea: { backgroundColor: '#f0f0f0' },
  badgeText: { fontSize: 12, fontWeight: '600' },
  badgeTextNearby: { color: '#6C47FF' },
  badgeTextSameArea: { color: '#888' },
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  emptyText: { fontSize: 15, color: '#aaa', textAlign: 'center' },
  errorText: { color: '#c00', textAlign: 'center', padding: 12, fontSize: 13 },
});

const toastStyles = StyleSheet.create({
  toast: {
    position: 'absolute',
    bottom: 90,
    left: 24,
    right: 24,
    backgroundColor: '#323232',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  toastText: { color: '#fff', fontSize: 14 },
});
