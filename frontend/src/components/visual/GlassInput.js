import React from 'react';
import { View, TextInput, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../../theme';

export default function GlassInput({
  icon,
  value,
  onChangeText,
  placeholder,
  secureTextEntry = false,
  trailing,
  style,
  ...rest
}) {
  return (
    <View style={[styles.wrapper, style]}>
      <LinearGradient
        colors={[
          'rgba(255,255,255,0.70)',
          'rgba(210,230,225,0.55)',
          'rgba(200,225,240,0.55)',
        ]}
        start={{ x: 0.3, y: 0.28 }}
        end={{ x: 1, y: 1 }}
        style={[StyleSheet.absoluteFill, styles.gradient]}
      />
      {icon && (
        <View style={styles.iconWrap} pointerEvents="none">
          {icon}
        </View>
      )}
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={theme.colors.inkFaint}
        secureTextEntry={secureTextEntry}
        style={styles.input}
        {...rest}
      />
      {trailing && <View style={styles.trailing}>{trailing}</View>}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    height: 52,
    borderRadius: theme.radii.pill,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    gap: 12,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.70)',
    overflow: 'hidden',
    shadowColor: 'rgba(140,165,195,1)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
    elevation: 2,
  },
  gradient: {
    borderRadius: theme.radii.pill,
  },
  iconWrap: {
    width: 22,
    alignItems: 'center',
    justifyContent: 'center',
    opacity: 0.7,
  },
  input: {
    flex: 1,
    backgroundColor: 'transparent',
    fontSize: 16,
    fontWeight: '500',
    color: theme.colors.ink,
    fontFamily: '"Plus Jakarta Sans", system-ui',
  },
  trailing: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
