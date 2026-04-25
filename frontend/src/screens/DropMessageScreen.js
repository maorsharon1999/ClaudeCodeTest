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
import { theme } from '../theme';
import { createSpatialMessage } from '../api/spatialMessages';
import SkyBackground from '../components/visual/SkyBackground';
import BubbleField from '../components/visual/BubbleField';
import GlassCard from '../components/visual/GlassCard';
import GlassButton from '../components/visual/GlassButton';
import GlassChip from '../components/visual/GlassChip';
import ScreenHeader from '../components/visual/ScreenHeader';
import SectionLabel from '../components/visual/SectionLabel';

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
    <SkyBackground variant="sky">
      <BubbleField />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScreenHeader
          title="Drop a Message"
          subtitle="Stays pinned here for 24h"
          onBack={() => navigation.goBack()}
        />

        <ScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <SectionLabel style={styles.sectionLabel}>Your message</SectionLabel>
          <GlassCard style={styles.inputCard}>
            <TextInput
              style={styles.input}
              value={content}
              onChangeText={(t) => setContent(t.slice(0, MAX_CHARS))}
              placeholder="Write something for people nearby to discover..."
              placeholderTextColor={theme.colors.inkMuted}
              multiline
              maxLength={MAX_CHARS}
              autoFocus
            />
            <Text style={[styles.charCount, remaining < 20 && styles.charCountWarning]}>
              {remaining}
            </Text>
          </GlassCard>

          <SectionLabel style={styles.sectionLabel}>Who can read it?</SectionLabel>
          {VISIBILITY_OPTIONS.map((opt) => (
            <TouchableOpacity
              key={opt.key}
              onPress={() => setVisibility(opt.key)}
              accessibilityRole="radio"
              accessibilityState={{ selected: visibility === opt.key }}
              style={styles.visTouch}
            >
              <GlassCard style={[styles.visOption, visibility === opt.key && styles.visOptionSelected]}>
                <View style={[styles.visIconBg, visibility === opt.key && styles.visIconBgSelected]}>
                  <Ionicons
                    name={opt.icon}
                    size={18}
                    color={visibility === opt.key ? '#fff' : theme.colors.skyDeep}
                  />
                </View>
                <View style={styles.visText}>
                  <Text style={[styles.visLabel, visibility === opt.key && styles.visLabelSelected]}>
                    {opt.label}
                  </Text>
                  <Text style={styles.visDesc}>{opt.desc}</Text>
                </View>
                {visibility === opt.key && (
                  <Ionicons name="checkmark-circle" size={20} color={theme.colors.skyDeep} />
                )}
              </GlassCard>
            </TouchableOpacity>
          ))}

          <GlassCard style={styles.locationRow}>
            <Ionicons
              name={locating ? 'locate-outline' : 'location'}
              size={16}
              color={locating ? theme.colors.inkMuted : theme.colors.mintDeep}
            />
            <Text style={styles.locationText}>
              {locating ? 'Acquiring location…' : 'Location captured'}
            </Text>
            {locating && <ActivityIndicator size="small" color={theme.colors.inkMuted} style={{ marginLeft: 6 }} />}
          </GlassCard>
        </ScrollView>

        <View style={styles.footer}>
          <GlassButton
            label={submitting ? 'Dropping...' : 'Drop Message'}
            onPress={handleSubmit}
            variant={canSubmit ? 'primary' : 'ghost'}
            size="lg"
          />
        </View>
      </KeyboardAvoidingView>
    </SkyBackground>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: { padding: theme.spacing.xl, paddingBottom: 16 },
  sectionLabel: {
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.sm,
  },
  inputCard: {
    padding: theme.spacing.md,
    minHeight: 120,
  },
  input: {
    fontSize: 16,
    color: theme.colors.ink,
    lineHeight: 24,
    flex: 1,
    textAlignVertical: 'top',
  },
  charCount: {
    alignSelf: 'flex-end',
    fontSize: 12,
    color: theme.colors.inkMuted,
    marginTop: theme.spacing.sm,
  },
  charCountWarning: {
    color: theme.colors.warn,
    fontWeight: '700',
  },
  visTouch: { marginBottom: theme.spacing.sm },
  visOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.md,
  },
  visOptionSelected: {
    borderWidth: 2,
    borderColor: theme.colors.skyDeep,
  },
  visIconBg: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: theme.colors.glassTint,
    borderWidth: 1,
    borderColor: theme.colors.glassBorder,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.md,
  },
  visIconBgSelected: {
    backgroundColor: theme.colors.skyDeep,
    borderColor: theme.colors.skyDeep,
  },
  visText: { flex: 1 },
  visLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: theme.colors.ink,
  },
  visLabelSelected: {
    color: theme.colors.skyDeep,
  },
  visDesc: {
    fontSize: 12,
    color: theme.colors.inkMuted,
    marginTop: 2,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: theme.spacing.xl,
    padding: theme.spacing.md,
    gap: 8,
  },
  locationText: {
    fontSize: 13,
    color: theme.colors.inkMuted,
    flex: 1,
  },
  footer: {
    padding: theme.spacing.xl,
    borderTopWidth: 1,
    borderTopColor: theme.colors.glassBorder,
  },
});
