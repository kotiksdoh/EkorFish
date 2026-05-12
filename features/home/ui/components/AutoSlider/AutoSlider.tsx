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
  isProduct?: boolean
}

export const AutoSlider: React.FC<AutoSliderProps> = ({
  items,
  autoPlayInterval = 4000,
  showIndicators = true,
  isProduct
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  
  const flatListRef = useRef<FlatList>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const resumeTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isUserInteractingRef = useRef(false);
  const isAutoScrollingRef = useRef(false);

  const clampIndex = useCallback(
    (index: number) => {
      if (items.length <= 0) return 0;
      return Math.max(0, Math.min(index, items.length - 1));
    },
    [items.length],
  );

  const goToNextSlide = useCallback(() => {
    if (items.length <= 1 || isUserInteractingRef.current) return;
    isAutoScrollingRef.current = true;
    setCurrentIndex((prev) => (prev < items.length - 1 ? prev + 1 : 0));
  }, [items.length]);

  // Автопрокрутка (только timerRef; resumeTimerRef не трогаем — иначе при смене currentIndex
  // после ручного свайпа cleanup отменяет «возобновить через 2с» и автоплей/полоска замирают навсегда)
  useEffect(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    if (isAutoPlaying && items.length > 1 && !isUserInteractingRef.current) {
      timerRef.current = setTimeout(goToNextSlide, autoPlayInterval);
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [currentIndex, isAutoPlaying, items.length, autoPlayInterval, goToNextSlide]);

  useEffect(
    () => () => {
      if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current);
    },
    [],
  );

  // Если данные слайдера изменились, держим индекс в допустимых пределах
  useEffect(() => {
    setCurrentIndex((prev) => clampIndex(prev));
  }, [clampIndex]);

  // Прокрутка к текущему слайду
  useEffect(() => {
    if (flatListRef.current && items.length > 0) {
      const safeIndex = clampIndex(currentIndex);
      flatListRef.current.scrollToIndex({
        index: safeIndex,
        animated: true,
      });
    }
  }, [currentIndex, items.length, clampIndex]);

  const handleScrollBegin = () => {
    if (resumeTimerRef.current) {
      clearTimeout(resumeTimerRef.current);
      resumeTimerRef.current = null;
    }
    isUserInteractingRef.current = true;
    setIsAutoPlaying(false);
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  const handleScrollEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const contentOffset = event.nativeEvent.contentOffset;
    const viewSize = event.nativeEvent.layoutMeasurement;
    const rawIndex = Math.round(contentOffset.x / viewSize.width);
    const newIndex = clampIndex(rawIndex);
    
    if (newIndex !== currentIndex) setCurrentIndex(newIndex);

    // После автоскролла не ставим паузу — продолжаем стандартный цикл автоперехода.
    if (isAutoScrollingRef.current) {
      isAutoScrollingRef.current = false;
      return;
    }

    isUserInteractingRef.current = false;
    if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current);
    resumeTimerRef.current = setTimeout(() => setIsAutoPlaying(true), 2000);
  };

  const handleIndicatorPress = (index: number) => {
    if (index === currentIndex) return;

    isUserInteractingRef.current = true;
    setCurrentIndex(index);
    setIsAutoPlaying(false);

    if (resumeTimerRef.current) {
      clearTimeout(resumeTimerRef.current);
    }
    resumeTimerRef.current = setTimeout(() => {
      isUserInteractingRef.current = false;
      setIsAutoPlaying(true);
    }, 3000);
  };

  const renderItem = ({ item }: { item: SlideItem }) => (
    <AutoSliderItem 
      item={item} 
      sliderHeight={SLIDER_HEIGHT} 
      isProduct={isProduct}
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
        initialScrollIndex={0}
        getItemLayout={(_, index) => ({
          length: SCREEN_WIDTH,
          offset: SCREEN_WIDTH * index,
          index,
        })}
        onScrollToIndexFailed={(info) => {
          const fallbackIndex = clampIndex(info.index);
          flatListRef.current?.scrollToOffset({
            offset: SCREEN_WIDTH * fallbackIndex,
            animated: true,
          });
        }}
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
    // marginTop: -STATUS_BAR_HEIGHT, // ЗАХОДИТ ЗА СТАТУС БАР
    // backgroundColor: '#fff',
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
    gap: 1,
  },
  indicatorButton: {
    // padding: 4,
  },
});