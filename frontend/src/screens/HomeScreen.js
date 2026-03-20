import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Platform } from 'react-native';
import BubbleMapView from '../components/BubbleMapView';
import { useAuth } from '../context/AuthContext';
import { theme } from '../theme';

export default function HomeScreen({ navigation }) {
  const { signOut } = useAuth();

  return (
    <View style={styles.container}>
      <BubbleMapView navigation={navigation} />

      {/* Top bar overlay */}
      <View style={styles.topBar} pointerEvents="box-none">
        <Text style={styles.title}>Bubble</Text>
        <TouchableOpacity
          style={styles.settingsBtn}
          onPress={() => navigation.navigate('Settings')}
          accessibilityRole="button"
          accessibilityLabel="Settings"
        >
          <Text style={styles.settingsIcon}>&#9881;</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 56 : 24,
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: theme.colors.brand,
    letterSpacing: -0.5,
  },
  settingsBtn: { padding: 8 },
  settingsIcon: { fontSize: 26, color: theme.colors.textSecondary },
});
