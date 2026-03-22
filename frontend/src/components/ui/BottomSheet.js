import React, { useRef, useEffect } from 'react';
import { View, TouchableOpacity, Animated, Dimensions, StyleSheet } from 'react-native';
import { theme } from '../../theme';

const SCREEN_HEIGHT = Dimensions.get('window').height;

export default function BottomSheet({ visible, onDismiss, children, style }) {
  const translateY = useRef(new Animated.Value(SCREEN_HEIGHT)).current;

  useEffect(() => {
    if (visible) {
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
        damping: 20,
        stiffness: 200,
      }).start();
    } else {
      Animated.timing(translateY, {
        toValue: SCREEN_HEIGHT,
        duration: 220,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  if (!visible) return null;

  return (
    <>
      <TouchableOpacity
        style={styles.overlay}
        onPress={onDismiss}
        activeOpacity={1}
        accessibilityRole="button"
        accessibilityLabel="Dismiss"
      />
      <Animated.View
        style={[styles.sheet, { transform: [{ translateY }] }, style]}
      >
        <View style={styles.handle} />
        {children}
      </Animated.View>
    </>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: theme.colors.bgOverlay,
  },
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: theme.colors.bgElevated,
    borderTopLeftRadius: theme.radii.xl,
    borderTopRightRadius: theme.radii.xl,
    padding: 20,
    paddingTop: 12,
    borderTopWidth: 1,
    borderColor: theme.colors.borderDefault,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: theme.colors.textFaint,
    alignSelf: 'center',
    marginBottom: 16,
  },
});
