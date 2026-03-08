import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { getProfile, updateProfile } from '../api/profile';
import { ProfileForm } from './ProfileSetupScreen';

export default function ProfileEditScreen({ navigation }) {
  const [profile, setProfile] = useState(null);
  const [loadError, setLoadError] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getProfile()
      .then((data) => setProfile(data))
      .catch(() => setLoadError(true));
  }, []);

  async function handleSave(data) {
    setSaving(true);
    try {
      await updateProfile(data);
      navigation.goBack();
    } catch (err) {
      const message =
        err.response?.data?.error?.message || 'Failed to save profile. Please try again.';
      Alert.alert('Error', message);
    } finally {
      setSaving(false);
    }
  }

  if (loadError) {
    return (
      <View style={editStyles.center}>
        <Text style={editStyles.errorText}>Could not load profile. Please go back and try again.</Text>
      </View>
    );
  }

  if (!profile) {
    return (
      <View style={editStyles.center}>
        <ActivityIndicator size="large" color="#6C47FF" />
      </View>
    );
  }

  return (
    <ProfileForm
      initialValues={profile}
      onSave={handleSave}
      saving={saving}
    />
  );
}

const editStyles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' },
  errorText: { color: '#E53935', fontSize: 15, textAlign: 'center', paddingHorizontal: 32 },
});
