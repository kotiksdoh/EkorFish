import { ThemedText } from "@/components/themed-text";
import { CatalogCard } from "@/features/shared/ui/CatalogCard";
import {
  CATALOG_GRID_GAP,
  CATALOG_GRID_HORIZONTAL_PADDING,
  getCatalogGridCardWidth,
} from "@/features/shared/ui/catalogGridLayout";
import { useAppSelector } from "@/store/hooks";
import React, { useCallback, useMemo } from "react";
import { FlatList, StyleSheet, View, useWindowDimensions } from "react-native";

export default function Catalog() {
  const catalog = useAppSelector((state) => state.auth.categories);
  const { width: screenWidth } = useWindowDimensions();
  const catalogCardCellStyle = useMemo(
    () => ({ width: getCatalogGridCardWidth(screenWidth) }),
    [screenWidth],
  );

  const renderCatalogCard = useCallback(
    ({ item }: { item: any }) => (
      <View style={catalogCardCellStyle}>
        <CatalogCard
          id={item.id}
          img={item.imageUrl}
          name={item.name}
          fullWidth
        />
      </View>
    ),
    [catalogCardCellStyle],
  );

  const keyExtractor = useCallback((item: any) => String(item.id), []);

  if (!catalog?.length) {
    return null;
  }

  return (
    <View style={styles.container}>
      <ThemedText
        style={styles.catalogMainText}
        lightColor="#1B1B1C"
        darkColor="#FBFCFF"
      >
        Каталог товаров
      </ThemedText>

      <FlatList
        key="home-catalog-grid"
        data={catalog}
        renderItem={renderCatalogCard}
        keyExtractor={keyExtractor}
        numColumns={3}
        scrollEnabled={false}
        nestedScrollEnabled
        columnWrapperStyle={styles.columnWrapper}
        initialNumToRender={9}
        maxToRenderPerBatch={6}
        windowSize={5}
        removeClippedSubviews={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingLeft: CATALOG_GRID_HORIZONTAL_PADDING,
    paddingRight: CATALOG_GRID_HORIZONTAL_PADDING,
    borderRadius: 8,
    marginTop: 24,
    marginBottom: 12
  },
  catalogMainText: {
    fontWeight: "600",
    fontSize: 20,
    lineHeight: 24,
    marginBottom: 24,
    fontFamily: "Montserrat",
  },
  columnWrapper: {
    gap: CATALOG_GRID_GAP,
    marginBottom: 8,
  },
});
