import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import ProfileHomeScreen from '../screens/ProfileHomeScreen';
import ProfileEditScreen from '../screens/ProfileEditScreen';
import SettingsScreen from '../screens/SettingsScreen';
import SafetyCenterScreen from '../screens/SafetyCenterScreen';
import BlockedUsersScreen from '../screens/BlockedUsersScreen';
import NotificationsCenterScreen from '../screens/NotificationsCenterScreen';

const Stack = createNativeStackNavigator();

export default function ProfileStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ProfileHome" component={ProfileHomeScreen} />
      <Stack.Screen name="ProfileEdit" component={ProfileEditScreen} />
      <Stack.Screen name="Settings" component={SettingsScreen} />
      <Stack.Screen name="SafetyCenter" component={SafetyCenterScreen} />
      <Stack.Screen name="BlockedUsers" component={BlockedUsersScreen} />
      <Stack.Screen name="NotificationsCenter" component={NotificationsCenterScreen} />
    </Stack.Navigator>
  );
}
