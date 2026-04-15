import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../theme';
import Button from './Button';

export default function ErrorState({ message, onRetry, style }) {
  return (
    <View style={[styles.container, style]}>
      <Ionicons name="alert-circle-outline" size={48} color={theme.colors.error} style={styles.icon} />
      <Text style={styles.message}>{message || 'Something went wrong.'}</Text>
      {onRetry ? (
        <Button title="Retry" onPress={onRetry} variant="outline" size="sm" style={styles.btn} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  icon: {
    marginBottom: 12,
  },
  message: {
    fontSize: 15,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: 16,
  },
  btn: {
    minWidth: 100,
  },
});
