import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
    Dimensions,
    FlatList,
    NativeScrollEvent,
    NativeSyntheticEvent,
    StyleSheet,
    TouchableOpacity,
    View,
} from 'react-native';
import { AutoSliderItem } from './AutoSliderItem';
import { ProgressIndicator } from './ProgressIndicator';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SLIDER_HEIGHT = 282;

export interface SlideItem {
  id: string;
  imageUrl: string;
  title?: string;
  subtitle?: string;
}

interface AutoSliderProps {
  items: SlideItem[];
  autoPlayInterval?: number;
  showIndicators?: boolean;
}

export const AutoSlider: React.FC<AutoSliderProps> = ({
  items,
  autoPlayInterval = 4000,
  showIndicators = true,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  
  const flatListRef = useRef<FlatList>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const goToNextSlide = useCallback(() => {
    if (items.length <= 1) return;
    
    setCurrentIndex(prev => (prev < items.length - 1 ? prev + 1 : 0));
  }, [items.length]);

  // Автопрокрутка
  useEffect(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    if (isAutoPlaying && items.length > 1) {
      timerRef.current = setTimeout(goToNextSlide, autoPlayInterval);
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [currentIndex, isAutoPlaying, items.length, autoPlayInterval, goToNextSlide]);

  // Прокрутка к текущему слайду
  useEffect(() => {
    if (flatListRef.current && items.length > 0) {
      flatListRef.current.scrollToIndex({
        index: currentIndex,
        animated: true,
      });
    }
  }, [currentIndex, items.length]);

  const handleScrollBegin = () => {
    setIsAutoPlaying(false);
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  const handleScrollEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const contentOffset = event.nativeEvent.contentOffset;
    const viewSize = event.nativeEvent.layoutMeasurement;
    const newIndex = Math.round(contentOffset.x / viewSize.width);
    
    if (newIndex !== currentIndex) {
      setCurrentIndex(newIndex);
    }
    
    setTimeout(() => setIsAutoPlaying(true), 2000);
  };

  const handleIndicatorPress = (index: number) => {
    if (index === currentIndex) return;
    
    setCurrentIndex(index);
    setIsAutoPlaying(false);
    
    setTimeout(() => setIsAutoPlaying(true), 3000);
  };

  const renderItem = ({ item }: { item: SlideItem }) => (
    <AutoSliderItem 
      item={item} 
      sliderHeight={SLIDER_HEIGHT} 
    />
  );

  return (
    <View style={styles.container}>
      <FlatList
        ref={flatListRef}
        data={items}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScrollBeginDrag={handleScrollBegin}
        onMomentumScrollEnd={handleScrollEnd}
        scrollEventThrottle={16}
        bounces={false}
        decelerationRate="fast"
        initialScrollIndex={currentIndex}
        getItemLayout={(_, index) => ({
          length: SCREEN_WIDTH,
          offset: SCREEN_WIDTH * index,
          index,
        })}
      />

      {/* Индикаторы прогресса */}
      {showIndicators && items.length > 1 && (
        <View style={styles.indicatorsContainer}>
          <View style={styles.indicatorsWrapper}>
            {items.map((_, index) => (
              <TouchableOpacity
                key={index}
                onPress={() => handleIndicatorPress(index)}
                activeOpacity={0.7}
                style={styles.indicatorButton}
              >
                <ProgressIndicator
                  index={index}
                  currentIndex={currentIndex}
                  autoPlayInterval={autoPlayInterval}
                  isPlaying={isAutoPlaying}
                />
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: SLIDER_HEIGHT,
    position: 'relative',
    backgroundColor: '#fff', // Временный фон для видимости
  },
  indicatorsContainer: {
    position: 'absolute',
    bottom: 24,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  indicatorsWrapper: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'rgba(0,0,0,0.3)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    // borderRadius: 20,
  },
  indicatorButton: {
    padding: 4,
  },
});