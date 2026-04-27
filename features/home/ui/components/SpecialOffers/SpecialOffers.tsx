// features/shared/ui/SpecialOffers.tsx
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { AddToCart, getProductList } from "@/features/catalog/catalogSlice";
import { ProductCard } from "@/features/shared/ui/ProductCard";
import { PrimaryButton } from "@/features/shared/ui/components/PrimartyButton";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  ScrollView,
  StyleSheet,
  View
} from "react-native";

const { width: screenWidth } = Dimensions.get("window");
const cardWidth = (screenWidth - 32 - 8) / 2; // 32 = paddingHorizontal 16 с двух сторон, 8 = gap
interface SpecialOffersProps {
  handleAddToCartPress: (product: any) => void;
  onShowAllPress?: () => void;
}

function SpecialOffersComponent({
  handleAddToCartPress,
  onShowAllPress,
}: SpecialOffersProps) {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const me = useAppSelector((state) => state.auth.me);
  const products = useAppSelector((state) => state.catalog.products);
  const isLoading = useAppSelector((state) => state.catalog.isLoading);


  // Загрузка промо-товаров
  useEffect(() => {
    const params = {
      isPromo: true,
      offset: 0,
      count: 10,
      storageId: me?.storageId,
      isFavorite: false,
    };

    dispatch(
      getProductList({
        params,
        isLoadMore: false,
      })
    );
  }, [dispatch, me?.storageId]);

  // Берем первые 5 промо-товаров
  const promoProducts = products.slice(0, 5);

  const handleShowAll = () => {
    onShowAllPress?.();
    router.push(
      `dashboard/${encodeURIComponent("promo")}?catalogId=${" "}&catalogName=${encodeURIComponent("Акции")}&isPromo=true`
    );
  };

  if (!isLoading && promoProducts.length === 0) {
    return null;
  }

  

  return (
    <>
    <ThemedView lightColor="#FFFFFF" style={styles.container}>
      <ThemedText style={styles.title}>
        Специальные предложения
      </ThemedText>

      {isLoading ? (
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
          {promoProducts.map((item) => (
            <View key={item.id} style={[styles.productWrapper, { width: cardWidth }]}>
              <ProductCard
                id={item.id}
                img={item.image}
                isFrozen={item.isFrozen}
                name={item.name}
                kgPrice={item.pricePerKg?.toLocaleString("ru-RU")}
                fullPrice={item.price?.toLocaleString("ru-RU")}
                isFavorite={item.isFavorite}
                productData={item}
                fullWidth={true}
                onAddToCartPress={handleAddToCartPress}

              />
            </View>
          ))}
        </ScrollView>
      )}

      <PrimaryButton
        title="Все предложения"
        onPress={handleShowAll}
        variant="third"
        size="md"
        loading={false}
        activeOpacity={0.8}
        fullWidth
      />

    </ThemedView>

    </>
  );
}

export default React.memo(SpecialOffersComponent, (prevProps, nextProps) => {
  return (
    prevProps.handleAddToCartPress === nextProps.handleAddToCartPress &&
    prevProps.onShowAllPress === nextProps.onShowAllPress
  );
});

const styles = StyleSheet.create({
  container: {
    flexDirection: "column",
    alignItems: "flex-start",
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderRadius: 24,
    marginTop: 20,
    overflow: "hidden",
    position: "relative",
  },
  title: {
    alignSelf: "flex-start",
    marginBottom: 24,
    fontWeight: "600",
    fontSize: 20,
  },
  loadingContainer: {
    height: 200,
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
    marginBottom: 24,
  },
  scrollView: {
    marginBottom: 24,
    width: "100%",
  },
  scrollContent: {
    paddingRight: 16,
    gap: 8,
  },
  productWrapper: {
    // width будет динамической из расчета cardWidth
  },
});