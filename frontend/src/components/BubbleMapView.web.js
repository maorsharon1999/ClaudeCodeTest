/**
 * Web stub for BubbleMapView.
 *
 * react-native-maps imports native-only modules that crash Metro on web.
 * Expo's platform-extension resolver picks this file (.web.js) instead of
 * BubbleMapView.js when bundling for the web target.
 *
 * The stub renders a dark placeholder so the screen layout is preserved
 * without attempting to mount any map.
 */
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function BubbleMapView() {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>Map view is available on the mobile app.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111',
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    color: '#888',
    fontSize: 14,
  },
});
