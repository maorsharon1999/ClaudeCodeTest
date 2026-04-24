import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import CircleIconBtn from './CircleIconBtn';
import { BackIcon } from './icons';
import { theme } from '../../theme';

export default function ScreenHeader({ title, subtitle, onBack = true, right }) {
  return (
    <View style={styles.row}>
      {onBack && (
        <CircleIconBtn onPress={typeof onBack === 'function' ? onBack : undefined}>
          <BackIcon size={18} color={theme.colors.ink} />
        </CircleIconBtn>
      )}
      <View style={styles.titles}>
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
      {right && <View style={styles.rightSlot}>{right}</View>}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 10,
    gap: 12,
  },
  titles: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: theme.colors.ink,
    fontFamily: '"Plus Jakarta Sans", system-ui',
  },
  subtitle: {
    fontSize: 11,
    color: theme.colors.inkMuted,
    fontFamily: '"Plus Jakarta Sans", system-ui',
    marginTop: 1,
  },
  rightSlot: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
