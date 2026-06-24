// features/shared/ui/SpecialOffers.tsx
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { axdef } from "@/features/shared/services/axios";
import { adaptProductsArray } from "@/features/shared/services/productAdapter";
import { ProductCard } from "@/features/shared/ui/ProductCard";
import { PrimaryButton } from "@/features/shared/ui/components/PrimartyButton";
import { useAppSelector } from "@/store/hooks";
import { useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
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
  onProductPress?: () => void;
}

function SpecialOffersComponent({
  handleAddToCartPress,
  onShowAllPress,
  onProductPress,
}: SpecialOffersProps) {
  const router = useRouter();
  const me = useAppSelector((state) => state.auth.me);
  const [promoProducts, setPromoProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);


  // Локально загружаем промо, чтобы не трогать глобальный catalog.products
  useEffect(() => {
    let isMounted = true;

    const loadPromo = async () => {
      setIsLoading(true);
      try {
        const params = new URLSearchParams();
        params.append("isFavorite", "false");
        params.append("isPromo", "true");
        params.append("offset", "0");
        params.append("count", "10");
        if (me?.storageId) {
          params.append("storageId", String(me.storageId));
        }

        const response = await axdef.get("/api/Catalog/product/list", {
          params,
          paramsSerializer: (p) => p.toString(),
        });

        const rawProducts = response?.data?.data || [];
        const adapted = adaptProductsArray(rawProducts);
        if (isMounted) {
          setPromoProducts(adapted.slice(0, 5));
        }
      } catch (error) {
        console.error("Ошибка загрузки спецпредложений:", error);
        if (isMounted) {
          setPromoProducts([]);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void loadPromo();

    return () => {
      isMounted = false;
    };
  }, [me?.storageId]);

  const hasProducts = useMemo(() => promoProducts.length > 0, [promoProducts.length]);

  const handleShowAll = () => {
    onShowAllPress?.();
    router.push(
      `dashboard/${encodeURIComponent("promo")}?catalogId=${" "}&catalogName=${encodeURIComponent("Акции")}&isPromo=true`
    );
  };

  if (!isLoading && !hasProducts) {
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
          {promoProducts.map((item, index) => (
            <View key={item.id ?? `promo-${index}`} style={[styles.productWrapper, { width: cardWidth }]}>
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
                returnTo="home"
                onAddToCartPress={handleAddToCartPress}
                onBeforeNavigate={onProductPress}
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
    prevProps.onShowAllPress === nextProps.onShowAllPress &&
    prevProps.onProductPress === nextProps.onProductPress
  );
});

const styles = StyleSheet.create({
  container: {
    flexDirection: "column",
    alignItems: "flex-start",
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderRadius: 24,
    marginTop: 8,
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
    marginBottom: 16,
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