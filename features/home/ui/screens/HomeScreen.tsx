// screens/HomeScreen.tsx
import { ThemedView } from "@/components/themed-view";
import SearchInput from "@/features/auth/ui/components/SearchInput";
import { useAppSelector } from "@/store/hooks";
import React, { useState } from "react";
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
// import { SearchScreenWithHistory } from '@/features/search/ui/SearchScreenWithHistory';
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
  const sliderItems = useAppSelector((state) => state.auth.sliders);
  const router = useRouter();
  const orders = useAppSelector((state) => state.catalog.orders);

  const handleSearchPress = () => {
    setShowSearch(true);
  };

  const handleSearchClose = () => {
    setShowSearch(false);
  };

  const handleSearchSubmit = (query: string) => {
    // Переходим на экран каталога с поиском
    //@ts-ignore
    router.push(
      `dashboard/${encodeURIComponent("fsfs")}?catalogId=${" "}&catalogName=${encodeURIComponent(`${query}`)}&children=${encodeURIComponent("")}&search=${encodeURIComponent(`${query}`)}`,
    );
  };
  console.log("orders", orders);
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
                renderItem={({ item }) => <OrdersCard order={item} />}
                contentContainerStyle={styles.ordersList}
              />
            </View>
          )}
          <DeliveryInfoCard />
        </ThemedView>

        <SpecialOffers />
        <Catalog />
      </ScrollView>

      {/* Экран поиска с историей */}
      <SearchScreenWithHistory
        visible={showSearch}
        onClose={handleSearchClose}
        onSearch={handleSearchSubmit}
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
