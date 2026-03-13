import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../context/AuthContext';
import { theme } from '../theme';

import PhoneEntryScreen from '../screens/PhoneEntryScreen';
import OtpVerifyScreen from '../screens/OtpVerifyScreen';
import ProfileSetupScreen from '../screens/ProfileSetupScreen';
import HomeScreen from '../screens/HomeScreen';
import ProfileEditScreen from '../screens/ProfileEditScreen';
import DiscoveryScreen from '../screens/DiscoveryScreen';
import SignalsScreen from '../screens/SignalsScreen';
import ChatsScreen from '../screens/ChatsScreen';
import ThreadScreen from '../screens/ThreadScreen';

const AuthStack = createNativeStackNavigator();
const AppStack = createNativeStackNavigator();

function AuthNavigator() {
  return (
    <AuthStack.Navigator screenOptions={{ headerShown: false }}>
      <AuthStack.Screen name="PhoneEntry" component={PhoneEntryScreen} />
      <AuthStack.Screen name="OtpVerify" component={OtpVerifyScreen} />
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
    </AppStack.Navigator>
  );
}

function SplashScreen() {
  const wordmarkScale = useRef(new Animated.Value(0.85)).current;

  const circle1Y = useRef(new Animated.Value(0)).current;
  const circle2Y = useRef(new Animated.Value(0)).current;
  const circle3Y = useRef(new Animated.Value(0)).current;
  const circle4Y = useRef(new Animated.Value(0)).current;
  const circle5Y = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Wordmark entrance
    Animated.timing(wordmarkScale, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();

    // Floating circles with staggered delays
    const makeLoop = (anim, delay) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(anim, { toValue: -16, duration: 1800, useNativeDriver: true }),
          Animated.timing(anim, { toValue: 0, duration: 1800, useNativeDriver: true }),
        ])
      );

    makeLoop(circle1Y, 0).start();
    makeLoop(circle2Y, 300).start();
    makeLoop(circle3Y, 600).start();
    makeLoop(circle4Y, 900).start();
    makeLoop(circle5Y, 1200).start();
  }, []);

  const circles = [
    { anim: circle1Y, size: 56, top: '15%', left: '10%', opacity: 0.12 },
    { anim: circle2Y, size: 36, top: '25%', right: '12%', opacity: 0.1 },
    { anim: circle3Y, size: 24, top: '60%', left: '18%', opacity: 0.15 },
    { anim: circle4Y, size: 44, bottom: '20%', right: '8%', opacity: 0.08 },
    { anim: circle5Y, size: 20, bottom: '32%', left: '60%', opacity: 0.13 },
  ];

  return (
    <View style={splashStyles.container}>
      {circles.map((c, i) => (
        <Animated.View
          key={i}
          style={[
            splashStyles.circle,
            {
              width: c.size,
              height: c.size,
              borderRadius: c.size / 2,
              opacity: c.opacity,
              top: c.top,
              left: c.left,
              right: c.right,
              bottom: c.bottom,
              transform: [{ translateY: c.anim }],
            },
          ]}
        />
      ))}
      <Animated.Text
        style={[
          splashStyles.wordmark,
          { transform: [{ scale: wordmarkScale }] },
        ]}
      >
        Bubble
      </Animated.Text>
    </View>
  );
}

export default function RootNavigator() {
  const { authState } = useAuth();

  if (authState === null) {
    return <SplashScreen />;
  }

  return (
    <NavigationContainer>
      {authState ? <AppNavigator /> : <AuthNavigator />}
    </NavigationContainer>
  );
}

const splashStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.brand,
    justifyContent: 'center',
    alignItems: 'center',
  },
  wordmark: {
    ...theme.typography.displayLg,
    color: '#fff',
  },
  circle: {
    position: 'absolute',
    backgroundColor: '#fff',
  },
});
