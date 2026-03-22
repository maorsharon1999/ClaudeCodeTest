import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  Animated,
  StyleSheet,
  Platform,
} from 'react-native';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { createBubble } from '../api/bubbles';
import { CATEGORY_ICONS } from '../constants/icons';
import { Input, Button, Chip, Header } from '../components/ui';
import { theme } from '../theme';

const CATEGORIES = [
  'Social', 'Study', 'Food & Drinks', 'Sports', 'Music',
  'Nightlife', 'Outdoors', 'Gaming', 'Tech', 'Art', 'Other',
];

const DURATION_OPTIONS = [
  { label: '1h', value: 1 },
  { label: '2h', value: 2 },
  { label: '4h', value: 4 },
  { label: '8h', value: 8 },
];

export default function CreateBubbleScreen({ navigation }) {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [durationH, setDurationH] = useState(4);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [location, setLocation] = useState(null);

  const enterAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(enterAnim, { toValue: 1, duration: 320, useNativeDriver: true }).start();
  }, []);
  const enterStyle = {
    opacity: enterAnim,
    transform: [{ translateY: enterAnim.interpolate({ inputRange: [0, 1], outputRange: [16, 0] }) }],
  };

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        setLocation({ lat: loc.coords.latitude, lng: loc.coords.longitude });
      }
    })();
  }, []);

  const isValid = title.trim().length >= 3 && category && location;

  async function handleCreate() {
    if (!isValid || saving) return;
    setSaving(true);
    setError('');
    try {
      const bubble = await createBubble({
        title: title.trim(),
        category,
        description: description.trim() || undefined,
        duration_h: durationH,
        lat: location.lat,
        lng: location.lng,
      });
      // Navigate to chat within RadarStack
      navigation.navigate('RadarStack', {
        screen: 'BubbleChat',
        params: { bubbleId: bubble.id, bubbleTitle: bubble.title },
      });
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Failed to create bubble. Try again.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Animated.View style={[styles.flex, enterStyle]}>
      <Header
        title="Create Bubble"
        onBack={() => navigation.goBack()}
      />
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={styles.subtitle}>Start something nearby for others to join.</Text>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <Input
          label="Title *"
          placeholder="What's happening? (e.g. Study group at library)"
          value={title}
          onChangeText={(t) => setTitle(t.slice(0, 60))}
          maxLength={60}
          style={styles.field}
        />

        <Text style={styles.label}>Category *</Text>
        <View style={styles.chipRow}>
          {CATEGORIES.map((cat) => {
            const iconName = CATEGORY_ICONS[cat] || CATEGORY_ICONS.Other;
            return (
              <Chip
                key={cat}
                label={cat}
                selected={category === cat}
                onPress={() => setCategory(category === cat ? '' : cat)}
                icon={
                  <Ionicons
                    name={iconName}
                    size={14}
                    color={category === cat ? theme.colors.brand : theme.colors.textMuted}
                  />
                }
              />
            );
          })}
        </View>

        <Input
          label="Description (optional)"
          placeholder="Add more details..."
          value={description}
          onChangeText={(t) => setDescription(t.slice(0, 300))}
          maxLength={300}
          multiline
          style={styles.field}
        />

        <Text style={styles.label}>Duration</Text>
        <View style={styles.chipRow}>
          {DURATION_OPTIONS.map((opt) => (
            <Chip
              key={opt.value}
              label={opt.label}
              selected={durationH === opt.value}
              onPress={() => setDurationH(opt.value)}
            />
          ))}
        </View>

        {!location && (
          <Text style={styles.locationWarn}>Waiting for location permission...</Text>
        )}

        <Button
          title="Create Bubble"
          onPress={handleCreate}
          loading={saving}
          disabled={!isValid}
          size="lg"
          style={styles.createBtn}
        />
      </ScrollView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: theme.colors.bgDeep },
  container: { padding: 24, paddingBottom: 48 },
  subtitle: {
    fontSize: 15,
    color: theme.colors.textSecondary,
    marginBottom: 20,
  },
  errorText: {
    color: theme.colors.error,
    fontSize: 14,
    marginBottom: 12,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.textSecondary,
    marginBottom: 8,
    marginTop: 16,
  },
  field: { marginBottom: 8 },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
  },
  locationWarn: {
    color: theme.colors.textMuted,
    fontSize: 13,
    marginTop: 12,
    textAlign: 'center',
  },
  createBtn: { marginTop: 32 },
});
