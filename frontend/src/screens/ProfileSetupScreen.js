import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Platform,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { updateProfile } from '../api/profile';
import { useAuth } from '../context/AuthContext';
import { theme } from '../theme';
import PhotoEditor from '../components/PhotoEditor';

// DateTimePicker is native-only; import conditionally
let DateTimePicker = null;
if (Platform.OS !== 'web') {
  DateTimePicker = require('@react-native-community/datetimepicker').default;
}

const MONTHS = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
];

function WebDatePicker({ value, onChange, hasError, maxDate }) {
  const [month, setMonth] = React.useState(value ? value.getMonth() + 1 : '');
  const [day, setDay]     = React.useState(value ? value.getDate() : '');
  const [year, setYear]   = React.useState(value ? value.getFullYear() : '');

  const maxYear = maxDate.getFullYear();
  const years = [];
  for (let y = maxYear; y >= maxYear - 100; y--) years.push(y);

  const daysInMonth = month && year ? new Date(year, month, 0).getDate() : 31;
  const days = [];
  for (let d = 1; d <= daysInMonth; d++) days.push(d);

  function tryUpdate(m, d, y) {
    if (m && d && y) {
      const date = new Date(y, m - 1, d);
      if (!isNaN(date.getTime())) onChange(date);
    }
  }

  const selectStyle = {
    flex: 1,
    height: 50,
    border: `1.5px solid ${hasError ? '#E53935' : '#ddd'}`,
    borderRadius: 10,
    fontSize: 16,
    color: '#111',
    paddingLeft: 10,
    backgroundColor: '#fff',
    cursor: 'pointer',
    outline: 'none',
    appearance: 'none',
    WebkitAppearance: 'none',
    backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'12\' height=\'8\' viewBox=\'0 0 12 8\'%3E%3Cpath fill=\'%23999\' d=\'M6 8L0 0h12z\'/%3E%3C/svg%3E")',
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'right 12px center',
    paddingRight: 32,
  };

  return (
    <div style={{ display: 'flex', gap: 8 }}>
      <select
        value={month}
        onChange={(e) => { const m = Number(e.target.value); setMonth(m); tryUpdate(m, day, year); }}
        style={{ ...selectStyle, flex: 2 }}
      >
        <option value="">Month</option>
        {MONTHS.map((name, i) => (
          <option key={i} value={i + 1}>{name}</option>
        ))}
      </select>

      <select
        value={day}
        onChange={(e) => { const d = Number(e.target.value); setDay(d); tryUpdate(month, d, year); }}
        style={selectStyle}
      >
        <option value="">Day</option>
        {days.map((d) => (
          <option key={d} value={d}>{d}</option>
        ))}
      </select>

      <select
        value={year}
        onChange={(e) => { const y = Number(e.target.value); setYear(y); tryUpdate(month, day, y); }}
        style={{ ...selectStyle, flex: 1.5 }}
      >
        <option value="">Year</option>
        {years.map((y) => (
          <option key={y} value={y}>{y}</option>
        ))}
      </select>
    </div>
  );
}

