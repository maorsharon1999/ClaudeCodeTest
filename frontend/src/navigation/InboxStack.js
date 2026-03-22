import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import InboxScreen from '../screens/InboxScreen';
import BubbleChatScreen from '../screens/BubbleChatScreen';
import DirectChatScreen from '../screens/DirectChatScreen';

const Stack = createNativeStackNavigator();

export default function InboxStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="InboxHome" component={InboxScreen} />
      <Stack.Screen name="BubbleChat" component={BubbleChatScreen} />
      <Stack.Screen name="DirectChat" component={DirectChatScreen} />
    </Stack.Navigator>
  );
}
