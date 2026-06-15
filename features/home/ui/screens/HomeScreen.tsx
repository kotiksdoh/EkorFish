// screens/HomeScreen.tsx
import { ThemedView } from "@/components/themed-view";
import SearchInput from "@/features/auth/ui/components/SearchInput";
import { AddToCart } from "@/features/catalog/catalogSlice";
import { AddToCartModal } from "@/features/shared/ui/AddToCartModal";
import ManagerSection from "@/features/shared/ui/ManagerSection";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  FlatList,
  InteractionManager,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { AutoSlider } from "../components/AutoSlider";
import Catalog from "../components/Catalog/Catalog";
import DeliveryInfoCard from "../components/DeliveryInfoCard";
import { HomeHeader } from "../components/HomeHeader";
import OrdersCard from "../components/Orders/OrdersCard";
import SpecialOffers from "../components/SpecialOffers/SpecialOffers";
import { SearchScreenWithHistory } from "./SearchScreenWithHistory";

// Временные данные для слайдера (замените на реальные URL)
const SLIDER_ITEMS: any[] = [
 
];

export const HomeScreen = ({
  handleLoginPress,
}: {
  handleLoginPress: () => void;
}) => {
  const [showHeavyBlocks, setShowHeavyBlocks] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [existingCartItem, setExistingCartItem] = useState<any>(null);
  const [showAddToCartModal, setShowAddToCartModal] = useState(false);
  const cartItems = useAppSelector((state) => state.catalog.cart);
  const dispatch = useAppDispatch();

  const sliderItems = useAppSelector((state) => state.auth.sliders);
  const router = useRouter();
  const orders = useAppSelector((state) => state.catalog.orders);
  const sliderData = useMemo(
    () => (sliderItems.length > 0 ? sliderItems : SLIDER_ITEMS),
    [sliderItems],
  );
  const ordersKeyExtractor = useCallback((item: any) => String(item.id), []);
  const renderOrderItem = useCallback(
    ({ item }: { item: any }) => <OrdersCard order={item} fullWidth={false} />,
    [],
  );

  // На Android откладываем тяжёлые блоки, чтобы первая отрисовка была плавнее
  useEffect(() => {
    setShowHeavyBlocks(false);
    const task = InteractionManager.runAfterInteractions(() => {
      setShowHeavyBlocks(true);
    });
    return () => task.cancel();
  }, []);

  const handleSearchPress = useCallback(() => {
    setShowSearch(true);
  }, []);

  const handleSearchClose = useCallback(() => {
    setShowSearch(false);
  }, []);

  const handleSearchSubmit = useCallback((query: string) => {
    //@ts-ignore
    router.push(
      `dashboard/${encodeURIComponent("fsfs")}?catalogId=${" "}&catalogName=${encodeURIComponent(`${query}`)}&children=${encodeURIComponent("")}&search=${encodeURIComponent(`${query}`)}&isPromo=false`,
    );
  }, [router]);

  const handleAddToCartPress = useCallback((product: any) => {
    const cartItemsForProduct =
      cartItems?.filter((item: any) => item.productId === product.id) || [];

    setSelectedProduct(product);
    setExistingCartItem(cartItemsForProduct);
    setShowAddToCartModal(true);
  }, [cartItems]);

  const handleAddToCart = useCallback((
    productId: string,
    optionId: string,
    quantity: number,
  ) => {
    dispatch(
      AddToCart({
        productId: productId,
        productPurchaseOptionId: optionId,
        quantity: quantity,
      }),
    );
  }, [dispatch]);
  return (
    <>
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <HomeHeader
          title="EkorFish"
          transparent={true}
          onLoginPress={handleLoginPress}
        />
        {/* Слайдер */}
        <ThemedView lightColor={"#FFFFFF"} style={styles.container}>
          <AutoSlider
            items={sliderData}
            autoPlayInterval={4000}
            showIndicators={true}
          />

          {/* Оборачиваем SearchInput в TouchableOpacity для открытия поиска */}
          <TouchableOpacity onPress={handleSearchPress} activeOpacity={1}>
            <View pointerEvents="none">
              <SearchInput
                isActiveButton={true}
                placeholder="Найти товары"
                // Делаем инпут неактивным, чтобы нельзя было ввести текст прямо здесь
                disabled={false}
              />
            </View>
          </TouchableOpacity>
          {orders && orders.length > 0 && (
            <View style={styles.ordersSection}>
              <FlatList
                data={orders}
                keyExtractor={ordersKeyExtractor}
                horizontal
                showsHorizontalScrollIndicator={false}
                renderItem={renderOrderItem}
                contentContainerStyle={styles.ordersList}
                initialNumToRender={3}
                maxToRenderPerBatch={4}
                windowSize={3}
                removeClippedSubviews
              />
            </View>
          )}
          {showHeavyBlocks ? (
            <>
              <ManagerSection />
              <DeliveryInfoCard />
            </>
          ) : null}
        </ThemedView>

        {showHeavyBlocks ? (
          <>
            <SpecialOffers handleAddToCartPress={handleAddToCartPress} />
            <Catalog />
          </>
        ) : null}
      </ScrollView>

      {/* Экран поиска с историей */}
      <SearchScreenWithHistory
        visible={showSearch}
        onClose={handleSearchClose}
        onSearch={handleSearchSubmit}
      />
        <AddToCartModal
          visible={showAddToCartModal}
          onClose={() => {
            setShowAddToCartModal(false);
            setExistingCartItem(null);
          }}
          product={selectedProduct}
          onAddToCart={handleAddToCart}
          existingCartItem={existingCartItem}
          variant="cart"
        />
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  ordersSection: {
    marginTop: 8,
    marginBottom: 16,
    paddingLeft: 16,
  },
  ordersList: {
    paddingRight: 16,
  },
});
