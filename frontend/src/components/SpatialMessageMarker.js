import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../theme';

export default function SpatialMessageMarker({ isUnlocked, authorName }) {
  return (
    <View style={styles.wrapper}>
      <View style={[styles.pin, isUnlocked ? styles.pinUnlocked : styles.pinLocked]}>
        <Ionicons
          name={isUnlocked ? 'chatbubble' : 'lock-closed'}
          size={14}
          color={isUnlocked ? '#fff' : theme.colors.textMuted}
        />
      </View>
      <View style={styles.tail} />
      {isUnlocked && authorName ? (
        <View style={styles.label}>
          <Text style={styles.labelText} numberOfLines={1}>{authorName}</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
  },
  pin: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    ...theme.shadows.card,
  },
  pinUnlocked: {
    backgroundColor: theme.colors.brand,
  },
  pinLocked: {
    backgroundColor: theme.colors.bgElevated,
    borderWidth: 1.5,
    borderColor: theme.colors.borderDefault,
  },
  tail: {
    width: 0,
    height: 0,
    borderLeftWidth: 5,
    borderRightWidth: 5,
    borderTopWidth: 6,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: theme.colors.brand,
    marginTop: -1,
  },
  label: {
    marginTop: 3,
    backgroundColor: theme.colors.bgGlass,
    borderRadius: theme.radii.sm,
    paddingHorizontal: 6,
    paddingVertical: 2,
    maxWidth: 80,
    ...theme.shadows.card,
  },
  labelText: {
    ...theme.typography.micro,
    color: theme.colors.textSecondary,
    fontWeight: '600',
  },
});
