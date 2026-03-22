import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { getProfile, updateProfile } from '../api/profile';
import { ProfileForm } from './ProfileSetupScreen';
import { Header } from '../components/ui';
import { theme } from '../theme';

export default function ProfileEditScreen({ navigation }) {
  const [profile, setProfile] = useState(null);
  const [loadError, setLoadError] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  const enterAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(enterAnim, { toValue: 1, duration: 320, useNativeDriver: true }).start();
  }, []);
  const enterStyle = {
    opacity: enterAnim,
    transform: [{ translateY: enterAnim.interpolate({ inputRange: [0, 1], outputRange: [16, 0] }) }],
  };

  useEffect(() => {
    getProfile()
      .then((data) => setProfile(data))
      .catch(() => setLoadError(true));
  }, []);

  async function handleSave(data) {
    setSaving(true);
    setSaveError('');
    try {
      await updateProfile(data);
      navigation.goBack();
    } catch (err) {
      const message =
        err.response?.data?.error?.message || 'Failed to save profile. Please try again.';
      setSaveError(message);
    } finally {
      setSaving(false);
    }
  }

  if (loadError) {
    return (
      <View style={styles.center}>
        <Header title="Edit Profile" onBack={() => navigation.goBack()} />
        <Text style={styles.errorText}>Could not load profile. Please go back and try again.</Text>
      </View>
    );
  }

  if (!profile) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={theme.colors.brand} />
      </View>
    );
  }

  return (
    <Animated.View style={[styles.flex, enterStyle]}>
      <Header title="Edit Profile" onBack={() => navigation.goBack()} />
      {saveError ? (
        <Text style={styles.saveError}>{saveError}</Text>
      ) : null}
      <ProfileForm
        initialValues={profile}
        onSave={handleSave}
        saving={saving}
        photos={profile.photos || []}
        onPhotosChange={(p) => setProfile((prev) => ({ ...prev, photos: p }))}
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: theme.colors.bgDeep },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.bgDeep,
  },
  errorText: {
    color: theme.colors.error,
    fontSize: 15,
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  saveError: {
    color: theme.colors.error,
    fontSize: 14,
    paddingHorizontal: 24,
    paddingTop: 12,
  },
});
