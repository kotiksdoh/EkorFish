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

const PLACEHOLDER_GALLERY_ITEMS = [
  { id: "gallery-placeholder", imageUrl: "" },
] as const;

export const ProductDetailGallery: React.FC<ProductDetailGalleryProps> = ({
  items,
  autoPlayInterval = 4000,
  showIndicators = true,
  isActive = true,
}) => {
  const galleryItems = React.useMemo(
    () => (items.length > 0 ? items : [...PLACEHOLDER_GALLERY_ITEMS]),
    [items],
  );

  const galleryItemsKey = React.useMemo(
    () => galleryItems.map((item) => item.id).join("|"),
    [galleryItems],
  );

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(autoPlayInterval > 0);
  const [galleryWidth, setGalleryWidth] = useState(0);
  const isScreenFocused = useIsFocused();

  const pagerRef = useRef<PagerView>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const resumeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isUserInteractingRef = useRef(false);
  const currentIndexRef = useRef(0);
  const itemsKeyRef = useRef("");
  const galleryWidthRef = useRef(0);
  const isMountedRef = useRef(true);

  currentIndexRef.current = currentIndex;
  galleryWidthRef.current = galleryWidth;

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

  const canUsePager = isActive && isScreenFocused;

  const goToPage = useCallback(
    (index: number) => {
      if (!isMountedRef.current || !isActive || !isScreenFocused) return;
      const safeIndex = clampIndex(index);
      pagerRef.current?.setPage(safeIndex);
    },
    [clampIndex, isActive, isScreenFocused],
  );

  const goToNextSlide = useCallback(() => {
    if (
      autoPlayInterval <= 0 ||
      galleryItems.length <= 1 ||
      isUserInteractingRef.current ||
      !canUsePager
    ) {
      return;
    }
    const nextIndex =
      currentIndexRef.current < galleryItems.length - 1
        ? currentIndexRef.current + 1
        : 0;
    setCurrentIndexSafe(nextIndex);
    goToPage(nextIndex);
  }, [
    autoPlayInterval,
    goToPage,
    canUsePager,
    galleryItems.length,
    setCurrentIndexSafe,
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
    if (!isActive || !isScreenFocused) {
      isUserInteractingRef.current = false;
      clearAutoplayTimer();
      if (resumeTimerRef.current) {
        clearTimeout(resumeTimerRef.current);
        resumeTimerRef.current = null;
      }
    }
  }, [clearAutoplayTimer, isActive, isScreenFocused]);

  useEffect(() => {
    clearAutoplayTimer();
    if (
      autoPlayInterval > 0 &&
      isAutoPlaying &&
      canUsePager &&
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
    canUsePager,
    galleryItems.length,
  ]);

  useEffect(() => {
    if (galleryItemsKey === itemsKeyRef.current) return;

    itemsKeyRef.current = galleryItemsKey;
    setCurrentIndexSafe(0);
    isUserInteractingRef.current = false;
    setIsAutoPlayingSafe(autoPlayInterval > 0);
    requestAnimationFrame(() => {
      if (!isMountedRef.current || !isActive || !isScreenFocused) return;
      pagerRef.current?.setPageWithoutAnimation(0);
    });
  }, [
    autoPlayInterval,
    galleryItemsKey,
    isActive,
    isScreenFocused,
    setCurrentIndexSafe,
    setIsAutoPlayingSafe,
  ]);

  const handlePageScrollStateChanged = useCallback(
    (state: "idle" | "dragging" | "settling") => {
      if (state === "dragging") {
        if (resumeTimerRef.current) {
          clearTimeout(resumeTimerRef.current);
          resumeTimerRef.current = null;
        }
        isUserInteractingRef.current = true;
        setIsAutoPlayingSafe(false);
        clearAutoplayTimer();
        return;
      }

      if (state === "idle") {
        scheduleResumeAutoplay();
      }
    },
    [clearAutoplayTimer, scheduleResumeAutoplay, setIsAutoPlayingSafe],
  );

  const handlePageSelected = useCallback(
    (event: PagerViewOnPageSelectedEvent) => {
      const index = clampIndex(event.nativeEvent.position);
      setCurrentIndexSafe(index);
    },
    [clampIndex, setCurrentIndexSafe],
  );

  const handleIndicatorPress = useCallback(
    (index: number) => {
      if (index === currentIndexRef.current) return;

      isUserInteractingRef.current = true;
      setIsAutoPlayingSafe(false);
      setCurrentIndexSafe(index);
      goToPage(index);

      if (resumeTimerRef.current) {
        clearTimeout(resumeTimerRef.current);
      }
      if (autoPlayInterval <= 0) return;

      resumeTimerRef.current = setTimeout(() => {
        isUserInteractingRef.current = false;
        setIsAutoPlayingSafe(true);
      }, 3000);
    },
    [autoPlayInterval, goToPage, setCurrentIndexSafe, setIsAutoPlayingSafe],
  );

  const activeSlide = galleryItems[clampIndex(currentIndex)] ?? galleryItems[0];

  if (!canUsePager) {
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
            />
          </View>
        ) : null}
      </View>
    );
  }

  return (
    <View style={styles.container} onLayout={handleLayout}>
      {galleryWidth > 0 ? (
        <PagerView
          key={`product-gallery-${galleryItemsKey}`}
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
                slideId={item.id}
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
