import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Platform } from 'react-native';
import { Chip, Button } from '../../components/ui';
import { theme } from '../../theme';

const DISTANCE_OPTIONS = ['1 km', '5 km', '10 km', 'Any'];
const AGE_OPTIONS = ['18-25', '25-35', '35+', 'Any age'];

export default function DiscoveryPreferencesScreen({ route, navigation }) {
  const params = route.params || {};
  const [distance, setDistance] = useState('');
  const [ageRange, setAgeRange] = useState('');

  function handleContinue() {
    navigation.navigate('LocationPermission', { ...params, distance, ageRange });
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={styles.step}>Step 5 of 7</Text>
      <Text style={styles.title}>Discovery Preferences</Text>
      <Text style={styles.subtitle}>Help us show you the most relevant bubbles.</Text>

      <Text style={styles.sectionLabel}>Distance</Text>
      <Text style={styles.sectionHint}>How far should we look for nearby bubbles?</Text>
      <View style={styles.chipRow}>
        {DISTANCE_OPTIONS.map((opt) => (
          <Chip
            key={opt}
            label={opt}
            selected={distance === opt}
            onPress={() => setDistance(distance === opt ? '' : opt)}
            style={styles.chip}
          />
        ))}
      </View>

      <Text style={[styles.sectionLabel, { marginTop: 28 }]}>Age Range</Text>
      <Text style={styles.sectionHint}>What age range are you interested in meeting?</Text>
      <View style={styles.chipRow}>
        {AGE_OPTIONS.map((opt) => (
          <Chip
            key={opt}
            label={opt}
            selected={ageRange === opt}
            onPress={() => setAgeRange(ageRange === opt ? '' : opt)}
            style={styles.chip}
          />
        ))}
      </View>

      <View style={styles.footer}>
        <Button title="Continue" onPress={handleContinue} size="lg" />
        <View style={styles.progress}>
          {[0, 1, 2, 3, 4, 5, 6].map((i) => (
            <View key={i} style={[styles.dot, i === 5 && styles.dotActive]} />
          ))}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.bgDeep },
  content: {
    padding: 24,
    paddingTop: Platform.OS === 'ios' ? 64 : 32,
    paddingBottom: 48,
  },
  step: { fontSize: 13, color: theme.colors.brand, fontWeight: '600', marginBottom: 8 },
  title: { ...theme.typography.titleMd, color: theme.colors.textPrimary, marginBottom: 8 },
  subtitle: { fontSize: 15, color: theme.colors.textSecondary, marginBottom: 32 },
  sectionLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.textPrimary,
    marginBottom: 6,
  },
  sectionHint: { fontSize: 13, color: theme.colors.textMuted, marginBottom: 12 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { marginBottom: 4 },
  footer: { marginTop: 40 },
  progress: { flexDirection: 'row', justifyContent: 'center', gap: 8, marginTop: 20 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: theme.colors.bgElevated },
  dotActive: { backgroundColor: theme.colors.brand, width: 24 },
});
