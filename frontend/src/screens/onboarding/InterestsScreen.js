import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CATEGORY_ICONS } from '../../constants/icons';
import { Chip, Button } from '../../components/ui';
import { theme } from '../../theme';

const INTEREST_OPTIONS = [
  'Social', 'Study', 'Food & Drinks', 'Sports', 'Music',
  'Nightlife', 'Outdoors', 'Gaming', 'Tech', 'Art',
];

const VIBE_OPTIONS = ['Chill', 'Adventurous', 'Intellectual', 'Party', 'Creative'];
const INTENT_OPTIONS = ['Friends', 'Dating', 'Networking', 'Open to anything'];

export default function InterestsScreen({ route, navigation }) {
  const params = route.params || {};
  const [interests, setInterests] = useState([]);
  const [vibes, setVibes] = useState([]);
  const [intent, setIntent] = useState('');

  function toggleInterest(tag) {
    setInterests((prev) =>
      prev.includes(tag)
        ? prev.filter((t) => t !== tag)
        : prev.length < 10
        ? [...prev, tag]
        : prev
    );
  }

  function toggleVibe(vibe) {
    setVibes((prev) =>
      prev.includes(vibe)
        ? prev.filter((v) => v !== vibe)
        : prev.length < 5
        ? [...prev, vibe]
        : prev
    );
  }

  function handleNext() {
    navigation.navigate('DiscoveryPreferences', { ...params, interests, vibes, intent });
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={styles.step}>Step 4 of 7</Text>
      <Text style={styles.title}>What are you into?</Text>
      <Text style={styles.subtitle}>Pick your interests so we can show you relevant bubbles.</Text>

      <View style={styles.chipGrid}>
        {INTEREST_OPTIONS.map((tag) => {
          const iconName = CATEGORY_ICONS[tag] || CATEGORY_ICONS.Other;
          return (
            <Chip
              key={tag}
              label={tag}
              selected={interests.includes(tag)}
              onPress={() => toggleInterest(tag)}
              icon={<Ionicons name={iconName} size={16} color={interests.includes(tag) ? theme.colors.brand : theme.colors.textMuted} />}
              style={styles.chip}
            />
          );
        })}
      </View>

      <Text style={styles.sectionLabel}>Vibes</Text>
      <Text style={styles.sectionHint}>How would you describe your energy?</Text>
      <View style={styles.chipGrid}>
        {VIBE_OPTIONS.map((vibe) => (
          <Chip
            key={vibe}
            label={vibe}
            selected={vibes.includes(vibe)}
            onPress={() => toggleVibe(vibe)}
            style={styles.chip}
          />
        ))}
      </View>

      <Text style={styles.sectionLabel}>What are you looking for?</Text>
      <View style={styles.chipGrid}>
        {INTENT_OPTIONS.map((opt) => (
          <Chip
            key={opt}
            label={opt}
            selected={intent === opt}
            onPress={() => setIntent(intent === opt ? '' : opt)}
            style={styles.chip}
          />
        ))}
      </View>

      <View style={styles.footer}>
        <Button title="Continue" onPress={handleNext} size="lg" />
        <TouchableOpacity style={styles.skipBtn} onPress={handleNext}>
          <Text style={styles.skipText}>Skip for now</Text>
        </TouchableOpacity>
        <View style={styles.progress}>
          {[0,1,2,3,4,5,6].map((i) => (
            <View key={i} style={[styles.dot, i === 4 && styles.dotActive]} />
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
  subtitle: { fontSize: 15, color: theme.colors.textSecondary, marginBottom: 24 },
  sectionLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.textPrimary,
    marginTop: 28,
    marginBottom: 6,
  },
  sectionHint: { fontSize: 13, color: theme.colors.textMuted, marginBottom: 12 },
  chipGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { marginBottom: 4 },
  footer: { paddingBottom: 32, marginTop: 32 },
  skipBtn: { alignItems: 'center', paddingVertical: 14 },
  skipText: { fontSize: 15, color: theme.colors.textMuted },
  progress: { flexDirection: 'row', justifyContent: 'center', gap: 8, marginTop: 8 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: theme.colors.bgElevated },
  dotActive: { backgroundColor: theme.colors.brand, width: 24 },
});
