import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Header, EmptyState } from '../components/ui';
import { theme } from '../theme';

export default function NotificationsCenterScreen({ navigation }) {
  return (
    <View style={styles.container}>
      <Header
        title="Notifications"
        onBack={() => navigation.goBack()}
      />
      <View style={styles.content}>
        <EmptyState
          icon="notifications-outline"
          title="No notifications yet"
          subtitle="New signals, matches, and updates will appear here"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.bgDeep },
  content: { flex: 1, justifyContent: 'center' },
});
