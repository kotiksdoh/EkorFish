import { ChevronDownIcon, CloseIcon } from "@/assets/icons/icons";
import { ThemedText } from "@/components/themed-text";
import { useColorScheme } from "@/hooks/use-color-scheme";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  LayoutChangeEvent,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";

const COLLAPSED_MAX_ROWS = 3;
const EXPANDED_MAX_ROWS = 6;

type SearchHistoryChipsProps = {
  items: string[];
  onItemPress: (item: string) => void;
  onItemRemove: (item: string) => void;
  resetKey?: boolean;
};

type DisplaySnapshot = {
  itemsKey: string;
  visibleItems: string[];
  showMore: boolean;
  showHide: boolean;
};

function buildRowIndices(layouts: { y: number }[]): number[] {
  const roundedYs = layouts.map((layout) => Math.round(layout.y));
  const uniqueYs = Array.from(new Set(roundedYs)).sort((a, b) => a - b);

  return roundedYs.map((y) => uniqueYs.indexOf(y));
}

function countVisibleItems(
  rowIndices: number[],
  maxRows: number,
  reserveLastRowForToggle: boolean,
): number {
  const lastAllowedRow = reserveLastRowForToggle
    ? maxRows - 2
    : maxRows - 1;

  let visibleCount = 0;

  for (let index = 0; index < rowIndices.length; index++) {
    if (rowIndices[index] <= lastAllowedRow) {
      visibleCount = index + 1;
    } else {
      break;
    }
  }

  return visibleCount;
}

function buildDisplaySnapshot(
  items: string[],
  itemsKey: string,
  rowIndices: number[],
  isExpanded: boolean,
): DisplaySnapshot {
  const totalRows = rowIndices.length > 0 ? Math.max(...rowIndices) + 1 : 0;
  const needsToggle = totalRows > COLLAPSED_MAX_ROWS;

  if (!needsToggle) {
    return {
      itemsKey,
      visibleItems: items,
      showMore: false,
      showHide: false,
    };
  }

  if (isExpanded) {
    if (totalRows <= EXPANDED_MAX_ROWS) {
      return {
        itemsKey,
        visibleItems: items,
        showMore: false,
        showHide: true,
      };
    }

    const visibleCount = countVisibleItems(
      rowIndices,
      EXPANDED_MAX_ROWS,
      true,
    );

    return {
      itemsKey,
      visibleItems: items.slice(0, visibleCount),
      showMore: false,
      showHide: true,
    };
  }

  const visibleCount = countVisibleItems(
    rowIndices,
    COLLAPSED_MAX_ROWS,
    true,
  );

  return {
    itemsKey,
    visibleItems: items.slice(0, visibleCount),
    showMore: true,
    showHide: false,
  };
}

export function SearchHistoryChips({
  items,
  onItemPress,
  onItemRemove,
  resetKey,
}: SearchHistoryChipsProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const [isExpanded, setIsExpanded] = useState(false);
  const [rowIndices, setRowIndices] = useState<number[]>([]);
  const layoutsRef = useRef<{ y: number }[]>([]);
  const displaySnapshotRef = useRef<DisplaySnapshot>({
    itemsKey: "",
    visibleItems: [],
    showMore: false,
    showHide: false,
  });

  const itemsKey = useMemo(() => items.join("\u0001"), [items]);

  useEffect(() => {
    setIsExpanded(false);
  }, [resetKey]);

  useEffect(() => {
    layoutsRef.current = [];
    setRowIndices([]);
  }, [itemsKey]);

  const handleMeasureLayout = useCallback(
    (index: number, event: LayoutChangeEvent) => {
      layoutsRef.current[index] = { y: event.nativeEvent.layout.y };

      if (layoutsRef.current.filter(Boolean).length !== items.length) {
        return;
      }

      setRowIndices(buildRowIndices(layoutsRef.current));
    },
    [items.length],
  );

  const isMeasured = rowIndices.length === items.length && items.length > 0;

  const display = useMemo(() => {
    if (isMeasured) {
      const nextSnapshot = buildDisplaySnapshot(
        items,
        itemsKey,
        rowIndices,
        isExpanded,
      );
      displaySnapshotRef.current = nextSnapshot;
      return nextSnapshot;
    }

    const previousSnapshot = displaySnapshotRef.current;
    if (previousSnapshot.itemsKey === itemsKey && previousSnapshot.visibleItems.length > 0) {
      return previousSnapshot;
    }

    const fallbackSnapshot: DisplaySnapshot = {
      itemsKey,
      visibleItems: items,
      showMore: false,
      showHide: false,
    };
    displaySnapshotRef.current = fallbackSnapshot;
    return fallbackSnapshot;
  }, [isExpanded, isMeasured, items, itemsKey, rowIndices]);

  const chipBackground = isDark ? "#202022" : "#F2F4F7";

  return (
    <>
      {items.length > 0 && !isMeasured && (
        <View pointerEvents="none" style={styles.measureLayer}>
          {items.map((item, index) => (
            <View
              key={`measure-${item}-${index}`}
              style={[styles.historyItem, { backgroundColor: chipBackground }]}
              onLayout={(event) => handleMeasureLayout(index, event)}
            >
              <ThemedText style={styles.historyItemText}>{item}</ThemedText>
              <View style={styles.measureClosePlaceholder} />
            </View>
          ))}
        </View>
      )}

      <View style={styles.historyMainCont}>
        {display.visibleItems.map((item, index) => (
          <TouchableOpacity
            key={`${item}-${index}`}
            style={[styles.historyItem, { backgroundColor: chipBackground }]}
            onPress={() => onItemPress(item)}
          >
            <ThemedText style={styles.historyItemText}>{item}</ThemedText>
            <TouchableOpacity
              onPress={() => onItemRemove(item)}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <CloseIcon stroke="#80818B" width={16} height={16} />
            </TouchableOpacity>
          </TouchableOpacity>
        ))}

        {display.showMore && (
          <TouchableOpacity
            style={[styles.historyItem, { backgroundColor: chipBackground }]}
            onPress={() => setIsExpanded(true)}
          >
            <ThemedText style={styles.historyItemText}>Еще</ThemedText>
            <ChevronDownIcon stroke="#80818B" width={16} height={16} />
          </TouchableOpacity>
        )}

        {display.showHide && (
          <TouchableOpacity
            style={[styles.historyItem, { backgroundColor: chipBackground }]}
            onPress={() => setIsExpanded(false)}
          >
            <ThemedText style={styles.historyItemText}>Скрыть</ThemedText>
            <View style={styles.chevronRotated}>
              <ChevronDownIcon stroke="#80818B" width={16} height={16} />
            </View>
          </TouchableOpacity>
        )}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  measureLayer: {
    position: "absolute",
    left: 0,
    right: 0,
    opacity: 0,
    zIndex: -1,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 4,
  },
  measureClosePlaceholder: {
    width: 16,
    height: 16,
  },
  historyMainCont: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    marginBottom: 10,
    gap: 4,
  },
  historyItem: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 6,
    paddingVertical: 5,
    paddingHorizontal: 8,
    marginBottom: 8,
    gap: 12,
  },
  historyItemText: {
    fontSize: 14,
  },
  chevronRotated: {
    transform: [{ rotate: "180deg" }],
  },
});
