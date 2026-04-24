import React from 'react';
import GlassSurface from './GlassSurface';

export default function GlassCard({ children, style, radius = 28, dark = false, tint }) {
  return (
    <GlassSurface style={style} radius={radius} dark={dark} tint={tint}>
      {children}
    </GlassSurface>
  );
}
