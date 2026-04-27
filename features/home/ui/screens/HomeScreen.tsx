// screens/HomeScreen.tsx
import { ThemedView } from "@/components/themed-view";
import SearchInput from "@/features/auth/ui/components/SearchInput";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import React, { useCallback, useState } from "react";
import {
  FlatList,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { AutoSlider } from "../components/AutoSlider";
import Catalog from "../components/Catalog/Catalog";
import DeliveryInfoCard from "../components/DeliveryInfoCard";
import { HomeHeader } from "../components/HomeHeader";
import SpecialOffers from "../components/SpecialOffers/SpecialOffers";
import { AddToCart } from "@/features/catalog/catalogSlice";
import { buildTemplateLineFromProduct } from "@/features/templates/buildTemplateLine";
import { TemplatePickerBanner } from "@/features/templates/TemplatePickerBanner";
import { useTemplatePicker } from "@/features/templates/TemplatePickerContext";
import { AddToCartModal } from "@/features/shared/ui/AddToCartModal";
import ManagerSection from "@/features/shared/ui/ManagerSection";
import { useRouter } from "expo-router";
import OrdersCard from "../components/Orders/OrdersCard";
import { SearchScreenWithHistory } from "./SearchScreenWithHistory";

// Временные данные для слайдера (замените на реальные URL)
const SLIDER_ITEMS = [
  {
    id: "1",
    imageUrl:
      "https://cs10.pikabu.ru/post_img/big/2018/02/20/10/1519147784145166438.jpg",
  },
  {
    id: "2",
    imageUrl:
      "https://prophotos.ru/data/articles/0002/4092/image-rectangle_600_x.jpg",
  },
  {
    id: "3",
    imageUrl:
      "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcS5y_CQNi9oiqn96_0204tGgLQuUxigGKLe1w&s",
  },
  {
    id: "4",
    imageUrl:
      "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcS5y_CQNi9oiqn96_0204tGgLQuUxigGKLe1w&s",
  },
  {
    id: "5",
    imageUrl:
      "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcS5y_CQNi9oiqn96_0204tGgLQuUxigGKLe1w&s",
  },
];

export const HomeScreen = ({
  handleLoginPress,
}: {
  handleLoginPress: () => void;
}) => {
  const [showSearch, setShowSearch] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [existingCartItem, setExistingCartItem] = useState<any>(null);
  const [showAddToCartModal, setShowAddToCartModal] = useState(false);
  const cartItems = useAppSelector((state) => state.catalog.cart);
  const dispatch = useAppDispatch();

  const sliderItems = useAppSelector((state) => state.auth.sliders);
  const router = useRouter();
  const orders = useAppSelector((state) => state.catalog.orders);

  const currentCompany = useAppSelector((state) => state.auth.currentCompany);
  const templatePicker = useTemplatePicker();

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
    const templateLines = templatePicker.pickingForTemplateId
      ? templatePicker.getExistingTemplateLinesForProduct(String(product.id))
      : [];

    setSelectedProduct(product);
    setExistingCartItem(
      templatePicker.pickingForTemplateId ? templateLines : cartItemsForProduct,
    );
    setShowAddToCartModal(true);
  }, [cartItems, templatePicker]);

  const handleAddToCart = useCallback((
    productId: string,
    optionId: string,
    quantity: number,
  ) => {
    if (templatePicker.pickingForTemplateId && selectedProduct) {
      void templatePicker.addLineFromProduct(
        buildTemplateLineFromProduct(selectedProduct, optionId, quantity),
      );
      return;
    }
    dispatch(
      AddToCart({
        productId: productId,
        productPurchaseOptionId: optionId,
        quantity: quantity,
      }),
    );
  }, [templatePicker, selectedProduct, dispatch]);
  return (
    <>
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <HomeHeader
          title="EkorFish"
          transparent={true}
          onLoginPress={handleLoginPress}
        />
        <TemplatePickerBanner />

        {/* Слайдер */}
        <ThemedView lightColor={"#FFFFFF"} style={styles.container}>
          <AutoSlider
            items={sliderItems.length > 0 ? sliderItems : SLIDER_ITEMS}
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
                keyExtractor={(item) => item.id.toString()}
                horizontal
                showsHorizontalScrollIndicator={false}
                renderItem={({ item }) => <OrdersCard order={item} fullWidth={false}/>}
                contentContainerStyle={styles.ordersList}
              />
            </View>
          )}
          <ManagerSection />
          <DeliveryInfoCard />
        </ThemedView>

        <SpecialOffers handleAddToCartPress={handleAddToCartPress}/>
        <Catalog />
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
          variant={
            templatePicker.pickingForTemplateId ? "template" : "cart"
          }
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
