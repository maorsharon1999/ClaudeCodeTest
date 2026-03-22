import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import WelcomeScreen from '../screens/onboarding/WelcomeScreen';
import IntroCarouselScreen from '../screens/onboarding/IntroCarouselScreen';
import ProfileBasicsScreen from '../screens/onboarding/ProfileBasicsScreen';
import AddPhotosScreen from '../screens/onboarding/AddPhotosScreen';
import InterestsScreen from '../screens/onboarding/InterestsScreen';
import DiscoveryPreferencesScreen from '../screens/onboarding/DiscoveryPreferencesScreen';
import LocationPermissionScreen from '../screens/onboarding/LocationPermissionScreen';
import NotificationsScreen from '../screens/onboarding/NotificationsScreen';

const Stack = createNativeStackNavigator();

export default function OnboardingStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Welcome" component={WelcomeScreen} />
      <Stack.Screen name="IntroCarousel" component={IntroCarouselScreen} />
      <Stack.Screen name="ProfileBasics" component={ProfileBasicsScreen} />
      <Stack.Screen name="AddPhotos" component={AddPhotosScreen} />
      <Stack.Screen name="Interests" component={InterestsScreen} />
      <Stack.Screen name="DiscoveryPreferences" component={DiscoveryPreferencesScreen} />
      <Stack.Screen name="LocationPermission" component={LocationPermissionScreen} />
      <Stack.Screen name="Notifications" component={NotificationsScreen} />
    </Stack.Navigator>
  );
}
