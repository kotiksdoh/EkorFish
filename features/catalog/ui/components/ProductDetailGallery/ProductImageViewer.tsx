import { CloseIcon } from "@/assets/icons/icons";
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
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AppModal } from "@/features/shared/ui/AppModal";
import { ProductGalleryItem } from "./productDetailGalleryTypes";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");
const PLACEHOLDER_IMAGE = require("@/assets/icons/png/noImage.png");

function hasRemoteUrl(url: string): boolean {
  return typeof url === "string" && url.trim().startsWith("http");
}

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
  const indexRef = useRef(initialIndex);

  useEffect(() => {
    if (!visible) return;
    const safeIndex = Math.max(0, Math.min(initialIndex, items.length - 1));
    setIndex(safeIndex);
    indexRef.current = safeIndex;
    requestAnimationFrame(() => {
      listRef.current?.scrollToOffset({
        offset: SCREEN_WIDTH * safeIndex,
        animated: false,
      });
    });
  }, [visible, initialIndex, items.length]);

  const handleScrollEnd = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const pageWidth = event.nativeEvent.layoutMeasurement.width || SCREEN_WIDTH;
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
        onIndexChange?.(next);
      }
    },
    [items.length, onIndexChange],
  );

  const renderItem = useCallback(
    ({ item }: { item: ProductGalleryItem }) => {
      const remote = hasRemoteUrl(item.imageUrl);
      return (
        <View style={styles.page}>
          <Image
            source={remote ? { uri: item.imageUrl } : PLACEHOLDER_IMAGE}
            style={styles.image}
            contentFit="contain"
            cachePolicy="memory-disk"
            recyclingKey={`viewer-${item.id}`}
            transition={0}
          />
        </View>
      );
    },
    [],
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
      <View style={styles.backdrop}>
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
      </View>
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
  },
  image: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT * 0.75,
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
