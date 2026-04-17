import React, { useRef, useEffect, useState } from 'react';
import { View, StyleSheet, Animated, Easing, StatusBar } from 'react-native';
import { NavigationContainer, useNavigationContainerRef } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import * as SplashScreen from 'expo-splash-screen';
import * as Notifications from 'expo-notifications';
import { useAuth } from '../context/AuthContext';
import { theme } from '../theme';

import EmailLoginScreen from '../screens/EmailLoginScreen';
import OnboardingStack from './OnboardingStack';
import MainTabNavigator from './MainTabNavigator';

const AuthStack = createNativeStackNavigator();
const RootStack = createNativeStackNavigator();

const screenOptions = {
  headerShown: false,
  contentStyle: { backgroundColor: theme.colors.bgDeep },
};

function AuthNavigator() {
  return (
    <AuthStack.Navigator screenOptions={screenOptions}>
      <AuthStack.Screen name="EmailLogin" component={EmailLoginScreen} />
    </AuthStack.Navigator>
  );
}

function AppNavigator() {
  const { profileComplete } = useAuth();

  return (
    <RootStack.Navigator screenOptions={screenOptions}>
      {!profileComplete && (
        <RootStack.Screen name="Onboarding" component={OnboardingStack} />
      )}
      <RootStack.Screen name="MainTabs" component={MainTabNavigator} />
    </RootStack.Navigator>
  );
}

// ---------------------------------------------------------------------------
// SplashAnimationScreen — dark-themed
// ---------------------------------------------------------------------------
function SplashAnimationScreen({ onDone }) {
  const wordmarkOpacity = useRef(new Animated.Value(0)).current;
  const wordmarkScale   = useRef(new Animated.Value(0.8)).current;
  const dotScale = useRef(new Animated.Value(0)).current;
  const screenOpacity = useRef(new Animated.Value(1)).current;

  const circle1Y = useRef(new Animated.Value(0)).current;
  const circle2Y = useRef(new Animated.Value(0)).current;
  const circle3Y = useRef(new Animated.Value(0)).current;
  const circle4Y = useRef(new Animated.Value(0)).current;
  const circle5Y = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    SplashScreen.hideAsync().catch(() => {});

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

    const dotBeat = Animated.sequence([
      Animated.delay(300),
      Animated.spring(dotScale, {
        toValue: 1,
        friction: 5,
        tension: 180,
        useNativeDriver: true,
      }),
    ]);

    const exit = Animated.sequence([
      Animated.delay(500),
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
    { anim: circle1Y, size: 56,  top: '12%',  left: '8%',  opacity: 0.08 },
    { anim: circle2Y, size: 36,  top: '22%',  right: '10%', opacity: 0.06 },
    { anim: circle3Y, size: 28,  top: '58%',  left: '15%', opacity: 0.1 },
    { anim: circle4Y, size: 48,  bottom: '18%', right: '6%', opacity: 0.05 },
    { anim: circle5Y, size: 20,  bottom: '30%', left: '58%', opacity: 0.09 },
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
  const [splashDone, setSplashDone] = useState(false);
  const navigationRef = useNavigationContainerRef();
  const notificationResponseListener = useRef();

  useEffect(() => {
    notificationResponseListener.current =
      Notifications.addNotificationResponseReceivedListener(response => {
        const data = response.notification.request.content.data;
        if (!navigationRef.isReady()) return;

        switch (data?.type) {
          case 'signal_received':
          case 'signal_approved':
            navigationRef.navigate('InboxStack', { screen: 'NotificationsCenterScreen' });
            break;
          case 'dm_received':
            if (data.thread_id) {
              navigationRef.navigate('InboxStack', {
                screen: 'DirectChatScreen',
                params: { threadId: data.thread_id },
              });
            }
            break;
          case 'bubble_message':
          case 'bubble_join':
            if (data.bubble_id) {
              navigationRef.navigate('ExploreStack', {
                screen: 'BubbleChatScreen',
                params: { bubbleId: data.bubble_id },
              });
            }
            break;
        }
      });

    return () => {
      if (notificationResponseListener.current) {
        Notifications.removeNotificationSubscription(notificationResponseListener.current);
      }
    };
  }, []);

  const showSplash = !splashDone || authState === null;

  if (showSplash) {
    return <SplashAnimationScreen onDone={() => setSplashDone(true)} />;
  }

  const navTheme = {
    dark: false,
    colors: {
      primary: theme.colors.brand,
      background: theme.colors.bgDeep,
      card: theme.colors.bgSurface,
      text: theme.colors.textPrimary,
      border: theme.colors.borderDefault,
      notification: theme.colors.accent,
    },
  };

  return (
    <NavigationContainer theme={navTheme} ref={navigationRef}>
      <StatusBar barStyle="dark-content" backgroundColor={theme.colors.bgDeep} />
      {authState ? <AppNavigator /> : <AuthNavigator />}
    </NavigationContainer>
  );
}

// ---------------------------------------------------------------------------
// Styles — light themed
// ---------------------------------------------------------------------------
const splashStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.bgDeep,
    justifyContent: 'center',
    alignItems: 'center',
  },
  wordmark: {
    fontSize:      48,
    fontWeight:    '700',
    letterSpacing: -1,
    color:         theme.colors.brand,
  },
  dot: {
    marginTop:    12,
    width:        8,
    height:       8,
    borderRadius: 4,
    backgroundColor: theme.colors.brand,
  },
  circle: {
    position:        'absolute',
    backgroundColor: theme.colors.brand,
  },
});
