import { LogoIcon } from '@/assets/icons/icons.js';
import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
    Easing,
    runOnJS,
    useAnimatedStyle,
    useSharedValue,
    withTiming,
} from 'react-native-reanimated';

interface SplashScreenProps {
  onAnimationComplete: () => void;
}

export const SplashScreen = ({ onAnimationComplete }: SplashScreenProps) => {
  const opacity = useSharedValue(1);
  const scale = useSharedValue(1);

  useEffect(() => {
    // Анимация исчезновения
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

    // Задержка перед анимацией
    const timer = setTimeout(animateOut, 1500);

    return () => clearTimeout(timer);
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.content, animatedStyle]}>
        {/* Ваш логотип */}
        <LogoIcon/>
        {/* <Image
          source={logo} // Путь к вашему логотипу
          style={styles.logo}
          resizeMode="contain"
        /> */}
        {/* Или просто текст */}
        {/* <Text style={styles.text}>EkorFish</Text> */}
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF', // Белый фон
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
  },
  logo: {
    width: 200,
    height: 200,
  },
  text: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#203686',
  },
});