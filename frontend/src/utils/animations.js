import { Animated, Easing } from 'react-native';

export function fadeInUp(animValue, { duration = 320, delay = 0 } = {}) {
  return Animated.timing(animValue, {
    toValue: 1,
    duration,
    delay,
    useNativeDriver: true,
  });
}

export function fadeInUpStyle(animValue, translateDistance = 16) {
  return {
    opacity: animValue,
    transform: [
      {
        translateY: animValue.interpolate({
          inputRange: [0, 1],
          outputRange: [translateDistance, 0],
        }),
      },
    ],
  };
}

export function springScale(animValue, toValue, { speed = 20, bounciness = 6 } = {}) {
  return Animated.spring(animValue, {
    toValue,
    useNativeDriver: true,
    speed,
    bounciness,
  });
}

export function pulseLoop(animValue, { minOpacity = 0.3, maxOpacity = 0.7, duration = 800 } = {}) {
  return Animated.loop(
    Animated.sequence([
      Animated.timing(animValue, {
        toValue: maxOpacity,
        duration,
        useNativeDriver: true,
      }),
      Animated.timing(animValue, {
        toValue: minOpacity,
        duration,
        useNativeDriver: true,
      }),
    ])
  );
}

export function staggeredEntrance(animValues, { staggerDelay = 60, duration = 300 } = {}) {
  return Animated.stagger(
    staggerDelay,
    animValues.map((anim) =>
      Animated.timing(anim, {
        toValue: 1,
        duration,
        useNativeDriver: true,
        easing: Easing.out(Easing.cubic),
      })
    )
  );
}

export function springPop(animValue, { toValue = 1.1, speed = 25, bounciness = 8 } = {}) {
  return Animated.sequence([
    Animated.spring(animValue, { toValue, useNativeDriver: true, speed, bounciness }),
    Animated.spring(animValue, { toValue: 1, useNativeDriver: true, speed, bounciness }),
  ]);
}

export function breathingScale(animValue, { minScale = 0.95, maxScale = 1.05, duration = 2000 } = {}) {
  return Animated.loop(
    Animated.sequence([
      Animated.timing(animValue, {
        toValue: maxScale,
        duration,
        easing: Easing.inOut(Easing.sin),
        useNativeDriver: true,
      }),
      Animated.timing(animValue, {
        toValue: minScale,
        duration,
        easing: Easing.inOut(Easing.sin),
        useNativeDriver: true,
      }),
    ])
  );
}
