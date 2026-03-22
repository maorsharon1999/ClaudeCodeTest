import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Animated,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import client from '../api/client';
import { resolvePhotoUrl } from '../lib/photoUrl';
import { theme } from '../theme';
import { Header, Avatar, EmptyState, ErrorState } from '../components/ui';
import { fadeInUp, fadeInUpStyle } from '../utils/animations';

async function getBlockedUsers() {
  const { data } = await client.get('/blocks');
  return data.blocks;
}

async function unblockUser(blockedId) {
  await client.delete(`/blocks/${blockedId}`);
}

export default function BlockedUsersScreen({ navigation }) {
  const [blocks, setBlocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const enterAnim = useRef(new Animated.Value(0)).current;

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
      fadeInUp(enterAnim).start();
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

  function renderContent() {
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
          <ErrorState message={error} onRetry={load} />
        </View>
      );
    }

    if (blocks.length === 0) {
      return (
        <View style={styles.center}>
          <EmptyState
            icon="checkmark-circle-outline"
            title="No blocked users"
            subtitle="Your block list is clean"
          />
        </View>
      );
    }

    return (
      <FlatList
        data={blocks}
        keyExtractor={item => item.blocked_id}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        renderItem={({ item }) => {
          const photoUrl = resolvePhotoUrl(item.photos?.[0]);
          return (
            <View style={styles.row}>
              <Avatar
                uri={photoUrl}
                name={item.display_name}
                size={44}
                style={styles.avatar}
              />
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

  return (
    <View style={styles.screen}>
      <Header title="Blocked Users" onBack={() => navigation.goBack()} />
      <Animated.View style={[styles.list, fadeInUpStyle(enterAnim)]}>
        {renderContent()}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: theme.colors.bgDeep,
  },
  list: {
    flex: 1,
    backgroundColor: theme.colors.bgDeep,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: theme.colors.borderSubtle,
    marginLeft: 72,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: theme.colors.bgSurface,
  },
  avatar: {
    marginRight: 12,
  },
  name: { flex: 1, fontSize: 16, color: theme.colors.textPrimary },
  unblockBtn: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: theme.radii.pill,
    borderWidth: 1,
    borderColor: theme.colors.brand,
    backgroundColor: theme.colors.brandMuted,
  },
  unblockText: { fontSize: 14, color: theme.colors.brand, fontWeight: '600' },
});