const GENDER_OPTIONS = [
  { label: 'Man', value: 'man' },
  { label: 'Woman', value: 'woman' },
  { label: 'Non-binary', value: 'nonbinary' },
  { label: 'Prefer not to say', value: 'other' },
];
const LOOKING_FOR_OPTIONS = [
  { label: 'Men', value: 'men' },
  { label: 'Women', value: 'women' },
  { label: 'Non-binary', value: 'nonbinary' },
  { label: 'Everyone', value: 'everyone' },
];
const INTENT_OPTIONS = [
  { label: 'Casual', value: 'casual' },
  { label: 'Serious', value: 'serious' },
  { label: 'Open', value: 'open' },
];
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
export function ProfileForm({ initialValues = {}, onSave, saving, photos = [], onPhotosChange }) {
  const [displayName, setDisplayName] = useState(initialValues.display_name || '');
  const [birthDate, setBirthDate] = useState(
    initialValues.birth_date ? new Date(initialValues.birth_date) : null
  );
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [bio, setBio] = useState(initialValues.bio || '');
  const [gender, setGender] = useState(initialValues.gender || '');
  const [lookingFor, setLookingFor] = useState(initialValues.looking_for || '');
  const [intent, setIntent] = useState(initialValues.intent || '');
  const [focusedField, setFocusedField] = useState(null);
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
      intent: intent || undefined,
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
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Photos <Text style={styles.optional}>(optional)</Text></Text>
        <PhotoEditor photos={photos} onPhotosChange={onPhotosChange || (() => {})} />
      </View>

      <View style={[styles.section, styles.sectionBorder]}>
        <Text style={styles.label}>
          Display Name <Text style={styles.required}>*</Text>
        </Text>
        <TextInput
          style={[styles.input, errors.displayName && styles.inputError, focusedField === 'displayName' && styles.inputFocused]}
          placeholder="How others will see you"
          placeholderTextColor={theme.colors.textFaint}
          value={displayName}
          onChangeText={(t) => {
            setDisplayName(t);
            if (errors.displayName) setErrors((e) => ({ ...e, displayName: undefined }));
          }}
          onFocus={() => setFocusedField('displayName')}
          onBlur={() => setFocusedField(null)}
          autoCorrect={false}
          maxLength={40}
        />
        {errors.displayName && <Text style={styles.errorText}>{errors.displayName}</Text>}

        <Text style={styles.label}>
          Birth Date <Text style={styles.required}>*</Text>
        </Text>
        {Platform.OS === 'web' ? (
          <WebDatePicker
            value={birthDate}
            maxDate={maxDate}
            hasError={!!errors.birthDate}
            onChange={(d) => {
              setBirthDate(d);
              if (errors.birthDate) setErrors((e) => ({ ...e, birthDate: undefined }));
            }}
          />
        ) : (
          <>
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
            {showDatePicker && DateTimePicker && (
              <DateTimePicker
                value={birthDate || maxDate}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                maximumDate={maxDate}
                onChange={handleDateChange}
              />
            )}
            {Platform.OS === 'ios' && showDatePicker && (
              <TouchableOpacity style={styles.doneBtn} onPress={() => setShowDatePicker(false)}>
                <Text style={styles.doneBtnText}>Done</Text>
              </TouchableOpacity>
            )}
          </>
        )}
        {errors.birthDate && <Text style={styles.errorText}>{errors.birthDate}</Text>}

        <Text style={styles.label}>
          Bio <Text style={styles.optional}>(optional)</Text>
        </Text>
        <TextInput
          style={[styles.input, styles.bioInput, focusedField === 'bio' && styles.inputFocused]}
          placeholder="A short intro about you"
          placeholderTextColor={theme.colors.textFaint}
          value={bio}
          onChangeText={(t) => setBio(t.slice(0, 140))}
          onFocus={() => setFocusedField('bio')}
          onBlur={() => setFocusedField(null)}
          multiline
          maxLength={140}
          textAlignVertical="top"
        />
        <Text style={styles.charCount}>{bio.length}/140</Text>
      </View>

      <View style={[styles.section, styles.sectionBorder]}>
        <Text style={styles.label}>
          Gender <Text style={styles.optional}>(optional)</Text>
        </Text>
        <View style={styles.optionRow}>
          {GENDER_OPTIONS.map((opt) => (
            <TouchableOpacity
              key={opt.value}
              style={[styles.optionChip, gender === opt.value && styles.optionChipActive]}
              onPress={() => setGender(gender === opt.value ? '' : opt.value)}
              accessibilityRole="button"
            >
              <Text style={[styles.optionChipText, gender === opt.value && styles.optionChipTextActive]}>
                {opt.label}
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
              key={opt.value}
              style={[styles.optionChip, lookingFor === opt.value && styles.optionChipActive]}
              onPress={() => setLookingFor(lookingFor === opt.value ? '' : opt.value)}
              accessibilityRole="button"
            >
              <Text style={[styles.optionChipText, lookingFor === opt.value && styles.optionChipTextActive]}>
                {opt.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>
          Intent <Text style={styles.optional}>(optional)</Text>
        </Text>
        <View style={styles.optionRow}>
          {INTENT_OPTIONS.map((opt) => (
            <TouchableOpacity
              key={opt.value}
              style={[styles.optionChip, intent === opt.value && styles.optionChipActive]}
              onPress={() => setIntent(intent === opt.value ? '' : opt.value)}
              accessibilityRole="button"
            >
              <Text style={[styles.optionChipText, intent === opt.value && styles.optionChipTextActive]}>
                {opt.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
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

  async function handleSave(data) {
    setSaving(true);
    setSaveError('');
    try {
      await updateProfile(data);
      markProfileComplete();
    } catch (err) {
      const message =
        err.response?.data?.error?.message || 'Failed to save profile. Please try again.';
      setSaveError(message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Animated.View style={[styles.flex, enterStyle]}>
      <Text style={styles.heading}>Set Up Your Profile</Text>
      <Text style={styles.subheading}>Tell us a bit about yourself.</Text>
      {saveError ? (
        <Text style={styles.saveError}>{saveError}</Text>
      ) : null}
      <ProfileForm onSave={handleSave} saving={saving} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: theme.colors.bgBase },
  section: { marginBottom: 8 },
  sectionBorder: {
    borderTopWidth: 1,
    borderTopColor: theme.colors.borderSubtle,
    paddingTop: 8,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
  },
  heading: {
    ...theme.typography.titleMd,
    color: theme.colors.textPrimary,
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
  saveError: {
    color: theme.colors.error,
    fontSize: 14,
    paddingHorizontal: 24,
    marginBottom: 4,
  },
  container: { padding: 24, paddingBottom: 48 },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 6,
    marginTop: 16,
  },
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
  inputError: { borderColor: theme.colors.error },
  inputFocused: { borderColor: theme.colors.brand },
  errorText: { color: theme.colors.error, fontSize: 12, marginTop: 4 },
  dateButton: { justifyContent: 'center' },
  dateText: { fontSize: 16, color: theme.colors.textPrimary },
  datePlaceholder: { fontSize: 16, color: theme.colors.textFaint },
  doneBtn: {
    alignSelf: 'flex-end',
    paddingVertical: 6,
    paddingHorizontal: 16,
    marginTop: 4,
  },
  doneBtnText: { color: theme.colors.brand, fontSize: 16, fontWeight: '600' },
  bioInput: { height: 90, paddingTop: 12 },
  charCount: { fontSize: 11, color: '#bbb', textAlign: 'right', marginTop: 2 },
  optionRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  optionChip: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: theme.colors.borderDefault,
    marginBottom: 4,
  },
  optionChipActive: { borderColor: theme.colors.brand, backgroundColor: theme.colors.badgePurpleBg },
  optionChipText: { fontSize: 14, color: theme.colors.textSecondary },
  optionChipTextActive: { color: theme.colors.brand, fontWeight: '600' },
  saveButton: {
    height: 52,
    backgroundColor: theme.colors.brand,
    borderRadius: theme.radii.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 32,
  },
  saveButtonDisabled: { opacity: 0.45 },
  saveButtonText: { color: '#fff', fontSize: 17, fontWeight: '600' },
});
