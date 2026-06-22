import { ThemedText } from "@/components/themed-text";
import { CatalogCard } from "@/features/shared/ui/CatalogCard";
import { useAppSelector } from "@/store/hooks";
import React, { useCallback } from "react";
import { FlatList, StyleSheet, View } from "react-native";

export default function Catalog() {
  const catalog = useAppSelector((state) => state.auth.categories);

  const renderCatalogCard = useCallback(
    ({ item }: { item: any }) => (
      <View style={styles.catalogCardCell}>
        <CatalogCard
          id={item.id}
          img={item.imageUrl}
          name={item.name}
          fullWidth
        />
      </View>
    ),
    [],
  );

  const keyExtractor = useCallback((item: any) => String(item.id), []);

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
    paddingLeft: 16,
    paddingRight: 16,
    borderRadius: 8,
    marginTop: 20,
  },
  catalogMainText: {
    fontWeight: "600",
    fontSize: 20,
    lineHeight: 24,
    marginBottom: 24,
    fontFamily: "Montserrat",
  },
  columnWrapper: {
    gap: 8,
    marginBottom: 8,
  },
  catalogCardCell: {
    flex: 1,
    minWidth: 0,
  },
});
