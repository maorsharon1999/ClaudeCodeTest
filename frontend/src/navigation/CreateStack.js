import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import CreateTypeChooserScreen from '../screens/CreateTypeChooserScreen';
import CreateTimeAndPlaceScreen from '../screens/CreateTimeAndPlaceScreen';
import CreateVisibilityScreen from '../screens/CreateVisibilityScreen';
import CreatePreviewScreen from '../screens/CreatePreviewScreen';
import CreateAreaScreen from '../screens/CreateAreaScreen';

const Stack = createNativeStackNavigator();

export default function CreateStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="CreateTypeChooser" component={CreateTypeChooserScreen} />
      <Stack.Screen name="CreateTimeAndPlace" component={CreateTimeAndPlaceScreen} />
      <Stack.Screen name="CreateArea" component={CreateAreaScreen} />
      <Stack.Screen name="CreateVisibility" component={CreateVisibilityScreen} />
      <Stack.Screen name="CreatePreview" component={CreatePreviewScreen} />
    </Stack.Navigator>
  );
}
