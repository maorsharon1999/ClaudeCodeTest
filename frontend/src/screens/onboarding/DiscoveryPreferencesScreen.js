import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Platform } from 'react-native';
import { theme } from '../../theme';
import SkyBackground from '../../components/visual/SkyBackground';
import BubbleField from '../../components/visual/BubbleField';
import GlassButton from '../../components/visual/GlassButton';
import GlassCard from '../../components/visual/GlassCard';
import GlassChip from '../../components/visual/GlassChip';
import ScreenHeader from '../../components/visual/ScreenHeader';
import SectionLabel from '../../components/visual/SectionLabel';

const DISTANCE_OPTIONS = ['1 km', '5 km', '10 km', 'Any'];
const AGE_OPTIONS = ['18-25', '25-35', '35+', 'Any age'];
const SHOW_ME_OPTIONS = ['Women', 'Men', 'Nonbinary folks'];

export default function DiscoveryPreferencesScreen({ route, navigation }) {
  const params = route.params || {};
  const [distance, setDistance] = useState('');
  const [ageRange, setAgeRange] = useState('');

  function handleContinue() {
    navigation.navigate('LocationPermission', { ...params, distance, ageRange });
  }

  return (
    <SkyBackground variant="sky">
      <BubbleField />
      <View style={styles.screenWrap}>
        <ScreenHeader
          title="Discovery"
          subtitle="Who & what you'll see"
          onBack={() => {}}
          right={<GlassChip label="5 / 7" />}
        />
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.title}>How far should{'\n'}bubbles drift?</Text>

          <SectionLabel style={{ marginBottom: 10 }}>Distance</SectionLabel>
          <Text style={styles.sectionHint}>How far should we look for nearby bubbles?</Text>
          <View style={styles.chipRow}>
            {DISTANCE_OPTIONS.map((opt) => (
              <GlassChip
                key={opt}
                label={opt}
                selected={distance === opt}
                onPress={() => setDistance(distance === opt ? '' : opt)}
              />
            ))}
          </View>

          <SectionLabel style={{ marginTop: 28, marginBottom: 10 }}>Show me</SectionLabel>
          <GlassCard style={styles.cardSection}>
            {SHOW_ME_OPTIONS.map((opt, i) => (
              <View key={opt} style={[styles.cardRow, i < SHOW_ME_OPTIONS.length - 1 && styles.cardRowBorder]}>
                <Text style={styles.cardRowLabel}>{opt}</Text>
                <View style={styles.toggleOn}>
                  <View style={styles.toggleKnobOn} />
                </View>
              </View>
            ))}
          </GlassCard>

          <SectionLabel style={{ marginTop: 24, marginBottom: 10 }}>Age range</SectionLabel>
          <Text style={styles.sectionHint}>What age range are you interested in meeting?</Text>
          <View style={styles.chipRow}>
            {AGE_OPTIONS.map((opt) => (
              <GlassChip
                key={opt}
                label={opt}
                selected={ageRange === opt}
                onPress={() => setAgeRange(ageRange === opt ? '' : opt)}
              />
            ))}
          </View>

          <View style={styles.footer}>
            <View style={styles.btnRow}>
              <GlassButton label="Back" variant="ghost" size="lg" onPress={() => {}} style={styles.btnBack} />
              <GlassButton label="Continue" variant="primary" size="lg" onPress={handleContinue} style={styles.btnNext} />
            </View>
            <View style={styles.progress}>
              {[0, 1, 2, 3, 4, 5, 6].map((i) => (
                <View key={i} style={[styles.dot, i === 5 && styles.dotActive]} />
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
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -0.6,
    color: theme.colors.ink,
    marginBottom: 20,
    lineHeight: 30,
  },
  sectionHint: { fontSize: 13, color: theme.colors.inkMuted, marginBottom: 12 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  cardSection: { padding: 4 },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 14,
  },
  cardRowBorder: { borderBottomWidth: 1, borderBottomColor: theme.colors.inkGhost },
  cardRowLabel: { flex: 1, fontSize: 15, fontWeight: '600', color: theme.colors.ink },
  toggleOn: {
    width: 48,
    height: 28,
    borderRadius: 14,
    backgroundColor: theme.colors.glassTint,
    borderWidth: 1.5,
    borderColor: theme.colors.glassBorder,
    justifyContent: 'center',
  },
  toggleKnobOn: {
    position: 'absolute',
    right: 3,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#fff',
    ...theme.shadows.card,
  },
  footer: { marginTop: 40 },
  btnRow: { flexDirection: 'row', gap: 10 },
  btnBack: { flex: 1 },
  btnNext: { flex: 2 },
  progress: { flexDirection: 'row', justifyContent: 'center', gap: 8, marginTop: 20 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: theme.colors.inkGhost },
  dotActive: { backgroundColor: theme.colors.skyDeep, width: 24 },
});
