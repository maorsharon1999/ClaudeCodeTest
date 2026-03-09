import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { getThreads } from '../api/chat';

function relativeTime(isoString) {
  if (!isoString) return '';
  const diffMs = Date.now() - new Date(isoString).getTime();
  const diffSec = Math.floor(diffMs / 1000);
  if (diffSec < 60) return 'just now';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return diffMin + 'm ago';
  const diffHr = Math.floor(diffMin / 60);
  return diffHr + 'h ago';
}

export default function ChatsScreen({ navigation }) {
  const [threads, setThreads] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadThreads = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getThreads();
      setThreads(data);
    } catch (err) {
      setError('Could not load conversations. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadThreads();
    }, [loadThreads])
  );

  function renderThread({ item }) {
    const other = item.other_user || {};
    const name = other.display_name || '';
    const age = other.age ? ', ' + other.age : '';
    const msgBody = item.last_message?.body || '';
    const preview = msgBody ? msgBody.slice(0, 60) + (msgBody.length > 60 ? '…' : '') : '';
    const time = relativeTime(item.last_message?.sent_at);

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() =>
          navigation.navigate('Thread', {
            threadId: item.thread_id,
            displayName: other.display_name,
            otherUserId: other.user_id,
          })
        }
        accessibilityRole="button"
        accessibilityLabel={'Open conversation with ' + name}
      >
        <View style={styles.cardTop}>
          <Text style={styles.cardName}>{name + age}</Text>
          {time ? <Text style={styles.cardTime}>{time}</Text> : null}
        </View>
        {preview ? (
          <Text style={styles.cardPreview} numberOfLines={1} ellipsizeMode="tail">
            {preview}
          </Text>
        ) : null}
      </TouchableOpacity>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Chats</Text>
      </View>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      {loading && threads.length === 0 ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#6C47FF" />
        </View>
      ) : (
        <FlatList
          data={threads}
          keyExtractor={(item) => item.thread_id}
          contentContainerStyle={threads.length === 0 ? styles.emptyList : styles.list}
          renderItem={renderThread}
          ListEmptyComponent={
            !loading ? (
              <Text style={styles.emptyText}>
                {'No conversations yet.\nApprove a signal to start chatting.'}
              </Text>
            ) : null
          }
        />
      )}
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
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  list: { padding: 16 },
  emptyList: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  emptyText: { fontSize: 15, color: '#aaa', textAlign: 'center', lineHeight: 22 },
  errorText: { color: '#c00', textAlign: 'center', padding: 12, fontSize: 13 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#ebebeb',
  },
  cardTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  cardName: { fontSize: 17, fontWeight: '700', color: '#222' },
  cardTime: { fontSize: 12, color: '#aaa' },
  cardPreview: { fontSize: 14, color: '#666', marginTop: 6 },
});
