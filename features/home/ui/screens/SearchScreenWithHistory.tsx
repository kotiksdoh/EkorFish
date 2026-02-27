// features/search/ui/SearchScreenWithHistory.tsx
import { ArrowIconLeft, CloseIcon } from "@/assets/icons/icons";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  Keyboard,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
  useColorScheme,
} from "react-native";
import Catalog from "../components/Catalog/Catalog";

const SEARCH_HISTORY_KEY = "@search_history";

interface SearchScreenWithHistoryProps {
  visible: boolean;
  onClose: () => void;
  onSearch: (query: string) => void;
}

export const SearchScreenWithHistory: React.FC<
  SearchScreenWithHistoryProps
> = ({ visible, onClose, onSearch }) => {
  const colorScheme = useColorScheme();
  // TODO
  const isDark = colorScheme === "dark";
  const [searchQuery, setSearchQuery] = useState("");
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const inputRef = useRef<TextInput>(null);
  const router = useRouter();

  // Загружаем историю при открытии
  useEffect(() => {
    if (visible) {
      loadSearchHistory();
      // Фокус на инпут при открытии
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    } else {
      setSearchQuery("");
      Keyboard.dismiss();
    }
  }, [visible]);

  const loadSearchHistory = async () => {
    try {
      const history = await AsyncStorage.getItem(SEARCH_HISTORY_KEY);
      if (history) {
        setSearchHistory(JSON.parse(history));
      }
    } catch (error) {
      console.error("Ошибка загрузки истории поиска:", error);
    }
  };

  const saveSearchQuery = async (query: string) => {
    if (!query.trim()) return;

    try {
      // Получаем текущую историю
      const history = await AsyncStorage.getItem(SEARCH_HISTORY_KEY);
      let historyArray: string[] = history ? JSON.parse(history) : [];

      // Удаляем дубликаты
      historyArray = historyArray.filter(
        (item) => item.toLowerCase() !== query.toLowerCase(),
      );

      // Добавляем новый запрос в начало
      historyArray.unshift(query);

      // Ограничиваем историю 10 элементами
      if (historyArray.length > 10) {
        historyArray = historyArray.slice(0, 10);
      }

      // Сохраняем
      await AsyncStorage.setItem(
        SEARCH_HISTORY_KEY,
        JSON.stringify(historyArray),
      );
      setSearchHistory(historyArray);
    } catch (error) {
      console.error("Ошибка сохранения истории поиска:", error);
    }
  };

  const handleSearch = () => {
    if (searchQuery.trim()) {
      saveSearchQuery(searchQuery);
      onSearch(searchQuery);
      onClose();
    }
  };

  const handleClearHistory = async () => {
    try {
      await AsyncStorage.removeItem(SEARCH_HISTORY_KEY);
      setSearchHistory([]);
    } catch (error) {
      console.error("Ошибка очистки истории поиска:", error);
    }
  };

  const handleRemoveHistoryItem = async (itemToRemove: string) => {
    try {
      const newHistory = searchHistory.filter((item) => item !== itemToRemove);
      await AsyncStorage.setItem(
        SEARCH_HISTORY_KEY,
        JSON.stringify(newHistory),
      );
      setSearchHistory(newHistory);
    } catch (error) {
      console.error("Ошибка удаления элемента из истории:", error);
    }
  };

  const handleHistoryItemPress = (item: string) => {
    setSearchQuery(item);
    saveSearchQuery(item);
    onSearch(item);
    onClose();
  };

  const handleClearInput = () => {
    setSearchQuery("");
    inputRef.current?.focus();
  };

  const handleSearchIconPress = () => {
    onClose();
  };

  if (!visible) return null;

  return (
    <ThemedView
      style={styles.container}
      lightColor="#EBEDF0"
      darkColor="#040508"
    >
      <ThemedView
        style={[
          searchHistory.length > 0
            ? styles.headerWhithoutBorders
            : styles.header,
        ]}
      >
        <ThemedView lightColor="#03051E08" style={styles.searchContainer}>
          <TouchableOpacity onPress={handleSearchIconPress}>
            <ArrowIconLeft stroke="#80818B" />
          </TouchableOpacity>
          <TextInput
            ref={inputRef}
            style={styles.searchInput}
            placeholder="Найти товары"
            placeholderTextColor="#80818B"
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              onPress={handleClearInput}
              style={styles.clearInputButton}
            >
              <CloseIcon stroke="#80818B" width={20} height={20} />
            </TouchableOpacity>
          )}
        </ThemedView>
      </ThemedView>

      <ThemedView style={styles.history}>
        {searchHistory.length > 0 && (
          <>
            <View style={styles.historyHeader}>
              <ThemedText lightColor="#80818B" darkColor="#FBFCFF80" style={styles.historyTitle}>Вы искали</ThemedText>
              <TouchableOpacity onPress={handleClearHistory}>
                <ThemedText style={styles.clearButton}>Очистить</ThemedText>
              </TouchableOpacity>
            </View>
            <View style={styles.historyMainCont}>
              {searchHistory.map((item, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.historyItem,
                    { backgroundColor: isDark ? "#202022" : "#F2F4F7" },
                  ]}
                  onPress={() => handleHistoryItemPress(item)}
                >
                  <ThemedText style={styles.historyItemText}>{item}</ThemedText>
                  <TouchableOpacity
                    onPress={() => handleRemoveHistoryItem(item)}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <CloseIcon stroke="#80818B" width={16} height={16} />
                  </TouchableOpacity>
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}
      </ThemedView>

      <ScrollView style={styles.content}>
        {/* <SpecialOffers/> */}
        <Catalog />
      </ScrollView>
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
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 62,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    paddingBottom: 16,
    gap: 12,
  },
  headerWhithoutBorders: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 62,
    paddingBottom: 16,
    gap: 12,
  },
  backButton: {
    padding: 8,
  },
  searchContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    // borderBottomLeftRadius: 24,
    // borderBottomRightRadius: 24,
    paddingHorizontal: 12,
    height: 48,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
    color: "#1B1B1C",
    padding: 0,
  },
  clearInputButton: {
    padding: 4,
    marginLeft: 4,
  },
  content: {
    flex: 1,
    // paddingHorizontal: 16,
    // paddingTop: 16,
  },
  history: {
    paddingHorizontal: 16,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  historyHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  historyTitle: {
    fontSize: 16,
    fontWeight: "500",
  },
  clearButton: {
    fontSize: 14,
    color: "#203686",
  },
  historyMainCont: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    // flex: 1,
    marginBottom: 10,
    gap: 4,
  },
  historyItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F2F4F7",
    borderRadius: 6,
    paddingVertical: 8,
    paddingHorizontal: 8,
    marginBottom: 8,
    gap: 12,
  },
  historyItemText: {
    fontSize: 14,
  },
});
