import { ProgressIndicator } from "@/features/home/ui/components/AutoSlider/ProgressIndicator";
import { useIsFocused } from "@react-navigation/native";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  FlatList,
  LayoutChangeEvent,
  NativeScrollEvent,
  NativeSyntheticEvent,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import {
  GALLERY_HEIGHT,
  ProductDetailGallerySlide,
} from "./ProductDetailGallerySlide";
import { ProductImageViewer } from "./ProductImageViewer";
import {
  ProductDetailGalleryProps,
  ProductGalleryItem,
} from "./productDetailGalleryTypes";

export type { ProductGalleryItem } from "./productDetailGalleryTypes";

const PLACEHOLDER_GALLERY_ITEMS = [
  { id: "gallery-placeholder", imageUrl: "" },
] as const;

export const ProductDetailGallery: React.FC<ProductDetailGalleryProps> = ({
  items,
  autoPlayInterval = 4000,
  showIndicators = true,
  isActive = true,
}) => {
  const galleryItems = useMemo(
    () => (items.length > 0 ? items : [...PLACEHOLDER_GALLERY_ITEMS]),
    [items],
  );

  const galleryItemsKey = useMemo(
    () => galleryItems.map((item) => item.id).join("|"),
    [galleryItems],
  );

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(autoPlayInterval > 0);
  const [galleryWidth, setGalleryWidth] = useState(0);
  const [viewerVisible, setViewerVisible] = useState(false);
  const [viewerIndex, setViewerIndex] = useState(0);
  const isScreenFocused = useIsFocused();

  const flatListRef = useRef<FlatList<ProductGalleryItem>>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const resumeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isUserInteractingRef = useRef(false);
  const currentIndexRef = useRef(0);
  const itemsKeyRef = useRef("");
  const galleryWidthRef = useRef(0);
  const isMountedRef = useRef(true);

  currentIndexRef.current = currentIndex;
  galleryWidthRef.current = galleryWidth;

  const canUseCarousel = isActive && isScreenFocused;

  const setCurrentIndexSafe = useCallback((index: number) => {
    if (isMountedRef.current) {
      setCurrentIndex(index);
    }
  }, []);

  const setIsAutoPlayingSafe = useCallback((value: boolean) => {
    if (isMountedRef.current) {
      setIsAutoPlaying(value);
    }
  }, []);

  const clampIndex = useCallback(
    (index: number) => {
      if (galleryItems.length <= 0) return 0;
      return Math.max(0, Math.min(index, galleryItems.length - 1));
    },
    [galleryItems.length],
  );

  const clearAutoplayTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const scheduleResumeAutoplay = useCallback(() => {
    if (autoPlayInterval <= 0) return;
    if (resumeTimerRef.current) {
      clearTimeout(resumeTimerRef.current);
    }
    resumeTimerRef.current = setTimeout(() => {
      isUserInteractingRef.current = false;
      setIsAutoPlayingSafe(true);
    }, 2000);
  }, [autoPlayInterval, setIsAutoPlayingSafe]);

  const scrollToPage = useCallback(
    (index: number, animated = true) => {
      if (!isMountedRef.current || !canUseCarousel || galleryWidthRef.current <= 0) {
        return;
      }
      const safeIndex = clampIndex(index);
      flatListRef.current?.scrollToOffset({
        offset: galleryWidthRef.current * safeIndex,
        animated,
      });
    },
    [canUseCarousel, clampIndex],
  );

  const openViewer = useCallback(
    (index: number) => {
      isUserInteractingRef.current = true;
      setIsAutoPlayingSafe(false);
      clearAutoplayTimer();
      setViewerIndex(clampIndex(index));
      setViewerVisible(true);
    },
    [clampIndex, clearAutoplayTimer, setIsAutoPlayingSafe],
  );

  const closeViewer = useCallback(() => {
    setViewerVisible(false);
    scheduleResumeAutoplay();
  }, [scheduleResumeAutoplay]);

  const handleViewerIndexChange = useCallback(
    (index: number) => {
      const safeIndex = clampIndex(index);
      setViewerIndex(safeIndex);
      setCurrentIndexSafe(safeIndex);
      scrollToPage(safeIndex, false);
    },
    [clampIndex, scrollToPage, setCurrentIndexSafe],
  );

  const goToNextSlide = useCallback(() => {
    if (
      autoPlayInterval <= 0 ||
      galleryItems.length <= 1 ||
      isUserInteractingRef.current ||
      !canUseCarousel ||
      viewerVisible
    ) {
      return;
    }
    const nextIndex =
      currentIndexRef.current < galleryItems.length - 1
        ? currentIndexRef.current + 1
        : 0;
    setCurrentIndexSafe(nextIndex);
    scrollToPage(nextIndex);
  }, [
    autoPlayInterval,
    canUseCarousel,
    galleryItems.length,
    scrollToPage,
    setCurrentIndexSafe,
    viewerVisible,
  ]);

  const handleLayout = useCallback((event: LayoutChangeEvent) => {
    const nextWidth = Math.round(event.nativeEvent.layout.width);
    if (nextWidth > 0 && nextWidth !== galleryWidthRef.current) {
      setGalleryWidth(nextWidth);
    }
  }, []);

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
    if (!canUseCarousel) {
      isUserInteractingRef.current = false;
      clearAutoplayTimer();
      if (resumeTimerRef.current) {
        clearTimeout(resumeTimerRef.current);
        resumeTimerRef.current = null;
      }
    }
  }, [canUseCarousel, clearAutoplayTimer]);

  useEffect(() => {
    clearAutoplayTimer();
    if (
      autoPlayInterval > 0 &&
      isAutoPlaying &&
      canUseCarousel &&
      !viewerVisible &&
      galleryItems.length > 1 &&
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
    canUseCarousel,
    galleryItems.length,
    viewerVisible,
  ]);

  useEffect(() => {
    if (galleryItemsKey === itemsKeyRef.current) return;

    itemsKeyRef.current = galleryItemsKey;
    setCurrentIndexSafe(0);
    isUserInteractingRef.current = false;
    setIsAutoPlayingSafe(autoPlayInterval > 0);
    requestAnimationFrame(() => {
      if (!isMountedRef.current || !canUseCarousel) return;
      flatListRef.current?.scrollToOffset({ offset: 0, animated: false });
    });
  }, [
    autoPlayInterval,
    canUseCarousel,
    galleryItemsKey,
    setCurrentIndexSafe,
    setIsAutoPlayingSafe,
  ]);

  const handleScrollBegin = useCallback(() => {
    if (resumeTimerRef.current) {
      clearTimeout(resumeTimerRef.current);
      resumeTimerRef.current = null;
    }
    isUserInteractingRef.current = true;
    setIsAutoPlayingSafe(false);
    clearAutoplayTimer();
  }, [clearAutoplayTimer, setIsAutoPlayingSafe]);

  const handleScrollEnd = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const pageWidth =
        event.nativeEvent.layoutMeasurement.width || galleryWidthRef.current;
      if (pageWidth <= 0) return;

      const index = clampIndex(
        Math.round(event.nativeEvent.contentOffset.x / pageWidth),
      );
      setCurrentIndexSafe(index);
      scheduleResumeAutoplay();
    },
    [clampIndex, scheduleResumeAutoplay, setCurrentIndexSafe],
  );

  const handleIndicatorPress = useCallback(
    (index: number) => {
      if (index === currentIndexRef.current) return;

      isUserInteractingRef.current = true;
      setIsAutoPlayingSafe(false);
      setCurrentIndexSafe(index);
      scrollToPage(index);

      if (resumeTimerRef.current) {
        clearTimeout(resumeTimerRef.current);
      }
      if (autoPlayInterval <= 0) return;

      resumeTimerRef.current = setTimeout(() => {
        isUserInteractingRef.current = false;
        setIsAutoPlayingSafe(true);
      }, 3000);
    },
    [autoPlayInterval, scrollToPage, setCurrentIndexSafe, setIsAutoPlayingSafe],
  );

  const renderItem = useCallback(
    ({ item, index }: { item: ProductGalleryItem; index: number }) => (
      <ProductDetailGallerySlide
        slideId={item.id}
        imageUrl={item.imageUrl}
        pageWidth={galleryWidth}
        onPress={() => openViewer(index)}
      />
    ),
    [galleryWidth, openViewer],
  );

  const keyExtractor = useCallback(
    (item: ProductGalleryItem, index: number) =>
      item.id || `gallery-slide-${index}`,
    [],
  );

  const getItemLayout = useCallback(
    (_: ArrayLike<ProductGalleryItem> | null | undefined, index: number) => ({
      length: galleryWidth,
      offset: galleryWidth * index,
      index,
    }),
    [galleryWidth],
  );

  const activeSlide = galleryItems[clampIndex(currentIndex)] ?? galleryItems[0];

  if (!canUseCarousel) {
    return (
      <View style={styles.container} onLayout={handleLayout}>
        {galleryWidth > 0 && activeSlide ? (
          <View
            style={[
              styles.page,
              { width: galleryWidth, height: GALLERY_HEIGHT },
            ]}
          >
            <ProductDetailGallerySlide
              slideId={activeSlide.id}
              imageUrl={activeSlide.imageUrl}
              pageWidth={galleryWidth}
              onPress={() => openViewer(clampIndex(currentIndex))}
            />
          </View>
        ) : null}
        <ProductImageViewer
          visible={viewerVisible}
          items={galleryItems}
          initialIndex={viewerIndex}
          onClose={closeViewer}
          onIndexChange={handleViewerIndexChange}
        />
      </View>
    );
  }

  return (
    <View style={styles.container} onLayout={handleLayout}>
      {galleryWidth > 0 ? (
        <FlatList
          key={`product-gallery-${galleryItemsKey}`}
          ref={flatListRef}
          data={galleryItems}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScrollBeginDrag={handleScrollBegin}
          onMomentumScrollEnd={handleScrollEnd}
          onScrollEndDrag={handleScrollEnd}
          scrollEventThrottle={16}
          bounces={false}
          decelerationRate="fast"
          nestedScrollEnabled
          getItemLayout={getItemLayout}
          style={{ width: galleryWidth, height: GALLERY_HEIGHT }}
        />
      ) : null}

      {showIndicators && galleryItems.length > 1 ? (
        <View style={styles.indicatorsContainer} pointerEvents="box-none">
          <View style={styles.indicatorsWrapper}>
            {galleryItems.map((_, index) => (
              <TouchableOpacity
                key={`gallery-indicator-${index}`}
                onPress={() => handleIndicatorPress(index)}
                activeOpacity={0.7}
                style={styles.indicatorButton}
              >
                <ProgressIndicator
                  index={index}
                  currentIndex={currentIndex}
                  autoPlayInterval={autoPlayInterval}
                  isPlaying={
                    isAutoPlaying && isScreenFocused && !viewerVisible
                  }
                  variant="product"
                />
              </TouchableOpacity>
            ))}
          </View>
        </View>
      ) : null}

      <ProductImageViewer
        visible={viewerVisible}
        items={galleryItems}
        initialIndex={viewerIndex}
        onClose={closeViewer}
        onIndexChange={handleViewerIndexChange}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: "100%",
    height: GALLERY_HEIGHT,
    alignSelf: "stretch",
  },
  page: {
    alignSelf: "stretch",
    justifyContent: "center",
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
    maxWidth: "100%",
    paddingHorizontal: 16,
  },
  indicatorButton: {},
});
