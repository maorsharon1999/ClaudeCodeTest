import React from 'react';
import { ActivityIndicator, View } from 'react-native';
import GlassButton from '../visual/GlassButton';
import { theme } from '../../theme';

// Map legacy variant names to GlassButton variants
function resolveVariant(variant) {
  if (variant === 'primary') return 'primary';
  if (variant === 'secondary' || variant === 'ghost' || variant === 'outline') return 'ghost';
  if (variant === 'danger') return 'ink';
  return 'primary';
}

// Map legacy size names to GlassButton sizes
function resolveSize(size) {
  if (size === 'sm') return 'sm';
  if (size === 'lg') return 'lg';
  return 'md';
}

export default function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  icon,
  style,
  children,
}) {
  const glassVariant = resolveVariant(variant);
  const glassSize = resolveSize(size);

  // For danger variant, override the ink gradient tint via a style override
  const dangerOverride =
    variant === 'danger'
      ? { backgroundColor: 'rgba(180,60,60,0.85)' }
      : undefined;

  return (
    <GlassButton
      variant={glassVariant}
      size={glassSize}
      onPress={onPress}
      disabled={disabled || loading}
      style={[dangerOverride, style]}
    >
      {loading ? (
        <ActivityIndicator
          color={glassVariant === 'ink' ? 'rgba(255,255,255,0.9)' : theme.colors.ink}
          size="small"
        />
      ) : (
        <>
          {icon ? <View style={{ marginRight: 6 }}>{icon}</View> : null}
          {title || children || null}
        </>
      )}
    </GlassButton>
  );
}
