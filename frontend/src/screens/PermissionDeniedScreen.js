import React from 'react';
import { View, Text, Linking, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '../components/ui';
import { theme } from '../theme';

const ICONS = {
  location: 'location-outline',
  camera: 'camera-outline',
  microphone: 'mic-outline',
};

const TITLES = {
  location: 'Location Access Needed',
  camera: 'Camera Access Needed',
  microphone: 'Microphone Access Needed',
};

const DEFAULTS = {
  location: 'Bubble needs your location to show you nearby people and events.',
  camera: 'Bubble needs camera access for photos and verification.',
  microphone: 'Bubble needs microphone access for voice notes.',
};

export default function PermissionDeniedScreen({ route, navigation }) {
  const { permissionType = 'location', explanation } = route?.params || {};
  const icon = ICONS[permissionType] || ICONS.location;
  const title = TITLES[permissionType] || 'Permission Needed';
  const desc = explanation || DEFAULTS[permissionType] || DEFAULTS.location;

  return (
    <View style={styles.container}>
      <Ionicons name={icon} size={80} color={theme.colors.brand} />
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.description}>{desc}</Text>
      <Button
        title="Open Settings"
        onPress={() => Linking.openSettings()}
        size="lg"
        style={styles.btn}
      />
      <Button
        title="Go Back"
        variant="ghost"
        onPress={() => navigation.goBack()}
        style={styles.backBtn}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.bgDeep,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  title: {
    ...theme.typography.titleMd,
    color: theme.colors.textPrimary,
    marginTop: 24,
    marginBottom: 12,
    textAlign: 'center',
  },
  description: {
    fontSize: 15,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
  },
  btn: { width: '100%', marginBottom: 12 },
  backBtn: { width: '100%' },
});
