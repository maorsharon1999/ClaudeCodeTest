import React, { useRef, useEffect, useState } from 'react';
import { View, StyleSheet, Animated, Easing } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import * as SplashScreen from 'expo-splash-screen';
import { useAuth } from '../context/AuthContext';
import { theme } from '../theme';

import EmailLoginScreen from '../screens/EmailLoginScreen';
import ProfileSetupScreen from '../screens/ProfileSetupScreen';
import HomeScreen from '../screens/HomeScreen';
import ProfileEditScreen from '../screens/ProfileEditScreen';
import DiscoveryScreen from '../screens/DiscoveryScreen';
import SignalsScreen from '../screens/SignalsScreen';
import ChatsScreen from '../screens/ChatsScreen';
import ThreadScreen from '../screens/ThreadScreen';
import SettingsScreen from '../screens/SettingsScreen';
import BlockedUsersScreen from '../screens/BlockedUsersScreen';
import CreateBubbleScreen from '../screens/CreateBubbleScreen';
import BubbleChatScreen from '../screens/BubbleChatScreen';

const AuthStack = createNativeStackNavigator();
const AppStack = createNativeStackNavigator();

function AuthNavigator() {
  return (
    <AuthStack.Navigator screenOptions={{ headerShown: false }}>
      <AuthStack.Screen name="EmailLogin" component={EmailLoginScreen} />
    </AuthStack.Navigator>
  );
}

function AppNavigator() {
  const { profileComplete } = useAuth();
  return (
    <AppStack.Navigator screenOptions={{ headerShown: false }}>
      {!profileComplete && (
        <AppStack.Screen name="ProfileSetup" component={ProfileSetupScreen} />
      )}
      <AppStack.Screen name="Home" component={HomeScreen} />
      <AppStack.Screen
        name="ProfileEdit"
        component={ProfileEditScreen}
        options={{ headerShown: true, title: 'Edit Profile' }}
      />
      <AppStack.Screen
        name="Discovery"
        component={DiscoveryScreen}
        options={{ headerShown: true, title: 'Nearby' }}
      />
      <AppStack.Screen
        name="Signals"
        component={SignalsScreen}
        options={{ headerShown: true, title: 'Signals' }}
      />
      <AppStack.Screen
        name="Chats"
        component={ChatsScreen}
        options={{ headerShown: true, title: 'Chats' }}
      />
      <AppStack.Screen
        name="Thread"
        component={ThreadScreen}
        options={({ route }) => ({ headerShown: true, title: route.params?.displayName || 'Chat' })}
      />
      <AppStack.Screen
        name="Settings"
        component={SettingsScreen}
        options={{ headerShown: true, title: 'Settings' }}
      />
      <AppStack.Screen
        name="BlockedUsers"
        component={BlockedUsersScreen}
        options={{ headerShown: true, title: 'Blocked Users' }}
      />
      <AppStack.Screen
        name="CreateBubble"
        component={CreateBubbleScreen}
        options={{ headerShown: true, title: 'Create Bubble' }}
      />
      <AppStack.Screen
        name="BubbleChat"
        component={BubbleChatScreen}
        options={{ headerShown: false }}
      />
    </AppStack.Navigator>
  );
}

