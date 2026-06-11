import { Image } from "expo-image";
import React from "react";
import { StyleSheet, View } from "react-native";

export const GALLERY_HEIGHT = 282;
const IMAGE_WIDTH_RATIO = 0.93;
const IMAGE_HEIGHT_RATIO = 0.95;

interface ProductDetailGallerySlideProps {
  imageUrl: string;
  pageWidth: number;
}

const ProductDetailGallerySlideComponent: React.FC<ProductDetailGallerySlideProps> = ({
  imageUrl,
  pageWidth,
}) => {
  const imageWidth = pageWidth * IMAGE_WIDTH_RATIO;
  const imageHeight = GALLERY_HEIGHT * IMAGE_HEIGHT_RATIO;

  return (
    <View style={[styles.slide, { width: pageWidth, height: GALLERY_HEIGHT }]}>
      <View style={[styles.imageFrame, { width: imageWidth, height: imageHeight }]}>
        <Image
          source={{ uri: imageUrl }}
          style={styles.productImage}
          contentFit="cover"
          cachePolicy="memory-disk"
          recyclingKey={imageUrl}
          transition={120}
        />
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
  productImage: {
    width: "100%",
    height: "100%",
    borderRadius: 24,
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
