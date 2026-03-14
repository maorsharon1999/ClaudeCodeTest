import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Animated,
  Platform,
} from 'react-native';
import { setVisibility, getProfile } from '../api/profile';
import { useAuth } from '../context/AuthContext';
import { getIncomingSignals } from '../api/signals';
import { useFocusEffect } from '@react-navigation/native';
import Toast from '../components/Toast';
import { theme } from '../theme';

// Reset server-side visibility to invisible on every new session (privacy invariant)
async function resetVisibilityOnMount() {
  try { await setVisibility('invisible'); } catch { /* best-effort */ }
}

export default function HomeScreen({ navigation }) {
  const { signOut } = useAuth();
  const [isVisible, setIsVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const [toastKey, setToastKey] = useState(0);
  const [signalCount, setSignalCount] = useState(0);
  const [profilePhoto, setProfilePhoto] = useState(null);

  // Entrance animation
  const enterAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(enterAnim, { toValue: 1, duration: 320, useNativeDriver: true }).start();
  }, []);
  const enterStyle = {
    opacity: enterAnim,
    transform: [{ translateY: enterAnim.interpolate({ inputRange: [0, 1], outputRange: [16, 0] }) }],
  };

  // Orb color animation (useNativeDriver: false required for color interpolation)
  const orbColor = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(orbColor, {
      toValue: isVisible ? 1 : 0,
      duration: 250,
      useNativeDriver: false,
    }).start();
  }, [isVisible]);
  const orbBg = orbColor.interpolate({
    inputRange: [0, 1],
    outputRange: [theme.colors.disabled, theme.colors.brand],
  });

  // Pulse ring animations
  const ring1Scale = useRef(new Animated.Value(1)).current;
  const ring1Opacity = useRef(new Animated.Value(0.6)).current;
  const ring2Scale = useRef(new Animated.Value(1)).current;
  const ring2Opacity = useRef(new Animated.Value(0.6)).current;
  const ring1Anim = useRef(null);
  const ring2Anim = useRef(null);

  useEffect(() => {
    if (isVisible) {
      const makeRingLoop = (scale, opacity, delay) =>
        Animated.loop(
          Animated.sequence([
            Animated.delay(delay),
            Animated.parallel([
              Animated.timing(scale, { toValue: 1.5, duration: 1800, useNativeDriver: true }),
              Animated.timing(opacity, { toValue: 0, duration: 1800, useNativeDriver: true }),
            ]),
            Animated.parallel([
              Animated.timing(scale, { toValue: 1, duration: 0, useNativeDriver: true }),
              Animated.timing(opacity, { toValue: 0.6, duration: 0, useNativeDriver: true }),
            ]),
          ])
        );

      ring1Anim.current = makeRingLoop(ring1Scale, ring1Opacity, 0);
      ring2Anim.current = makeRingLoop(ring2Scale, ring2Opacity, 700);
      ring1Anim.current.start();
      ring2Anim.current.start();
    } else {
      if (ring1Anim.current) ring1Anim.current.stop();
      if (ring2Anim.current) ring2Anim.current.stop();
      ring1Scale.setValue(1);
      ring1Opacity.setValue(0);
      ring2Scale.setValue(1);
      ring2Opacity.setValue(0);
    }
  }, [isVisible]);

  useEffect(() => {
    resetVisibilityOnMount();
    getProfile().then(p => {
      const raw = p?.photos?.[0];
      if (raw) {
        // Replace localhost with the configured API host so device can reach it
        const apiBase = process.env.EXPO_PUBLIC_API_URL || '';
        const host = apiBase ? apiBase.replace('/api/v1', '') : '';
        const url = host ? raw.replace(/^http:\/\/localhost:\d+/, host) : raw;
        setProfilePhoto(url);
      }
    }).catch(() => {});
  }, []);
  useFocusEffect(
    useCallback(() => {
      getIncomingSignals().then((s) => setSignalCount(s.length)).catch(() => {});
    }, [])
  );

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
    <Animated.View style={[homeStyles.container, enterStyle]}>
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

      <View style={{ width: 200, height: 200, alignItems: 'center', justifyContent: 'center' }}>
        <Animated.View
          style={[
            homeStyles.pulseRing,
            { transform: [{ scale: ring1Scale }], opacity: ring1Opacity },
          ]}
        />
        <Animated.View
          style={[
            homeStyles.pulseRing,
            { transform: [{ scale: ring2Scale }], opacity: ring2Opacity },
          ]}
        />
        <TouchableOpacity
          style={[
            homeStyles.toggleButton,
            loading && homeStyles.toggleLoading,
            isVisible ? theme.shadows.orb : homeStyles.toggleShadowOff,
          ]}
          onPress={handleToggle}
          disabled={loading}
          accessibilityRole="switch"
          accessibilityState={{ checked: isVisible }}
          accessibilityLabel={isVisible ? 'Go invisible' : 'Go visible'}
        >
          {profilePhoto && (
            <Image
              source={{ uri: profilePhoto }}
              style={homeStyles.orbPhoto}
              resizeMode="cover"
            />
          )}
          <Animated.View style={[homeStyles.orbInner, { backgroundColor: profilePhoto ? 'rgba(0,0,0,0.15)' : orbBg }]}>
            {loading && <ActivityIndicator size="large" color="#fff" />}
            {!profilePhoto && !loading && (
              <Text style={homeStyles.toggleText}>
                {isVisible ? 'GO INVISIBLE' : 'GO VISIBLE'}
              </Text>
            )}
          </Animated.View>
        </TouchableOpacity>
      </View>

      <Text style={homeStyles.hint}>
        {isVisible ? 'Others nearby can see you.' : 'You are hidden from everyone.'}
      </Text>

      <View style={homeStyles.navRow}>
        <TouchableOpacity
          style={homeStyles.navItem}
          onPress={() => navigation.navigate('Signals')}
          accessibilityRole="button"
          accessibilityLabel="View signals"
        >
          <View style={homeStyles.navIconWrap}>
            <Text style={homeStyles.navIconGlyph}>⚡</Text>
            {signalCount > 0 && (
              <View style={homeStyles.badge}>
                <Text style={homeStyles.badgeText}>{signalCount}</Text>
              </View>
            )}
          </View>
          <Text style={homeStyles.navLabel}>Signals</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={homeStyles.navItem}
          onPress={() => navigation.navigate('Chats')}
          accessibilityRole="button"
          accessibilityLabel="View chats"
        >
          <View style={homeStyles.navIconWrap}>
            <Text style={homeStyles.navIconGlyph}>✉</Text>
          </View>
          <Text style={homeStyles.navLabel}>Chats</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={homeStyles.navItem}
          onPress={() => navigation.navigate('Discovery')}
          accessibilityRole="button"
          accessibilityLabel="Find people nearby"
        >
          <View style={homeStyles.navIconWrap}>
            <Text style={homeStyles.navIconGlyph}>◎</Text>
          </View>
          <Text style={homeStyles.navLabel}>Nearby</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={homeStyles.signOutBtn}
        onPress={signOut}
        accessibilityRole="button"
        accessibilityLabel="Sign out"
      >
        <Text style={homeStyles.signOutText}>Sign Out</Text>
      </TouchableOpacity>

      <Toast key={toastKey} message={toastMsg} visible={!!toastMsg} />
    </Animated.View>
  );
}

const homeStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.bgBase,
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
  settingsIcon: { fontSize: 26, color: theme.colors.textSecondary },
  title: { ...theme.typography.displayLg, color: theme.colors.brand, marginBottom: 16 },
  statusLabel: { fontSize: 18, color: theme.colors.textSecondary, marginBottom: 40 },
  statusOn: { color: theme.colors.success, fontWeight: '700' },
  statusOff: { color: theme.colors.textFaint, fontWeight: '700' },
  pulseRing: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    borderWidth: 2,
    borderColor: theme.colors.brand,
  },
  toggleButton: {
    width: 200,
    height: 200,
    borderRadius: 100,
    overflow: 'hidden',
  },
  orbPhoto: {
    position: 'absolute',
    width: 200,
    height: 200,
  },
  orbInner: {
    width: 200,
    height: 200,
    borderRadius: 100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  toggleShadowOff: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 8,
  },
  toggleLoading: { opacity: 0.7 },
  toggleText: { color: '#fff', fontSize: 18, fontWeight: '700', textAlign: 'center', letterSpacing: 1 },
  hint: { marginTop: 28, fontSize: 14, color: theme.colors.textMuted, textAlign: 'center' },
  navRow: {
    flexDirection: 'row',
    marginTop: 36,
    gap: 32,
  },
  navItem: {
    alignItems: 'center',
  },
  navIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: theme.colors.bgWash,
    justifyContent: 'center',
    alignItems: 'center',
  },
  navIconGlyph: {
    fontSize: 24,
  },
  navLabel: {
    marginTop: 6,
    fontSize: 12,
    color: theme.colors.textSecondary,
    fontWeight: '500',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: theme.colors.error,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  badgeText: { color: '#fff', fontSize: 10, fontWeight: '700' },
  signOutBtn: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 48 : 28,
    padding: 8,
  },
  signOutText: { fontSize: 14, color: theme.colors.textFaint, textDecorationLine: 'underline' },
});
