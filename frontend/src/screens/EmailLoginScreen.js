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
import { Ionicons } from '@expo/vector-icons';
import { verifyFirebaseIdToken } from '../api/auth';
import { signInOrRegisterWithEmail } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { theme } from '../theme';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function EmailLoginScreen() {
  const { signIn } = useAuth();

  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
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

  // Button press spring
  const btnScale = useRef(new Animated.Value(1)).current;
  const onBtnPressIn = () => Animated.spring(btnScale, { toValue: 0.94, useNativeDriver: true, speed: 40, bounciness: 0 }).start();
  const onBtnPressOut = () => Animated.spring(btnScale, { toValue: 1, useNativeDriver: true, speed: 20, bounciness: 6 }).start();

  function clearError() {
    if (status === 'error') {
      setStatus('idle');
      setErrorMsg('');
    }
  }

  function validate() {
    if (!EMAIL_REGEX.test(email.trim())) {
      return 'Enter a valid email address.';
    }
    if (password.length < 8) {
      return 'Password must be at least 8 characters.';
    }
    return null;
  }

  async function handleSubmit() {
    const validationError = validate();
    if (validationError) {
      setStatus('error');
      setErrorMsg(validationError);
      return;
    }

    setStatus('submitting');
    setErrorMsg('');

    try {
      const credential = await signInOrRegisterWithEmail(email.trim(), password, isRegistering);
      const idToken = await credential.user.getIdToken();
      const data = await verifyFirebaseIdToken(idToken);

      await signIn(data);
    } catch (err) {
      console.error('[AUTH_DEBUG] Sign-in error:', JSON.stringify({
        message: err.message,
        code: err.code,
        responseStatus: err.response?.status,
        responseData: err.response?.data,
        name: err.name,
      }));
      const firebaseCode = err.code;
      const backendCode  = err.response?.data?.error?.code;

      if (firebaseCode === 'auth/email-already-in-use' || backendCode === 'EMAIL_TAKEN') {
        setErrorMsg('An account with this email already exists.');
      } else if (firebaseCode === 'auth/weak-password') {
        setErrorMsg('Password must be at least 8 characters.');
      } else if (firebaseCode === 'auth/invalid-email') {
        setErrorMsg('Enter a valid email address.');
      } else if (
        firebaseCode === 'auth/wrong-password' ||
        firebaseCode === 'auth/user-not-found' ||
        firebaseCode === 'auth/invalid-credential' ||
        backendCode === 'INVALID_CREDENTIALS'
      ) {
        setErrorMsg('Incorrect email or password.');
      } else if (backendCode === 'ACCOUNT_BANNED') {
        setErrorMsg('This account has been suspended.');
      } else if (backendCode === 'VALIDATION_ERROR') {
        setErrorMsg(err.response.data.error.message || 'Invalid input.');
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
        <View style={[styles.accentBar, { backgroundColor: theme.colors.brand }]} />
        <Text style={styles.subtitle}>
          {isRegistering ? 'Create your account' : 'Welcome back'}
        </Text>

        <TextInput
          style={[styles.input, status === 'error' && styles.inputError]}
          placeholder="Email"
          placeholderTextColor={theme.colors.textFaint}
          keyboardType="email-address"
          autoCorrect={false}
          autoCapitalize="none"
          autoComplete="email"
          textContentType="emailAddress"
          value={email}
          onChangeText={(t) => { setEmail(t); clearError(); }}
          editable={!isSubmitting}
        />

        <View style={styles.passwordRow}>
          <TextInput
            style={[styles.input, styles.passwordInput, status === 'error' && styles.inputError]}
            placeholder="Password"
            placeholderTextColor={theme.colors.textFaint}
            secureTextEntry={!showPassword}
            autoComplete={isRegistering ? 'new-password' : 'current-password'}
            textContentType={isRegistering ? 'newPassword' : 'password'}
            value={password}
            onChangeText={(t) => { setPassword(t); clearError(); }}
            editable={!isSubmitting}
          />
          <TouchableOpacity
            style={styles.eyeBtn}
            onPress={() => setShowPassword((v) => !v)}
            accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
          >
            <Ionicons
              name={showPassword ? 'eye-off-outline' : 'eye-outline'}
              size={20}
              color={theme.colors.textMuted}
            />
          </TouchableOpacity>
        </View>

        {status === 'error' && (
          <Text style={styles.errorText}>{errorMsg}</Text>
        )}

        <Animated.View style={{ transform: [{ scale: btnScale }] }}>
          <TouchableOpacity
            style={[styles.button, isSubmitting && styles.buttonDisabled]}
            onPress={handleSubmit}
            onPressIn={onBtnPressIn}
            onPressOut={onBtnPressOut}
            disabled={isSubmitting}
            accessibilityRole="button"
            accessibilityLabel={isRegistering ? 'Create account' : 'Sign in'}
          >
            {!isSubmitting && (
              <View style={[StyleSheet.absoluteFill, { backgroundColor: theme.gradients.brand?.[0] ?? '#6C47FF' }]} />
            )}
            {isSubmitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>
                {isRegistering ? 'Create Account' : 'Sign In'}
              </Text>
            )}
          </TouchableOpacity>
        </Animated.View>

        <TouchableOpacity
          style={styles.toggleRow}
          onPress={() => { setIsRegistering((v) => !v); setStatus('idle'); setErrorMsg(''); }}
          accessibilityRole="button"
        >
          <Text style={styles.toggleText}>
            {isRegistering
              ? 'Already have an account? '
              : "Don't have an account? "}
            <Text style={styles.toggleLink}>
              {isRegistering ? 'Sign in' : 'Sign up'}
            </Text>
          </Text>
        </TouchableOpacity>
      </Animated.View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: theme.colors.bgDeep },
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
    backgroundColor: 'rgba(0,114,206,0.08)',
  },
  title: {
    ...theme.typography.displayLg,
    color: theme.colors.brand,
    textAlign: 'center',
    marginBottom: 8,
  },
  accentBar: {
    height: 3,
    width: 48,
    borderRadius: 2,
    marginBottom: 20,
    alignSelf: 'center',
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
    fontSize: 16,
    color: theme.colors.textPrimary,
    backgroundColor: theme.colors.inputBg,
    marginBottom: 12,
  },
  inputError: {
    borderColor: theme.colors.error,
  },
  passwordRow: {
    position: 'relative',
  },
  passwordInput: {
    paddingRight: 48,
  },
  eyeBtn: {
    position: 'absolute',
    right: 14,
    top: 14,
    padding: 2,
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
    marginTop: 4,
    overflow: 'hidden',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '600',
  },
  toggleRow: {
    marginTop: 24,
    alignItems: 'center',
  },
  toggleText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  toggleLink: {
    color: theme.colors.brand,
    fontWeight: '600',
  },
});
