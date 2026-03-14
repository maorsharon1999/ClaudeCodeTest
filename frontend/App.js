import { enableScreens } from 'react-native-screens';
enableScreens();
import React from 'react';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from './src/context/AuthContext';
import RootNavigator from './src/navigation/RootNavigator';

// Prevent the native splash from auto-hiding before we are ready to
// show our animated intro. This must be called before the component tree
// renders — module-level execution guarantees that.
SplashScreen.preventAutoHideAsync().catch(() => {
  // A failure here (e.g. splash already hidden by the OS) is non-fatal.
});

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <StatusBar style="light" />
        <RootNavigator />
      </AuthProvider>
    </SafeAreaProvider>
  );
}
