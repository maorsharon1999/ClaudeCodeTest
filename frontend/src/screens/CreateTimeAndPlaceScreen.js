import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  Animated,
  StyleSheet,
} from 'react-native';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { Input, Button, Chip, Header } from '../components/ui';
import { theme } from '../theme';
import { fadeInUp, fadeInUpStyle } from '../utils/animations';

const DURATION_OPTIONS = [
  { label: '1h', value: 1 },
  { label: '2h', value: 2 },
  { label: '4h', value: 4 },
  { label: '8h', value: 8 },
];

export default function CreateTimeAndPlaceScreen({ navigation, route }) {
  const { category } = route.params;

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [durationH, setDurationH] = useState(2);
  const [location, setLocation] = useState(null);
  const [locationError, setLocationError] = useState('');
  const [titleError, setTitleError] = useState('');

  const enterAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    fadeInUp(enterAnim, { duration: 320 }).start();
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          const loc = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
          });
          setLocation({ lat: loc.coords.latitude, lng: loc.coords.longitude });
        } else {
          setLocationError('Location permission denied. Enable it in settings.');
        }
      } catch {
        setLocationError('Could not detect location.');
      }
    })();
  }, []);

  function handleNext() {
    if (title.trim().length < 3) {
      setTitleError('Title must be at least 3 characters.');
      return;
    }
    setTitleError('');
    navigation.navigate('CreateVisibility', {
      category,
      title: title.trim(),
      description: description.trim(),
      durationH,
      location,
    });
  }

  const canProceed = title.trim().length >= 3 && !!location;

  return (
    <Animated.View style={[styles.flex, fadeInUpStyle(enterAnim)]}>
      <Header
        title="Details"
        subtitle="Step 2 of 4"
        onBack={() => navigation.goBack()}
      />
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Input
          label="Title *"
          placeholder="What's happening? (e.g. Study group at library)"
          value={title}
          onChangeText={(t) => {
            setTitle(t.slice(0, 60));
            if (titleError) setTitleError('');
          }}
          maxLength={60}
          style={styles.field}
        />
        {titleError ? <Text style={styles.fieldError}>{titleError}</Text> : null}
        <Text style={styles.charCount}>{title.length}/60</Text>

        <Input
          label="Description (optional)"
          placeholder="Add more details..."
          value={description}
          onChangeText={(t) => setDescription(t.slice(0, 300))}
          maxLength={300}
          multiline
          style={[styles.field, styles.textArea]}
        />
        <Text style={styles.charCount}>{description.length}/300</Text>

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

        <Text style={styles.label}>Location</Text>
        <View style={styles.locationRow}>
          <Ionicons
            name="location-outline"
            size={18}
            color={location ? theme.colors.cyan : theme.colors.textMuted}
          />
          <Text style={[styles.locationText, location && styles.locationReady]}>
            {locationError
              ? locationError
              : location
              ? 'Near your location'
              : 'Detecting your location...'}
          </Text>
        </View>

        <Button
          title="Next"
          onPress={handleNext}
          disabled={!canProceed}
          size="lg"
          style={styles.nextBtn}
        />
      </ScrollView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: theme.colors.bgDeep },
  container: { padding: theme.spacing.xl, paddingBottom: 48 },
  field: { marginBottom: 2 },
  textArea: { minHeight: 80 },
  fieldError: {
    color: theme.colors.error,
    fontSize: 12,
    marginTop: 4,
    marginBottom: 4,
  },
  charCount: {
    fontSize: 12,
    color: theme.colors.textFaint,
    textAlign: 'right',
    marginBottom: theme.spacing.md,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.textSecondary,
    marginBottom: 8,
    marginTop: 4,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: theme.spacing.md,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: theme.colors.bgSurface,
    borderRadius: theme.radii.md,
    borderWidth: 1,
    borderColor: theme.colors.borderDefault,
    marginBottom: theme.spacing.md,
  },
  locationText: {
    fontSize: 14,
    color: theme.colors.textMuted,
  },
  locationReady: {
    color: theme.colors.cyan,
    fontWeight: '600',
  },
  nextBtn: { marginTop: 24 },
});
