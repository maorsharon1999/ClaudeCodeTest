import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import PhotoEditor from '../../components/PhotoEditor';
import { Button } from '../../components/ui';
import { theme } from '../../theme';

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
    <View style={styles.container}>
      <Text style={styles.step}>Step 2 of 5</Text>
      <Text style={styles.title}>Add your photos</Text>
      <Text style={styles.subtitle}>Help others recognize you. You can add up to 3 photos.</Text>

      <View style={styles.editor}>
        <PhotoEditor photos={photos} onPhotosChange={setPhotos} />
      </View>

      <View style={styles.footer}>
        <Button title="Continue" onPress={handleNext} size="lg" />
        <TouchableOpacity style={styles.skipBtn} onPress={handleSkip}>
          <Text style={styles.skipText}>Skip for now</Text>
        </TouchableOpacity>
        <View style={styles.progress}>
          {[0,1,2,3,4,5].map((i) => (
            <View key={i} style={[styles.dot, i === 2 && styles.dotActive]} />
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.bgDeep,
    padding: 24,
    paddingTop: Platform.OS === 'ios' ? 64 : 32,
  },
  step: { fontSize: 13, color: theme.colors.brand, fontWeight: '600', marginBottom: 8 },
  title: { ...theme.typography.titleMd, color: theme.colors.textPrimary, marginBottom: 8 },
  subtitle: { fontSize: 15, color: theme.colors.textSecondary, marginBottom: 32 },
  editor: { flex: 1 },
  footer: { paddingBottom: 32 },
  skipBtn: { alignItems: 'center', paddingVertical: 14 },
  skipText: { fontSize: 15, color: theme.colors.textMuted },
  progress: { flexDirection: 'row', justifyContent: 'center', gap: 8, marginTop: 8 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: theme.colors.bgElevated },
  dotActive: { backgroundColor: theme.colors.brand, width: 24 },
});
