import { useColorScheme } from "@/hooks/use-color-scheme";
import { Image } from "expo-image";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";

export const GALLERY_HEIGHT = 282;
const IMAGE_WIDTH_RATIO = 0.93;
const IMAGE_HEIGHT_RATIO = 0.95;
const PLACEHOLDER_IMAGE = require("@/assets/icons/png/noImage.png");

function hasValidImageUrl(url: string): boolean {
  if (!url || typeof url !== "string") return false;
  return url.length > 10 && !url.endsWith("/") && url.startsWith("http");
}

interface ProductDetailGallerySlideProps {
  imageUrl: string;
  pageWidth: number;
}

const ProductDetailGallerySlideComponent: React.FC<ProductDetailGallerySlideProps> = ({
  imageUrl,
  pageWidth,
}) => {
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === "dark";
  const [isImageLoading, setIsImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);

  const imageWidth = pageWidth * IMAGE_WIDTH_RATIO;
  const imageHeight = GALLERY_HEIGHT * IMAGE_HEIGHT_RATIO;
  const showPlaceholder = !hasValidImageUrl(imageUrl) || imageError;
  const imageSource = showPlaceholder ? PLACEHOLDER_IMAGE : { uri: imageUrl };

  useEffect(() => {
    setImageError(false);
    setIsImageLoading(!showPlaceholder);
  }, [imageUrl, showPlaceholder]);

  return (
    <View style={[styles.slide, { width: pageWidth, height: GALLERY_HEIGHT }]}>
      <View
        style={[
          styles.imageFrame,
          { width: imageWidth, height: imageHeight },
          isDarkMode ? styles.imageFrameDark : styles.imageFrameLight,
        ]}
      >
        <Image
          source={imageSource}
          style={styles.productImage}
          contentFit={showPlaceholder ? "contain" : "cover"}
          cachePolicy="memory-disk"
          recyclingKey={showPlaceholder ? "gallery-placeholder" : imageUrl}
          transition={showPlaceholder ? 0 : 120}
          onLoadStart={
            showPlaceholder ? undefined : () => setIsImageLoading(true)
          }
          onLoad={showPlaceholder ? undefined : () => setIsImageLoading(false)}
          onLoadEnd={showPlaceholder ? undefined : () => setIsImageLoading(false)}
          onError={
            showPlaceholder
              ? undefined
              : () => {
                  setImageError(true);
                  setIsImageLoading(false);
                }
          }
        />
        {!showPlaceholder && isImageLoading ? (
          <View
            style={[
              styles.loadingOverlay,
              isDarkMode ? styles.loadingOverlayDark : styles.loadingOverlayLight,
            ]}
          >
            <ActivityIndicator
              size="small"
              color={isDarkMode ? "#4C94FF" : "#203686"}
            />
          </View>
        ) : null}
        <View style={styles.gradientOverlay} />
      </View>
    </View>
  );
};

export const ProductDetailGallerySlide = React.memo(
  ProductDetailGallerySlideComponent,
  (prev, next) =>
    prev.imageUrl === next.imageUrl && prev.pageWidth === next.pageWidth,
);

const styles = StyleSheet.create({
  slide: {
    alignItems: "center",
    justifyContent: "center",
  },
  imageFrame: {
    position: "relative",
    overflow: "hidden",
    borderRadius: 24,
  },
  imageFrameLight: {
    backgroundColor: "#FFFFFF",
  },
  imageFrameDark: {
    backgroundColor: "#151516",
  },
  productImage: {
    width: "100%",
    height: "100%",
    borderRadius: 24,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 24,
  },
  loadingOverlayLight: {
    backgroundColor: "#FFFFFF",
  },
  loadingOverlayDark: {
    backgroundColor: "#151516",
  },
  gradientOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 100,
    borderBottomRightRadius: 24,
    borderBottomLeftRadius: 24,
  },
});
