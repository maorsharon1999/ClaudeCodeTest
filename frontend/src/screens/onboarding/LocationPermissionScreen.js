import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '../../components/ui';
import { theme } from '../../theme';

export default function LocationPermissionScreen({ route, navigation }) {
  const params = route.params || {};

  async function handleEnable() {
    await Location.requestForegroundPermissionsAsync();
    navigation.navigate('Notifications', params);
  }

  function handleSkip() {
    navigation.navigate('Notifications', params);
  }

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.iconCircle}>
          <Ionicons name="location" size={40} color={theme.colors.cyan} />
        </View>
        <Text style={styles.title}>Enable Location</Text>
        <Text style={styles.subtitle}>
          Bubble uses your location to find bubbles near you.{'\n'}
          We never share your exact location with other users.
        </Text>
      </View>

      <View style={styles.footer}>
        <Button title="Enable Location" onPress={handleEnable} size="lg" />
        <Button title="Not Now" onPress={handleSkip} variant="ghost" style={styles.skipBtn} />
        <View style={styles.progress}>
          {[0,1,2,3,4,5].map((i) => (
            <View key={i} style={[styles.dot, i === 4 && styles.dotActive]} />
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
    justifyContent: 'space-between',
  },
  content: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(0,212,170,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  title: { ...theme.typography.titleMd, color: theme.colors.textPrimary, textAlign: 'center', marginBottom: 12 },
  subtitle: { fontSize: 15, color: theme.colors.textSecondary, textAlign: 'center', lineHeight: 22 },
  footer: { paddingBottom: 32 },
  skipBtn: { marginTop: 8 },
  progress: { flexDirection: 'row', justifyContent: 'center', gap: 8, marginTop: 20 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: theme.colors.bgElevated },
  dotActive: { backgroundColor: theme.colors.brand, width: 24 },
});
