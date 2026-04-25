import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Platform } from 'react-native';
import { Input, Button, Chip } from '../../components/ui';
import { theme } from '../../theme';
import SkyBackground from '../../components/visual/SkyBackground';
import BubbleField from '../../components/visual/BubbleField';
import GlassButton from '../../components/visual/GlassButton';
import GlassCard from '../../components/visual/GlassCard';
import GlassInput from '../../components/visual/GlassInput';
import GlassChip from '../../components/visual/GlassChip';
import ScreenHeader from '../../components/visual/ScreenHeader';
import SectionLabel from '../../components/visual/SectionLabel';

let DateTimePicker = null;
if (Platform.OS !== 'web') {
  DateTimePicker = require('@react-native-community/datetimepicker').default;
}

const MIN_AGE_YEARS = 18;

const GENDER_OPTIONS = ['Man', 'Woman', 'Non-binary', 'Prefer not to say'];
const LOOKING_FOR_OPTIONS = ['Men', 'Women', 'Everyone'];

export default function ProfileBasicsScreen({ navigation }) {
  const [displayName, setDisplayName] = useState('');
  const [birthDate, setBirthDate] = useState(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [gender, setGender] = useState('');
  const [lookingFor, setLookingFor] = useState([]);
  const [bio, setBio] = useState('');
  const [errors, setErrors] = useState({});

  const maxDate = new Date(
    new Date().getFullYear() - MIN_AGE_YEARS,
    new Date().getMonth(),
    new Date().getDate()
  );

  const isValid = displayName.trim().length > 0;

  function handleNext() {
    const newErrors = {};
    if (!displayName.trim()) newErrors.displayName = 'Name is required.';
    if (birthDate && birthDate > maxDate) newErrors.birthDate = 'You must be at least 18.';
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    navigation.navigate('AddPhotos', {
      displayName: displayName.trim(),
      birthDate: birthDate ? birthDate.toISOString().split('T')[0] : undefined,
      gender,
      lookingFor,
      bio: bio.trim(),
    });
  }

  return (
    <SkyBackground variant="sky">
      <BubbleField />
      <View style={styles.screenWrap}>
        <ScreenHeader
          title="Your basics"
          subtitle="Step 2 of 7"
          onBack={() => {}}
          right={<GlassChip label="2 / 7" />}
        />
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.title}>What should{'\n'}we call you?</Text>

          <SectionLabel>Name</SectionLabel>
          <GlassInput
            placeholder="Your name"
            value={displayName}
            onChangeText={(t) => {
              setDisplayName(t);
              if (errors.displayName) setErrors((e) => ({ ...e, displayName: undefined }));
            }}
            error={errors.displayName}
          />

          <SectionLabel style={{ marginTop: 18 }}>Date of birth</SectionLabel>
          {Platform.OS !== 'web' ? (
            <>
              <TouchableOpacity
                style={[styles.dateBtn, errors.birthDate && styles.dateBtnError]}
                onPress={() => setShowDatePicker(true)}
              >
                <Text style={birthDate ? styles.dateText : styles.datePlaceholder}>
                  {birthDate ? birthDate.toLocaleDateString() : 'Select your birth date'}
                </Text>
              </TouchableOpacity>
              {showDatePicker && DateTimePicker && (
                <DateTimePicker
                  value={birthDate || maxDate}
                  mode="date"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  maximumDate={maxDate}
                  onChange={(_, d) => {
                    if (Platform.OS === 'android') setShowDatePicker(false);
                    if (d) setBirthDate(d);
                  }}
                />
              )}
            </>
          ) : (
            <GlassInput
              placeholder="YYYY-MM-DD"
              value={birthDate ? birthDate.toISOString().split('T')[0] : ''}
              onChangeText={(t) => {
                const d = new Date(t);
                if (!isNaN(d.getTime())) setBirthDate(d);
              }}
              error={errors.birthDate}
            />
          )}
          {errors.birthDate && <Text style={styles.error}>{errors.birthDate}</Text>}

          <SectionLabel style={{ marginTop: 20 }}>I identify as</SectionLabel>
          <View style={styles.chipRow}>
            {GENDER_OPTIONS.map((opt) => (
              <GlassChip
                key={opt}
                label={opt}
                selected={gender === opt}
                onPress={() => setGender(gender === opt ? '' : opt)}
              />
            ))}
          </View>

          <SectionLabel style={{ marginTop: 20 }}>Looking to…</SectionLabel>
          <View style={styles.chipRow}>
            {LOOKING_FOR_OPTIONS.map((opt) => (
              <GlassChip
                key={opt}
                label={opt}
                selected={lookingFor.includes(opt)}
                onPress={() =>
                  setLookingFor((prev) =>
                    prev.includes(opt) ? prev.filter((o) => o !== opt) : [...prev, opt]
                  )
                }
              />
            ))}
          </View>

          <SectionLabel style={{ marginTop: 20 }}>Bio</SectionLabel>
          <GlassInput
            placeholder="Tell people a little about yourself..."
            value={bio}
            onChangeText={(t) => setBio(t.slice(0, 200))}
            multiline
            numberOfLines={3}
          />
          <Text style={styles.charCount}>{bio.length}/200</Text>

          <View style={styles.footer}>
            <View style={styles.btnRow}>
              <GlassButton label="Back" variant="ghost" size="lg" onPress={() => {}} style={styles.btnBack} />
              <GlassButton label="Continue" variant="primary" size="lg" onPress={handleNext} disabled={!isValid} style={styles.btnNext} />
            </View>
            <View style={styles.progress}>
              {[0,1,2,3,4,5,6].map((i) => (
                <View key={i} style={[styles.dot, i === 2 && styles.dotActive]} />
              ))}
            </View>
          </View>
        </ScrollView>
      </View>
    </SkyBackground>
  );
}

const styles = StyleSheet.create({
  screenWrap: { flex: 1, zIndex: 2 },
  scroll: { flex: 1 },
  content: { padding: 24, paddingTop: 8, paddingBottom: 100 },
  title: {
    fontSize: 30,
    fontWeight: '800',
    letterSpacing: -0.8,
    color: theme.colors.ink,
    marginBottom: 20,
    lineHeight: 34,
  },
  dateBtn: {
    height: 52,
    borderWidth: 1.5,
    borderColor: theme.colors.glassBorder,
    borderRadius: theme.radii.lg,
    justifyContent: 'center',
    paddingHorizontal: 14,
    backgroundColor: theme.colors.glassTint,
    marginBottom: 4,
  },
  dateBtnError: { borderColor: theme.colors.error },
  dateText: { fontSize: 16, color: theme.colors.ink },
  datePlaceholder: { fontSize: 16, color: theme.colors.inkFaint },
  error: { fontSize: 12, color: theme.colors.error, marginTop: 4 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 4 },
  charCount: { fontSize: 12, color: theme.colors.inkMuted, textAlign: 'right', marginTop: 4 },
  footer: { marginTop: 40 },
  btnRow: { flexDirection: 'row', gap: 10 },
  btnBack: { flex: 1 },
  btnNext: { flex: 2 },
  progress: { flexDirection: 'row', justifyContent: 'center', gap: 8, marginTop: 20 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: theme.colors.inkGhost },
  dotActive: { backgroundColor: theme.colors.skyDeep, width: 24 },
});
