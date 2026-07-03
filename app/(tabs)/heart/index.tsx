// HeartScreen.tsx
import { SortIcon } from "@/assets/icons/icons";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useAuthGate } from "@/features/auth/hooks/useAuthGate";
import { ModalHeader } from "@/features/auth/ui/Header";
import SearchInput from "@/features/auth/ui/components/SearchInput";
import {
  AddToCart,
  clearSelectedFilters,
  getCategoryFilters,
  getProductList,
  resetPagination,
  setSelectedFilters,
} from "@/features/catalog/catalogSlice";
import {
  DEFAULT_PRODUCT_SORT,
  PRODUCT_SORT_OPTIONS,
  applyProductSortToParams,
  getProductSortLabel,
  type ProductSortId,
} from "@/features/catalog/productSort";
import { AddToCartModal } from "@/features/shared/ui/AddToCartModal";
import {
  BottomSheetModal,
  type BottomSheetModalRef,
} from "@/features/shared/ui/BottomSheetModal";
import { ProductCard } from "@/features/shared/ui/ProductCard";
import { prefetchProductImageUrls } from "@/features/shared/utils/prefetchProductImages";
import { TemplatePickerBanner } from "@/features/templates/TemplatePickerBanner";
import { useTemplatePicker } from "@/features/templates/TemplatePickerContext";
import { buildTemplateLineFromProduct } from "@/features/templates/buildTemplateLine";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  Image,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import {
  SafeAreaProvider,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

const { width: screenWidth, height: screenHeight } = Dimensions.get("window");

const normalizeFilterId = (id: string | number) => String(id);

export default function HeartScreen() {
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === "dark";
  // Состояния
  const [searchQuery, setSearchQuery] = useState("");
  const [showSortModal, setShowSortModal] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [selectedFilterGroup, setSelectedFilterGroup] = useState<any>(null);
  const [sortBy, setSortBy] = useState<ProductSortId>(DEFAULT_PRODUCT_SORT);
  const [priceRange, setPriceRange] = useState({
    min: "",
    max: "",
  });

  const pageSize = 10;

  const sortSheetRef = useRef<BottomSheetModalRef>(null);
  const filterSheetRef = useRef<BottomSheetModalRef>(null);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [existingCartItem, setExistingCartItem] = useState<any>(null);
  const [showAddToCartModal, setShowAddToCartModal] = useState(false);
  const cartItems = useAppSelector((state) => state.catalog.cart);
  // Получаем состояние из Redux
  const products = useAppSelector((state) => state.catalog.products);
  const isLoading = useAppSelector((state) => state.catalog.isLoading);
  const isLoadingMore = useAppSelector((state) => state.catalog.isLoadingMore);
  const activeProductListMode = useAppSelector(
    (state) => state.catalog.activeProductListMode,
  );
  const isLoadingFilters = useAppSelector(
    (state) => state.catalog.isLoadingFilters,
  );
  const hasMore = useAppSelector((state) => state.catalog.hasMore);
  const currentPage = useAppSelector((state) => state.catalog.currentPage);
  const filters = useAppSelector((state) => state.catalog.filters);
  const filtersCategoryId = useAppSelector(
    (state) => state.catalog.filtersCategoryId,
  );
  const selectedFilterIds = useAppSelector(
    (state) => state.catalog.selectedFilterIds,
  );
  const [draftFilterIds, setDraftFilterIds] = useState<string[]>([]);
  
  const dispatch = useAppDispatch();
  const insets = useSafeAreaInsets();
  const sortModalBottomPadding =
    Math.max(insets.bottom, Platform.OS === "android" ? 28 : 16) + 12;
  const filterModalBottomPadding = Math.max(insets.bottom, 12);
  const filterListMaxHeight = Math.round(screenHeight * 0.7 - 108);
  const templatePicker = useTemplatePicker();
  const { requireAuth, openLogin, authGateModal } = useAuthGate();
  const searchInputRef = useRef<TextInput>(null);
  const router = useRouter();
  const scrollViewRef = useRef<ScrollView>(null);
  const [hasToken, setHasToken] = useState<boolean | null>(null);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
  // Ref для предотвращения двойных запросов
  const isFetchingRef = useRef(false);
  const filtersLengthRef = useRef(filters.length);
  const filtersCategoryIdRef = useRef(filtersCategoryId);
  const isLoadingFiltersRef = useRef(isLoadingFilters);
  const productsLengthRef = useRef(products.length);

  filtersLengthRef.current = filters.length;
  filtersCategoryIdRef.current = filtersCategoryId;
  isLoadingFiltersRef.current = isLoadingFilters;
  productsLengthRef.current = products.length;

  const handleAddToCartPress = async (product: any) => {
    if (!templatePicker.pickingForTemplateId && !(await requireAuth())) {
      return;
    }

    const cartItemsForProduct =
      cartItems?.filter((item: any) => item.productId === product.id) || [];
    const templateLines = templatePicker.pickingForTemplateId
      ? templatePicker.getExistingTemplateLinesForProduct(String(product.id))
      : [];

    setSelectedProduct(product);
    setExistingCartItem(
      templatePicker.pickingForTemplateId ? templateLines : cartItemsForProduct,
    );
    setShowAddToCartModal(true);
  };

  const handleAddToCart = (
    productId: string,
    optionId: string,
    quantity: number,
  ) => {
    if (templatePicker.pickingForTemplateId && selectedProduct) {
      void templatePicker.addLineFromProduct(
        buildTemplateLineFromProduct(selectedProduct, optionId, quantity),
      );
      return;
    }
    console.log("Добавлено в корзину:", {
      productId,
      optionId,
      quantity,
    });
    dispatch(
      AddToCart({
        productId: productId,
        productPurchaseOptionId: optionId,
        quantity: quantity,
      }),
    );
  };

  const sortOptions = PRODUCT_SORT_OPTIONS;

  useFocusEffect(
    useCallback(() => {
      const checkToken = async () => {
        const token = await AsyncStorage.getItem("token");
        setHasToken(!!token);
      };
      checkToken();
    }, []),
  );

  // Проверка, есть ли в группе выбранные фильтры
  const hasSelectedFiltersInGroup = (filterGroup: any) => {
    return filterGroup.filterOptions.some((option: any) =>
      selectedFilterIds.includes(normalizeFilterId(option.id)),
    );
  };

  // Подсчет выбранных фильтров в группе
  const countSelectedFiltersInGroup = (filterGroup: any) => {
    return filterGroup.filterOptions.filter((option: any) =>
      selectedFilterIds.includes(normalizeFilterId(option.id)),
    ).length;
  };

  const me = useAppSelector((state) => state.auth.me);

  // Загрузка продуктов ИЗБРАННОГО
  const loadProducts = useCallback(
    async (
      isLoadMore: boolean = false,
      searchText: string = searchQuery,
      sortOverride?: ProductSortId,
      filterIdsOverride?: string[],
    ) => {
      if (isFetchingRef.current) return;
      if (isLoadMore && !hasMore) return;

      isFetchingRef.current = true;

      try {
        const effectiveFilterIds = filterIdsOverride ?? selectedFilterIds;

        const params: any = {
          isFavorite: true,
          offset: isLoadMore ? products.length : 0,
          count: pageSize,
          storageId: me?.storageId,
          isPromo: false,
        };

        if (searchText) {
          params.search = searchText;
        }

        // Преобразуем в числа
        const minPrice = priceRange.min
          ? parseFloat(priceRange.min)
          : undefined;
        const maxPrice = priceRange.max
          ? parseFloat(priceRange.max)
          : undefined;

        if (minPrice !== undefined && !isNaN(minPrice)) {
          params.MinPrice = minPrice;
        }
        if (maxPrice !== undefined && !isNaN(maxPrice)) {
          params.MaxPrice = maxPrice;
        }

        if (effectiveFilterIds.length > 0) {
          params.FilterIds = effectiveFilterIds.join(",");
        }

        applyProductSortToParams(params, sortOverride ?? sortBy);

        const token = await AsyncStorage.getItem("token");
        if (!token) {
          return;
        }
        dispatch(
          getProductList({
            params,
            isLoadMore,
          }),
        );
      } catch (error) {
        console.error("Ошибка загрузки избранного:", error);
      } finally {
        setTimeout(() => {
          isFetchingRef.current = false;
        }, 500);
      }
    },
    [
      dispatch,
      hasMore,
      me?.storageId,
      priceRange,
      products.length,
      searchQuery,
      selectedFilterIds,
      sortBy,
    ],
  );

  const loadProductsRef = useRef(loadProducts);
  loadProductsRef.current = loadProducts;
  const activeProductListModeRef = useRef(activeProductListMode);
  activeProductListModeRef.current = activeProductListMode;

  const closeFilterModal = useCallback(() => {
    filterSheetRef.current?.close();
  }, []);

  const handleFilterSheetClose = useCallback(() => {
    setShowFilterModal(false);
    setSelectedFilterGroup(null);
  }, []);

  const applyFilterDraft = useCallback(() => {
    const idsToApply = draftFilterIds.map(normalizeFilterId);
    filterSheetRef.current?.close(() => {
      dispatch(setSelectedFilters(idsToApply));
      scrollViewRef.current?.scrollTo({ y: 0, animated: false });
      void loadProductsRef.current(false, searchQuery, undefined, idsToApply);
    });
  }, [dispatch, draftFilterIds, searchQuery]);

  const handleFilterGroupPress = (filterGroup: any) => {
    setDraftFilterIds(selectedFilterIds.map(normalizeFilterId));
    setSelectedFilterGroup(filterGroup);
    setShowFilterModal(true);
  };

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;

      const checkTokenAndLoad = async () => {
        const token = await AsyncStorage.getItem("token");
        if (cancelled) {
          return;
        }

        if (!token) {
          setHasToken(false);
          return;
        }

        setHasToken(true);

        const favoritesReady =
          activeProductListModeRef.current === "favorites" &&
          productsLengthRef.current > 0;

        if (!favoritesReady) {
          setHasLoadedOnce(false);
          dispatch(resetPagination());
          void loadProductsRef.current(false, "");
        }

        const favoriteFiltersLoaded =
          filtersCategoryIdRef.current === "" &&
          filtersLengthRef.current > 0;
        if (!favoriteFiltersLoaded && !isLoadingFiltersRef.current) {
          dispatch(getCategoryFilters(null));
        }
      };

      void checkTokenAndLoad();

      return () => {
        cancelled = true;
      };
    }, [dispatch]),
  );

  useEffect(() => {
    if (
      activeProductListMode === "favorites" &&
      !isLoading &&
      !isLoadingMore
    ) {
      setHasLoadedOnce(true);
    }
  }, [activeProductListMode, isLoading, isLoadingMore]);

  // Обработчик прокрутки
  const handleScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const nativeEvent = event.nativeEvent;

      if (
        !nativeEvent ||
        !nativeEvent.layoutMeasurement ||
        !nativeEvent.contentOffset ||
        !nativeEvent.contentSize ||
        isLoading ||
        isLoadingMore ||
        !hasMore ||
        isFetchingRef.current
      ) {
        return;
      }

      const { layoutMeasurement, contentOffset, contentSize } = nativeEvent;
      const paddingToBottom = 50;

      const distanceFromBottom =
        contentSize.height - layoutMeasurement.height - contentOffset.y;

      if (distanceFromBottom < paddingToBottom) {
        console.log("Loading more favorites...");
        loadProducts(true, searchQuery);
      }
    },
    [isLoading, isLoadingMore, hasMore, loadProducts, searchQuery],
  );

  // Обработчик поиска
  const handleSearchSubmit = useCallback((submittedText?: string) => {
    const effectiveSearch = (submittedText ?? searchQuery).trim();
    if (submittedText !== undefined) {
      setSearchQuery(submittedText);
    }
    console.log("Search submitted in favorites:", effectiveSearch);
    scrollViewRef.current?.scrollTo({ y: 0, animated: false });
    loadProducts(false, effectiveSearch);
  }, [searchQuery, loadProducts]);

  const handleSearchClear = useCallback(() => {
    setSearchQuery("");
    scrollViewRef.current?.scrollTo({ y: 0, animated: false });
    loadProducts(false, "");
  }, [loadProducts]);

  const handleSortSelect = (sortId: ProductSortId) => {
    sortSheetRef.current?.close(() => {
      setSortBy(sortId);
      scrollViewRef.current?.scrollTo({ y: 0, animated: false });
      loadProducts(false, searchQuery, sortId);
    });
  };

  // Обработчик переключения фильтра (только черновик до «Готово»)
  const handleFilterToggle = (filterOptionId: string | number) => {
    const id = normalizeFilterId(filterOptionId);
    setDraftFilterIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

  const isDraftFilterSelected = (filterOptionId: string | number) =>
    draftFilterIds.includes(normalizeFilterId(filterOptionId));

  // Сброс фильтров в текущей группе (черновик)
  const resetCurrentGroupFilters = () => {
    if (!selectedFilterGroup) return;

    const groupOptionIds = new Set(
      selectedFilterGroup.filterOptions.map((option: any) => String(option.id)),
    );
    setDraftFilterIds((prev) =>
      prev.filter((id) => !groupOptionIds.has(String(id))),
    );
  };

  // Сброс всех фильтров
  const resetAllFilters = () => {
    dispatch(clearSelectedFilters());
    setPriceRange({ min: "", max: "" });
    loadProducts(false, searchQuery);
  };

  const getCurrentSortLabel = () => getProductSortLabel(sortBy);

  const isFavoritesMode = activeProductListMode === "favorites";
  const displayProducts =
    hasToken && isFavoritesMode ? products : [];

  useEffect(() => {
    if (!isFavoritesMode || displayProducts.length === 0) {
      return;
    }
    prefetchProductImageUrls(displayProducts);
  }, [displayProducts, isFavoritesMode]);

  const showInitialLoading =
    hasToken === true &&
    displayProducts.length === 0 &&
    (isLoading || !isFavoritesMode);

  const showEmptyState =
    displayProducts.length === 0 &&
    !isLoading &&
    !isLoadingMore &&
    (hasToken === false ||
      (hasToken === true && isFavoritesMode));

  const showProductsRefreshing =
    isFavoritesMode &&
    isLoading &&
    !isLoadingMore &&
    hasLoadedOnce;

  // Рендер элемента группы фильтров в горизонтальном списке
  const renderFilterGroupItem = (filterGroup: any) => {
    const hasSelected = hasSelectedFiltersInGroup(filterGroup);
    const selectedCount = countSelectedFiltersInGroup(filterGroup);

    return (
      <TouchableOpacity
        key={filterGroup.id}
        style={[
          styles.filterGroupButton,
          isDarkMode && {
            backgroundColor: "#202022",
          },
          hasSelected && styles.filterGroupButtonActive,
          isDarkMode &&
            hasSelected && {
              backgroundColor: "#3881EE",
            },
        ]}
        onPress={() => handleFilterGroupPress(filterGroup)}
      >
        <ThemedText
          style={[
            styles.filterGroupText,
            hasSelected && styles.filterGroupTextActive,
          ]}
        >
          {filterGroup.name}
          {hasSelected && selectedCount > 0 && ` (${selectedCount})`}
        </ThemedText>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaProvider>
      <ThemedView
        style={styles.safeArea}
        lightColor={"#EBEDF0"}
        darkColor="#040508"
      >
        <ModalHeader
          showBackButton={false}
          content={
            <SearchInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Найдите товар"
              isActiveButton={false}
              onSubmitEditing={handleSearchSubmit}
              onClear={handleSearchClear}
              ref={searchInputRef}
              isFav={true}
            />
          }
        />

        <View style={styles.mainContainer}>
          <TemplatePickerBanner />
          <ScrollView
            ref={scrollViewRef}
            style={styles.container}
            showsVerticalScrollIndicator={false}
            onScroll={handleScroll}
            scrollEventThrottle={100}
            contentContainerStyle={styles.scrollContent}
          >
            <ThemedView
              style={styles.themeContainer}
              lightColor={"#FFFFFF"}
              darkColor="#040508"
            >
              {/* Горизонтальный список сортировки и фильтров */}
              <View style={styles.horizontalFiltersWrapper}>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={styles.horizontalFiltersContainer}
                  contentContainerStyle={styles.horizontalFiltersContent}
                >
                  {/* Кнопка сортировки */}
                  <TouchableOpacity
                    style={[
                      styles.sortFilterButton,
                      isDarkMode && {
                        backgroundColor: "#202022",
                      },
                    ]}
                    onPress={() => setShowSortModal(true)}
                  >
                    <SortIcon
                      stroke={isDarkMode ? "#FBFCFF" : "#1B1B1C"}
                      fill={isDarkMode ? "#FBFCFF" : "#1B1B1C"}
                      size={16}
                    />
                    <ThemedText style={styles.sortFilterButtonText}>
                      {getCurrentSortLabel()}
                    </ThemedText>
                  </TouchableOpacity>

                  {/* Группы фильтров из бэкенда */}
                  {!isLoadingFilters &&
                    filters.length > 0 &&
                    filters.map((filterGroup) =>
                      renderFilterGroupItem(filterGroup),
                    )}
                </ScrollView>
              </View>

              <View style={styles.productsArea}>
                {showInitialLoading ? (
                  <View style={styles.initialLoadingContainer}>
                    <ActivityIndicator
                      size="large"
                      color={isDarkMode ? "#4C94FF" : "#203686"}
                    />
                    <ThemedText style={styles.initialLoadingText}>
                      Загрузка избранного...
                    </ThemedText>
                  </View>
                ) : displayProducts.length > 0 ? (
                  <View style={styles.productsGridWrapper}>
                    <View style={styles.productsGrid}>
                      {displayProducts.map((product) => (
                        <ProductCard
                          key={String(product.id)}
                          id={product.id}
                          img={product.image}
                          name={product.name}
                          kgPrice={product.pricePerKg.toLocaleString("ru-RU")}
                          fullPrice={product.price.toLocaleString("ru-RU")}
                          isFrozen={product.isFrozen}
                          isFavorite={product.isFavorite}
                          productData={product}
                          onAddToCartPress={handleAddToCartPress}
                          returnTo="heart"
                        />
                      ))}
                    </View>
                    {showProductsRefreshing ? (
                      <View
                        style={[
                          styles.productsRefreshingOverlay,
                          isDarkMode && styles.productsRefreshingOverlayDark,
                        ]}
                      >
                        <ActivityIndicator
                          size="large"
                          color={isDarkMode ? "#4C94FF" : "#203686"}
                        />
                      </View>
                    ) : null}
                  </View>
                ) : showEmptyState ? (
                <View style={styles.emptyContainer}>
                  <Image
                    source={require("@/assets/icons/png/noItems.png")}
                    style={styles.image}
                    resizeMode="contain"
                  />
                  <ThemedText
                    lightColor="#1B1B1C"
                    darkColor="#FBFCFF"
                    style={styles.emptyText}
                  >
                    В избранном пока ничего нет
                  </ThemedText>
                  <ThemedText
                    lightColor="#80818B"
                    darkColor="#80818B"
                    style={styles.emptyTextSecond}
                  >
                    {`Добавляйте товары в избранное, \nчтобы вернуться к ним позже`}
                  </ThemedText>
                </View>
                ) : null}
              </View>

              {isLoadingMore && (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="small" color="#203686" />
                  <ThemedText style={styles.loadingText}>
                    Загрузка...
                  </ThemedText>
                </View>
              )}
            </ThemedView>
          </ScrollView>
        </View>

        <BottomSheetModal
          ref={sortSheetRef}
          visible={showSortModal}
          onClose={() => setShowSortModal(false)}
          isDarkMode={isDarkMode}
        >
          <TouchableOpacity
            style={styles.swipeHandleContainer}
            activeOpacity={0.7}
            onPress={() => sortSheetRef.current?.close()}
          >
            <View style={styles.swipeHandle} />
          </TouchableOpacity>

          <View style={styles.modalHeader}>
            <ThemedText style={styles.modalTitle}>
              Показывать сначала
            </ThemedText>
          </View>

          <ScrollView
            style={styles.sortOptionsContainer}
            contentContainerStyle={{
              paddingBottom: sortModalBottomPadding,
            }}
            showsVerticalScrollIndicator={false}
          >
            {sortOptions.map((option) => (
              <TouchableOpacity
                key={option.id}
                style={[
                  styles.sortOptionItem,
                  isDarkMode && {
                    borderBottomColor: "#323235",
                  },
                ]}
                onPress={() => handleSortSelect(option.id)}
              >
                <View style={styles.sortOptionItemContent}>
                  <View
                    style={[
                      styles.sortOptionRadio,
                      sortBy === option.id && styles.sortOptionRadioSelected,
                      isDarkMode &&
                        sortBy === option.id && {
                          borderColor: "#4C94FF",
                        },
                    ]}
                  >
                    {sortBy === option.id && (
                      <View
                        style={[
                          styles.sortOptionRadioInner,
                          isDarkMode && { backgroundColor: "#FFFFFF" },
                        ]}
                      />
                    )}
                  </View>
                  <ThemedText
                    style={[
                      styles.sortOptionText,
                      isDarkMode && { color: "#FBFCFF" },
                    ]}
                  >
                    {option.label}
                  </ThemedText>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </BottomSheetModal>

        <BottomSheetModal
          ref={filterSheetRef}
          visible={showFilterModal}
          onClose={handleFilterSheetClose}
          isDarkMode={isDarkMode}
          maxHeight="70%"
        >
          <TouchableOpacity
            style={styles.swipeHandleContainer}
            activeOpacity={0.7}
            onPress={() => closeFilterModal()}
          >
            <View style={styles.swipeHandle} />
          </TouchableOpacity>

          <View style={styles.modalHeader}>
            <View style={styles.modalHeaderSide}>
              <TouchableOpacity onPress={resetCurrentGroupFilters}>
                <ThemedText style={styles.modalResetText} />
              </TouchableOpacity>
            </View>

            <ThemedText
              style={styles.modalTitle}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {selectedFilterGroup?.name || "Фильтры"}
            </ThemedText>

            <View style={[styles.modalHeaderSide, styles.modalHeaderSideRight]}>
              <TouchableOpacity onPress={applyFilterDraft}>
                <ThemedText style={styles.modalCloseText}>Готово</ThemedText>
              </TouchableOpacity>
            </View>
          </View>

          <ScrollView
            style={[
              styles.filterOptionsContainer,
              { maxHeight: filterListMaxHeight },
            ]}
            contentContainerStyle={{
              paddingBottom: filterModalBottomPadding,
            }}
            showsVerticalScrollIndicator
            bounces={false}
            nestedScrollEnabled
          >
            {selectedFilterGroup?.filterOptions.map((option: any) => (
              <TouchableOpacity
                key={option.id}
                style={styles.filterOptionItem}
                onPress={() => handleFilterToggle(option.id)}
              >
                <View
                  style={[
                    styles.radioOuter,
                    isDraftFilterSelected(option.id) && styles.radioOuterSelected,
                    isDarkMode &&
                      isDraftFilterSelected(option.id) && {
                        borderColor: "#4C94FF",
                      },
                  ]}
                >
                  {isDraftFilterSelected(option.id) && (
                    <View style={styles.radioInner} />
                  )}
                </View>
                <ThemedText
                  style={[
                    styles.filterOptionText,
                    isDraftFilterSelected(option.id) &&
                      styles.filterOptionTextSelected,
                  ]}
                >
                  {option.value}
                </ThemedText>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </BottomSheetModal>

        <AddToCartModal
          visible={showAddToCartModal}
          onClose={() => {
            setShowAddToCartModal(false);
            setExistingCartItem(null);
          }}
          product={selectedProduct}
          onAddToCart={handleAddToCart}
          existingCartItem={existingCartItem}
          variant={
            templatePicker.pickingForTemplateId ? "template" : "cart"
          }
          onAuthRequired={openLogin}
        />
        {authGateModal}
      </ThemedView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  mainContainer: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  themeContainer: {
    borderRadius: 24,
    marginTop: 10,
    minHeight: "100%",
  },
  horizontalFiltersWrapper: {
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 8,
  },
  horizontalFiltersContainer: {
    flexGrow: 0,
  },
  horizontalFiltersContent: {
    flexDirection: "row",
    paddingRight: 16,
    alignItems: "center",
  },
  sortFilterButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 3,
    backgroundColor: "#F5F5F5",
    borderRadius: 6,
    marginRight: 8,
    // minHeight: 36,
  },
  sortOptionText:{
    fontWeight: "500",
    fontSize: 16
  },
  sortFilterButtonText: {
    fontFamily: "Montserrat",
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 8,
  },
  filterGroupButton: {
    paddingHorizontal: 16,
    paddingVertical: 3,
    backgroundColor: "#F5F5F5",
    borderRadius: 6,
    marginRight: 8,
    // minHeight: 36,
  },
  filterGroupButtonActive: {
    backgroundColor: "#203686",
  },
  filterGroupText: {
    fontFamily: "Montserrat",
    fontSize: 14,
    fontWeight: '500'
  },
  filterGroupTextActive: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
  productsArea: {
    minHeight: 120,
  },
  initialLoadingContainer: {
    paddingVertical: 60,
    alignItems: "center",
    justifyContent: "center",
  },
  initialLoadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#80818B",
  },
  productsGrid: {
    marginTop: 8,
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 16,
    gap: 8,
    paddingBottom: 20,
  },
  productsGridWrapper: {
    position: "relative",
  },
  productsRefreshingOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255, 255, 255, 0.72)",
    borderRadius: 12,
    marginHorizontal: 16,
    marginTop: 8,
    minHeight: 160,
  },
  productsRefreshingOverlayDark: {
    backgroundColor: "rgba(4, 5, 8, 0.72)",
  },
  emptyContainer: {
    paddingVertical: 60,
    paddingHorizontal: 24,
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  emptyText: {
    marginTop: 24,
    fontSize: 24,
    fontWeight: "600",
    textAlign: "center",
    width: "100%",
  },
  emptyTextSecond: {
    marginTop: 8,
    fontSize: 16,
    textAlign: "center",
    width: "100%",
  },
  loadingContainer: {
    paddingVertical: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    marginTop: 8,
    fontSize: 14,
    color: "#80818B",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContainer: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "70%",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  swipeHandleContainer: {
    alignItems: "center",
    paddingTop: 12,
    paddingBottom: 8,
    width: "100%",
  },
  swipeHandle: {
    width: 40,
    height: 4,
    backgroundColor: "#E0E0E0",
    borderRadius: 2,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  modalHeaderSide: {
    flex: 1,
    minWidth: 0,
  },
  modalHeaderSideRight: {
    alignItems: "flex-end",
  },
  modalCloseText: {
    fontFamily: "Montserrat",
    fontSize: 16,
    color: "#203686",
    fontWeight: "600",
  },
  modalResetText: {
    fontFamily: "Montserrat",
    fontSize: 16,
    color: "#203686",
  },
  modalTitle: {
    flex: 2,
    flexShrink: 1,
    minWidth: 0,
    fontFamily: "Montserrat",
    fontSize: 18,
    fontWeight: "600",
    textAlign: "center",
    marginHorizontal: 8,
  },
  sortOptionsContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  sortOptionItem: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  sortOptionItemContent: {
    flexDirection: "row",
    gap: 12,
    alignItems: "center",
  },
  sortOptionRadio: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#D8DADE",
    justifyContent: "center",
    alignItems: "center",
  },
  sortOptionRadioSelected: {
    borderColor: "#203686",
    borderWidth: 5,
  },
  sortOptionRadioInner: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: "#FFFFFF",
  },
  filterOptionsContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    flexShrink: 1,
  },
  filterOptionItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
  },
  filterOptionCheckbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: "#D8DADE",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  filterOptionCheckboxSelected: {
    width: 12,
    height: 12,
    borderRadius: 2,
    backgroundColor: "#203686",
  },
  filterOptionText: {
    fontFamily: "Montserrat",
    fontSize: 16,
    fontWeight: '500'
  },
  filterOptionTextSelected: {
    fontWeight: "600",
  },
  image: {
    width: 86,
    height: 86,
  },
  radioOuter: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#D8DADE",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
    // backgroundColor: "#FBFCFF",
  },
  radioOuterSelected: {
    borderColor: "#203686",
    borderWidth: 5,
  },
  radioInner: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: "#FFFFFF",
  },
});
