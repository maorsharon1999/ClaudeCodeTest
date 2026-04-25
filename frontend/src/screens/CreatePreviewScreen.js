import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Animated,
  StyleSheet,
} from 'react-native';
import MapView, { PROVIDER_GOOGLE } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { CATEGORY_ICONS } from '../constants/icons';
import BubbleAreaOverlay from '../components/BubbleAreaOverlay';
import mapDarkStyle from '../components/MapDarkStyle.json';
import { createBubble } from '../api/bubbles';
import { theme } from '../theme';
import { fadeInUp, fadeInUpStyle } from '../utils/animations';
import SkyBackground from '../components/visual/SkyBackground';
import BubbleField from '../components/visual/BubbleField';
import GlassCard from '../components/visual/GlassCard';
import GlassButton from '../components/visual/GlassButton';
import GlassChip from '../components/visual/GlassChip';
import ScreenHeader from '../components/visual/ScreenHeader';
import SectionLabel from '../components/visual/SectionLabel';

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
  const { category, title, description, durationH, location, visibility,
    shape_type, radius_m, shape_coords, center } = route.params;

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
        lat: center?.lat || (location ? location.lat : undefined),
        lng: center?.lng || (location ? location.lng : undefined),
        shape_type: shape_type || 'circle',
        radius_m: radius_m || 200,
        shape_coords: shape_coords || undefined,
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
    <SkyBackground variant="dawn">
      <BubbleField />
      <Animated.View style={[styles.flex, fadeInUpStyle(enterAnim)]}>
        <ScreenHeader
          title="Ready to float"
          onBack={() => navigation.goBack()}
          right={<GlassChip label="5 / 5" />}
        />
        <ScrollView
          contentContainerStyle={styles.container}
          showsVerticalScrollIndicator={false}
        >
          <GlassCard style={styles.summaryCard}>
            <View style={styles.categoryRow}>
              <View style={styles.categoryIconWrap}>
                <Ionicons name={iconName} size={28} color={theme.colors.skyDeep} />
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
            <View style={styles.rowDivider} />

            <DetailRow
              label="Area"
              value={
                shape_type === 'polygon'
                  ? 'Custom polygon'
                  : shape_type === 'rectangle'
                  ? 'Custom rectangle'
                  : `Circle, ~${radius_m || 200}m radius`
              }
            />

            {/* Mini-map preview */}
            {(center || location) && (
              <View style={styles.miniMapContainer}>
                <MapView
                  provider={PROVIDER_GOOGLE}
                  style={styles.miniMap}
                  customMapStyle={mapDarkStyle}
                  scrollEnabled={false}
                  zoomEnabled={false}
                  rotateEnabled={false}
                  pitchEnabled={false}
                  initialRegion={{
                    latitude: center?.lat || location?.lat || 32.08,
                    longitude: center?.lng || location?.lng || 34.78,
                    latitudeDelta: 0.008,
                    longitudeDelta: 0.008,
                  }}
                >
                  <BubbleAreaOverlay
                    bubble={{
                      lat: center?.lat || location?.lat || 32.08,
                      lng: center?.lng || location?.lng || 34.78,
                      shape_type: shape_type || 'circle',
                      radius_m: radius_m || 200,
                      shape_coords: shape_coords || null,
                    }}
                    selected
                  />
                </MapView>
              </View>
            )}
          </GlassCard>

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <GlassButton
            label={saving ? 'Creating...' : 'Float bubble'}
            onPress={handleCreate}
            variant="primary"
            size="lg"
            style={styles.createBtn}
          />
        </ScrollView>
      </Animated.View>
    </SkyBackground>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: { padding: theme.spacing.xl, paddingBottom: 100 },
  summaryCard: {
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.xl,
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: theme.spacing.lg,
  },
  categoryIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: theme.colors.glassTint,
    borderWidth: 1.5,
    borderColor: theme.colors.glassBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryInfo: { flex: 1 },
  categoryLabel: {
    fontSize: 12,
    color: theme.colors.skyDeep,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 4,
  },
  bubbleTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: theme.colors.ink,
  },
  divider: {
    height: 1,
    backgroundColor: theme.colors.glassBorder,
    marginBottom: theme.spacing.md,
  },
  rowDivider: {
    height: 1,
    backgroundColor: theme.colors.glassBorder,
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
    color: theme.colors.inkMuted,
    fontWeight: '600',
    minWidth: 90,
  },
  detailValue: {
    flex: 1,
    fontSize: 13,
    color: theme.colors.inkSoft,
    textAlign: 'right',
    fontWeight: '600',
  },
  errorText: {
    color: theme.colors.error,
    fontSize: 14,
    marginBottom: theme.spacing.md,
    textAlign: 'center',
  },
  miniMapContainer: {
    marginTop: theme.spacing.md,
    borderRadius: theme.radii.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: theme.colors.glassBorder,
  },
  miniMap: { height: 140, width: '100%' },
  createBtn: { marginTop: 8 },
});
