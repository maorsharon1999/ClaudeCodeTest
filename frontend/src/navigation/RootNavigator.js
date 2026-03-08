import React from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../context/AuthContext';

import PhoneEntryScreen from '../screens/PhoneEntryScreen';
import OtpVerifyScreen from '../screens/OtpVerifyScreen';
import ProfileSetupScreen from '../screens/ProfileSetupScreen';
import HomeScreen from '../screens/HomeScreen';
import ProfileEditScreen from '../screens/ProfileEditScreen';
import DiscoveryScreen from '../screens/DiscoveryScreen';
import SignalsScreen from '../screens/SignalsScreen';

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
    </AppStack.Navigator>
  );
}

export default function RootNavigator() {
  const { authState } = useAuth();

  if (authState === null) {
    // Loading: silent refresh in progress
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#6C47FF" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      {authState ? <AppNavigator /> : <AuthNavigator />}
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
});
