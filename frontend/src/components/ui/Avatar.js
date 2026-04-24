import React from 'react';
import AvatarBubble from '../visual/AvatarBubble';

export default function Avatar({ uri, imageUri, name, initials, size = 44, tone = 'a', style }) {
  // Accept both uri (legacy) and imageUri (new) prop names
  const resolvedImageUri = imageUri || uri || null;
  // Derive initials from name if not explicitly provided
  const resolvedInitials = initials || (name ? (name[0] || '').toUpperCase() : undefined);

  return (
    <AvatarBubble
      size={size}
      imageUri={resolvedImageUri}
      initials={resolvedInitials}
      tone={tone}
      style={style}
    />
  );
}
