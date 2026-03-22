import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Platform } from 'react-native';
import { Input, Button, Chip } from '../../components/ui';
import { theme } from '../../theme';

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
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={styles.step}>Step 2 of 7</Text>
      <Text style={styles.title}>What's your name?</Text>
      <Text style={styles.subtitle}>This is how others will see you in bubbles.</Text>

      <Input
        label="Display Name"
        placeholder="Your name"
        value={displayName}
        onChangeText={(t) => {
          setDisplayName(t);
          if (errors.displayName) setErrors((e) => ({ ...e, displayName: undefined }));
        }}
        maxLength={40}
        error={errors.displayName}
        style={styles.field}
      />

      <Text style={styles.label}>Birth Date <Text style={styles.optional}>(optional)</Text></Text>
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
        <Input
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

      <Text style={[styles.label, { marginTop: 24 }]}>Gender <Text style={styles.optional}>(optional)</Text></Text>
      <View style={styles.chipRow}>
        {GENDER_OPTIONS.map((opt) => (
          <Chip
            key={opt}
            label={opt}
            selected={gender === opt}
            onPress={() => setGender(gender === opt ? '' : opt)}
            style={styles.chip}
          />
        ))}
      </View>

      <Text style={[styles.label, { marginTop: 20 }]}>Looking for <Text style={styles.optional}>(optional)</Text></Text>
      <View style={styles.chipRow}>
        {LOOKING_FOR_OPTIONS.map((opt) => (
          <Chip
            key={opt}
            label={opt}
            selected={lookingFor.includes(opt)}
            onPress={() =>
              setLookingFor((prev) =>
                prev.includes(opt) ? prev.filter((o) => o !== opt) : [...prev, opt]
              )
            }
            style={styles.chip}
          />
        ))}
      </View>

      <Text style={[styles.label, { marginTop: 20 }]}>Bio <Text style={styles.optional}>(optional)</Text></Text>
      <Input
        placeholder="Tell people a little about yourself..."
        value={bio}
        onChangeText={(t) => setBio(t.slice(0, 200))}
        multiline
        numberOfLines={3}
        style={styles.bioInput}
      />
      <Text style={styles.charCount}>{bio.length}/200</Text>

      <View style={styles.footer}>
        <Button title="Continue" onPress={handleNext} disabled={!isValid} size="lg" />
        <View style={styles.progress}>
          {[0,1,2,3,4,5,6].map((i) => (
            <View key={i} style={[styles.dot, i === 2 && styles.dotActive]} />
          ))}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.bgDeep },
  content: { padding: 24, paddingTop: Platform.OS === 'ios' ? 64 : 32, paddingBottom: 48 },
  step: { fontSize: 13, color: theme.colors.brand, fontWeight: '600', marginBottom: 8 },
  title: { ...theme.typography.titleMd, color: theme.colors.textPrimary, marginBottom: 8 },
  subtitle: { fontSize: 15, color: theme.colors.textSecondary, marginBottom: 32 },
  field: { marginBottom: 20 },
  label: { fontSize: 14, fontWeight: '600', color: theme.colors.textSecondary, marginBottom: 6 },
  optional: { color: theme.colors.textMuted, fontWeight: '400' },
  dateBtn: {
    height: 50,
    borderWidth: 1,
    borderColor: theme.colors.borderDefault,
    borderRadius: theme.radii.md,
    justifyContent: 'center',
    paddingHorizontal: 14,
    backgroundColor: theme.colors.inputBg,
  },
  dateBtnError: { borderColor: theme.colors.error },
  dateText: { fontSize: 16, color: theme.colors.textPrimary },
  datePlaceholder: { fontSize: 16, color: theme.colors.textFaint },
  error: { fontSize: 12, color: theme.colors.error, marginTop: 4 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { marginBottom: 4 },
  bioInput: { minHeight: 80, textAlignVertical: 'top' },
  charCount: { fontSize: 12, color: theme.colors.textMuted, textAlign: 'right', marginTop: 4 },
  footer: { marginTop: 40 },
  progress: { flexDirection: 'row', justifyContent: 'center', gap: 8, marginTop: 20 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: theme.colors.bgElevated },
  dotActive: { backgroundColor: theme.colors.brand, width: 24 },
});
