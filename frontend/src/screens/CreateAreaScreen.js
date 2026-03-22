import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Animated,
  StyleSheet,
  Platform,
} from 'react-native';
import MapView, { Marker, Circle, Polygon, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import mapDarkStyle from '../components/MapDarkStyle.json';
import { theme } from '../theme';
import { fadeInUp, fadeInUpStyle } from '../utils/animations';

const MIN_RADIUS = 50;
const MAX_RADIUS = 2000;
const MAX_PLACEMENT_RADIUS = 1000; // 1 km from user location
const MAX_POLYGON_VERTICES = 20;
const CLOSE_THRESHOLD_M = 80; // easier to close polygon on mobile

const FILL_COLOR = 'rgba(123,97,255,0.12)';
const STROKE_COLOR = 'rgba(123,97,255,0.5)';
const BOUNDARY_COLOR = 'rgba(255,255,255,0.12)';
const BOUNDARY_STROKE = 'rgba(255,255,255,0.25)';

function haversineM(lat1, lng1, lat2, lng2) {
  const toRad = d => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 6371000 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function offsetPoint(lat, lng, distanceM, bearing) {
  const R = 6371000;
  const toRad = d => (d * Math.PI) / 180;
  const toDeg = r => (r * 180) / Math.PI;
  const lat1 = toRad(lat);
  const lng1 = toRad(lng);
  const b = toRad(bearing);
  const lat2 = Math.asin(
    Math.sin(lat1) * Math.cos(distanceM / R) +
    Math.cos(lat1) * Math.sin(distanceM / R) * Math.cos(b)
  );
  const lng2 = lng1 + Math.atan2(
    Math.sin(b) * Math.sin(distanceM / R) * Math.cos(lat1),
    Math.cos(distanceM / R) - Math.sin(lat1) * Math.sin(lat2)
  );
  return { latitude: toDeg(lat2), longitude: toDeg(lng2) };
}

export default function CreateAreaScreen({ navigation, route }) {
  const params = route.params;
  const userLoc = params.location;
  const userCoord = {
    latitude: userLoc?.lat || 32.08,
    longitude: userLoc?.lng || 34.78,
  };

  const [shapeMode, setShapeMode] = useState('circle');
  const [circleCenter, setCircleCenter] = useState(userCoord);
  const [circleRadius, setCircleRadius] = useState(200);
  const [edgeHandle, setEdgeHandle] = useState(null);
  const [polygonPoints, setPolygonPoints] = useState([]);
  const [polygonClosed, setPolygonClosed] = useState(false);
  const [rectCorners, setRectCorners] = useState([]);

  const mapRef = useRef(null);
  const enterAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    fadeInUp(enterAnim, { duration: 320 }).start();
  }, []);

  // Compute edge handle from center + radius (east)
  useEffect(() => {
    const handle = offsetPoint(circleCenter.latitude, circleCenter.longitude, circleRadius, 90);
    setEdgeHandle(handle);
  }, [circleCenter, circleRadius]);

  // Check if a point is within 1km of user
  function isWithinBoundary(lat, lng) {
    return haversineM(userCoord.latitude, userCoord.longitude, lat, lng) <= MAX_PLACEMENT_RADIUS;
  }

  function handleMapPress(e) {
    const coord = e.nativeEvent.coordinate;
    if (!isWithinBoundary(coord.latitude, coord.longitude)) return; // ignore taps outside 1km

    if (shapeMode === 'polygon') {
      if (polygonClosed) return;
      // Check if tapping near first vertex to close
      if (polygonPoints.length >= 3) {
        const first = polygonPoints[0];
        const dist = haversineM(first.latitude, first.longitude, coord.latitude, coord.longitude);
        if (dist < CLOSE_THRESHOLD_M) {
          setPolygonClosed(true);
          return;
        }
      }
      if (polygonPoints.length >= MAX_POLYGON_VERTICES) return;
      setPolygonPoints(prev => [...prev, coord]);
    } else if (shapeMode === 'rectangle') {
      if (rectCorners.length >= 2) return;
      if (!isWithinBoundary(coord.latitude, coord.longitude)) return;
      setRectCorners(prev => [...prev, coord]);
    }
  }

  function handleEdgeDrag(e) {
    const coord = e.nativeEvent.coordinate;
    const dist = haversineM(
      circleCenter.latitude, circleCenter.longitude,
      coord.latitude, coord.longitude
    );
    const clamped = Math.max(MIN_RADIUS, Math.min(MAX_RADIUS, Math.round(dist)));
    setCircleRadius(clamped);
  }

  function handleCircleCenterDrag(e) {
    const coord = e.nativeEvent.coordinate;
    // Clamp center within 1km of user
    if (isWithinBoundary(coord.latitude, coord.longitude)) {
      setCircleCenter(coord);
    }
  }

  function handleClear() {
    if (shapeMode === 'circle') {
      setCircleRadius(200);
      setCircleCenter(userCoord);
    } else if (shapeMode === 'polygon') {
      setPolygonPoints([]);
      setPolygonClosed(false);
    } else {
      setRectCorners([]);
    }
  }

  function canConfirm() {
    if (shapeMode === 'circle') return circleRadius >= MIN_RADIUS;
    if (shapeMode === 'polygon') return polygonClosed && polygonPoints.length >= 3;
    if (shapeMode === 'rectangle') return rectCorners.length === 2;
    return false;
  }

  function handleClosePolygon() {
    if (polygonPoints.length >= 3 && !polygonClosed) {
      setPolygonClosed(true);
    }
  }

  function handleConfirm() {
    let result;
    if (shapeMode === 'circle') {
      result = {
        shape_type: 'circle',
        center: { lat: circleCenter.latitude, lng: circleCenter.longitude },
        radius_m: circleRadius,
        shape_coords: null,
      };
    } else if (shapeMode === 'polygon') {
      const coords = polygonPoints.map(p => ({ lat: p.latitude, lng: p.longitude }));
      const n = coords.length;
      const cLat = coords.reduce((s, c) => s + c.lat, 0) / n;
      const cLng = coords.reduce((s, c) => s + c.lng, 0) / n;
      const maxDist = Math.max(...coords.map(c => haversineM(cLat, cLng, c.lat, c.lng)));
      result = {
        shape_type: 'polygon',
        center: { lat: cLat, lng: cLng },
        radius_m: Math.round(maxDist),
        shape_coords: coords,
      };
    } else {
      const [c1, c2] = rectCorners;
      const coords = [
        { lat: c1.latitude, lng: c1.longitude },
        { lat: c2.latitude, lng: c2.longitude },
      ];
      result = {
        shape_type: 'rectangle',
        center: {
          lat: (c1.latitude + c2.latitude) / 2,
          lng: (c1.longitude + c2.longitude) / 2,
        },
        radius_m: Math.round(haversineM(
          (c1.latitude + c2.latitude) / 2,
          (c1.longitude + c2.longitude) / 2,
          c1.latitude, c1.longitude
        )),
        shape_coords: coords,
      };
    }

    navigation.navigate('CreateVisibility', {
      ...params,
      ...result,
    });
  }

  function switchMode(mode) {
    setShapeMode(mode);
    setPolygonPoints([]);
    setPolygonClosed(false);
    setRectCorners([]);
  }

  // Rectangle 4-corner polygon for display
  const rectPolygon = rectCorners.length === 2
    ? [
        { latitude: rectCorners[0].latitude, longitude: rectCorners[0].longitude },
        { latitude: rectCorners[0].latitude, longitude: rectCorners[1].longitude },
        { latitude: rectCorners[1].latitude, longitude: rectCorners[1].longitude },
        { latitude: rectCorners[1].latitude, longitude: rectCorners[0].longitude },
      ]
    : [];

  const showCloseBtn = shapeMode === 'polygon' && polygonPoints.length >= 3 && !polygonClosed;

  return (
    <Animated.View style={[styles.flex, fadeInUpStyle(enterAnim)]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={theme.colors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Define Area</Text>
          <Text style={styles.headerSubtitle}>Step 3 of 5</Text>
        </View>
        <View style={styles.backBtn} />
      </View>

      {/* Map */}
      <MapView
        ref={mapRef}
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        customMapStyle={mapDarkStyle}
        initialRegion={{
          ...userCoord,
          latitudeDelta: 0.02,    // wider zoom to see ~1km
          longitudeDelta: 0.02,
        }}
        onPress={handleMapPress}
      >
        {/* 1km boundary ring — shows placement limit */}
        <Circle
          center={userCoord}
          radius={MAX_PLACEMENT_RADIUS}
          fillColor={BOUNDARY_COLOR}
          strokeColor={BOUNDARY_STROKE}
          strokeWidth={1}
          zIndex={-1}
        />

        {/* User location dot */}
        <Marker
          coordinate={userCoord}
          anchor={{ x: 0.5, y: 0.5 }}
          tracksViewChanges={false}
          zIndex={1}
        >
          <View style={styles.userDot} />
        </Marker>

        {/* Circle mode */}
        {shapeMode === 'circle' && (
          <>
            <Circle
              center={circleCenter}
              radius={circleRadius}
              fillColor={FILL_COLOR}
              strokeColor={STROKE_COLOR}
              strokeWidth={2}
            />
            <Marker
              coordinate={circleCenter}
              draggable
              onDragEnd={handleCircleCenterDrag}
              anchor={{ x: 0.5, y: 0.5 }}
              tracksViewChanges={false}
            >
              <View style={styles.centerDot} />
            </Marker>
            {edgeHandle && (
              <Marker
                coordinate={edgeHandle}
                draggable
                onDrag={handleEdgeDrag}
                onDragEnd={handleEdgeDrag}
                anchor={{ x: 0.5, y: 0.5 }}
                tracksViewChanges={false}
              >
                <View style={styles.edgeHandle}>
                  <Text style={styles.edgeLabel}>{circleRadius}m</Text>
                </View>
              </Marker>
            )}
          </>
        )}

        {/* Polygon mode */}
        {shapeMode === 'polygon' && polygonPoints.length > 0 && (
          <>
            {polygonClosed ? (
              <Polygon
                coordinates={polygonPoints}
                fillColor={FILL_COLOR}
                strokeColor={STROKE_COLOR}
                strokeWidth={2}
              />
            ) : (
              <Polyline
                coordinates={polygonPoints}
                strokeColor={STROKE_COLOR}
                strokeWidth={2}
              />
            )}
            {polygonPoints.map((pt, i) => (
              <Marker
                key={i}
                coordinate={pt}
                anchor={{ x: 0.5, y: 0.5 }}
                tracksViewChanges={false}
                onPress={() => {
                  if (i === 0 && polygonPoints.length >= 3 && !polygonClosed) {
                    setPolygonClosed(true);
                  } else if (polygonClosed && polygonPoints.length > 3) {
                    setPolygonPoints(prev => prev.filter((_, idx) => idx !== i));
                    setPolygonClosed(false); // reopen so they can re-close
                  }
                }}
              >
                <View style={[styles.vertexDot, i === 0 && !polygonClosed && styles.vertexFirst]} />
              </Marker>
            ))}
          </>
        )}

        {/* Rectangle mode */}
        {shapeMode === 'rectangle' && (
          <>
            {rectPolygon.length === 4 && (
              <Polygon
                coordinates={rectPolygon}
                fillColor={FILL_COLOR}
                strokeColor={STROKE_COLOR}
                strokeWidth={2}
              />
            )}
            {rectCorners.map((pt, i) => (
              <Marker
                key={i}
                coordinate={pt}
                draggable
                onDragEnd={(e) => {
                  const c = e.nativeEvent.coordinate;
                  if (!isWithinBoundary(c.latitude, c.longitude)) return;
                  setRectCorners(prev => {
                    const next = [...prev];
                    next[i] = c;
                    return next;
                  });
                }}
                anchor={{ x: 0.5, y: 0.5 }}
                tracksViewChanges={false}
              >
                <View style={styles.vertexDot} />
              </Marker>
            ))}
          </>
        )}
      </MapView>

      {/* Shape mode hint */}
      <View style={styles.hintRow}>
        <Text style={styles.hintText}>
          {shapeMode === 'circle'
            ? 'Drag center & edge to adjust (up to 1km)'
            : shapeMode === 'polygon'
            ? polygonClosed
              ? 'Polygon closed. Tap vertex to remove.'
              : `Tap map to add vertices (${polygonPoints.length}/${MAX_POLYGON_VERTICES})`
            : rectCorners.length < 2
            ? `Tap map to place corners (${rectCorners.length}/2)`
            : 'Drag corners to adjust'}
        </Text>
      </View>

      {/* Bottom toolbar */}
      <View style={styles.toolbar}>
        <View style={styles.modeRow}>
          {['circle', 'polygon', 'rectangle'].map(mode => (
            <TouchableOpacity
              key={mode}
              style={[styles.modeBtn, shapeMode === mode && styles.modeBtnActive]}
              onPress={() => switchMode(mode)}
            >
              <Ionicons
                name={
                  mode === 'circle'
                    ? 'ellipse-outline'
                    : mode === 'polygon'
                    ? 'shapes-outline'
                    : 'square-outline'
                }
                size={18}
                color={shapeMode === mode ? theme.colors.brand : theme.colors.textMuted}
              />
              <Text
                style={[styles.modeBtnText, shapeMode === mode && styles.modeBtnTextActive]}
              >
                {mode.charAt(0).toUpperCase() + mode.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.clearBtn} onPress={handleClear}>
            <Ionicons name="refresh-outline" size={18} color={theme.colors.textMuted} />
            <Text style={styles.clearBtnText}>Clear</Text>
          </TouchableOpacity>

          {/* Explicit close polygon button */}
          {showCloseBtn && (
            <TouchableOpacity style={styles.closeBtn} onPress={handleClosePolygon}>
              <Ionicons name="checkmark-done-outline" size={18} color={theme.colors.cyan} />
              <Text style={styles.closeBtnText}>Close</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[styles.confirmBtn, !canConfirm() && styles.confirmBtnDisabled]}
            onPress={handleConfirm}
            disabled={!canConfirm()}
          >
            <Text style={styles.confirmBtnText}>Confirm Area</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: theme.colors.bgDeep },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 56 : 24,
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: theme.colors.bgDeep,
    zIndex: 10,
  },
  backBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: theme.colors.textPrimary },
  headerSubtitle: { fontSize: 12, color: theme.colors.textMuted, marginTop: 2 },
  map: { flex: 1 },
  userDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#00C9A7',
    borderWidth: 2,
    borderColor: '#fff',
  },
  centerDot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: theme.colors.brand,
    borderWidth: 2.5,
    borderColor: '#fff',
  },
  edgeHandle: {
    backgroundColor: 'rgba(10,10,20,0.85)',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: theme.colors.brand,
  },
  edgeLabel: { color: theme.colors.brand, fontSize: 12, fontWeight: '700' },
  vertexDot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: theme.colors.brand,
    borderWidth: 2.5,
    borderColor: '#fff',
  },
  vertexFirst: {
    backgroundColor: theme.colors.cyan,
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 3,
    borderColor: '#fff',
  },
  hintRow: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 108 : 76,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  hintText: {
    backgroundColor: 'rgba(10,10,20,0.82)',
    color: theme.colors.textSecondary,
    fontSize: 12,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    overflow: 'hidden',
  },
  toolbar: {
    backgroundColor: theme.colors.bgElevated,
    borderTopWidth: 1,
    borderTopColor: theme.colors.borderDefault,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: Platform.OS === 'ios' ? 34 : 16,
  },
  modeRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  modeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: theme.radii.md,
    borderWidth: 1,
    borderColor: theme.colors.borderDefault,
    backgroundColor: theme.colors.bgSurface,
  },
  modeBtnActive: {
    borderColor: theme.colors.brand,
    backgroundColor: theme.colors.brandMuted,
  },
  modeBtnText: { fontSize: 13, color: theme.colors.textMuted, fontWeight: '600' },
  modeBtnTextActive: { color: theme.colors.brand },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
  },
  clearBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: theme.radii.md,
    borderWidth: 1,
    borderColor: theme.colors.borderDefault,
  },
  clearBtnText: { color: theme.colors.textMuted, fontSize: 14, fontWeight: '600' },
  closeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: theme.radii.md,
    borderWidth: 1,
    borderColor: theme.colors.cyan,
    backgroundColor: 'rgba(0,201,167,0.1)',
  },
  closeBtnText: { color: theme.colors.cyan, fontSize: 14, fontWeight: '600' },
  confirmBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: theme.radii.md,
    backgroundColor: theme.colors.brand,
  },
  confirmBtnDisabled: { opacity: 0.4 },
  confirmBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
});
