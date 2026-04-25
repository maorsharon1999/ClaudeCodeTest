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
import SkyBackground from '../components/visual/SkyBackground';
import BubbleField from '../components/visual/BubbleField';
import LogoBubble from '../components/visual/LogoBubble';
import GlassButton from '../components/visual/GlassButton';
import GlassCard from '../components/visual/GlassCard';
import GlassInput from '../components/visual/GlassInput';

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
    <SkyBackground variant="sky">
      <BubbleField />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <Animated.View style={[styles.container, enterStyle]}>
          {/* Logo floating above card */}
          <View style={styles.logoWrap}>
            <LogoBubble size={130} />
          </View>

          {/* Glass card */}
          <GlassCard style={styles.card}>
            <Text style={styles.cardTitle}>
              {isRegistering ? 'Create your account' : 'Welcome back'}
            </Text>

            <GlassInput
              placeholder="Email Address"
              value={email}
              onChangeText={(t) => { setEmail(t); clearError(); }}
              error={status === 'error' ? errorMsg : undefined}
              keyboardType="email-address"
              autoCorrect={false}
              autoCapitalize="none"
              autoComplete="email"
              textContentType="emailAddress"
              editable={!isSubmitting}
            />

            <View style={styles.passwordRow}>
              <GlassInput
                placeholder="Password"
                value={password}
                onChangeText={(t) => { setPassword(t); clearError(); }}
                secureTextEntry={!showPassword}
                autoComplete={isRegistering ? 'new-password' : 'current-password'}
                textContentType={isRegistering ? 'newPassword' : 'password'}
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
                  color={theme.colors.inkMuted}
                />
              </TouchableOpacity>
            </View>

            {status === 'error' && (
              <Text style={styles.errorText}>{errorMsg}</Text>
            )}

            <Animated.View style={{ transform: [{ scale: btnScale }] }}>
              <GlassButton
                label={isRegistering ? 'Create Account' : 'Sign In'}
                variant="primary"
                size="lg"
                onPress={handleSubmit}
                onPressIn={onBtnPressIn}
                onPressOut={onBtnPressOut}
                disabled={isSubmitting}
                loading={isSubmitting}
                style={styles.submitBtn}
              />
            </Animated.View>

            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerLabel}>OR</Text>
              <View style={styles.dividerLine} />
            </View>

            <TouchableOpacity
              style={styles.toggleRow}
              onPress={() => { setIsRegistering((v) => !v); setStatus('idle'); setErrorMsg(''); }}
              accessibilityRole="button"
            >
              <Text style={styles.toggleText}>
                {isRegistering
                  ? 'Already have an account? '
                  : "New to the surface? "}
                <Text style={styles.toggleLink}>
                  {isRegistering ? 'Sign in' : 'Create Account'}
                </Text>
              </Text>
            </TouchableOpacity>
          </GlassCard>
        </Animated.View>
      </KeyboardAvoidingView>
    </SkyBackground>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingTop: 70,
    zIndex: 2,
  },
  logoWrap: {
    alignItems: 'center',
    marginBottom: -60,
    zIndex: 3,
  },
  card: {
    paddingTop: 80,
    paddingHorizontal: 22,
    paddingBottom: 28,
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: theme.colors.ink,
    textAlign: 'center',
    marginBottom: 20,
  },
  passwordRow: {
    position: 'relative',
    marginTop: 12,
  },
  eyeBtn: {
    position: 'absolute',
    right: 14,
    top: 14,
    padding: 2,
    zIndex: 1,
  },
  errorText: {
    color: theme.colors.error,
    fontSize: 13,
    marginTop: 6,
    marginBottom: 4,
  },
  submitBtn: {
    marginTop: 20,
    width: '100%',
    letterSpacing: 3,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginVertical: 22,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: theme.colors.inkGhost,
  },
  dividerLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 2.5,
    color: theme.colors.inkMuted,
  },
  toggleRow: {
    alignItems: 'center',
  },
  toggleText: {
    fontSize: 14,
    color: theme.colors.inkSoft,
  },
  toggleLink: {
    color: theme.colors.ink,
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
});
