import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { ProductCard } from "@/features/shared/ui/ProductCard";
import { useAppSelector } from "@/store/hooks";
import React, { useMemo } from "react";
import {
  ActivityIndicator,
  Dimensions,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";

const { width: screenWidth } = Dimensions.get("window");
const cardWidth = (screenWidth - 32 - 8) / 2;

interface SimilarProductsProps {
  title?: string;
  handleAddToCartPress: (product: any) => void;
  returnTo?: "home" | "heart" | "catalog" | "shop";
  variant?: "similar" | "segmentPopular";
}

function SimilarProductsComponent({
  title = "Похожие товары",
  handleAddToCartPress,
  returnTo = "catalog",
  variant = "similar",
}: SimilarProductsProps) {
  const similarProducts = useAppSelector((state) =>
    variant === "segmentPopular"
      ? state.catalog.segmentPopularProducts
      : state.catalog.similarProducts,
  );
  const isLoadingSimilarProducts = useAppSelector((state) =>
    variant === "segmentPopular"
      ? state.catalog.isLoadingSegmentPopularProducts
      : state.catalog.isLoadingSimilarProducts,
  );

  const hasProducts = useMemo(
    () => similarProducts.length > 0,
    [similarProducts.length],
  );

  if (!isLoadingSimilarProducts && !hasProducts) {
    return null;
  }

  return (
    <ThemedView
      lightColor="#FFFFFF"
      darkColor="#040508"
      style={styles.container}
    >
      <ThemedText
        style={styles.title}
        lightColor="#1B1B1C"
        darkColor="#FBFCFF"
      >
        {title}
      </ThemedText>

      {isLoadingSimilarProducts ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#203686" />
        </View>
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
        >
          {similarProducts.map((item, index) => (
            <View
              key={item.id ?? `similar-${index}`}
              style={[styles.productWrapper, { width: cardWidth }]}
            >
              <ProductCard
                id={item.id}
                img={item.image}
                isFrozen={item.isFrozen}
                name={item.name}
                kgPrice={item.pricePerKg?.toLocaleString("ru-RU")}
                fullPrice={item.price?.toLocaleString("ru-RU")}
                isFavorite={item.isFavorite}
                productData={item}
                fullWidth
                returnTo={returnTo}
                onAddToCartPress={handleAddToCartPress}
              />
            </View>
          ))}
        </ScrollView>
      )}
    </ThemedView>
  );
}

export default React.memo(SimilarProductsComponent);

const styles = StyleSheet.create({
  container: {
    flexDirection: "column",
    alignItems: "flex-start",
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderRadius: 24,
    marginTop: 8,
    marginHorizontal: 0,
    overflow: "hidden",
  },
  title: {
    alignSelf: "flex-start",
    marginBottom: 24,
    fontWeight: "600",
    fontSize: 20,
    lineHeight: 24,
    fontFamily: "Montserrat",
  },
  loadingContainer: {
    height: 200,
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
    marginBottom: 24,
  },
  scrollView: {
    width: "100%",
  },
  scrollContent: {
    paddingRight: 16,
    gap: 8,
  },
  productWrapper: {
    minWidth: 0,
  },
});
