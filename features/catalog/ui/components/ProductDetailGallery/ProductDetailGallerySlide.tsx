import { useColorScheme } from "@/hooks/use-color-scheme";
import { Image } from "expo-image";
import React, { useEffect, useRef, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";

export const GALLERY_HEIGHT = 282;
const PLACEHOLDER_IMAGE = require("@/assets/icons/png/noImage.png");

function hasGalleryImageUrl(url: string): boolean {
  if (!url || typeof url !== "string") return false;
  const trimmed = url.trim();
  return trimmed.length > 0 && trimmed.startsWith("http");
}

interface ProductDetailGallerySlideProps {
  slideId: string;
  imageUrl: string;
  pageWidth: number;
  onPress?: () => void;
}

const ProductDetailGallerySlideComponent: React.FC<ProductDetailGallerySlideProps> = ({
  slideId,
  imageUrl,
  pageWidth,
  onPress,
}) => {
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === "dark";
  const [imageError, setImageError] = useState(false);
  const isMountedRef = useRef(true);

  const hasRemoteImage = hasGalleryImageUrl(imageUrl) && !imageError;
  const imageSource = hasRemoteImage ? { uri: imageUrl } : PLACEHOLDER_IMAGE;

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    setImageError(false);
  }, [imageUrl]);

  return (
    <Pressable
      style={[styles.slide, { width: pageWidth, height: GALLERY_HEIGHT }]}
      onPress={onPress}
      disabled={!onPress || !hasRemoteImage}
    >
      <View
        style={[
          styles.imageFrame,
          isDarkMode ? styles.imageFrameDark : styles.imageFrameLight,
        ]}
      >
        <Image
          source={imageSource}
          style={styles.productImage}
          contentFit={hasRemoteImage ? "cover" : "contain"}
          cachePolicy="memory-disk"
          recyclingKey={`gallery-${slideId}`}
          transition={0}
          onError={() => {
            if (isMountedRef.current) {
              setImageError(true);
            }
          }}
        />
      </View>
    </Pressable>
  );
};

export const ProductDetailGallerySlide = React.memo(
  ProductDetailGallerySlideComponent,
  (prev, next) =>
    prev.slideId === next.slideId &&
    prev.imageUrl === next.imageUrl &&
    prev.pageWidth === next.pageWidth &&
    prev.onPress === next.onPress,
);

const styles = StyleSheet.create({
  slide: {
    alignSelf: "stretch",
  },
  imageFrame: {
    width: "100%",
    height: "100%",
    position: "relative",
    overflow: "hidden",
    borderRadius: 24,
  },
  imageFrameLight: {
    backgroundColor: "#F5F5F5",
  },
  imageFrameDark: {
    backgroundColor: "#2E2E32",
  },
  productImage: {
    width: "100%",
    height: "100%",
    borderRadius: 24,
  },
});
