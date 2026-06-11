import { ProgressIndicator } from "@/features/home/ui/components/AutoSlider/ProgressIndicator";
import { useIsFocused } from "@react-navigation/native";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Dimensions,
  FlatList,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import {
  PRODUCT_SLIDER_HEIGHT,
  ProductImageSliderSlide,
} from "./ProductImageSliderSlide";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const PAGE_WIDTH = SCREEN_WIDTH;
const RENDER_WINDOW = 5;
const INITIAL_RENDER = 3;

export interface ProductSlideItem {
  id: string;
  imageUrl: string;
}

interface ProductImageSliderProps {
  items: ProductSlideItem[];
  autoPlayInterval?: number;
  showIndicators?: boolean;
}

export const ProductImageSlider: React.FC<ProductImageSliderProps> = ({
  items,
  autoPlayInterval = 4000,
  showIndicators = true,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const isScreenFocused = useIsFocused();

  const flatListRef = useRef<FlatList<ProductSlideItem>>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const resumeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isUserInteractingRef = useRef(false);
  const isProgrammaticScrollRef = useRef(false);
  const scrollSettleLockRef = useRef(0);
  const currentIndexRef = useRef(0);
  const itemsKeyRef = useRef("");
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

  const scheduleResumeAutoplay = useCallback(() => {
    if (resumeTimerRef.current) {
      clearTimeout(resumeTimerRef.current);
    }
    resumeTimerRef.current = setTimeout(() => {
      isUserInteractingRef.current = false;
      setIsAutoPlaying(true);
    }, 2000);
  }, []);

  const scrollToIndexProgrammatic = useCallback(
    (index: number, animated = true) => {
      if (!flatListRef.current || items.length <= 0) return;

      const safeIndex = clampIndex(index);
      isProgrammaticScrollRef.current = true;
      flatListRef.current.scrollToOffset({
        offset: PAGE_WIDTH * safeIndex,
        animated,
      });
    },
    [clampIndex, items.length],
  );

  const goToNextSlide = useCallback(() => {
    if (items.length <= 1 || isUserInteractingRef.current || !isScreenFocused) {
      return;
    }

    const nextIndex =
      currentIndexRef.current < items.length - 1
        ? currentIndexRef.current + 1
        : 0;

    setCurrentIndex(nextIndex);
    scrollToIndexProgrammatic(nextIndex);
  }, [isScreenFocused, items.length, scrollToIndexProgrammatic]);

  useEffect(() => {
    if (!isScreenFocused) {
      isUserInteractingRef.current = false;
      clearAutoplayTimer();
      if (resumeTimerRef.current) {
        clearTimeout(resumeTimerRef.current);
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

  useEffect(
    () => () => {
      if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current);
    },
    [],
  );

  useEffect(() => {
    const nextItemsKey = items.map((item) => item.id).join("|");
    if (nextItemsKey === itemsKeyRef.current) return;

    itemsKeyRef.current = nextItemsKey;
    setCurrentIndex(0);
    currentIndexRef.current = 0;
    isUserInteractingRef.current = false;
    isProgrammaticScrollRef.current = false;
    setIsAutoPlaying(true);

    requestAnimationFrame(() => {
      flatListRef.current?.scrollToOffset({ offset: 0, animated: false });
    });
  }, [items]);

  const handleScrollBegin = useCallback(() => {
    if (resumeTimerRef.current) {
      clearTimeout(resumeTimerRef.current);
      resumeTimerRef.current = null;
    }
    isUserInteractingRef.current = true;
    setIsAutoPlaying(false);
    clearAutoplayTimer();
  }, [clearAutoplayTimer]);

  const handleScrollSettle = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const now = Date.now();
      if (now - scrollSettleLockRef.current < 60) return;
      scrollSettleLockRef.current = now;

      const contentOffset = event.nativeEvent.contentOffset;
      const viewSize = event.nativeEvent.layoutMeasurement;
      const pageWidth = viewSize.width || PAGE_WIDTH;
      const rawIndex = contentOffset.x / pageWidth;
      const newIndex = clampIndex(Math.round(rawIndex));
      const targetOffset = newIndex * pageWidth;
      const isMisaligned = Math.abs(contentOffset.x - targetOffset) > 2;

      if (isProgrammaticScrollRef.current) {
        isProgrammaticScrollRef.current = false;
        if (newIndex !== currentIndexRef.current) {
          setCurrentIndex(newIndex);
        }
        scheduleResumeAutoplay();
        return;
      }

      if (isMisaligned) {
        isProgrammaticScrollRef.current = true;
        if (newIndex !== currentIndexRef.current) {
          setCurrentIndex(newIndex);
        }
        flatListRef.current?.scrollToOffset({
          offset: targetOffset,
          animated: true,
        });
        scheduleResumeAutoplay();
        return;
      }

      if (newIndex !== currentIndexRef.current) {
        setCurrentIndex(newIndex);
      }
      scheduleResumeAutoplay();
    },
    [clampIndex, scheduleResumeAutoplay],
  );

  const handleIndicatorPress = useCallback(
    (index: number) => {
      if (index === currentIndexRef.current) return;

      isUserInteractingRef.current = true;
      setIsAutoPlaying(false);
      setCurrentIndex(index);
      scrollToIndexProgrammatic(index);

      if (resumeTimerRef.current) {
        clearTimeout(resumeTimerRef.current);
      }
      resumeTimerRef.current = setTimeout(() => {
        isUserInteractingRef.current = false;
        setIsAutoPlaying(true);
      }, 3000);
    },
    [scrollToIndexProgrammatic],
  );

  const renderItem = useCallback(
    ({ item }: { item: ProductSlideItem }) => (
      <ProductImageSliderSlide imageUrl={item.imageUrl} />
    ),
    [],
  );

  const keyExtractor = useCallback(
    (item: ProductSlideItem, index: number) => item.id || `product-slide-${index}`,
    [],
  );

  const getItemLayout = useCallback(
    (_: ArrayLike<ProductSlideItem> | null | undefined, index: number) => ({
      length: PAGE_WIDTH,
      offset: PAGE_WIDTH * index,
      index,
    }),
    [],
  );

  if (items.length === 0) {
    return <View style={styles.container} />;
  }

  return (
    <View style={styles.container}>
      <FlatList
        ref={flatListRef}
        data={items}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScrollBeginDrag={handleScrollBegin}
        onScrollEndDrag={handleScrollSettle}
        onMomentumScrollEnd={handleScrollSettle}
        scrollEventThrottle={16}
        bounces={false}
        decelerationRate="fast"
        nestedScrollEnabled
        removeClippedSubviews={Platform.OS === "android"}
        initialNumToRender={Math.min(INITIAL_RENDER, items.length)}
        maxToRenderPerBatch={2}
        windowSize={RENDER_WINDOW}
        updateCellsBatchingPeriod={50}
        getItemLayout={getItemLayout}
      />

      {showIndicators && items.length > 1 ? (
        <View style={styles.indicatorsContainer} pointerEvents="box-none">
          <View style={styles.indicatorsWrapper}>
            {items.map((_, index) => (
              <TouchableOpacity
                key={`indicator-${index}`}
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
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: PRODUCT_SLIDER_HEIGHT,
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
    flexWrap: "wrap",
    maxWidth: SCREEN_WIDTH - 32,
  },
  indicatorButton: {},
});