// ---------------------------------------------------------------------------
// SplashAnimationScreen
//
// Timing contract:
//   0 ms        — component mounts, native splash is hidden immediately
//   0–800 ms    — fade-in + scale-up of wordmark (opacity 0→1, scale 0.8→1.0)
//   800–1300 ms — hold at full opacity
//   1300–1600 ms — fade-out of entire screen (opacity 1→0)
//   1600 ms     — onDone() fires, RootNavigator switches to the real stack
//
// Floating ambient circles run an independent staggered loop throughout,
// adding depth without distracting from the wordmark entrance.
// ---------------------------------------------------------------------------
function SplashAnimationScreen({ onDone }) {
  // Wordmark entrance values
  const wordmarkOpacity = useRef(new Animated.Value(0)).current;
  const wordmarkScale   = useRef(new Animated.Value(0.8)).current;

  // Dot beneath the wordmark — a small accent beat
  const dotScale = useRef(new Animated.Value(0)).current;

  // Full-screen fade-out wrapper
  const screenOpacity = useRef(new Animated.Value(1)).current;

  // Ambient floating circles
  const circle1Y = useRef(new Animated.Value(0)).current;
  const circle2Y = useRef(new Animated.Value(0)).current;
  const circle3Y = useRef(new Animated.Value(0)).current;
  const circle4Y = useRef(new Animated.Value(0)).current;
  const circle5Y = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Hide the native splash screen as soon as this JS view is ready to paint.
    SplashScreen.hideAsync().catch(() => {});

    // --- Ambient floating circles (continuous loops, staggered) ---
    const makeFloatLoop = (anim, delay) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(anim, {
            toValue: -14,
            duration: 2000,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(anim, {
            toValue: 0,
            duration: 2000,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ])
      );

    makeFloatLoop(circle1Y, 0).start();
    makeFloatLoop(circle2Y, 400).start();
    makeFloatLoop(circle3Y, 700).start();
    makeFloatLoop(circle4Y, 1100).start();
    makeFloatLoop(circle5Y, 1500).start();

    // --- Wordmark entrance (fade + scale) ---
    const entrance = Animated.parallel([
      Animated.timing(wordmarkOpacity, {
        toValue: 1,
        duration: 800,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(wordmarkScale, {
        toValue: 1,
        duration: 800,
        easing: Easing.out(Easing.back(1.1)),
        useNativeDriver: true,
      }),
    ]);

    // --- Dot accent beat (starts 300 ms after wordmark begins) ---
    const dotBeat = Animated.sequence([
      Animated.delay(300),
      Animated.spring(dotScale, {
        toValue: 1,
        friction: 5,
        tension: 180,
        useNativeDriver: true,
      }),
    ]);

    // --- Hold, then fade the whole screen out ---
    const exit = Animated.sequence([
      Animated.delay(500),   // hold at full opacity
      Animated.timing(screenOpacity, {
        toValue: 0,
        duration: 300,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
    ]);

    Animated.parallel([entrance, dotBeat]).start(() => {
      exit.start(() => {
        onDone();
      });
    });
  }, []);

  const circles = [
    { anim: circle1Y, size: 56,  top: '12%',  left: '8%',  opacity: 0.1  },
    { anim: circle2Y, size: 36,  top: '22%',  right: '10%',opacity: 0.08 },
    { anim: circle3Y, size: 28,  top: '58%',  left: '15%', opacity: 0.12 },
    { anim: circle4Y, size: 48,  bottom: '18%',right: '6%',opacity: 0.07 },
    { anim: circle5Y, size: 20,  bottom: '30%',left: '58%',opacity: 0.11 },
  ];

  return (
    <Animated.View style={[splashStyles.container, { opacity: screenOpacity }]}>
      {circles.map((c, i) => (
        <Animated.View
          key={i}
          style={[
            splashStyles.circle,
            {
              width:        c.size,
              height:       c.size,
              borderRadius: c.size / 2,
              opacity:      c.opacity,
              top:          c.top,
              left:         c.left,
              right:        c.right,
              bottom:       c.bottom,
              transform:    [{ translateY: c.anim }],
            },
          ]}
        />
      ))}

      <Animated.Text
        style={[
          splashStyles.wordmark,
          {
            opacity:   wordmarkOpacity,
            transform: [{ scale: wordmarkScale }],
          },
        ]}
      >
        Bubble
      </Animated.Text>

      {/* Small accent dot beneath the wordmark */}
      <Animated.View
        style={[
          splashStyles.dot,
          { transform: [{ scale: dotScale }] },
        ]}
      />
    </Animated.View>
  );
}

// ---------------------------------------------------------------------------
// RootNavigator
// ---------------------------------------------------------------------------
export default function RootNavigator() {
  const { authState } = useAuth();

  // splashDone tracks whether the animated intro has finished playing.
  // It starts false so the splash is always shown for at least one full cycle,
  // regardless of how fast the auth token check resolves.
  const [splashDone, setSplashDone] = useState(false);

  // Show the animated splash while either:
  //   a) auth check is still in-flight (authState === null), OR
  //   b) animation hasn't completed yet (splashDone === false)
  const showSplash = !splashDone || authState === null;

  if (showSplash) {
    return <SplashAnimationScreen onDone={() => setSplashDone(true)} />;
  }

  return (
    <NavigationContainer>
      {authState ? <AppNavigator /> : <AuthNavigator />}
    </NavigationContainer>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------
const splashStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.brand,
    justifyContent: 'center',
    alignItems: 'center',
  },
  wordmark: {
    fontSize:      48,
    fontWeight:    '800',
    letterSpacing: -1,
    color:         '#fff',
  },
  dot: {
    marginTop:    12,
    width:        8,
    height:       8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.6)',
  },
  circle: {
    position:        'absolute',
    backgroundColor: '#fff',
  },
});
