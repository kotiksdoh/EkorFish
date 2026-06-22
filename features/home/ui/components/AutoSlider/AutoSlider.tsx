import { useIsFocused } from "@react-navigation/native";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Dimensions,
  FlatList,
  NativeScrollEvent,
  NativeSyntheticEvent,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { AutoSliderItem } from "./AutoSliderItem";
import { ProgressIndicator } from "./ProgressIndicator";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
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
  isProduct?: boolean;
}

export const AutoSlider: React.FC<AutoSliderProps> = ({
  items,
  autoPlayInterval = 4000,
  showIndicators = true,
  isProduct,
}) => {
  const isScreenFocused = useIsFocused();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  const flatListRef = useRef<FlatList>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const resumeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isUserInteractingRef = useRef(false);
  const isAutoScrollingRef = useRef(false);
  const isMountedRef = useRef(true);
  const currentIndexRef = useRef(0);

  currentIndexRef.current = currentIndex;

  const clampIndex = useCallback(
    (index: number) => {
      if (items.length <= 0) return 0;
      return Math.max(0, Math.min(index, items.length - 1));
    },
    [items.length],
  );

  const clearAutoplayTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const goToNextSlide = useCallback(() => {
    if (
      items.length <= 1 ||
      isUserInteractingRef.current ||
      !isScreenFocused ||
      !isMountedRef.current
    ) {
      return;
    }

    isAutoScrollingRef.current = true;
    const nextIndex =
      currentIndexRef.current < items.length - 1
        ? currentIndexRef.current + 1
        : 0;
    setCurrentIndex(nextIndex);
  }, [isScreenFocused, items.length]);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      clearAutoplayTimer();
      if (resumeTimerRef.current) {
        clearTimeout(resumeTimerRef.current);
        resumeTimerRef.current = null;
      }
    };
  }, [clearAutoplayTimer]);

  useEffect(() => {
    if (!isScreenFocused) {
      isUserInteractingRef.current = false;
      isAutoScrollingRef.current = false;
      clearAutoplayTimer();
      if (resumeTimerRef.current) {
        clearTimeout(resumeTimerRef.current);
        resumeTimerRef.current = null;
      }
    }
  }, [clearAutoplayTimer, isScreenFocused]);

  useEffect(() => {
    clearAutoplayTimer();

    if (
      isAutoPlaying &&
      isScreenFocused &&
      items.length > 1 &&
      !isUserInteractingRef.current
    ) {
      timerRef.current = setTimeout(goToNextSlide, autoPlayInterval);
    }

    return clearAutoplayTimer;
  }, [
    autoPlayInterval,
    clearAutoplayTimer,
    currentIndex,
    goToNextSlide,
    isAutoPlaying,
    isScreenFocused,
    items.length,
  ]);

  useEffect(() => {
    setCurrentIndex((prev) => clampIndex(prev));
  }, [clampIndex]);

  useEffect(() => {
    if (!isScreenFocused || !flatListRef.current || items.length === 0) {
      return;
    }

    const safeIndex = clampIndex(currentIndex);
    flatListRef.current.scrollToIndex({
      index: safeIndex,
      animated: true,
    });
  }, [currentIndex, items.length, clampIndex, isScreenFocused]);

  const handleScrollBegin = () => {
    if (resumeTimerRef.current) {
      clearTimeout(resumeTimerRef.current);
      resumeTimerRef.current = null;
    }
    isUserInteractingRef.current = true;
    setIsAutoPlaying(false);
    clearAutoplayTimer();
  };

  const handleScrollEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (!isMountedRef.current || !isScreenFocused) {
      return;
    }

    const contentOffset = event.nativeEvent.contentOffset;
    const viewSize = event.nativeEvent.layoutMeasurement;
    const rawIndex = Math.round(contentOffset.x / viewSize.width);
    const newIndex = clampIndex(rawIndex);

    if (newIndex !== currentIndex) {
      setCurrentIndex(newIndex);
    }

    if (isAutoScrollingRef.current) {
      isAutoScrollingRef.current = false;
      return;
    }

    isUserInteractingRef.current = false;
    if (resumeTimerRef.current) {
      clearTimeout(resumeTimerRef.current);
    }
    resumeTimerRef.current = setTimeout(() => {
      if (isMountedRef.current && isScreenFocused) {
        setIsAutoPlaying(true);
      }
    }, 2000);
  };

  const handleIndicatorPress = (index: number) => {
    if (index === currentIndex) return;

    isUserInteractingRef.current = true;
    isAutoScrollingRef.current = false;
    setCurrentIndex(index);
    setIsAutoPlaying(false);

    if (resumeTimerRef.current) {
      clearTimeout(resumeTimerRef.current);
    }
    resumeTimerRef.current = setTimeout(() => {
      if (isMountedRef.current && isScreenFocused) {
        isUserInteractingRef.current = false;
        setIsAutoPlaying(true);
      }
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
        keyExtractor={(item) => item.id}
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
          if (!isScreenFocused || !flatListRef.current) {
            return;
          }
          const fallbackIndex = clampIndex(info.index);
          flatListRef.current.scrollToOffset({
            offset: SCREEN_WIDTH * fallbackIndex,
            animated: false,
          });
        }}
      />

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
                  isPlaying={isAutoPlaying && isScreenFocused}
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
  },
  indicatorsContainer: {
    position: "absolute",
    bottom: 24,
    left: 0,
    right: 0,
    alignItems: "center",
  },
  indicatorsWrapper: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 1,
  },
  indicatorButton: {},
});
