import React from 'react';
import GlassCard from '../visual/GlassCard';

export default function Card({ children, glass, style }) {
  return (
    <GlassCard style={style}>
      {children}
    </GlassCard>
  );
}
