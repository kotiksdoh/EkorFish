import { CloseIcon } from "@/assets/icons/icons";
import { AppModal } from "@/features/shared/ui/AppModal";
import { Image } from "expo-image";
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
import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
} from "react-native-gesture-handler";
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ProductGalleryItem } from "./productDetailGalleryTypes";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");
const PLACEHOLDER_IMAGE = require("@/assets/icons/png/noImage.png");

const MIN_SCALE = 1;
const MAX_SCALE = 4;
const ZOOM_EPS = 1.02;
const DOUBLE_TAP_SCALE = 2;
const IMAGE_WIDTH = SCREEN_WIDTH;
const IMAGE_HEIGHT = SCREEN_HEIGHT * 0.75;

function hasRemoteUrl(url: string): boolean {
  return typeof url === "string" && url.trim().startsWith("http");
}

function clamp(value: number, min: number, max: number) {
  "worklet";
  return Math.min(max, Math.max(min, value));
}

function clampTranslation(tx: number, ty: number, scale: number) {
  "worklet";
  const maxX = Math.max(0, (IMAGE_WIDTH * (scale - 1)) / 2);
  const maxY = Math.max(0, (IMAGE_HEIGHT * (scale - 1)) / 2);
  return {
    x: clamp(tx, -maxX, maxX),
    y: clamp(ty, -maxY, maxY),
  };
}

interface ZoomableImageProps {
  imageUrl: string;
  slideId: string;
  isActive: boolean;
  onZoomChange: (isZoomed: boolean) => void;
}

const ZoomableImage: React.FC<ZoomableImageProps> = ({
  imageUrl,
  slideId,
  isActive,
  onZoomChange,
}) => {
  const remote = hasRemoteUrl(imageUrl);

  const scale = useSharedValue(1);
  const startScale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const startTranslateX = useSharedValue(0);
  const startTranslateY = useSharedValue(0);
  const isZoomedSV = useSharedValue(false);

  const syncZoomedFlag = useCallback(
    (zoomed: boolean) => {
      onZoomChange(zoomed);
    },
    [onZoomChange],
  );

  const setZoomedIfNeeded = (zoomed: boolean) => {
    "worklet";
    if (isZoomedSV.value === zoomed) return;
    isZoomedSV.value = zoomed;
    runOnJS(syncZoomedFlag)(zoomed);
  };

  const resetTransform = (animated: boolean) => {
    "worklet";
    if (animated) {
      scale.value = withTiming(1);
      translateX.value = withTiming(0);
      translateY.value = withTiming(0);
    } else {
      scale.value = 1;
      translateX.value = 0;
      translateY.value = 0;
    }
    startScale.value = 1;
    startTranslateX.value = 0;
    startTranslateY.value = 0;
    setZoomedIfNeeded(false);
  };

  useEffect(() => {
    if (!isActive) {
      scale.value = 1;
      startScale.value = 1;
      translateX.value = 0;
      translateY.value = 0;
      startTranslateX.value = 0;
      startTranslateY.value = 0;
      if (isZoomedSV.value) {
        isZoomedSV.value = false;
        onZoomChange(false);
      }
    }
  }, [
    isActive,
    isZoomedSV,
    onZoomChange,
    scale,
    startScale,
    startTranslateX,
    startTranslateY,
    translateX,
    translateY,
  ]);

  const pinch = Gesture.Pinch()
    .onBegin(() => {
      // База всегда с текущего scale — иначе скачки к MAX
      startScale.value = scale.value;
      startTranslateX.value = translateX.value;
      startTranslateY.value = translateY.value;
    })
    .onUpdate((event) => {
      const nextScale = clamp(
        startScale.value * event.scale,
        MIN_SCALE,
        MAX_SCALE,
      );
      scale.value = nextScale;

      const clamped = clampTranslation(
        translateX.value,
        translateY.value,
        nextScale,
      );
      translateX.value = clamped.x;
      translateY.value = clamped.y;

      setZoomedIfNeeded(nextScale > ZOOM_EPS);
    })
    .onEnd(() => {
      if (scale.value <= ZOOM_EPS) {
        resetTransform(true);
        return;
      }
      startScale.value = scale.value;
      const clamped = clampTranslation(
        translateX.value,
        translateY.value,
        scale.value,
      );
      translateX.value = clamped.x;
      translateY.value = clamped.y;
      startTranslateX.value = clamped.x;
      startTranslateY.value = clamped.y;
      setZoomedIfNeeded(true);
    });

  const pan = Gesture.Pan()
    .maxPointers(1)
    .averageTouches(true)
    // Не перехватываем свайп листа, пока нет зума.
    // Важно смотреть на scale (не «сохранённый»), иначе pan «оживает» только после лишнего жеста.
    .manualActivation(true)
    .onTouchesMove((_, state) => {
      if (scale.value > ZOOM_EPS) {
        state.activate();
      } else {
        state.fail();
      }
    })
    .onBegin(() => {
      startTranslateX.value = translateX.value;
      startTranslateY.value = translateY.value;
    })
    .onUpdate((event) => {
      if (scale.value <= ZOOM_EPS) return;
      const next = clampTranslation(
        startTranslateX.value + event.translationX,
        startTranslateY.value + event.translationY,
        scale.value,
      );
      translateX.value = next.x;
      translateY.value = next.y;
    })
    .onEnd(() => {
      startTranslateX.value = translateX.value;
      startTranslateY.value = translateY.value;
    });

  const doubleTap = Gesture.Tap()
    .numberOfTaps(2)
    .maxDuration(250)
    .onEnd(() => {
      if (scale.value > ZOOM_EPS) {
        resetTransform(true);
        return;
      }
      scale.value = withTiming(DOUBLE_TAP_SCALE);
      startScale.value = DOUBLE_TAP_SCALE;
      translateX.value = withTiming(0);
      translateY.value = withTiming(0);
      startTranslateX.value = 0;
      startTranslateY.value = 0;
      setZoomedIfNeeded(true);
    });

  // Simultaneous: pan НЕ ждёт fail double-tap (Exclusive ломал сдвиг одним пальцем)
  const composed = Gesture.Simultaneous(pinch, pan, doubleTap);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
  }));

  return (
    <View style={styles.page}>
      <GestureDetector gesture={composed}>
        <Animated.View collapsable={false} style={[styles.imageWrap, animatedStyle]}>
          <Image
            source={remote ? { uri: imageUrl } : PLACEHOLDER_IMAGE}
            style={styles.image}
            contentFit="contain"
            cachePolicy="memory-disk"
            recyclingKey={`viewer-${slideId}`}
            transition={0}
          />
        </Animated.View>
      </GestureDetector>
    </View>
  );
};

