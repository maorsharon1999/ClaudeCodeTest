import React from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CATEGORY_ICONS } from '../constants/icons';
import { timeRemaining } from '../utils/timeFormatters';
import { formatDistance } from '../utils/timeFormatters';
import { theme } from '../theme';
import GlassButton from './visual/GlassButton';

export default function BubblePeekCard({ bubble, onJoin, onDetails, joining }) {
  if (!bubble) return null;

  const iconName = CATEGORY_ICONS[bubble.category] || CATEGORY_ICONS.Other;

  return (
    <View style={styles.card}>
      <View style={styles.handle} />
      <View style={styles.header}>
        <View style={styles.iconCircle}>
          <Ionicons name={iconName} size={22} color={theme.colors.brand} />
        </View>
        <View style={styles.headerInfo}>
          <Text style={styles.title} numberOfLines={2}>{bubble.title}</Text>
          <View style={styles.meta}>
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryText}>{bubble.category}</Text>
            </View>
            <Text style={styles.metaText}>
              <Ionicons name="people-outline" size={12} color={theme.colors.textMuted} />
              {' '}{bubble.member_count <= 2 ? 'A few' : bubble.member_count}
              {' '}  {timeRemaining(bubble.expires_at)}
            </Text>
          </View>
        </View>
      </View>

      {bubble.description ? (
        <Text style={styles.desc} numberOfLines={2}>{bubble.description}</Text>
      ) : null}

      {bubble.distance_m != null && (
        <Text style={styles.distance}>
          <Ionicons name="location-outline" size={13} color={theme.colors.textMuted} />
          {' '}{formatDistance(bubble.distance_m)}
          {bubble.radius_m ? `  ~${bubble.radius_m}m area` : ''}
        </Text>
      )}

      <View style={styles.actions}>
        <GlassButton
          variant="ghost"
          size="md"
          onPress={onDetails}
          style={styles.detailsBtnFlex}
          accessibilityRole="button"
          accessibilityLabel="View details"
        >
          Details
        </GlassButton>
        <GlassButton
          variant="primary"
          size="md"
          onPress={onJoin}
          disabled={joining}
          style={styles.joinBtnFlex}
          accessibilityRole="button"
          accessibilityLabel="Join this bubble"
        >
          {joining ? <ActivityIndicator color="#fff" size="small" /> : 'Join Bubble'}
        </GlassButton>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'rgba(255,255,255,0.82)',
    borderTopLeftRadius: theme.radii.xl,
    borderTopRightRadius: theme.radii.xl,
    padding: 20,
    paddingTop: 12,
    borderTopWidth: 1.5,
    borderColor: theme.colors.glassBorder,
    ...theme.shadows.card,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: theme.colors.textFaint,
    alignSelf: 'center',
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: theme.colors.brandMuted,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  headerInfo: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.textPrimary,
    marginBottom: 6,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryBadge: {
    backgroundColor: theme.colors.brandMuted,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.brand,
  },
  metaText: {
    fontSize: 12,
    color: theme.colors.textMuted,
  },
  desc: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    lineHeight: 20,
    marginTop: 12,
  },
  distance: {
    fontSize: 13,
    color: theme.colors.textMuted,
    marginTop: 8,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  detailsBtnFlex: { flex: 1 },
  joinBtnFlex: { flex: 2 },
});
