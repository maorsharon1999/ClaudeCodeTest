import React from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CATEGORY_ICONS } from '../constants/icons';
import { timeRemaining } from '../utils/timeFormatters';
import { formatDistance } from '../utils/timeFormatters';
import { theme } from '../theme';

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
        <TouchableOpacity
          style={styles.detailsBtn}
          onPress={onDetails}
          accessibilityRole="button"
          accessibilityLabel="View details"
        >
          <Text style={styles.detailsBtnText}>Details</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.joinBtn}
          onPress={onJoin}
          disabled={joining}
          accessibilityRole="button"
          accessibilityLabel="Join this bubble"
        >
          {joining ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.joinBtnText}>Join Bubble</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.bgElevated,
    borderTopLeftRadius: theme.radii.xl,
    borderTopRightRadius: theme.radii.xl,
    padding: 20,
    paddingTop: 12,
    borderTopWidth: 1,
    borderColor: theme.colors.borderDefault,
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
  detailsBtn: {
    flex: 1,
    height: 48,
    borderRadius: theme.radii.md,
    borderWidth: 1,
    borderColor: theme.colors.borderDefault,
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailsBtnText: {
    color: theme.colors.textPrimary,
    fontSize: 15,
    fontWeight: '600',
  },
  joinBtn: {
    flex: 2,
    height: 48,
    backgroundColor: theme.colors.brand,
    borderRadius: theme.radii.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  joinBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
});
