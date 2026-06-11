import { Image } from "expo-image";
import React from "react";
import { Dimensions, StyleSheet, View } from "react-native";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
export const PRODUCT_SLIDER_HEIGHT = 282;

interface ProductImageSliderSlideProps {
  imageUrl: string;
}

const ProductImageSliderSlideComponent: React.FC<ProductImageSliderSlideProps> = ({
  imageUrl,
}) => (
  <View style={[styles.slide, { width: SCREEN_WIDTH }]}>
    <View style={[styles.imageWrapper, { height: PRODUCT_SLIDER_HEIGHT }]}>
      <Image
        source={{ uri: imageUrl }}
        style={styles.productImage}
        contentFit="cover"
        cachePolicy="memory-disk"
        recyclingKey={imageUrl}
        transition={120}
      />
      <View style={styles.gradientOverlay} />
      <View style={styles.textContainer} />
    </View>
  </View>
);

export const ProductImageSliderSlide = React.memo(
  ProductImageSliderSlideComponent,
  (prev, next) => prev.imageUrl === next.imageUrl,
);

const styles = StyleSheet.create({
  slide: {
    alignItems: "center",
    justifyContent: "center",
  },
  imageWrapper: {
    width: "100%",
    position: "relative",
  },
  productImage: {
    width: "93%",
    height: "95%",
    borderRadius: 24,
  },
  gradientOverlay: {
    position: "absolute",
    bottom: 0,
    left: 16,
    right: 16,
    height: 100,
    borderBottomRightRadius: 24,
    borderBottomLeftRadius: 24,
  },
  textContainer: {
    position: "absolute",
    bottom: 0,
    left: 16,
    right: 16,
    padding: 16,
    borderBottomRightRadius: 24,
    borderBottomLeftRadius: 24,
  },
});
