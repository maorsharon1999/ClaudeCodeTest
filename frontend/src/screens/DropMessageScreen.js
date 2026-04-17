import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { Header } from '../components/ui';
import { theme } from '../theme';
import { createSpatialMessage } from '../api/spatialMessages';

const MAX_CHARS = 280;

const VISIBILITY_OPTIONS = [
  { key: 'public',   label: 'Everyone',        icon: 'earth-outline',       desc: 'Visible to all nearby users' },
  { key: 'specific', label: 'Specific People', icon: 'person-add-outline',  desc: 'Only people you choose' },
];

export default function DropMessageScreen({ navigation }) {
  const [content, setContent] = useState('');
  const [visibility, setVisibility] = useState('public');
  const [location, setLocation] = useState(null);
  const [locating, setLocating] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Location Required', 'Location permission is needed to drop a message.');
          navigation.goBack();
          return;
        }
        const pos = await Promise.race([
          Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }),
          new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 8000)),
        ]);
        setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      } catch {
        // fallback to last known
        try {
          const last = await Location.getLastKnownPositionAsync();
          if (last) {
            setLocation({ lat: last.coords.latitude, lng: last.coords.longitude });
          } else {
            Alert.alert('Location Error', 'Could not get your location. Please try again.');
            navigation.goBack();
          }
        } catch {
          Alert.alert('Location Error', 'Could not get your location. Please try again.');
          navigation.goBack();
        }
      } finally {
        setLocating(false);
      }
    })();
  }, []);

  async function handleSubmit() {
    if (!content.trim()) return;
    if (!location) {
      Alert.alert('No Location', 'Still acquiring your location. Please wait.');
      return;
    }
    setSubmitting(true);
    try {
      await createSpatialMessage({
        content: content.trim(),
        lat: location.lat,
        lng: location.lng,
        visibility_type: visibility,
      });
      navigation.goBack();
    } catch (err) {
      Alert.alert('Error', err?.response?.data?.error?.message || 'Failed to drop message. Try again.');
    } finally {
      setSubmitting(false);
    }
  }

  const remaining = MAX_CHARS - content.length;
  const canSubmit = content.trim().length > 0 && !locating && !!location && !submitting;

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <Header title="Drop a Message" onBack={() => navigation.goBack()} />

      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.sectionLabel}>Your message</Text>
        <View style={styles.inputWrapper}>
          <TextInput
            style={styles.input}
            value={content}
            onChangeText={(t) => setContent(t.slice(0, MAX_CHARS))}
            placeholder="Write something for people nearby to discover..."
            placeholderTextColor={theme.colors.textMuted}
            multiline
            maxLength={MAX_CHARS}
            autoFocus
          />
          <Text style={[styles.charCount, remaining < 20 && styles.charCountWarning]}>
            {remaining}
          </Text>
        </View>

        <Text style={styles.sectionLabel}>Who can read it?</Text>
        {VISIBILITY_OPTIONS.map((opt) => (
          <TouchableOpacity
            key={opt.key}
            style={[styles.visOption, visibility === opt.key && styles.visOptionSelected]}
            onPress={() => setVisibility(opt.key)}
            accessibilityRole="radio"
            accessibilityState={{ selected: visibility === opt.key }}
          >
            <View style={[styles.visIconBg, visibility === opt.key && styles.visIconBgSelected]}>
              <Ionicons
                name={opt.icon}
                size={18}
                color={visibility === opt.key ? '#fff' : theme.colors.brand}
              />
            </View>
            <View style={styles.visText}>
              <Text style={[styles.visLabel, visibility === opt.key && styles.visLabelSelected]}>
                {opt.label}
              </Text>
              <Text style={styles.visDesc}>{opt.desc}</Text>
            </View>
            {visibility === opt.key && (
              <Ionicons name="checkmark-circle" size={20} color={theme.colors.brand} />
            )}
          </TouchableOpacity>
        ))}

        <View style={styles.locationRow}>
          <Ionicons
            name={locating ? 'locate-outline' : 'location'}
            size={16}
            color={locating ? theme.colors.textMuted : theme.colors.success}
          />
          <Text style={styles.locationText}>
            {locating ? 'Acquiring location…' : 'Location captured'}
          </Text>
          {locating && <ActivityIndicator size="small" color={theme.colors.textMuted} style={{ marginLeft: 6 }} />}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.submitBtn, !canSubmit && styles.submitBtnDisabled]}
          onPress={handleSubmit}
          disabled={!canSubmit}
        >
          {submitting
            ? <ActivityIndicator color="#fff" />
            : (
              <>
                <Ionicons name="pin" size={18} color="#fff" style={{ marginRight: 8 }} />
                <Text style={styles.submitLabel}>Drop Message</Text>
              </>
            )
          }
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: theme.colors.bgDeep },
  container: { padding: theme.spacing.xl, paddingBottom: 16 },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: theme.spacing.sm,
    marginTop: theme.spacing.lg,
  },
  inputWrapper: {
    backgroundColor: theme.colors.bgSurface,
    borderRadius: theme.radii.md,
    borderWidth: 1,
    borderColor: theme.colors.borderDefault,
    padding: theme.spacing.md,
    minHeight: 120,
  },
  input: {
    fontSize: 16,
    color: theme.colors.textPrimary,
    lineHeight: 24,
    flex: 1,
    textAlignVertical: 'top',
  },
  charCount: {
    alignSelf: 'flex-end',
    fontSize: 12,
    color: theme.colors.textMuted,
    marginTop: theme.spacing.sm,
  },
  charCountWarning: {
    color: theme.colors.warning,
    fontWeight: '700',
  },
  visOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.bgSurface,
    borderRadius: theme.radii.md,
    borderWidth: 1.5,
    borderColor: theme.colors.borderDefault,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  visOptionSelected: {
    borderColor: theme.colors.brand,
    backgroundColor: theme.colors.brandMuted,
  },
  visIconBg: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.colors.bgElevated,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.md,
  },
  visIconBgSelected: {
    backgroundColor: theme.colors.brand,
  },
  visText: { flex: 1 },
  visLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: theme.colors.textPrimary,
  },
  visLabelSelected: {
    color: theme.colors.brand,
  },
  visDesc: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: theme.spacing.xl,
    gap: 6,
  },
  locationText: {
    fontSize: 13,
    color: theme.colors.textSecondary,
  },
  footer: {
    padding: theme.spacing.xl,
    borderTopWidth: 1,
    borderColor: theme.colors.borderSubtle,
    backgroundColor: theme.colors.bgDeep,
  },
  submitBtn: {
    backgroundColor: theme.colors.brand,
    borderRadius: theme.radii.pill,
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    ...theme.shadows.buttonPress,
  },
  submitBtnDisabled: {
    backgroundColor: theme.colors.disabled,
  },
  submitLabel: {
    fontSize: 17,
    fontWeight: '700',
    color: '#fff',
  },
});
