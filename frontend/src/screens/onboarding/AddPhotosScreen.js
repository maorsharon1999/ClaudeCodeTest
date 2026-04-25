import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import PhotoEditor from '../../components/PhotoEditor';
import { theme } from '../../theme';
import SkyBackground from '../../components/visual/SkyBackground';
import BubbleField from '../../components/visual/BubbleField';
import GlassButton from '../../components/visual/GlassButton';
import ScreenHeader from '../../components/visual/ScreenHeader';
import GlassChip from '../../components/visual/GlassChip';

export default function AddPhotosScreen({ route, navigation }) {
  const params = route.params || {};
  const [photos, setPhotos] = useState([]);

  function handleNext() {
    navigation.navigate('Interests', { ...params, photos });
  }

  function handleSkip() {
    navigation.navigate('Interests', { ...params, photos: [] });
  }

  return (
    <SkyBackground variant="dawn">
      <BubbleField />
      <View style={styles.screenWrap}>
        <ScreenHeader
          title="Your moments"
          subtitle="Step 3 of 7"
          onBack={() => {}}
          right={<GlassChip label="3 / 7" />}
        />
        <View style={styles.body}>
          <Text style={styles.title}>Add a few photos.</Text>
          <Text style={styles.subtitle}>
            Real ones. We'll show them only to people within your bubble radius.
          </Text>

          <View style={styles.editor}>
            <PhotoEditor photos={photos} onPhotosChange={setPhotos} />
          </View>

          {/* Privacy nudge */}
          <View style={styles.privacyRow}>
            <View style={styles.privacyIcon}>
              <Text style={styles.privacyIconText}>🔒</Text>
            </View>
            <Text style={styles.privacyText}>
              Photos are blurred to strangers until you say hi.
            </Text>
          </View>
        </View>

        <View style={styles.footer}>
          <View style={styles.btnRow}>
            <GlassButton label="Back" variant="ghost" size="lg" onPress={() => {}} style={styles.btnBack} />
            <GlassButton label="Continue" variant="primary" size="lg" onPress={handleNext} style={styles.btnNext} />
          </View>
          <TouchableOpacity style={styles.skipBtn} onPress={handleSkip} accessibilityRole="button">
            <Text style={styles.skipText}>Skip for now</Text>
          </TouchableOpacity>
          <View style={styles.progress}>
            {[0,1,2,3,4,5].map((i) => (
              <View key={i} style={[styles.dot, i === 2 && styles.dotActive]} />
            ))}
          </View>
        </View>
      </View>
    </SkyBackground>
  );
}

const styles = StyleSheet.create({
  screenWrap: { flex: 1, zIndex: 2 },
  body: { flex: 1, paddingHorizontal: 24, paddingTop: 8 },
  title: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.8,
    color: theme.colors.ink,
    marginBottom: 6,
    lineHeight: 32,
  },
  subtitle: { fontSize: 14, color: theme.colors.inkSoft, marginBottom: 22 },
  editor: { flex: 1 },
  privacyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 16,
    marginBottom: 8,
  },
  privacyIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: theme.colors.glassTint,
    borderWidth: 1.5,
    borderColor: theme.colors.glassBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  privacyIconText: { fontSize: 12 },
  privacyText: { flex: 1, fontSize: 12, color: theme.colors.inkSoft },
  footer: { paddingHorizontal: 24, paddingBottom: 32 },
  btnRow: { flexDirection: 'row', gap: 10, marginBottom: 4 },
  btnBack: { flex: 1 },
  btnNext: { flex: 2 },
  skipBtn: { alignItems: 'center', paddingVertical: 12 },
  skipText: { fontSize: 15, color: theme.colors.inkMuted },
  progress: { flexDirection: 'row', justifyContent: 'center', gap: 8, marginTop: 8 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: theme.colors.inkGhost },
  dotActive: { backgroundColor: theme.colors.skyDeep, width: 24 },
});
