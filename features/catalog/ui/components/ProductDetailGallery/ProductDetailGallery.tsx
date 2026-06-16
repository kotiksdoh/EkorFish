import { ProgressIndicator } from "@/features/home/ui/components/AutoSlider/ProgressIndicator";
import { useIsFocused } from "@react-navigation/native";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  LayoutChangeEvent,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import PagerView, {
  PagerViewOnPageSelectedEvent,
} from "react-native-pager-view";
import {
  GALLERY_HEIGHT,
  ProductDetailGallerySlide,
} from "./ProductDetailGallerySlide";
import {
  ProductDetailGalleryProps,
} from "./productDetailGalleryTypes";

export type { ProductGalleryItem } from "./productDetailGalleryTypes";

export const ProductDetailGallery: React.FC<ProductDetailGalleryProps> = ({
  items,
  autoPlayInterval = 4000,
  showIndicators = true,
}) => {
  const galleryItems =
    items.length > 0
      ? items
      : [{ id: "gallery-placeholder", imageUrl: "" }];

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [galleryWidth, setGalleryWidth] = useState(0);
  const isScreenFocused = useIsFocused();

  const pagerRef = useRef<PagerView>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const resumeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isUserInteractingRef = useRef(false);
  const currentIndexRef = useRef(0);
  const itemsKeyRef = useRef("");
  const galleryWidthRef = useRef(0);

  currentIndexRef.current = currentIndex;
  galleryWidthRef.current = galleryWidth;

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
    if (resumeTimerRef.current) {
      clearTimeout(resumeTimerRef.current);
    }
    resumeTimerRef.current = setTimeout(() => {
      isUserInteractingRef.current = false;
      setIsAutoPlaying(true);
    }, 2000);
  }, []);

  const goToPage = useCallback(
    (index: number) => {
      const safeIndex = clampIndex(index);
      pagerRef.current?.setPage(safeIndex);
    },
    [clampIndex],
  );

  const goToNextSlide = useCallback(() => {
    if (galleryItems.length <= 1 || isUserInteractingRef.current || !isScreenFocused) {
      return;
    }
    const nextIndex =
      currentIndexRef.current < galleryItems.length - 1
        ? currentIndexRef.current + 1
        : 0;
    setCurrentIndex(nextIndex);
    goToPage(nextIndex);
  }, [goToPage, isScreenFocused, galleryItems.length]);

  const handleLayout = useCallback((event: LayoutChangeEvent) => {
    const nextWidth = Math.round(event.nativeEvent.layout.width);
    if (nextWidth > 0 && nextWidth !== galleryWidthRef.current) {
      setGalleryWidth(nextWidth);
    }
  }, []);

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
    isScreenFocused,
    galleryItems.length,
  ]);

  useEffect(
    () => () => {
      if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current);
    },
    [],
  );

  useEffect(() => {
    const nextItemsKey = galleryItems.map((item) => item.id).join("|");
    if (nextItemsKey === itemsKeyRef.current) return;

    itemsKeyRef.current = nextItemsKey;
    setCurrentIndex(0);
    isUserInteractingRef.current = false;
    setIsAutoPlaying(true);
    requestAnimationFrame(() => {
      pagerRef.current?.setPageWithoutAnimation(0);
    });
  }, [galleryItems]);

  const handlePageScrollStateChanged = useCallback(
    (state: "idle" | "dragging" | "settling") => {
      if (state === "dragging") {
        if (resumeTimerRef.current) {
          clearTimeout(resumeTimerRef.current);
          resumeTimerRef.current = null;
        }
        isUserInteractingRef.current = true;
        setIsAutoPlaying(false);
        clearAutoplayTimer();
        return;
      }

      if (state === "idle") {
        scheduleResumeAutoplay();
      }
    },
    [clearAutoplayTimer, scheduleResumeAutoplay],
  );

  const handlePageSelected = useCallback(
    (event: PagerViewOnPageSelectedEvent) => {
      const index = clampIndex(event.nativeEvent.position);
      setCurrentIndex(index);
    },
    [clampIndex],
  );

  const handleIndicatorPress = useCallback(
    (index: number) => {
      if (index === currentIndexRef.current) return;

      isUserInteractingRef.current = true;
      setIsAutoPlaying(false);
      setCurrentIndex(index);
      goToPage(index);

      if (resumeTimerRef.current) {
        clearTimeout(resumeTimerRef.current);
      }
      resumeTimerRef.current = setTimeout(() => {
        isUserInteractingRef.current = false;
        setIsAutoPlaying(true);
      }, 3000);
    },
    [goToPage],
  );

  return (
    <View style={styles.container} onLayout={handleLayout}>
      {galleryWidth > 0 ? (
        <PagerView
          ref={pagerRef}
          style={[styles.pager, { width: galleryWidth, height: GALLERY_HEIGHT }]}
          initialPage={0}
          offscreenPageLimit={1}
          overdrag={false}
          onPageScrollStateChanged={(event) =>
            handlePageScrollStateChanged(event.nativeEvent.pageScrollState)
          }
          onPageSelected={handlePageSelected}
        >
          {galleryItems.map((item) => (
            <View
              key={item.id}
              style={[styles.page, { width: galleryWidth, height: GALLERY_HEIGHT }]}
            >
              <ProductDetailGallerySlide
                imageUrl={item.imageUrl}
                pageWidth={galleryWidth}
              />
            </View>
          ))}
        </PagerView>
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
    width: "100%",
    height: GALLERY_HEIGHT,
    alignSelf: "stretch",
  },
  pager: {
    flex: 1,
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
