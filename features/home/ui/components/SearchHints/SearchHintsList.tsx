import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import {
  getHintHighlightParts,
  SEARCH_HINTS_LIMIT,
} from "@/features/home/utils/searchHints";
import { useColorScheme } from "@/hooks/use-color-scheme";
import React, { memo, useMemo } from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";

type SearchHintsListProps = {
  hints: string[];
  query: string;
  onHintPress: (hint: string) => void;
};

type SearchHintRowProps = {
  hint: string;
  query: string;
  isLast: boolean;
  isDark: boolean;
  onPress: (hint: string) => void;
};

const SearchHintRow = memo(function SearchHintRow({
  hint,
  query,
  isLast,
  isDark,
  onPress,
}: SearchHintRowProps) {
  const parts = useMemo(
    () => getHintHighlightParts(hint, query),
    [hint, query],
  );

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={() => onPress(hint)}
      style={styles.row}
    >
      <ThemedText style={styles.hintText}>
        {parts.map((part, index) => (
          <ThemedText
            key={`${index}-${part.text}`}
            style={part.bold ? styles.hintBold : styles.hintRegular}
          >
            {part.text}
          </ThemedText>
        ))}
      </ThemedText>
      {!isLast && (
        <View
          style={[
            styles.separator,
            { backgroundColor: isDark ? "#2A2A2C" : "#E4E6EB" },
          ]}
        />
      )}
    </TouchableOpacity>
  );
});

export const SearchHintsList = memo(function SearchHintsList({
  hints,
  query,
  onHintPress,
}: SearchHintsListProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const visibleHints = hints.slice(0, SEARCH_HINTS_LIMIT);

  if (visibleHints.length === 0) {
    return null;
  }

  return (
    <ThemedView
      style={styles.container}
      lightColor="#FFFFFF"
      darkColor="#121214"
    >
      {visibleHints.map((hint, index) => (
        <SearchHintRow
          key={`${hint}-${index}`}
          hint={hint}
          query={query}
          isLast={index === visibleHints.length - 1}
          isDark={isDark}
          onPress={onHintPress}
        />
      ))}
    </ThemedView>
  );
});

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    overflow: "hidden",
  },
  row: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    position: "relative",
  },
  hintText: {
    fontSize: 16,
    lineHeight: 22,
  },
  hintRegular: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: "400",
  },
  hintBold: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: "700",
  },
  separator: {
    position: "absolute",
    left: 16,
    right: 16,
    bottom: 0,
    height: StyleSheet.hairlineWidth,
  },
});
