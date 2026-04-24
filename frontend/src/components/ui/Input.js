import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import GlassInput from '../visual/GlassInput';
import { theme } from '../../theme';

export default function Input({
  label,
  placeholder,
  value,
  onChangeText,
  error,
  maxLength,
  multiline,
  secureTextEntry,
  keyboardType,
  autoCapitalize,
  autoComplete,
  textContentType,
  editable = true,
  numberOfLines,
  style,
  inputStyle,
  icon,
  trailing,
}) {
  const [focused, setFocused] = useState(false);

  return (
    <View style={style}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <GlassInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        secureTextEntry={secureTextEntry}
        icon={icon}
        trailing={trailing}
        maxLength={maxLength}
        multiline={multiline}
        numberOfLines={numberOfLines}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        autoComplete={autoComplete}
        textContentType={textContentType}
        editable={editable}
        textAlignVertical={multiline ? 'top' : 'center'}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={[
          focused && styles.focused,
          error && styles.inputError,
          multiline && styles.multiline,
          inputStyle,
        ]}
      />
      <View style={styles.footer}>
        {error ? <Text style={styles.error}>{error}</Text> : <View />}
        {maxLength ? (
          <Text style={styles.charCount}>{(value || '').length}/{maxLength}</Text>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.textSecondary,
    marginBottom: 6,
  },
  focused: {
    borderColor: theme.colors.borderFocus,
  },
  inputError: {
    borderColor: theme.colors.error,
  },
  multiline: {
    height: 90,
    alignItems: 'flex-start',
    paddingTop: 12,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  error: {
    fontSize: 12,
    color: theme.colors.error,
  },
  charCount: {
    fontSize: 11,
    color: theme.colors.textFaint,
  },
});
