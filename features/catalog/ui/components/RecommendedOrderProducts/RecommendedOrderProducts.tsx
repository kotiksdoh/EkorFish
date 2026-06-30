import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { getSegmentPopularProducts } from "@/features/catalog/catalogSlice";
import { ProductCard } from "@/features/shared/ui/ProductCard";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import React, { useEffect, useMemo } from "react";
import {
  ActivityIndicator,
  Dimensions,
  StyleSheet,
  View,
} from "react-native";

const { width: screenWidth } = Dimensions.get("window");
const horizontalPadding = 16;
const columnGap = 8;
const cardWidth = (screenWidth - horizontalPadding * 2 - columnGap) / 2;

interface RecommendedOrderProductsProps {
  visible: boolean;
  onAddToCartPress: (product: any) => void;
  returnTo?: "home" | "heart" | "catalog" | "shop";
}

export function RecommendedOrderProducts({
  visible,
  onAddToCartPress,
  returnTo = "catalog",
}: RecommendedOrderProductsProps) {
  const dispatch = useAppDispatch();
  const me = useAppSelector((state) => state.auth.me);
  const products = useAppSelector(
    (state) => state.catalog.segmentPopularProducts,
  );
  const isLoading = useAppSelector(
    (state) => state.catalog.isLoadingSegmentPopularProducts,
  );

  useEffect(() => {
    if (!visible) return;

    dispatch(
      getSegmentPopularProducts({
        storageId: me?.storageId ? String(me.storageId) : undefined,
      }),
    );
  }, [dispatch, me?.storageId, visible]);

  const displayProducts = useMemo(() => products.slice(0, 4), [products]);

  if (!visible) {
    return null;
  }

  if (!isLoading && displayProducts.length === 0) {
    return null;
  }

  return (
    <ThemedView
      lightColor="#FFFFFF"
      darkColor="#151516"
      style={styles.container}
    >
      <ThemedText
        style={styles.title}
        lightColor="#1B1B1C"
        darkColor="#FBFCFF"
      >
        Рекомендуем заказать
      </ThemedText>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#203686" />
        </View>
      ) : (
        <View style={styles.grid}>
          {displayProducts.map((item, index) => (
            <View
              key={item.id ?? `recommended-${index}`}
              style={[styles.productWrapper, { width: cardWidth }]}
            >
              <ProductCard
                id={item.id as number}
                img={item.image}
                isFrozen={item.isFrozen}
                name={item.name}
                kgPrice={item.pricePerKg?.toLocaleString("ru-RU")}
                fullPrice={item.price?.toLocaleString("ru-RU")}
                isFavorite={item.isFavorite}
                productData={item}
                fullWidth
                returnTo={returnTo}
                onAddToCartPress={onAddToCartPress}
              />
            </View>
          ))}
        </View>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 10,
    paddingHorizontal: horizontalPadding,
    paddingTop: 16,
    paddingBottom: 16,
    borderRadius: 24,
    overflow: "hidden",
  },
  title: {
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 24,
  },
  loadingContainer: {
    minHeight: 200,
    alignItems: "center",
    justifyContent: "center",
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: columnGap,
    rowGap: 8,
  },
  productWrapper: {
    minWidth: 0,
  },
});
