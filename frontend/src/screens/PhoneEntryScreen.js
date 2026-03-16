import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { requestOtp } from '../api/auth';
import { theme } from '../theme';

const E164_REGEX = /^\+[1-9]\d{7,14}$/;

export default function PhoneEntryScreen({ navigation }) {
  const [phone, setPhone] = useState('');
  const [status, setStatus] = useState('idle'); // idle | submitting | error
  const [errorMsg, setErrorMsg] = useState('');

  // Entrance animation
  const enterAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(enterAnim, { toValue: 1, duration: 320, useNativeDriver: true }).start();
  }, []);
  const enterStyle = {
    opacity: enterAnim,
    transform: [{ translateY: enterAnim.interpolate({ inputRange: [0, 1], outputRange: [16, 0] }) }],
  };

  // Send Code button press spring
  const sendScale = useRef(new Animated.Value(1)).current;
  const onSendPressIn = () => Animated.spring(sendScale, { toValue: 0.94, useNativeDriver: true, speed: 40, bounciness: 0 }).start();
  const onSendPressOut = () => Animated.spring(sendScale, { toValue: 1, useNativeDriver: true, speed: 20, bounciness: 6 }).start();

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
      <Animated.View style={[styles.container, enterStyle]}>
        <View style={styles.decorCircle} />
        <Text style={styles.title}>Bubble</Text>
        <LinearGradient
          colors={['#6C47FF', '#FF6C47']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.accentBar}
        />
        <Text style={styles.subtitle}>Enter your phone number to get started</Text>

        <TextInput
          style={[styles.input, status === 'error' && styles.inputError]}
          placeholder="+14155552671"
          placeholderTextColor={theme.colors.textFaint}
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

        <Animated.View style={{ transform: [{ scale: sendScale }] }}>
          <TouchableOpacity
            style={[styles.button, isSubmitting && styles.buttonDisabled]}
            onPress={handleSubmit}
            onPressIn={onSendPressIn}
            onPressOut={onSendPressOut}
            disabled={isSubmitting}
            accessibilityRole="button"
            accessibilityLabel="Send verification code"
          >
            {!isSubmitting && (
              <LinearGradient
                colors={theme.gradients.brand}
                style={StyleSheet.absoluteFill}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              />
            )}
            {isSubmitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Send Code</Text>
            )}
          </TouchableOpacity>
        </Animated.View>

        <Text style={styles.hint}>
          We'll send a 6-digit code via SMS. Standard rates may apply.
        </Text>
      </Animated.View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: theme.colors.bgTinted },
  container: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 28,
  },
  decorCircle: {
    position: 'absolute',
    top: -80,
    right: -60,
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: 'rgba(108,71,255,0.07)',
  },
  title: {
    ...theme.typography.displayLg,
    color: theme.colors.brand,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: 36,
  },
  input: {
    height: 52,
    borderWidth: 1.5,
    borderColor: theme.colors.borderDefault,
    borderRadius: 20,
    paddingHorizontal: 16,
    fontSize: 18,
    color: theme.colors.textPrimary,
    marginBottom: 8,
  },
  inputError: {
    borderColor: theme.colors.error,
  },
  errorText: {
    color: theme.colors.error,
    fontSize: 13,
    marginBottom: 12,
  },
  button: {
    height: 52,
    backgroundColor: theme.colors.brand,
    borderRadius: theme.radii.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
    overflow: 'hidden',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  accentBar: {
    height: 3,
    width: 48,
    borderRadius: 2,
    marginBottom: 20,
    alignSelf: 'center',
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
