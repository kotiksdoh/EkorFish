import { ArrowIconLeft, CloseIcon } from "@/assets/icons/icons";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { SearchHintsList } from "@/features/home/ui/components/SearchHints/SearchHintsList";
import { SearchHistoryChips } from "@/features/home/ui/components/SearchHistory/SearchHistoryChips";
import {
  createSearchHintsIndex,
  filterSearchHintsFromIndex,
} from "@/features/home/utils/searchHints";
import { useColorScheme } from "@/hooks/use-color-scheme";
import {
  FIXED_TEXT_PROPS,
  getFixedTextInputStyle,
} from "@/utils/fixedTextStyle";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Platform,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

type SearchTopAreaProps = {
  visible: boolean;
  hints: string[];
  hintsLower: string[];
  searchHistory: string[];
  onSearch: (query: string) => void;
  onClose: () => void;
  onClearHistory: () => void;
  onRemoveHistoryItem: (item: string) => void;
};

export function SearchTopArea({
  visible,
  hints,
  hintsLower,
  searchHistory,
  onSearch,
  onClose,
  onClearHistory,
  onRemoveHistoryItem,
}: SearchTopAreaProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const [searchQuery, setSearchQuery] = useState("");
  const inputRef = useRef<TextInput>(null);

  const hintsIndex = useMemo(
    () => createSearchHintsIndex(hints, hintsLower),
    [hints, hintsLower],
  );

  const filteredHints = useMemo(
    () => filterSearchHintsFromIndex(hintsIndex, searchQuery),
    [hintsIndex, searchQuery],
  );

  const isTyping = searchQuery.trim().length > 0;
  const showHints = isTyping && filteredHints.length > 0;
  const textColor = isDark ? "#FFFFFF" : "#1B1B1C";

  useEffect(() => {
    if (!visible) {
      setSearchQuery("");
      return;
    }

    const timer = setTimeout(() => {
      inputRef.current?.focus();
    }, 100);

    return () => clearTimeout(timer);
  }, [visible]);

  const handleSearch = useCallback(() => {
    if (searchQuery.trim()) {
      onSearch(searchQuery);
    }
  }, [onSearch, searchQuery]);

  const handleHistoryItemPress = useCallback(
    (item: string) => {
      onSearch(item);
    },
    [onSearch],
  );

  const handleHintPress = useCallback(
    (hint: string) => {
      onSearch(hint);
    },
    [onSearch],
  );

  const handleClearInput = useCallback(() => {
    setSearchQuery("");
    inputRef.current?.focus();
  }, []);

  return (
    <>
      <ThemedView
        style={[
          searchHistory.length > 0 || isTyping
            ? styles.headerWhithoutBorders
            : styles.header,
        ]}
      >
        <ThemedView lightColor="#03051E08" style={styles.searchContainer}>
          <TouchableOpacity onPress={onClose}>
            <ArrowIconLeft color={isDark ? "#FBFCFF" : "#80818B"} />
          </TouchableOpacity>
          <TextInput
            ref={inputRef}
            {...FIXED_TEXT_PROPS}
            style={getFixedTextInputStyle([
              styles.searchInput,
              { color: textColor },
            ])}
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

      {searchHistory.length > 0 && (
        <ThemedView style={styles.history}>
          {!isTyping && (
            <View style={styles.historyHeader}>
              <ThemedText
                lightColor="#80818B"
                darkColor="#FBFCFF80"
                style={styles.historyTitle}
              >
                Вы искали
              </ThemedText>
              <TouchableOpacity onPress={onClearHistory}>
                <ThemedText style={styles.clearButton}>Очистить</ThemedText>
              </TouchableOpacity>
            </View>
          )}
          <SearchHistoryChips
            items={searchHistory}
            resetKey={visible}
            onItemPress={handleHistoryItemPress}
            onItemRemove={onRemoveHistoryItem}
          />
        </ThemedView>
      )}

      {showHints && (
        <View style={styles.hintsSection}>
          <SearchHintsList
            hints={filteredHints}
            query={searchQuery}
            onHintPress={handleHintPress}
          />
        </View>
      )}
    </>
  );
}

const styles = StyleSheet.create({
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
  searchContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 48,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
    fontWeight: "500",
    padding: 0,
    ...(Platform.OS === "android" && {
      includeFontPadding: false,
      textAlignVertical: "center",
    }),
  },
  clearInputButton: {
    padding: 4,
    marginLeft: 4,
  },
  history: {
    paddingHorizontal: 16,
    paddingBottom: 4,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  historyHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  historyTitle: {
    fontSize: 16,
    fontWeight: "500",
  },
  clearButton: {
    fontSize: 14,
    color: "#203686",
  },
  hintsSection: {
    marginTop: 8,
    marginBottom: 8,
  },
});
