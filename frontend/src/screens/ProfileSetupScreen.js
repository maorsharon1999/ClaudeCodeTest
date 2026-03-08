import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { updateProfile } from '../api/profile';
import { useAuth } from '../context/AuthContext';

const GENDER_OPTIONS = ['Man', 'Woman', 'Non-binary', 'Prefer not to say'];
const LOOKING_FOR_OPTIONS = ['Friends', 'Dates', 'Networking', 'Anything'];
const MIN_AGE_YEARS = 18;

function isAtLeast18(date) {
  const today = new Date();
  const cutoff = new Date(
    today.getFullYear() - MIN_AGE_YEARS,
    today.getMonth(),
    today.getDate()
  );
  return date <= cutoff;
}

// Shared form used by both ProfileSetupScreen and ProfileEditScreen
export function ProfileForm({ initialValues = {}, onSave, saving }) {
  const [displayName, setDisplayName] = useState(initialValues.display_name || '');
  const [birthDate, setBirthDate] = useState(
    initialValues.birth_date ? new Date(initialValues.birth_date) : null
  );
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [bio, setBio] = useState(initialValues.bio || '');
  const [gender, setGender] = useState(initialValues.gender || '');
  const [lookingFor, setLookingFor] = useState(initialValues.looking_for || '');
  const [errors, setErrors] = useState({});

  const maxDate = new Date(
    new Date().getFullYear() - MIN_AGE_YEARS,
    new Date().getMonth(),
    new Date().getDate()
  );

  const isFormValid =
    displayName.trim().length > 0 &&
    birthDate !== null &&
    isAtLeast18(birthDate);

  function validate() {
    const newErrors = {};
    if (!displayName.trim()) newErrors.displayName = 'Name is required.';
    if (!birthDate) newErrors.birthDate = 'Birth date is required.';
    else if (!isAtLeast18(birthDate)) newErrors.birthDate = 'You must be at least 18.';
    return newErrors;
  }

  function handleSubmit() {
    const newErrors = validate();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    onSave({
      display_name: displayName.trim(),
      birth_date: birthDate.toISOString().split('T')[0],
      bio: bio.trim() || undefined,
      gender: gender || undefined,
      looking_for: lookingFor || undefined,
    });
  }

  function handleDateChange(event, selectedDate) {
    if (Platform.OS === 'android') setShowDatePicker(false);
    if (selectedDate) {
      setBirthDate(selectedDate);
      if (errors.birthDate) setErrors((e) => ({ ...e, birthDate: undefined }));
    }
  }

  return (
    <ScrollView
      style={styles.flex}
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={styles.label}>
        Display Name <Text style={styles.required}>*</Text>
      </Text>
      <TextInput
        style={[styles.input, errors.displayName && styles.inputError]}
        placeholder="How others will see you"
        placeholderTextColor="#aaa"
        value={displayName}
        onChangeText={(t) => {
          setDisplayName(t);
          if (errors.displayName) setErrors((e) => ({ ...e, displayName: undefined }));
        }}
        autoCorrect={false}
        maxLength={40}
      />
      {errors.displayName && <Text style={styles.errorText}>{errors.displayName}</Text>}

      <Text style={styles.label}>
        Birth Date <Text style={styles.required}>*</Text>
      </Text>
      <TouchableOpacity
        style={[styles.input, styles.dateButton, errors.birthDate && styles.inputError]}
        onPress={() => setShowDatePicker(true)}
        accessibilityRole="button"
        accessibilityLabel="Select birth date"
      >
        <Text style={birthDate ? styles.dateText : styles.datePlaceholder}>
          {birthDate ? birthDate.toLocaleDateString() : 'Select your birth date'}
        </Text>
      </TouchableOpacity>
      {errors.birthDate && <Text style={styles.errorText}>{errors.birthDate}</Text>}

      {showDatePicker && (
        <DateTimePicker
          value={birthDate || maxDate}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          maximumDate={maxDate}
          onChange={handleDateChange}
        />
      )}
      {Platform.OS === 'ios' && showDatePicker && (
        <TouchableOpacity
          style={styles.doneBtn}
          onPress={() => setShowDatePicker(false)}
        >
          <Text style={styles.doneBtnText}>Done</Text>
        </TouchableOpacity>
      )}

      <Text style={styles.label}>
        Bio <Text style={styles.optional}>(optional)</Text>
      </Text>
      <TextInput
        style={[styles.input, styles.bioInput]}
        placeholder="A short intro about you"
        placeholderTextColor="#aaa"
        value={bio}
        onChangeText={(t) => setBio(t.slice(0, 140))}
        multiline
        maxLength={140}
        textAlignVertical="top"
      />
      <Text style={styles.charCount}>{bio.length}/140</Text>

      <Text style={styles.label}>
        Gender <Text style={styles.optional}>(optional)</Text>
      </Text>
      <View style={styles.optionRow}>
        {GENDER_OPTIONS.map((opt) => (
          <TouchableOpacity
            key={opt}
            style={[styles.optionChip, gender === opt && styles.optionChipActive]}
            onPress={() => setGender(gender === opt ? '' : opt)}
            accessibilityRole="button"
          >
            <Text
              style={[
                styles.optionChipText,
                gender === opt && styles.optionChipTextActive,
              ]}
            >
              {opt}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.label}>
        Looking For <Text style={styles.optional}>(optional)</Text>
      </Text>
      <View style={styles.optionRow}>
        {LOOKING_FOR_OPTIONS.map((opt) => (
          <TouchableOpacity
            key={opt}
            style={[styles.optionChip, lookingFor === opt && styles.optionChipActive]}
            onPress={() => setLookingFor(lookingFor === opt ? '' : opt)}
            accessibilityRole="button"
          >
            <Text
              style={[
                styles.optionChipText,
                lookingFor === opt && styles.optionChipTextActive,
              ]}
            >
              {opt}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity
        style={[styles.saveButton, (!isFormValid || saving) && styles.saveButtonDisabled]}
        onPress={handleSubmit}
        disabled={!isFormValid || saving}
        accessibilityRole="button"
        accessibilityLabel="Save profile"
      >
        {saving ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.saveButtonText}>Save Profile</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

export default function ProfileSetupScreen() {
  const { markProfileComplete } = useAuth();
  const [saving, setSaving] = useState(false);

  async function handleSave(data) {
    setSaving(true);
    try {
      await updateProfile(data);
      markProfileComplete();
    } catch (err) {
      const message =
        err.response?.data?.error?.message || 'Failed to save profile. Please try again.';
      Alert.alert('Error', message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <View style={styles.flex}>
      <Text style={styles.heading}>Set Up Your Profile</Text>
      <Text style={styles.subheading}>Tell us a bit about yourself.</Text>
      <ProfileForm onSave={handleSave} saving={saving} />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#fff' },
  heading: {
    fontSize: 26,
    fontWeight: '700',
    color: '#111',
    paddingHorizontal: 24,
    paddingTop: 60,
    marginBottom: 4,
  },
  subheading: {
    fontSize: 15,
    color: '#666',
    paddingHorizontal: 24,
    marginBottom: 8,
  },
  container: { padding: 24, paddingBottom: 48 },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 6,
    marginTop: 16,
  },
  required: { color: '#E53935' },
  optional: { color: '#999', fontWeight: '400' },
  input: {
    height: 50,
    borderWidth: 1.5,
    borderColor: '#ddd',
    borderRadius: 10,
    paddingHorizontal: 14,
    fontSize: 16,
    color: '#111',
  },
  inputError: { borderColor: '#E53935' },
  errorText: { color: '#E53935', fontSize: 12, marginTop: 4 },
  dateButton: { justifyContent: 'center' },
  dateText: { fontSize: 16, color: '#111' },
  datePlaceholder: { fontSize: 16, color: '#aaa' },
  doneBtn: {
    alignSelf: 'flex-end',
    paddingVertical: 6,
    paddingHorizontal: 16,
    marginTop: 4,
  },
  doneBtnText: { color: '#6C47FF', fontSize: 16, fontWeight: '600' },
  bioInput: { height: 90, paddingTop: 12 },
  charCount: { fontSize: 11, color: '#bbb', textAlign: 'right', marginTop: 2 },
  optionRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  optionChip: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#ddd',
    marginBottom: 4,
  },
  optionChipActive: { borderColor: '#6C47FF', backgroundColor: '#EDE9FF' },
  optionChipText: { fontSize: 14, color: '#555' },
  optionChipTextActive: { color: '#6C47FF', fontWeight: '600' },
  saveButton: {
    height: 52,
    backgroundColor: '#6C47FF',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 32,
  },
  saveButtonDisabled: { opacity: 0.45 },
  saveButtonText: { color: '#fff', fontSize: 17, fontWeight: '600' },
});
