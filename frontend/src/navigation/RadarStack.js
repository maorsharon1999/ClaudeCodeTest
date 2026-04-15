import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import RadarHomeScreen from '../screens/RadarHomeScreen';
import BubbleDetailsScreen from '../screens/BubbleDetailsScreen';
import BubbleChatScreen from '../screens/BubbleChatScreen';

const Stack = createNativeStackNavigator();

export default function RadarStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="RadarHome" component={RadarHomeScreen} />
      <Stack.Screen name="BubbleDetails" component={BubbleDetailsScreen} />
      <Stack.Screen name="BubbleChat" component={BubbleChatScreen} />
    </Stack.Navigator>
  );
}