interface ProductImageViewerProps {
  visible: boolean;
  items: ProductGalleryItem[];
  initialIndex?: number;
  onClose: () => void;
  onIndexChange?: (index: number) => void;
}

export const ProductImageViewer: React.FC<ProductImageViewerProps> = ({
  visible,
  items,
  initialIndex = 0,
  onClose,
  onIndexChange,
}) => {
  const insets = useSafeAreaInsets();
  const listRef = useRef<FlatList<ProductGalleryItem>>(null);
  const [index, setIndex] = useState(initialIndex);
  const [isZoomed, setIsZoomed] = useState(false);
  const indexRef = useRef(initialIndex);

  useEffect(() => {
    if (!visible) {
      setIsZoomed(false);
      return;
    }
    const safeIndex = Math.max(0, Math.min(initialIndex, Math.max(items.length - 1, 0)));
    setIndex(safeIndex);
    indexRef.current = safeIndex;
    setIsZoomed(false);
    requestAnimationFrame(() => {
      listRef.current?.scrollToOffset({
        offset: SCREEN_WIDTH * safeIndex,
        animated: false,
      });
    });
  }, [visible, initialIndex, items.length]);

  const handleScrollEnd = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const pageWidth =
        event.nativeEvent.layoutMeasurement.width || SCREEN_WIDTH;
      if (pageWidth <= 0) return;
      const next = Math.max(
        0,
        Math.min(
          Math.round(event.nativeEvent.contentOffset.x / pageWidth),
          items.length - 1,
        ),
      );
      if (next !== indexRef.current) {
        indexRef.current = next;
        setIndex(next);
        setIsZoomed(false);
        onIndexChange?.(next);
      }
    },
    [items.length, onIndexChange],
  );

  const handleZoomChange = useCallback((zoomed: boolean) => {
    setIsZoomed(zoomed);
  }, []);

  const renderItem = useCallback(
    ({ item, index: itemIndex }: { item: ProductGalleryItem; index: number }) => (
      <ZoomableImage
        imageUrl={item.imageUrl}
        slideId={item.id}
        isActive={itemIndex === index}
        onZoomChange={handleZoomChange}
      />
    ),
    [handleZoomChange, index],
  );

  const getItemLayout = useCallback(
    (_: ArrayLike<ProductGalleryItem> | null | undefined, itemIndex: number) => ({
      length: SCREEN_WIDTH,
      offset: SCREEN_WIDTH * itemIndex,
      index: itemIndex,
    }),
    [],
  );

  return (
    <AppModal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <GestureHandlerRootView style={styles.backdrop}>
        <TouchableOpacity
          style={[styles.closeButton, { top: insets.top + 8 }]}
          onPress={onClose}
          activeOpacity={0.7}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <CloseIcon fill="#FFFFFF" />
        </TouchableOpacity>

        <FlatList
          ref={listRef}
          data={items}
          horizontal
          pagingEnabled
          scrollEnabled={!isZoomed}
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item, i) => item.id || `viewer-${i}`}
          renderItem={renderItem}
          getItemLayout={getItemLayout}
          onMomentumScrollEnd={handleScrollEnd}
          onScrollEndDrag={handleScrollEnd}
          bounces={false}
          decelerationRate="fast"
          initialNumToRender={1}
          windowSize={3}
          style={styles.list}
        />

        {items.length > 1 ? (
          <View
            pointerEvents="none"
            style={[styles.counter, { bottom: insets.bottom + 20 }]}
          >
            <View style={styles.dots}>
              {items.map((item, i) => (
                <View
                  key={item.id || `dot-${i}`}
                  style={[styles.dot, i === index && styles.dotActive]}
                />
              ))}
            </View>
          </View>
        ) : null}
      </GestureHandlerRootView>
    </AppModal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "#000000",
    justifyContent: "center",
  },
  closeButton: {
    position: "absolute",
    right: 16,
    zIndex: 2,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  list: {
    flexGrow: 0,
  },
  page: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  imageWrap: {
    width: IMAGE_WIDTH,
    height: IMAGE_HEIGHT,
    justifyContent: "center",
    alignItems: "center",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  counter: {
    position: "absolute",
    left: 0,
    right: 0,
    alignItems: "center",
  },
  dots: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "rgba(255,255,255,0.35)",
  },
  dotActive: {
    backgroundColor: "#FFFFFF",
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});
