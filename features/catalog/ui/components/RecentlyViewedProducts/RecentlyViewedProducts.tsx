import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import {
  loadRecentlyViewedProducts,
  type RecentlyViewedProduct,
} from "@/features/catalog/recentlyViewedStorage";
import { ProductCard } from "@/features/shared/ui/ProductCard";
import { useFocusEffect } from "@react-navigation/native";
import React, { useCallback, useState } from "react";
import { Dimensions, StyleSheet, View } from "react-native";

const { width: screenWidth } = Dimensions.get("window");
const horizontalPadding = 16;
const columnGap = 8;
const cardWidth = (screenWidth - horizontalPadding * 2 - columnGap) / 2;

interface RecentlyViewedProductsProps {
  onAddToCartPress: (product: RecentlyViewedProduct) => void;
}

export function RecentlyViewedProducts({
  onAddToCartPress,
}: RecentlyViewedProductsProps) {
  const [products, setProducts] = useState<RecentlyViewedProduct[]>([]);

  useFocusEffect(
    useCallback(() => {
      let isActive = true;

      void loadRecentlyViewedProducts().then((items) => {
        if (isActive) {
          setProducts(items);
        }
      });

      return () => {
        isActive = false;
      };
    }, []),
  );

  if (!products.length) {
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
        Вы смотрели недавно
      </ThemedText>

      <View style={styles.grid}>
        {products.map((item, index) => (
          <View
            key={item.id ?? `recent-${index}`}
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
              returnTo="shop"
              onAddToCartPress={onAddToCartPress}
            />
          </View>
        ))}
      </View>
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
    marginBottom: 12,
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
