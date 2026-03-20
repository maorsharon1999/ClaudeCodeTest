import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Animated,
  Platform,
} from 'react-native';
import * as Location from 'expo-location';
import { createBubble } from '../api/bubbles';
import { theme } from '../theme';

const CATEGORIES = [
  'Social', 'Study', 'Food & Drinks', 'Sports', 'Music',
  'Nightlife', 'Outdoors', 'Gaming', 'Tech', 'Art', 'Other',
];

const DURATION_OPTIONS = [
  { label: '1h', value: 1 },
  { label: '2h', value: 2 },
  { label: '4h', value: 4 },
  { label: '8h', value: 8 },
];

export default function CreateBubbleScreen({ navigation }) {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [durationH, setDurationH] = useState(4);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [location, setLocation] = useState(null);
  const [focusedField, setFocusedField] = useState(null);

  const enterAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(enterAnim, { toValue: 1, duration: 320, useNativeDriver: true }).start();
  }, []);
  const enterStyle = {
    opacity: enterAnim,
    transform: [{ translateY: enterAnim.interpolate({ inputRange: [0, 1], outputRange: [16, 0] }) }],
  };

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        setLocation({ lat: loc.coords.latitude, lng: loc.coords.longitude });
      }
    })();
  }, []);

  const isValid = title.trim().length >= 3 && category && location;

  async function handleCreate() {
    if (!isValid || saving) return;
    setSaving(true);
    setError('');
    try {
      const bubble = await createBubble({
        title: title.trim(),
        category,
        description: description.trim() || undefined,
        duration_h: durationH,
        lat: location.lat,
        lng: location.lng,
      });
      navigation.replace('BubbleChat', { bubbleId: bubble.id, bubbleTitle: bubble.title });
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Failed to create bubble. Try again.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Animated.View style={[styles.flex, enterStyle]}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={styles.heading}>Create a Bubble</Text>
        <Text style={styles.subheading}>Start something nearby for others to join.</Text>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <Text style={styles.label}>Title <Text style={styles.required}>*</Text></Text>
        <TextInput
          style={[styles.input, focusedField === 'title' && styles.inputFocused]}
          placeholder="What's happening? (e.g. Study group at library)"
          placeholderTextColor={theme.colors.textFaint}
          value={title}
          onChangeText={(t) => setTitle(t.slice(0, 60))}
          onFocus={() => setFocusedField('title')}
          onBlur={() => setFocusedField(null)}
          maxLength={60}
        />
        <Text style={styles.charCount}>{title.length}/60</Text>

        <Text style={styles.label}>Category <Text style={styles.required}>*</Text></Text>
        <View style={styles.chipRow}>
          {CATEGORIES.map((cat) => (
            <TouchableOpacity
              key={cat}
              style={[styles.chip, category === cat && styles.chipActive]}
              onPress={() => setCategory(category === cat ? '' : cat)}
            >
              <Text style={[styles.chipText, category === cat && styles.chipTextActive]}>{cat}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>Description <Text style={styles.optional}>(optional)</Text></Text>
        <TextInput
          style={[styles.input, styles.descInput, focusedField === 'desc' && styles.inputFocused]}
          placeholder="Add more details..."
          placeholderTextColor={theme.colors.textFaint}
          value={description}
          onChangeText={(t) => setDescription(t.slice(0, 300))}
          onFocus={() => setFocusedField('desc')}
          onBlur={() => setFocusedField(null)}
          multiline
          maxLength={300}
          textAlignVertical="top"
        />
        <Text style={styles.charCount}>{description.length}/300</Text>

        <Text style={styles.label}>Duration</Text>
        <View style={styles.chipRow}>
          {DURATION_OPTIONS.map((opt) => (
            <TouchableOpacity
              key={opt.value}
              style={[styles.chip, durationH === opt.value && styles.chipActive]}
              onPress={() => setDurationH(opt.value)}
            >
              <Text style={[styles.chipText, durationH === opt.value && styles.chipTextActive]}>{opt.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {!location && (
          <Text style={styles.locationWarn}>Waiting for location permission...</Text>
        )}

        <TouchableOpacity
          style={[styles.createBtn, (!isValid || saving) && styles.createBtnDisabled]}
          onPress={handleCreate}
          disabled={!isValid || saving}
          accessibilityRole="button"
          accessibilityLabel="Create bubble"
        >
          {saving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.createBtnText}>Create Bubble</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: theme.colors.bgBase },
  container: { padding: 24, paddingTop: Platform.OS === 'ios' ? 60 : 24, paddingBottom: 48 },
  heading: { ...theme.typography.titleMd, color: theme.colors.textPrimary, marginBottom: 4 },
  subheading: { fontSize: 15, color: theme.colors.textSecondary, marginBottom: 20 },
  errorText: { color: theme.colors.error, fontSize: 14, marginBottom: 12 },
  label: { fontSize: 14, fontWeight: '600', color: '#333', marginBottom: 6, marginTop: 16 },
  required: { color: theme.colors.error },
  optional: { color: '#999', fontWeight: '400' },
  input: {
    height: 50,
    borderWidth: 1.5,
    borderColor: theme.colors.borderDefault,
    borderRadius: theme.radii.md,
    paddingHorizontal: 14,
    fontSize: 16,
    color: theme.colors.textPrimary,
  },
  inputFocused: { borderColor: theme.colors.brand },
  descInput: { height: 90, paddingTop: 12 },
  charCount: { fontSize: 11, color: '#bbb', textAlign: 'right', marginTop: 2 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: theme.colors.borderDefault,
    marginBottom: 4,
  },
  chipActive: { borderColor: theme.colors.brand, backgroundColor: theme.colors.badgePurpleBg },
  chipText: { fontSize: 14, color: theme.colors.textSecondary },
  chipTextActive: { color: theme.colors.brand, fontWeight: '600' },
  locationWarn: { color: theme.colors.textMuted, fontSize: 13, marginTop: 12, textAlign: 'center' },
  createBtn: {
    height: 52,
    backgroundColor: theme.colors.brand,
    borderRadius: theme.radii.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 32,
  },
  createBtnDisabled: { opacity: 0.45 },
  createBtnText: { color: '#fff', fontSize: 17, fontWeight: '600' },
});
