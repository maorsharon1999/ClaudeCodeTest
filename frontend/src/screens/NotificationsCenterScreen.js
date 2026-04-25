import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { EmptyState } from '../components/ui';
import { theme } from '../theme';
import SkyBackground from '../components/visual/SkyBackground';
import BubbleField from '../components/visual/BubbleField';
import ScreenHeader from '../components/visual/ScreenHeader';
import GlassCard from '../components/visual/GlassCard';

export default function NotificationsCenterScreen({ navigation }) {
  return (
    <SkyBackground variant="dawn">
      <BubbleField />
      <View style={styles.flex}>
        <ScreenHeader
          title="Notifications"
          onBack={() => navigation.goBack()}
        />
        <View style={styles.content}>
          <GlassCard style={styles.emptyCard}>
            <View style={styles.emptyIconWrap}>
              <Ionicons name="notifications-outline" size={36} color={theme.colors.skyDeep} />
            </View>
            <Text style={styles.emptyTitle}>No notifications yet</Text>
            <Text style={styles.emptySubtitle}>New signals, matches, and updates will appear here</Text>
          </GlassCard>
        </View>
      </View>
    </SkyBackground>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.xl,
  },
  emptyCard: {
    padding: theme.spacing.xxl,
    alignItems: 'center',
    width: '100%',
  },
  emptyIconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: theme.colors.glassTint,
    borderWidth: 1.5,
    borderColor: theme.colors.glassBorder,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.lg,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: theme.colors.ink,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    color: theme.colors.inkMuted,
    textAlign: 'center',
    lineHeight: 20,
  },
});
