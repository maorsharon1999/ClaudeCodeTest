import React from 'react';
import { View, Text, Linking, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '../components/ui';
import { theme } from '../theme';

export default function AccessDeniedScreen({ route }) {
  const { reason } = route?.params || {};

  return (
    <View style={styles.container}>
      <Ionicons name="lock-closed-outline" size={80} color={theme.colors.error} />
      <Text style={styles.title}>Access Restricted</Text>
      <Text style={styles.description}>
        {reason || 'Your account has been restricted. Please contact support for more information.'}
      </Text>
      <Button
        title="Contact Support"
        onPress={() => Linking.openURL('mailto:support@bubble.app?subject=Account%20Review')}
        size="lg"
        style={styles.btn}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.bgDeep,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  title: {
    ...theme.typography.titleMd,
    color: theme.colors.textPrimary,
    marginTop: 24,
    marginBottom: 12,
    textAlign: 'center',
  },
  description: {
    fontSize: 15,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
  },
  btn: { width: '100%' },
});
