import React, { useEffect, useRef } from 'react';
import { View, Animated, Easing, StyleSheet } from 'react-native';

interface ProgressIndicatorProps {
  index: number;
  currentIndex: number;
  autoPlayInterval: number;
  isPlaying: boolean;
}

export const ProgressIndicator: React.FC<ProgressIndicatorProps> = ({
  index,
  currentIndex,
  autoPlayInterval = 4000,
  isPlaying,
}) => {
  const progressWidth = useRef(new Animated.Value(6)).current; // Начальная ширина 6px
  const isActive = index === currentIndex;
  
  console.log(`Indicator ${index}: active=${isActive}, playing=${isPlaying}, interval=${autoPlayInterval}`);

  useEffect(() => {
    // Останавливаем текущую анимацию
    progressWidth.stopAnimation();
    
    if (isActive && isPlaying && autoPlayInterval > 0) {
      console.log(`Starting animation for indicator ${index}`);
      
      // Сбрасываем ширину на начальную (6px = точка)
      progressWidth.setValue(6);
      
      // Запускаем анимацию от 6px до 32px (w-8 = 32px)
      Animated.timing(progressWidth, {
        toValue: 32,
        duration: autoPlayInterval,
        easing: Easing.linear,
        useNativeDriver: false, // width не поддерживает useNativeDriver
      }).start(({ finished }) => {
        console.log(`Animation ${index} finished:`, finished);
      });
    } else {
      // Для неактивных индикаторов - просто точка (6px)
      console.log(`Resetting indicator ${index} to dot`);
      progressWidth.setValue(6);
    }
  }, [isActive, isPlaying, autoPlayInterval, progressWidth]);

  // Только активный слайд показывает анимирующуюся линию
  if (isActive) {
    return (
      <View style={styles.container}>
        <View style={styles.track}>
          <Animated.View 
            style={[
              styles.progress,
              {
                width: progressWidth,
              }
            ]} 
          />
        </View>
      </View>
    );
  }

  // Все остальные - просто точки
  return <View style={styles.dot} />;
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 4,
  },
  track: {
    width: 32, // w-8
    height: 6, // h-1.5
    backgroundColor: 'rgba(255, 255, 255, 0.3)', // bg-white/30
    borderRadius: 9999,
    overflow: 'hidden',
  },
  progress: {
    height: '100%',
    backgroundColor: '#FFFFFF', // bg-white
    borderRadius: 9999,
  },
  dot: {
    width: 6, // w-1.5
    height: 6, // h-1.5
    backgroundColor: 'rgba(255, 255, 255, 0.5)', // bg-white/50
    borderRadius: 9999,
    marginHorizontal: 4,
  },
});