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
import { theme } from '../theme';
import { fadeInUp, fadeInUpStyle } from '../utils/animations';
import SkyBackground from '../components/visual/SkyBackground';
import BubbleField from '../components/visual/BubbleField';
import GlassCard from '../components/visual/GlassCard';
import GlassInput from '../components/visual/GlassInput';
import GlassButton from '../components/visual/GlassButton';
import GlassChip from '../components/visual/GlassChip';
import ScreenHeader from '../components/visual/ScreenHeader';
import SectionLabel from '../components/visual/SectionLabel';

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
    navigation.navigate('CreateArea', {
      category,
      title: title.trim(),
      description: description.trim(),
      durationH,
      location,
    });
  }

  const canProceed = title.trim().length >= 3 && !!location;

  return (
    <SkyBackground variant="sky">
      <BubbleField />
      <Animated.View style={[styles.flex, fadeInUpStyle(enterAnim)]}>
        <ScreenHeader
          title="Details"
          subtitle="Step 2 of 5"
          onBack={() => navigation.goBack()}
          right={<GlassChip label="2 / 5" />}
        />
        <ScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <GlassCard style={styles.formCard}>
            <GlassInput
              label="Title"
              placeholder="What's happening? (e.g. Study group at library)"
              value={title}
              onChangeText={(t) => {
                setTitle(t.slice(0, 60));
                if (titleError) setTitleError('');
              }}
              maxLength={60}
              error={titleError}
            />
            <Text style={styles.charCount}>{title.length}/60</Text>

            <GlassInput
              label="Description (optional)"
              placeholder="Add more details..."
              value={description}
              onChangeText={(t) => setDescription(t.slice(0, 300))}
              maxLength={300}
              multiline
            />
            <Text style={styles.charCount}>{description.length}/300</Text>
          </GlassCard>

          <SectionLabel style={styles.sectionLabel}>Duration</SectionLabel>
          <GlassCard style={styles.chipCard}>
            <View style={styles.chipRow}>
              {DURATION_OPTIONS.map((opt) => (
                <GlassChip
                  key={opt.value}
                  label={opt.label}
                  selected={durationH === opt.value}
                  onPress={() => setDurationH(opt.value)}
                />
              ))}
            </View>
          </GlassCard>

          <SectionLabel style={styles.sectionLabel}>Location</SectionLabel>
          <GlassCard style={styles.locationCard}>
            <Ionicons
              name="location-outline"
              size={18}
              color={location ? theme.colors.mintDeep : theme.colors.inkMuted}
              style={styles.locationIcon}
            />
            <Text style={[styles.locationText, location && styles.locationReady]}>
              {locationError
                ? locationError
                : location
                ? 'Near your location'
                : 'Detecting your location...'}
            </Text>
          </GlassCard>

          <GlassButton
            label="Next"
            onPress={handleNext}
            variant={canProceed ? 'primary' : 'ghost'}
            size="lg"
            style={styles.nextBtn}
          />
        </ScrollView>
      </Animated.View>
    </SkyBackground>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: { padding: theme.spacing.xl, paddingBottom: 100 },
  formCard: { padding: theme.spacing.lg, marginBottom: theme.spacing.md },
  charCount: {
    fontSize: 12,
    color: theme.colors.inkFaint,
    textAlign: 'right',
    marginBottom: theme.spacing.md,
  },
  sectionLabel: { marginBottom: theme.spacing.sm },
  chipCard: { padding: theme.spacing.md, marginBottom: theme.spacing.md },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  locationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  locationIcon: { marginRight: 10 },
  locationText: {
    fontSize: 14,
    color: theme.colors.inkMuted,
    flex: 1,
  },
  locationReady: {
    color: theme.colors.mintDeep,
    fontWeight: '600',
  },
  nextBtn: { marginTop: 8 },
});
