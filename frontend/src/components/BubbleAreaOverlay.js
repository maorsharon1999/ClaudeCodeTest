import React from 'react';
import { Circle, Polygon } from 'react-native-maps';

const FILL_DEFAULT = 'rgba(123,97,255,0.08)';
const FILL_SELECTED = 'rgba(123,97,255,0.18)';
const STROKE_DEFAULT = 'rgba(123,97,255,0.35)';
const STROKE_SELECTED = 'rgba(123,97,255,0.6)';
const STROKE_WIDTH = 2;

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

  if (shapeType === 'circle') {
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

  if (shapeType === 'polygon' && Array.isArray(bubble.shape_coords)) {
    const coordinates = bubble.shape_coords.map(pt => ({
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

  if (shapeType === 'rectangle' && Array.isArray(bubble.shape_coords) && bubble.shape_coords.length === 2) {
    const coordinates = rectCornersToPolygon(bubble.shape_coords);
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

  return null;
}
