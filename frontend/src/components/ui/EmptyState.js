import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../theme';
import Button from './Button';

export default function EmptyState({ icon, title, subtitle, ctaTitle, onCtaPress, style }) {
  return (
    <View style={[styles.container, style]}>
      {icon ? (
        <Ionicons name={icon} size={48} color={theme.colors.textFaint} style={styles.icon} />
      ) : null}
      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      {ctaTitle && onCtaPress ? (
        <Button title={ctaTitle} onPress={onCtaPress} size="sm" style={styles.cta} />
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
    marginBottom: 16,
  },
  title: {
    fontSize: 17,
    fontWeight: '600',
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    color: theme.colors.textMuted,
    textAlign: 'center',
    marginBottom: 20,
  },
  cta: {
    marginTop: 4,
  },
});
