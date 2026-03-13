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
import { theme } from '../theme';

export default function ProfileEditScreen({ navigation }) {
  const [profile, setProfile] = useState(null);
  const [loadError, setLoadError] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  // Entrance animation
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
      <View style={editStyles.center}>
        <Text style={editStyles.errorText}>Could not load profile. Please go back and try again.</Text>
      </View>
    );
  }

  if (!profile) {
    return (
      <View style={editStyles.center}>
        <ActivityIndicator size="large" color={theme.colors.brand} />
      </View>
    );
  }

  return (
    <Animated.View style={[editStyles.flex, enterStyle]}>
      {saveError ? (
        <Text style={editStyles.saveError}>{saveError}</Text>
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

const editStyles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: theme.colors.bgBase },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.colors.bgBase },
  errorText: { color: theme.colors.error, fontSize: 15, textAlign: 'center', paddingHorizontal: 32 },
  saveError: { color: theme.colors.error, fontSize: 14, paddingHorizontal: 24, paddingTop: 12 },
});
