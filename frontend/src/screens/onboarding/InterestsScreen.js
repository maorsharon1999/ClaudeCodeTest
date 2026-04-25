import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CATEGORY_ICONS } from '../../constants/icons';
import { theme } from '../../theme';
import SkyBackground from '../../components/visual/SkyBackground';
import BubbleField from '../../components/visual/BubbleField';
import GlassButton from '../../components/visual/GlassButton';
import GlassChip from '../../components/visual/GlassChip';
import ScreenHeader from '../../components/visual/ScreenHeader';
import SectionLabel from '../../components/visual/SectionLabel';

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
    <SkyBackground variant="mint">
      <BubbleField />
      <View style={styles.screenWrap}>
        <ScreenHeader
          title="Pick your vibes"
          subtitle="Step 4 of 7"
          onBack={() => {}}
          right={<GlassChip label="4 / 7" />}
        />
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.title}>What floats{'\n'}your bubble?</Text>
          <Text style={styles.subtitle}>Pick 3–8. We'll match you into bubbles with the same energy.</Text>

          <View style={styles.chipGrid}>
            {INTEREST_OPTIONS.map((tag) => {
              const iconName = CATEGORY_ICONS[tag] || CATEGORY_ICONS.Other;
              return (
                <GlassChip
                  key={tag}
                  label={tag}
                  selected={interests.includes(tag)}
                  onPress={() => toggleInterest(tag)}
                />
              );
            })}
          </View>

          <SectionLabel style={{ marginTop: 28 }}>Vibes</SectionLabel>
          <Text style={styles.sectionHint}>How would you describe your energy?</Text>
          <View style={styles.chipGrid}>
            {VIBE_OPTIONS.map((vibe) => (
              <GlassChip
                key={vibe}
                label={vibe}
                selected={vibes.includes(vibe)}
                onPress={() => toggleVibe(vibe)}
              />
            ))}
          </View>

          <SectionLabel style={{ marginTop: 24 }}>What are you looking for?</SectionLabel>
          <View style={styles.chipGrid}>
            {INTENT_OPTIONS.map((opt) => (
              <GlassChip
                key={opt}
                label={opt}
                selected={intent === opt}
                onPress={() => setIntent(intent === opt ? '' : opt)}
              />
            ))}
          </View>

          <View style={styles.footer}>
            <View style={styles.btnRow}>
              <GlassButton label="Back" variant="ghost" size="lg" onPress={() => {}} style={styles.btnBack} />
              <GlassButton
                label={`Continue · ${interests.length} picked`}
                variant="primary"
                size="lg"
                onPress={handleNext}
                style={styles.btnNext}
              />
            </View>
            <TouchableOpacity style={styles.skipBtn} onPress={handleNext} accessibilityRole="button">
              <Text style={styles.skipText}>Skip for now</Text>
            </TouchableOpacity>
            <View style={styles.progress}>
              {[0,1,2,3,4,5,6].map((i) => (
                <View key={i} style={[styles.dot, i === 4 && styles.dotActive]} />
              ))}
            </View>
          </View>
        </ScrollView>
      </View>
    </SkyBackground>
  );
}

const styles = StyleSheet.create({
  screenWrap: { flex: 1, zIndex: 2 },
  scroll: { flex: 1 },
  content: { padding: 24, paddingTop: 8, paddingBottom: 100 },
  title: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.8,
    color: theme.colors.ink,
    marginBottom: 6,
    lineHeight: 32,
  },
  subtitle: { fontSize: 14, color: theme.colors.inkSoft, marginBottom: 22 },
  sectionHint: { fontSize: 13, color: theme.colors.inkMuted, marginBottom: 12 },
  chipGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  footer: { marginTop: 40 },
  btnRow: { flexDirection: 'row', gap: 10 },
  btnBack: { flex: 1 },
  btnNext: { flex: 2 },
  skipBtn: { alignItems: 'center', paddingVertical: 14 },
  skipText: { fontSize: 15, color: theme.colors.inkMuted },
  progress: { flexDirection: 'row', justifyContent: 'center', gap: 8, marginTop: 8 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: theme.colors.inkGhost },
  dotActive: { backgroundColor: theme.colors.skyDeep, width: 24 },
});
