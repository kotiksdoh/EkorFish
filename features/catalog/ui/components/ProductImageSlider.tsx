import { ProgressIndicator } from "@/features/home/ui/components/AutoSlider/ProgressIndicator";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Dimensions,
  FlatList,
  Image,
  NativeScrollEvent,
  NativeSyntheticEvent,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const SLIDER_HEIGHT = 282;

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

  const flatListRef = useRef<FlatList>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const resumeTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isUserInteractingRef = useRef(false);
  const isProgrammaticScrollRef = useRef(false);
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
        offset: SCREEN_WIDTH * safeIndex,
        animated,
      });
    },
    [clampIndex, items.length],
  );

  const goToNextSlide = useCallback(() => {
    if (items.length <= 1 || isUserInteractingRef.current) return;

    const nextIndex =
      currentIndexRef.current < items.length - 1
        ? currentIndexRef.current + 1
        : 0;

    setCurrentIndex(nextIndex);
    scrollToIndexProgrammatic(nextIndex);
  }, [items.length, scrollToIndexProgrammatic]);

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
    const pageWidth = viewSize.width || SCREEN_WIDTH;
    const newIndex = clampIndex(Math.round(contentOffset.x / pageWidth));

    if (isProgrammaticScrollRef.current) {
      isProgrammaticScrollRef.current = false;
      scheduleResumeAutoplay();
      return;
    }

    if (newIndex !== currentIndexRef.current) {
      setCurrentIndex(newIndex);
    }

    scheduleResumeAutoplay();
  };

  const handleIndicatorPress = (index: number) => {
    if (index === currentIndex) return;

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
  };

  const renderItem = ({ item }: { item: ProductSlideItem }) => (
    <View style={[styles.slide, { width: SCREEN_WIDTH }]}>
      <View style={[styles.imageWrapper, { height: SLIDER_HEIGHT }]}>
        <Image
          source={{ uri: item.imageUrl }}
          style={styles.productImage}
          resizeMode="cover"
        />
        <View style={styles.gradientOverlay} />
        <View style={styles.textContainer} />
      </View>
    </View>
  );

  const listRenderConfig =
    items.length > 0
      ? {
          initialNumToRender: items.length,
          maxToRenderPerBatch: items.length,
          windowSize: Math.max(items.length, 3),
        }
      : {};

  return (
    <View style={styles.container}>
      <FlatList
        ref={flatListRef}
        data={items}
        renderItem={renderItem}
        keyExtractor={(item, index) => item.id || `product-slide-${index}`}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScrollBeginDrag={handleScrollBegin}
        onMomentumScrollEnd={handleScrollEnd}
        scrollEventThrottle={16}
        bounces={false}
        decelerationRate="fast"
        removeClippedSubviews={false}
        getItemLayout={(_, index) => ({
          length: SCREEN_WIDTH,
          offset: SCREEN_WIDTH * index,
          index,
        })}
        {...listRenderConfig}
      />

      {showIndicators && items.length > 1 ? (
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
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: SLIDER_HEIGHT,
  },
  slide: {
    alignItems: "center",
    justifyContent: "center",
  },
  imageWrapper: {
    width: "100%",
    position: "relative",
  },
  productImage: {
    width: "93%",
    height: "95%",
    borderRadius: 24,
  },
  gradientOverlay: {
    position: "absolute",
    bottom: 0,
    left: 16,
    right: 16,
    height: 100,
    borderBottomRightRadius: 24,
    borderBottomLeftRadius: 24,
  },
  textContainer: {
    position: "absolute",
    bottom: 0,
    left: 16,
    right: 16,
    padding: 16,
    borderBottomRightRadius: 24,
    borderBottomLeftRadius: 24,
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
