import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Image,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import client from '../api/client';
import { theme } from '../theme';

async function getBlockedUsers() {
  const { data } = await client.get('/blocks');
  return data.blocks;
}

async function unblockUser(blockedId) {
  await client.delete(`/blocks/${blockedId}`);
}

export default function BlockedUsersScreen() {
  const [blocks, setBlocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const list = await getBlockedUsers();
      setBlocks(list);
    } catch {
      setError('Could not load blocked users.');
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      load();
    }, [load])
  );

  function handleUnblock(item) {
    Alert.alert(
      'Unblock',
      `Unblock ${item.display_name || 'this user'}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Unblock',
          onPress: async () => {
            try {
              await unblockUser(item.blocked_id);
              setBlocks(prev => prev.filter(b => b.blocked_id !== item.blocked_id));
            } catch {
              Alert.alert('Error', 'Could not unblock. Please try again.');
            }
          },
        },
      ]
    );
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={theme.colors.brand} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  if (blocks.length === 0) {
    return (
      <View style={styles.center}>
        <Text style={styles.emptyText}>No blocked users.</Text>
      </View>
    );
  }

  return (
    <FlatList
      style={styles.list}
      data={blocks}
      keyExtractor={item => item.blocked_id}
      ItemSeparatorComponent={() => <View style={styles.separator} />}
      renderItem={({ item }) => {
        const apiBase = process.env.EXPO_PUBLIC_API_URL || '';
        const host = apiBase ? apiBase.replace('/api/v1', '') : '';
        const rawPhoto = item.photos?.[0];
        const photoUrl = rawPhoto && host ? rawPhoto.replace(/^http:\/\/localhost:\d+/, host) : rawPhoto;

        return (
          <View style={styles.row}>
            {photoUrl ? (
              <Image source={{ uri: photoUrl }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, styles.avatarFallback]}>
                <Text style={styles.avatarInitial}>
                  {(item.display_name || '?')[0].toUpperCase()}
                </Text>
              </View>
            )}
            <Text style={styles.name}>{item.display_name || 'Unknown'}</Text>
            <TouchableOpacity
              style={styles.unblockBtn}
              onPress={() => handleUnblock(item)}
              accessibilityRole="button"
              accessibilityLabel={`Unblock ${item.display_name}`}
            >
              <Text style={styles.unblockText}>Unblock</Text>
            </TouchableOpacity>
          </View>
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.bgBase,
  },
  errorText: { fontSize: 15, color: theme.colors.error },
  emptyText: { fontSize: 15, color: theme.colors.textMuted },
  list: { flex: 1, backgroundColor: theme.colors.bgBase },
  separator: { height: StyleSheet.hairlineWidth, backgroundColor: theme.colors.borderSubtle, marginLeft: 72 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginRight: 12,
  },
  avatarFallback: {
    backgroundColor: theme.colors.bgWash,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitial: { fontSize: 18, color: theme.colors.textSecondary },
  name: { flex: 1, fontSize: 16, color: theme.colors.textPrimary },
  unblockBtn: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: theme.radii.pill,
    borderWidth: 1,
    borderColor: theme.colors.brand,
  },
  unblockText: { fontSize: 14, color: theme.colors.brand, fontWeight: '600' },
});
