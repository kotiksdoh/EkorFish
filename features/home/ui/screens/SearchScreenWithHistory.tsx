// features/search/ui/SearchScreenWithHistory.tsx
import { ThemedView } from "@/components/themed-view";
import {
  getSegmentPopularProducts,
} from "@/features/catalog/catalogSlice";
import SimilarProducts from "@/features/catalog/ui/components/SimilarProducts/SimilarProducts";
import { SearchTopArea } from "@/features/home/ui/components/SearchTopArea/SearchTopArea";
import { AddToCartModal } from "@/features/shared/ui/AddToCartModal";
import { useTemplateAwareAddToCart } from "@/features/templates/useTemplateAwareAddToCart";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { useCallback, useEffect, useState } from "react";
import { Keyboard, ScrollView, StyleSheet } from "react-native";
import Catalog from "../components/Catalog/Catalog";

import { SEARCH_HISTORY_STORAGE_KEY } from "@/features/shared/services/privacyStorage";

type SearchCatalogScrollProps = {
  onAddToCartPress: (product: any) => void;
  returnTo?: "home" | "heart" | "catalog";
};

const SearchCatalogScroll = React.memo(function SearchCatalogScroll({
  onAddToCartPress,
  returnTo = "catalog",
}: SearchCatalogScrollProps) {
  return (
    <ScrollView style={styles.content} keyboardShouldPersistTaps="handled">
      <SimilarProducts
        title="Популярное в вашем сегменте"
        variant="segmentPopular"
        returnTo={returnTo}
        handleAddToCartPress={onAddToCartPress}
      />
      <Catalog />
    </ScrollView>
  );
});

interface SearchScreenWithHistoryProps {
  visible: boolean;
  onClose: () => void;
  onSearch: (query: string) => void;
  returnTo?: "home" | "heart" | "catalog";
}

export const SearchScreenWithHistory: React.FC<
  SearchScreenWithHistoryProps
> = ({ visible, onClose, onSearch, returnTo = "catalog" }) => {
  const dispatch = useAppDispatch();
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const {
    selectedProduct,
    existingCartItem,
    showAddToCartModal,
    handleAddToCartPress,
    handleAddToCart,
    closeAddToCartModal,
    variant: addToCartVariant,
    openLogin,
    authGateModal,
  } = useTemplateAwareAddToCart();
  const searchHints = useAppSelector((state) => state.auth.searchHints);
  const searchHintsLower = useAppSelector((state) => state.auth.searchHintsLower);
  const me = useAppSelector((state) => state.auth.me);

  useEffect(() => {
    if (visible) {
      loadSearchHistory();
      dispatch(
        getSegmentPopularProducts({
          storageId: me?.storageId ? String(me.storageId) : undefined,
        }),
      );
    } else {
      Keyboard.dismiss();
    }
  }, [dispatch, me?.storageId, visible]);

  const loadSearchHistory = async () => {
    try {
      const history = await AsyncStorage.getItem(SEARCH_HISTORY_STORAGE_KEY);
      if (history) {
        setSearchHistory(JSON.parse(history));
      }
    } catch (error) {
      console.error("Ошибка загрузки истории поиска:", error);
    }
  };

  const saveSearchQuery = useCallback(async (query: string) => {
    if (!query.trim()) return;

    try {
      const history = await AsyncStorage.getItem(SEARCH_HISTORY_STORAGE_KEY);
      let historyArray: string[] = history ? JSON.parse(history) : [];

      historyArray = historyArray.filter(
        (item) => item.toLowerCase() !== query.toLowerCase(),
      );

      historyArray.unshift(query);

      if (historyArray.length > 10) {
        historyArray = historyArray.slice(0, 10);
      }

      await AsyncStorage.setItem(
        SEARCH_HISTORY_STORAGE_KEY,
        JSON.stringify(historyArray),
      );
      setSearchHistory(historyArray);
    } catch (error) {
      console.error("Ошибка сохранения истории поиска:", error);
    }
  }, []);

  const handleSearchSubmit = useCallback(
    (query: string) => {
      if (!query.trim()) {
        return;
      }

      saveSearchQuery(query);
      onSearch(query);
      onClose();
    },
    [onClose, onSearch, saveSearchQuery],
  );

  const handleClearHistory = useCallback(async () => {
    try {
      await AsyncStorage.removeItem(SEARCH_HISTORY_STORAGE_KEY);
      setSearchHistory([]);
    } catch (error) {
      console.error("Ошибка очистки истории поиска:", error);
    }
  }, []);

  const handleRemoveHistoryItem = useCallback(async (itemToRemove: string) => {
    setSearchHistory((currentHistory) => {
      const newHistory = currentHistory.filter((item) => item !== itemToRemove);

      void AsyncStorage.setItem(
        SEARCH_HISTORY_STORAGE_KEY,
        JSON.stringify(newHistory),
      ).catch((error) => {
        console.error("Ошибка удаления элемента из истории:", error);
      });

      return newHistory;
    });
  }, []);

  if (!visible) return null;

  return (
    <ThemedView
      style={styles.container}
      lightColor="#EBEDF0"
      darkColor="#040508"
    >
      <SearchTopArea
        visible={visible}
        hints={searchHints}
        hintsLower={searchHintsLower}
        searchHistory={searchHistory}
        onSearch={handleSearchSubmit}
        onClose={onClose}
        onClearHistory={handleClearHistory}
        onRemoveHistoryItem={handleRemoveHistoryItem}
      />

      <SearchCatalogScroll
        onAddToCartPress={handleAddToCartPress}
        returnTo={returnTo}
      />

      <AddToCartModal
        visible={showAddToCartModal}
        onClose={closeAddToCartModal}
        product={selectedProduct}
        onAddToCart={handleAddToCart}
        existingCartItem={existingCartItem}
        variant={addToCartVariant}
        onAuthRequired={openLogin}
      />
      {authGateModal}
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
  },
  content: {
    flex: 1,
  },
});
