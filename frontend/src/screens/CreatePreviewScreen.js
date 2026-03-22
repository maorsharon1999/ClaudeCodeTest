import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Animated,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CATEGORY_ICONS } from '../constants/icons';
import { Card, Button, Header } from '../components/ui';
import { createBubble } from '../api/bubbles';
import { theme } from '../theme';
import { fadeInUp, fadeInUpStyle } from '../utils/animations';

const VISIBILITY_LABELS = {
  public: 'Public',
  friends: 'Friends Only',
  invite: 'Invite Only',
};

function DetailRow({ label, value }) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  );
}

export default function CreatePreviewScreen({ navigation, route }) {
  const { category, title, description, durationH, location, visibility } = route.params;

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const enterAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    fadeInUp(enterAnim, { duration: 320 }).start();
  }, []);

  async function handleCreate() {
    if (saving) return;
    setSaving(true);
    setError('');
    try {
      const bubble = await createBubble({
        title,
        category,
        description: description || undefined,
        duration_h: durationH,
        lat: location ? location.lat : undefined,
        lng: location ? location.lng : undefined,
      });
      navigation.navigate('RadarStack', {
        screen: 'BubbleChat',
        params: { bubbleId: bubble.id, bubbleTitle: bubble.title },
      });
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Failed to create bubble. Try again.');
      setSaving(false);
    }
  }

  const iconName = CATEGORY_ICONS[category] || CATEGORY_ICONS.Other;

  return (
    <Animated.View style={[styles.flex, fadeInUpStyle(enterAnim)]}>
      <Header
        title="Preview"
        subtitle="Step 4 of 4"
        onBack={() => navigation.goBack()}
      />
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.hint}>Review your bubble before publishing.</Text>

        <Card style={styles.summaryCard}>
          <View style={styles.categoryRow}>
            <View style={styles.categoryIcon}>
              <Ionicons name={iconName} size={28} color={theme.colors.brand} />
            </View>
            <View style={styles.categoryInfo}>
              <Text style={styles.categoryLabel}>{category}</Text>
              <Text style={styles.bubbleTitle}>{title}</Text>
            </View>
          </View>

          <View style={styles.divider} />

          {description ? (
            <>
              <DetailRow label="Description" value={description} />
              <View style={styles.rowDivider} />
            </>
          ) : null}

          <DetailRow
            label="Duration"
            value={durationH === 1 ? '1 hour' : `${durationH} hours`}
          />
          <View style={styles.rowDivider} />

          <DetailRow
            label="Visibility"
            value={VISIBILITY_LABELS[visibility] || visibility}
          />
          <View style={styles.rowDivider} />

          <DetailRow
            label="Location"
            value={location ? 'Near your location' : 'Location unavailable'}
          />
        </Card>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <Button
          title="Create Bubble"
          onPress={handleCreate}
          loading={saving}
          disabled={saving}
          size="lg"
          style={styles.createBtn}
        />
      </ScrollView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: theme.colors.bgDeep },
  container: { padding: theme.spacing.xl, paddingBottom: 48 },
  hint: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xl,
  },
  summaryCard: {
    marginBottom: theme.spacing.xl,
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: theme.spacing.lg,
  },
  categoryIcon: {
    width: 52,
    height: 52,
    borderRadius: theme.radii.sm,
    backgroundColor: theme.colors.brandMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryInfo: {
    flex: 1,
  },
  categoryLabel: {
    fontSize: 12,
    color: theme.colors.brand,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  bubbleTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.textPrimary,
  },
  divider: {
    height: 1,
    backgroundColor: theme.colors.borderDefault,
    marginBottom: theme.spacing.md,
  },
  rowDivider: {
    height: 1,
    backgroundColor: theme.colors.borderDefault,
    marginVertical: theme.spacing.sm,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
    paddingVertical: 2,
  },
  detailLabel: {
    fontSize: 13,
    color: theme.colors.textMuted,
    fontWeight: '600',
    minWidth: 90,
  },
  detailValue: {
    flex: 1,
    fontSize: 13,
    color: theme.colors.textBody,
    textAlign: 'right',
  },
  errorText: {
    color: theme.colors.error,
    fontSize: 14,
    marginBottom: theme.spacing.md,
    textAlign: 'center',
  },
  createBtn: { marginTop: 8 },
});
