import React, { useState, useEffect, useRef, useCallback } from 'react';
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
import { verifyOtp, requestOtp } from '../api/auth';
import { useAuth } from '../context/AuthContext';

const RESEND_SECONDS = 60;
const CODE_LENGTH = 6;

export default function OtpVerifyScreen({ route, navigation }) {
  const { phone } = route.params;
  const { signIn } = useAuth();

  const [code, setCode] = useState('');
  const [status, setStatus] = useState('idle'); // idle | verifying | error | locked
  const [errorMsg, setErrorMsg] = useState('');
  const [countdown, setCountdown] = useState(RESEND_SECONDS);
  const [resending, setResending] = useState(false);

  const timerRef = useRef(null);

  // Start/restart countdown
  const startCountdown = useCallback(() => {
    setCountdown(RESEND_SECONDS);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  useEffect(() => {
    startCountdown();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [startCountdown]);

  const handleVerify = useCallback(async (codeValue) => {
    if (codeValue.length !== CODE_LENGTH) return;
    setStatus('verifying');
    setErrorMsg('');

    try {
      const data = await verifyOtp(phone, codeValue);
      await signIn(data);
      // Navigation handled by RootNavigator based on auth state
    } catch (err) {
      const code_err = err.response?.data?.error?.code;
      if (code_err === 'OTP_LOCKED') {
        setStatus('locked');
        setErrorMsg('Too many incorrect attempts. Please request a new code.');
      } else if (code_err === 'OTP_NOT_FOUND') {
        setStatus('error');
        setErrorMsg('Code expired. Please request a new one.');
      } else if (code_err === 'OTP_INVALID') {
        setStatus('error');
        setErrorMsg('Incorrect code. Please try again.');
      } else {
        setStatus('error');
        setErrorMsg('Verification failed. Please try again.');
      }
      setCode('');
    }
  }, [phone, signIn]);

  function handleCodeChange(text) {
    const cleaned = text.replace(/\D/g, '').slice(0, CODE_LENGTH);
    setCode(cleaned);

    if (status === 'error') {
      setStatus('idle');
      setErrorMsg('');
    }

    if (cleaned.length === CODE_LENGTH) {
      handleVerify(cleaned);
    }
  }

  async function handleResend() {
    setResending(true);
    setCode('');
    setStatus('idle');
    setErrorMsg('');
    try {
      await requestOtp(phone);
      startCountdown();
    } catch (err) {
      const code_err = err.response?.data?.error?.code;
      if (code_err === 'OTP_RATE_LIMIT' || code_err === 'RATE_LIMIT') {
        setErrorMsg('Too many requests. Please wait.');
      } else {
        setErrorMsg('Failed to resend. Please try again.');
      }
    } finally {
      setResending(false);
    }
  }

  const isVerifying = status === 'verifying';
  const isLocked = status === 'locked';
  const canResend = countdown === 0 && !resending && !isVerifying;

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.container}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>

        <Text style={styles.title}>Enter Code</Text>
        <Text style={styles.subtitle}>
          We sent a 6-digit code to{'\n'}
          <Text style={styles.phone}>{phone}</Text>
        </Text>

        <TextInput
          style={[
            styles.input,
            (status === 'error' || isLocked) && styles.inputError,
            isVerifying && styles.inputDisabled,
          ]}
          placeholder="------"
          placeholderTextColor="#ccc"
          keyboardType="number-pad"
          textContentType="oneTimeCode"
          autoComplete="sms-otp"
          value={code}
          onChangeText={handleCodeChange}
          editable={!isVerifying && !isLocked}
          maxLength={CODE_LENGTH}
          textAlign="center"
        />

        {isVerifying && (
          <View style={styles.verifyingRow}>
            <ActivityIndicator size="small" color="#6C47FF" />
            <Text style={styles.verifyingText}>Verifying…</Text>
          </View>
        )}

        {(status === 'error' || isLocked) && (
          <Text style={styles.errorText}>{errorMsg}</Text>
        )}

        <View style={styles.resendRow}>
          {canResend ? (
            <TouchableOpacity onPress={handleResend} accessibilityRole="button">
              <Text style={styles.resendActive}>Resend code</Text>
            </TouchableOpacity>
          ) : resending ? (
            <ActivityIndicator size="small" color="#6C47FF" />
          ) : (
            <Text style={styles.resendCountdown}>
              Resend in {countdown}s
            </Text>
          )}
        </View>
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
  backBtn: {
    position: 'absolute',
    top: 60,
    left: 20,
  },
  backText: {
    fontSize: 16,
    color: '#6C47FF',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 15,
    color: '#555',
    marginBottom: 32,
    lineHeight: 22,
  },
  phone: {
    fontWeight: '600',
    color: '#111',
  },
  input: {
    height: 64,
    borderWidth: 1.5,
    borderColor: '#ddd',
    borderRadius: 12,
    fontSize: 32,
    color: '#111',
    letterSpacing: 12,
    marginBottom: 8,
  },
  inputError: {
    borderColor: '#E53935',
  },
  inputDisabled: {
    opacity: 0.6,
  },
  verifyingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  verifyingText: {
    color: '#6C47FF',
    fontSize: 14,
  },
  errorText: {
    color: '#E53935',
    fontSize: 13,
    marginBottom: 8,
  },
  resendRow: {
    marginTop: 24,
    alignItems: 'center',
  },
  resendActive: {
    color: '#6C47FF',
    fontSize: 15,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  resendCountdown: {
    color: '#999',
    fontSize: 14,
  },
});
