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
import { Gesture, GestureDetector, GestureHandlerRootView } from "react-native-gesture-handler";
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
const DOUBLE_TAP_SCALE = 2.5;

function hasRemoteUrl(url: string): boolean {
  return typeof url === "string" && url.trim().startsWith("http");
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
  const savedScale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const savedTranslateX = useSharedValue(0);
  const savedTranslateY = useSharedValue(0);

  const notifyZoom = useCallback(
    (nextScale: number) => {
      onZoomChange(nextScale > 1.01);
    },
    [onZoomChange],
  );

  const resetZoomValues = useCallback(() => {
    scale.value = 1;
    savedScale.value = 1;
    translateX.value = 0;
    translateY.value = 0;
    savedTranslateX.value = 0;
    savedTranslateY.value = 0;
  }, [
    savedScale,
    savedTranslateX,
    savedTranslateY,
    scale,
    translateX,
    translateY,
  ]);

  useEffect(() => {
    if (!isActive) {
      resetZoomValues();
      onZoomChange(false);
    }
  }, [isActive, onZoomChange, resetZoomValues]);

  const pinch = Gesture.Pinch()
    .onUpdate((event) => {
      scale.value = Math.min(
        MAX_SCALE,
        Math.max(MIN_SCALE, savedScale.value * event.scale),
      );
    })
    .onEnd(() => {
      if (scale.value <= 1.01) {
        scale.value = withTiming(1);
        savedScale.value = 1;
        translateX.value = withTiming(0);
        translateY.value = withTiming(0);
        savedTranslateX.value = 0;
        savedTranslateY.value = 0;
        runOnJS(notifyZoom)(1);
        return;
      }
      savedScale.value = scale.value;
      runOnJS(notifyZoom)(scale.value);
    });

  const pan = Gesture.Pan()
    .averageTouches(true)
    .manualActivation(true)
    .onTouchesMove((_, state) => {
      if (savedScale.value > 1.01) {
        state.activate();
      } else {
        state.fail();
      }
    })
    .onUpdate((event) => {
      translateX.value = savedTranslateX.value + event.translationX;
      translateY.value = savedTranslateY.value + event.translationY;
    })
    .onEnd(() => {
      savedTranslateX.value = translateX.value;
      savedTranslateY.value = translateY.value;
    });

  const doubleTap = Gesture.Tap()
    .numberOfTaps(2)
    .onEnd(() => {
      if (savedScale.value > 1.01) {
        scale.value = withTiming(1);
        savedScale.value = 1;
        translateX.value = withTiming(0);
        translateY.value = withTiming(0);
        savedTranslateX.value = 0;
        savedTranslateY.value = 0;
        runOnJS(notifyZoom)(1);
        return;
      }
      scale.value = withTiming(DOUBLE_TAP_SCALE);
      savedScale.value = DOUBLE_TAP_SCALE;
      runOnJS(notifyZoom)(DOUBLE_TAP_SCALE);
    });

  const composed = Gesture.Simultaneous(
    pinch,
    Gesture.Exclusive(doubleTap, pan),
  );

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
        <Animated.View style={[styles.imageWrap, animatedStyle]}>
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
    const safeIndex = Math.max(0, Math.min(initialIndex, items.length - 1));
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
          <View style={[styles.counter, { bottom: insets.bottom + 20 }]}>
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
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT * 0.75,
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
