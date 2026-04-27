import { ThemedView } from "@/components/themed-view";
import SearchInput from "@/features/auth/ui/components/SearchInput";
import { SearchScreenWithHistory } from "@/features/home/ui/screens/SearchScreenWithHistory";
import { CatalogCard } from "@/features/shared/ui/CatalogCard";
import { TemplatePickerBanner } from "@/features/templates/TemplatePickerBanner";
import { useTemplatePicker } from "@/features/templates/TemplatePickerContext";
import { useAppSelector } from "@/store/hooks";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import { FlatList, StyleSheet, TouchableOpacity, View } from "react-native";

export const CatalogScreen = () => {
  const [showSearch, setShowSearch] = useState(false);
  const {
    openSearchAfterNavigate,
    consumeOpenSearchFlag,
    pickingForTemplateId,
  } = useTemplatePicker();

  useFocusEffect(
    useCallback(() => {
      if (openSearchAfterNavigate && pickingForTemplateId) {
        setShowSearch(true);
        consumeOpenSearchFlag();
      }
    }, [openSearchAfterNavigate, pickingForTemplateId, consumeOpenSearchFlag]),
  );

  const catalog = useAppSelector((state) => state.auth.categories);
  const router = useRouter();

  const handleSearchPress = () => {
    setShowSearch(true);
  };

  const handleSearchClose = () => {
    setShowSearch(false);
  };

  const handleSearchSubmit = (query: string) => {
    //@ts-ignore
    router.push(
      `dashboard/${encodeURIComponent("fsfs")}?catalogId=${" "}&catalogName=${encodeURIComponent(
        `${query}`
      )}&children=${encodeURIComponent("")}&search=${encodeURIComponent(
        `${query}`
      )}&isPromo=false`,
    );
  };

  const renderCatalogCard = ({ item }: { item: any }) => (
    <CatalogCard
      key={item.id}
      id={item.id}
      img={item.imageUrl}
      name={item.name}
      children={item.children}
    />
  );

  const keyExtractor = (item: any) => String(item.id);
  const numColumns = 3;

  return (
    <>
      <FlatList
        data={catalog}
        renderItem={renderCatalogCard}
        keyExtractor={keyExtractor}
        numColumns={numColumns}
        scrollEnabled={true}
        showsVerticalScrollIndicator={false}
        columnWrapperStyle={styles.columnWrapper}
        ListHeaderComponent={
          <View style={styles.headerContainer}>
            <ThemedView lightColor={"#FFFFFF"} style={styles.container}>
              <TouchableOpacity onPress={handleSearchPress} activeOpacity={1}>
                <View pointerEvents="none">
                  <SearchInput
                    isActiveButton={false}
                    placeholder="Найти товары"
                    disabled={false}
                  />
                </View>
              </TouchableOpacity>
            </ThemedView>
            <TemplatePickerBanner />
          </View>
        }
        contentContainerStyle={styles.content}
      />

      <SearchScreenWithHistory
        visible={showSearch}
        onClose={handleSearchClose}
        onSearch={handleSearchSubmit}
      />
    </>
  );
};

const styles = StyleSheet.create({
  headerContainer: {
    width: "100%",
  },
  container: {
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    paddingTop: 42,
  },
  content: {
    paddingHorizontal: 8,
    paddingTop: 8,
    paddingBottom: 20,
  },
  columnWrapper: {
    gap: 8,
    marginBottom: 8,
    justifyContent: "space-between",
  },
});
