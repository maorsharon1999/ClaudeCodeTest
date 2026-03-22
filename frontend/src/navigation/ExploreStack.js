import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import ExploreScreen from '../screens/ExploreScreen';
import BubbleDetailsScreen from '../screens/BubbleDetailsScreen';
import BubbleChatScreen from '../screens/BubbleChatScreen';

const Stack = createNativeStackNavigator();

export default function ExploreStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ExploreHome" component={ExploreScreen} />
      <Stack.Screen name="BubbleDetails" component={BubbleDetailsScreen} />
      <Stack.Screen name="BubbleChat" component={BubbleChatScreen} />
    </Stack.Navigator>
  );
}
