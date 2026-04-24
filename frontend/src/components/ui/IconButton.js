import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import CircleIconBtn from '../visual/CircleIconBtn';
import { theme } from '../../theme';

export default function IconButton({
  name,
  icon,
  children,
  onPress,
  dark = false,
  size = 22,
  color,
  style,
}) {
  // Resolve content: explicit children/icon take priority, then Ionicons name
  let content = children || icon || null;
  if (!content && name) {
    const iconColor = color || (dark ? 'rgba(255,255,255,0.85)' : theme.colors.ink);
    content = <Ionicons name={name} size={size} color={iconColor} />;
  }

  return (
    <CircleIconBtn onPress={onPress} dark={dark}>
      {content}
    </CircleIconBtn>
  );
}
