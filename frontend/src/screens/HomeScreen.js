import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Animated,
  Platform,
} from 'react-native';
import { setVisibility } from '../api/profile';
import { useAuth } from '../context/AuthContext';

function Toast({ message, visible }) {
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
        Animated.delay(2200),
        Animated.timing(opacity, { toValue: 0, duration: 300, useNativeDriver: true }),
      ]).start();
    }
  }, [visible, message, opacity]);

  return (
    <Animated.View style={[toastStyles.toast, { opacity }]} pointerEvents="none">
      <Text style={toastStyles.toastText}>{message}</Text>
    </Animated.View>
  );
}

export default function HomeScreen({ navigation }) {
  const { signOut } = useAuth();
  const [isVisible, setIsVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const [toastKey, setToastKey] = useState(0);

  function showToast(msg) {
    setToastMsg(msg);
    setToastKey((k) => k + 1);
  }

  async function handleToggle() {
    if (loading) return;
    const newState = !isVisible;
    const apiState = newState ? 'visible' : 'invisible';
    setIsVisible(newState);
    setLoading(true);
    try {
      await setVisibility(apiState);
    } catch {
      setIsVisible(!newState);
      showToast('Could not update visibility. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={homeStyles.container}>
      <TouchableOpacity
        style={homeStyles.settingsBtn}
        onPress={() => navigation.navigate('ProfileEdit')}
        accessibilityRole="button"
        accessibilityLabel="Edit profile"
      >
        <Text style={homeStyles.settingsIcon}>&#9881;</Text>
      </TouchableOpacity>

      <Text style={homeStyles.title}>Bubble</Text>
      <Text style={homeStyles.statusLabel}>
        You are{' '}
        <Text style={isVisible ? homeStyles.statusOn : homeStyles.statusOff}>
          {isVisible ? 'VISIBLE' : 'INVISIBLE'}
        </Text>
      </Text>

      <TouchableOpacity
        style={[
          homeStyles.toggleButton,
          isVisible ? homeStyles.toggleOn : homeStyles.toggleOff,
          loading && homeStyles.toggleLoading,
        ]}
        onPress={handleToggle}
        disabled={loading}
        accessibilityRole="switch"
        accessibilityState={{ checked: isVisible }}
        accessibilityLabel={isVisible ? 'Go invisible' : 'Go visible'}
      >
        {loading ? (
          <ActivityIndicator size="large" color="#fff" />
        ) : (
          <Text style={homeStyles.toggleText}>
            {isVisible ? 'GO INVISIBLE' : 'GO VISIBLE'}
          </Text>
        )}
      </TouchableOpacity>

      <Text style={homeStyles.hint}>
        {isVisible ? 'Others nearby can see you.' : 'You are hidden from everyone.'}
      </Text>

      <TouchableOpacity
        style={homeStyles.signOutBtn}
        onPress={signOut}
        accessibilityRole="button"
        accessibilityLabel="Sign out"
      >
        <Text style={homeStyles.signOutText}>Sign Out</Text>
      </TouchableOpacity>

      <Toast key={toastKey} message={toastMsg} visible={!!toastMsg} />
    </View>
  );
}

const homeStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  settingsBtn: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 56 : 24,
    right: 20,
    padding: 8,
  },
  settingsIcon: { fontSize: 26, color: '#555' },
  title: { fontSize: 40, fontWeight: '800', color: '#6C47FF', marginBottom: 16 },
  statusLabel: { fontSize: 18, color: '#555', marginBottom: 40 },
  statusOn: { color: '#2E7D32', fontWeight: '700' },
  statusOff: { color: '#999', fontWeight: '700' },
  toggleButton: {
    width: 200,
    height: 200,
    borderRadius: 100,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 8,
  },
  toggleOn: { backgroundColor: '#6C47FF' },
  toggleOff: { backgroundColor: '#C7C7CC' },
  toggleLoading: { opacity: 0.7 },
  toggleText: { color: '#fff', fontSize: 18, fontWeight: '700', textAlign: 'center', letterSpacing: 1 },
  hint: { marginTop: 28, fontSize: 14, color: '#888', textAlign: 'center' },
  signOutBtn: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 48 : 28,
    padding: 8,
  },
  signOutText: { fontSize: 14, color: '#aaa', textDecorationLine: 'underline' },
});

const toastStyles = StyleSheet.create({
  toast: {
    position: 'absolute',
    bottom: 90,
    left: 24,
    right: 24,
    backgroundColor: '#323232',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  toastText: { color: '#fff', fontSize: 14 },
});
