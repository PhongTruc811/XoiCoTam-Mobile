import { useEffect, useMemo } from 'react';
import { useWindowDimensions } from 'react-native';
import { Gesture } from 'react-native-gesture-handler';
import { cancelAnimation, Easing, ReduceMotion, useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

export function isRightSwipeComplete(dx: number, dy: number, velocityX = 0, width = 375) {
  'worklet';
  return Math.abs(dx) > Math.abs(dy) * 1.5 && (dx > Math.max(72, width * 0.22) || (dx > 36 && velocityX > 700));
}

export function useSwipeBack(onBack: () => void, navigationKey = '') {
  const { width } = useWindowDimensions();
  const translateX = useSharedValue(0);
  const opacity = useSharedValue(1);
  const settling = useSharedValue(false);
  const scrollGesture = useMemo(() => Gesture.Native(), []);

  useEffect(() => {
    translateX.set(0);
    settling.set(false);
    opacity.set(0);
    opacity.set(withTiming(1, { duration: 160, reduceMotion: ReduceMotion.System }));
    return () => cancelAnimation(translateX);
  }, [navigationKey, translateX, settling, opacity]);

  const gesture = useMemo(() => {
    function restore() {
      'worklet';
      translateX.set(withSpring(0, { stiffness: 240, damping: 28, mass: 0.85, overshootClamping: true, reduceMotion: ReduceMotion.System }));
    }

    return Gesture.Pan()
      .simultaneousWithExternalGesture(scrollGesture)
      .activeOffsetX(14)
      .failOffsetX(-14)
      .failOffsetY([-20, 20])
      .maxPointers(1)
      .onStart(() => { if (!settling.get()) cancelAnimation(translateX); })
      .onUpdate(event => {
        if (!settling.get()) translateX.set(Math.min(width, Math.max(0, event.translationX * 0.94)));
      })
      .onEnd((event, success) => {
        if (settling.get()) return;
        if (!success || !isRightSwipeComplete(event.translationX, event.translationY, event.velocityX, width)) {
          restore();
          return;
        }
        settling.set(true);
        const duration = Math.max(150, Math.min(260, (width - translateX.get()) / Math.max(event.velocityX, 1100) * 1000));
        translateX.set(withTiming(width + 24, { duration, easing: Easing.out(Easing.cubic), reduceMotion: ReduceMotion.System }, finished => {
          if (finished) scheduleOnRN(onBack);
        }));
      })
      .onFinalize((_, success) => {
        if (!success && !settling.get()) restore();
      });
  }, [onBack, translateX, settling, scrollGesture, width]);

  const swipeStyle = useAnimatedStyle(() => {
    const progress = Math.min(1, translateX.get() / width);
    return {
      transform: [{ translateX: translateX.get() }, { scale: 1 - progress * 0.025 }],
      opacity: opacity.get(),
      borderRadius: progress * 24,
      overflow: 'hidden' as const,
    };
  });
  return { gesture, scrollGesture, swipeStyle };
}
