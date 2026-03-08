import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { requestOtp } from '../api/auth';

const E164_REGEX = /^\+[1-9]\d{7,14}$/;

export default function PhoneEntryScreen({ navigation }) {
  const [phone, setPhone] = useState('');
  const [status, setStatus] = useState('idle'); // idle | submitting | error
  const [errorMsg, setErrorMsg] = useState('');

  function validate(value) {
    if (!E164_REGEX.test(value)) {
      return 'Enter a valid phone number in E.164 format (e.g. +14155552671)';
    }
    return null;
  }

  async function handleSubmit() {
    const validationError = validate(phone.trim());
    if (validationError) {
      setStatus('error');
      setErrorMsg(validationError);
      return;
    }

    setStatus('submitting');
    setErrorMsg('');

    try {
      await requestOtp(phone.trim());
      navigation.navigate('OtpVerify', { phone: phone.trim() });
    } catch (err) {
      const code = err.response?.data?.error?.code;
      if (code === 'OTP_RATE_LIMIT' || code === 'RATE_LIMIT') {
        setErrorMsg('Too many requests. Please wait and try again.');
      } else if (code === 'VALIDATION_ERROR') {
        setErrorMsg('Invalid phone number format.');
      } else {
        setErrorMsg('Something went wrong. Please try again.');
      }
      setStatus('error');
    }
  }

  const isSubmitting = status === 'submitting';

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.container}>
        <Text style={styles.title}>Bubble</Text>
        <Text style={styles.subtitle}>Enter your phone number to get started</Text>

        <TextInput
          style={[styles.input, status === 'error' && styles.inputError]}
          placeholder="+14155552671"
          placeholderTextColor="#aaa"
          keyboardType="phone-pad"
          autoCorrect={false}
          autoComplete="tel"
          textContentType="telephoneNumber"
          value={phone}
          onChangeText={(text) => {
            setPhone(text);
            if (status === 'error') {
              setStatus('idle');
              setErrorMsg('');
            }
          }}
          editable={!isSubmitting}
          maxLength={16}
        />

        {status === 'error' && (
          <Text style={styles.errorText}>{errorMsg}</Text>
        )}

        <TouchableOpacity
          style={[styles.button, isSubmitting && styles.buttonDisabled]}
          onPress={handleSubmit}
          disabled={isSubmitting}
          accessibilityRole="button"
          accessibilityLabel="Send verification code"
        >
          {isSubmitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Send Code</Text>
          )}
        </TouchableOpacity>

        <Text style={styles.hint}>
          We'll send a 6-digit code via SMS. Standard rates may apply.
        </Text>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#fff' },
  container: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 28,
  },
  title: {
    fontSize: 36,
    fontWeight: '700',
    color: '#6C47FF',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#555',
    textAlign: 'center',
    marginBottom: 36,
  },
  input: {
    height: 52,
    borderWidth: 1.5,
    borderColor: '#ddd',
    borderRadius: 10,
    paddingHorizontal: 16,
    fontSize: 18,
    color: '#111',
    marginBottom: 8,
  },
  inputError: {
    borderColor: '#E53935',
  },
  errorText: {
    color: '#E53935',
    fontSize: 13,
    marginBottom: 12,
  },
  button: {
    height: 52,
    backgroundColor: '#6C47FF',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '600',
  },
  hint: {
    marginTop: 20,
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
  },
});
