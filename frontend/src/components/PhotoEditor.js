import React, { useState } from 'react';
import { View, Text, Image, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { uploadPhoto, deletePhoto } from '../api/profile';
import Toast from './Toast';
import { theme } from '../theme';

const SLOT_COUNT = 3;

export default function PhotoEditor({ photos = [], onPhotosChange }) {
  const [loadingSlot, setLoadingSlot] = useState(null);
  const [toastMsg, setToastMsg] = useState('');
  const [toastKey, setToastKey] = useState(0);

  function showToast(msg) {
    setToastMsg(msg);
    setToastKey((k) => k + 1);
  }

  async function handleAdd(slotIndex) {
    if (photos.length >= SLOT_COUNT) {
      showToast('Maximum 3 photos allowed.');
      return;
    }
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      showToast('Photo library permission is required.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'Images',
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (result.canceled) return;
    const asset = result.assets[0];
    setLoadingSlot(slotIndex);
    try {
      const mimeType = asset.mimeType || 'image/jpeg';
      const newPhotos = await uploadPhoto(asset.uri, mimeType);
      onPhotosChange(newPhotos);
    } catch (err) {
      showToast('Could not upload photo. Please try again.');
    } finally {
      setLoadingSlot(null);
    }
  }

  async function handleRemove(index) {
    setLoadingSlot(index);
    try {
      const newPhotos = await deletePhoto(index);
      onPhotosChange(newPhotos);
    } catch (err) {
      showToast('Could not remove photo. Please try again.');
    } finally {
      setLoadingSlot(null);
    }
  }

  return (
    <View>
      <View style={styles.row}>
        {Array.from({ length: SLOT_COUNT }).map((_, i) => {
          const photoUrl = photos[i];
          const isLoading = loadingSlot === i;

          if (photoUrl) {
            return (
              <View key={i} style={styles.slot}>
                <Image source={{ uri: photoUrl }} style={styles.slotImage} />
                {isLoading ? (
                  <View style={styles.slotOverlay}>
                    <ActivityIndicator color="#fff" />
                  </View>
                ) : (
                  <TouchableOpacity
                    style={styles.removeBtn}
                    onPress={() => handleRemove(i)}
                    accessibilityRole="button"
                    accessibilityLabel="Remove photo"
                  >
                    <Text style={styles.removeBtnText}>×</Text>
                  </TouchableOpacity>
                )}
              </View>
            );
          }

          return (
            <TouchableOpacity
              key={i}
              style={styles.emptySlot}
              onPress={() => handleAdd(i)}
              disabled={isLoading}
              accessibilityRole="button"
              accessibilityLabel="Add photo"
            >
              {isLoading ? (
                <ActivityIndicator color={theme.colors.textMuted} />
              ) : (
                <Text style={styles.addText}>+</Text>
              )}
            </TouchableOpacity>
          );
        })}
      </View>
      <Toast key={toastKey} message={toastMsg} visible={!!toastMsg} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  slot: {
    width: 100,
    height: 100,
    borderRadius: theme.radii.md,
    overflow: 'hidden',
  },
  slotImage: {
    width: 100,
    height: 100,
    borderRadius: theme.radii.md,
  },
  slotOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeBtn: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeBtnText: {
    color: '#fff',
    fontSize: 16,
    lineHeight: 20,
    fontWeight: '700',
  },
  emptySlot: {
    width: 100,
    height: 100,
    borderRadius: theme.radii.md,
    borderWidth: 1.5,
    borderColor: theme.colors.borderDefault,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addText: {
    fontSize: 28,
    color: theme.colors.textMuted,
    lineHeight: 32,
  },
});
