import { LogoIcon } from '@/assets/icons/icons.js';
import * as SplashScreenExpo from 'expo-splash-screen';
import React, { useEffect, useRef } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import Animated, {
    Easing,
    runOnJS,
    useAnimatedStyle,
    useSharedValue,
    withTiming,
} from 'react-native-reanimated';

interface SplashScreenProps {
  readyToDismiss: boolean;
  onAnimationComplete: () => void;
  onRetry?: () => void;
  showRetryHint?: boolean;
}

export const SplashScreen = ({
  readyToDismiss,
  onAnimationComplete,
  onRetry,
  showRetryHint = false,
}: SplashScreenProps) => {
  const opacity = useSharedValue(1);
  const scale = useSharedValue(1);
  const hasStartedDismissRef = useRef(false);
  const mountTimeRef = useRef(Date.now());

  useEffect(() => {
    SplashScreenExpo.hideAsync().catch(() => {
      /* ignore */
    });
  }, []);

  useEffect(() => {
    if (!readyToDismiss || hasStartedDismissRef.current) {
      return;
    }

    hasStartedDismissRef.current = true;

    const animateOut = () => {
      opacity.value = withTiming(0, {
        duration: 300,
        easing: Easing.ease,
      });
      scale.value = withTiming(1.2, {
        duration: 300,
        easing: Easing.ease,
      }, (finished) => {
        if (finished) {
          runOnJS(onAnimationComplete)();
        }
      });
    };

    const elapsed = Date.now() - mountTimeRef.current;
    const minDisplayMs = 1200;
    const delay = Math.max(0, minDisplayMs - elapsed);

    const timer = setTimeout(animateOut, delay);

    return () => clearTimeout(timer);
  }, [onAnimationComplete, opacity, readyToDismiss, scale]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  return (
    <Pressable
      style={styles.container}
      onPress={showRetryHint ? onRetry : undefined}
      disabled={!showRetryHint}
    >
      <Animated.View style={[styles.content, animatedStyle]}>
        <LogoIcon/>
      </Animated.View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
  },
});
