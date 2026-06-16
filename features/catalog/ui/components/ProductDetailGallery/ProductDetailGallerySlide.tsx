import { useColorScheme } from "@/hooks/use-color-scheme";
import { Image } from "expo-image";
import React, { useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";

export const GALLERY_HEIGHT = 282;
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
  const [imageError, setImageError] = useState(false);

  const showPlaceholder = !hasValidImageUrl(imageUrl) || imageError;
  const imageSource = showPlaceholder ? PLACEHOLDER_IMAGE : { uri: imageUrl };

  useEffect(() => {
    setImageError(false);
  }, [imageUrl]);

  return (
    <View style={[styles.slide, { width: pageWidth, height: GALLERY_HEIGHT }]}>
      <View
        style={[
          styles.imageFrame,
          isDarkMode ? styles.imageFrameDark : styles.imageFrameLight,
        ]}
      >
        <Image
          source={imageSource}
          style={styles.productImage}
          contentFit={showPlaceholder ? "contain" : "cover"}
          cachePolicy="memory-disk"
          recyclingKey={showPlaceholder ? "gallery-placeholder" : imageUrl}
          transition={0}
          onError={() => setImageError(true)}
        />
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
