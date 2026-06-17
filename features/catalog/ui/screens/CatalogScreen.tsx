import { ThemedView } from "@/components/themed-view";
import SearchInput from "@/features/auth/ui/components/SearchInput";
import { SearchScreenWithHistory } from "@/features/home/ui/screens/SearchScreenWithHistory";
import { CatalogCard } from "@/features/shared/ui/CatalogCard";
import { TemplatePickerBanner } from "@/features/templates/TemplatePickerBanner";
import { useTemplatePicker } from "@/features/templates/TemplatePickerContext";
import { useAppSelector } from "@/store/hooks";
import { useHeaderHeight } from "@react-navigation/elements";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useMemo, useState } from "react";
import { FlatList, Platform, StyleSheet, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export const CatalogScreen = () => {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
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
  const numColumns = 3;
  const headerTopPadding =
    Platform.OS === "android" ? headerHeight + 30 : insets.top + 8;
  const headerComponent = useMemo(
    () => (
      <View style={styles.headerContainer}>
        <ThemedView
          lightColor={"#FFFFFF"}
          style={[styles.container, { paddingTop: headerTopPadding }]}
        >
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
    ),
    [handleSearchPress, headerTopPadding],
  );

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
        ListHeaderComponent={headerComponent}
        contentContainerStyle={styles.content}
        initialNumToRender={12}
        maxToRenderPerBatch={12}
        windowSize={5}
        removeClippedSubviews
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
    marginBottom: 10,
  },
  container: {
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    paddingTop: 0,
  },
  content: {
    paddingBottom: 20,
  },
  catalogCardCell: {
    flex: 1,
    minWidth: 0,
  },
  columnWrapper: {
    paddingLeft: 16,
    paddingRight: 16,

    gap: 8,
    marginBottom: 8,
  },
});
