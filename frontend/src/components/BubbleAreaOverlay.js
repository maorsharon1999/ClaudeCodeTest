import React from 'react';
import { Circle, Polygon } from 'react-native-maps';

const FILL_DEFAULT = 'rgba(0,114,206,0.08)';
const FILL_SELECTED = 'rgba(0,114,206,0.18)';
const STROKE_DEFAULT = 'rgba(0,114,206,0.35)';
const STROKE_SELECTED = 'rgba(0,114,206,0.6)';
const STROKE_WIDTH = 2;

// Ensure shape_coords is a parsed array (may arrive as JSON string)
function parseCoords(raw) {
  if (!raw) return null;
  if (Array.isArray(raw)) return raw;
  if (typeof raw === 'string') {
    try { return JSON.parse(raw); } catch { return null; }
  }
  return null;
}

// Expand 2 corners into 4 rectangle corners
function rectCornersToPolygon(coords) {
  const [c1, c2] = coords;
  return [
    { latitude: c1.lat, longitude: c1.lng },
    { latitude: c1.lat, longitude: c2.lng },
    { latitude: c2.lat, longitude: c2.lng },
    { latitude: c2.lat, longitude: c1.lng },
  ];
}

export default function BubbleAreaOverlay({ bubble, selected = false, onPress }) {
  const fill = selected ? FILL_SELECTED : FILL_DEFAULT;
  const stroke = selected ? STROKE_SELECTED : STROKE_DEFAULT;
  const shapeType = bubble.shape_type || 'circle';
  const coords = parseCoords(bubble.shape_coords);

  if (shapeType === 'polygon' && coords && coords.length >= 3) {
    const coordinates = coords.map(pt => ({
      latitude: pt.lat,
      longitude: pt.lng,
    }));
    return (
      <Polygon
        coordinates={coordinates}
        fillColor={fill}
        strokeColor={stroke}
        strokeWidth={STROKE_WIDTH}
        zIndex={0}
        tappable={!!onPress}
        onPress={onPress}
      />
    );
  }

  if (shapeType === 'rectangle' && coords && coords.length === 2) {
    const coordinates = rectCornersToPolygon(coords);
    return (
      <Polygon
        coordinates={coordinates}
        fillColor={fill}
        strokeColor={stroke}
        strokeWidth={STROKE_WIDTH}
        zIndex={0}
        tappable={!!onPress}
        onPress={onPress}
      />
    );
  }

  // Default: circle (also fallback for polygon/rect with missing coords)
  return (
    <Circle
      center={{ latitude: bubble.lat, longitude: bubble.lng }}
      radius={bubble.radius_m || 200}
      fillColor={fill}
      strokeColor={stroke}
      strokeWidth={STROKE_WIDTH}
      zIndex={0}
      tappable={!!onPress}
      onPress={onPress}
    />
  );
}
