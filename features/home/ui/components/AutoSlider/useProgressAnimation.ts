// hooks/useProgressAnimation.ts
import { useEffect, useRef, useState } from 'react';
import { Animated } from 'react-native';

export const useProgressAnimation = (
  isActive: boolean,
  duration: number,
  onComplete?: () => void
) => {
  const progress = useRef(new Animated.Value(0)).current;
  const [isAnimating, setIsAnimating] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const startAnimation = () => {
    // Очищаем всё
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    
    progress.stopAnimation();
    progress.setValue(0);
    setIsAnimating(true);

    // Анимация
    Animated.timing(progress, {
      toValue: 1,
      duration,
      useNativeDriver: false,
    }).start(({ finished }) => {
      setIsAnimating(false);
      if (finished && onComplete) {
        onComplete();
      }
    });
  };

  const stopAnimation = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    progress.stopAnimation();
    setIsAnimating(false);
  };

  const resetAnimation = () => {
    stopAnimation();
    progress.setValue(0);
  };

  useEffect(() => {
    if (isActive) {
      startAnimation();
    } else {
      resetAnimation();
    }

    return () => {
      stopAnimation();
    };
  }, [isActive, duration]);

  return {
    progress,
    isAnimating,
    startAnimation,
    stopAnimation,
    resetAnimation,
  };
};