// CatalogDetailScreen.tsx
import { FilterXsIcon, SortIcon, WarningIcon } from "@/assets/icons/icons";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { ModalHeader } from "@/features/auth/ui/Header";
import SearchInput from "@/features/auth/ui/components/SearchInput";
import {
  AddToCart,
  clearSelectedFilters,
  clearSelectedSubcategory,
  getCategoryFilters,
  getProductList,
  interruptProductListLoading,
  resetPagination,
  setSelectedSubcategory,
  toggleFilterSelection,
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
import { TownSelectionModal } from "@/features/shared/ui/TownSelectionModal";
import AnimatedTextInput from "@/features/shared/ui/components/CustomInput";
import { TemplatePickerBanner } from "@/features/templates/TemplatePickerBanner";
import { useTemplatePicker } from "@/features/templates/TemplatePickerContext";
import { buildTemplateLineFromProduct } from "@/features/templates/buildTemplateLine";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  BackHandler,
  Dimensions,
  FlatList,
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

const SHELF_LIFE_PERCENT_MAX = 100;
const BOTTOM_THRESHOLD = Math.max(320, screenHeight * 0.35);

function normalizeShelfLifePercentInput(text: string): string {
  if (text === "") return "";

  const digitsOnly = text.replace(/\D/g, "");
  if (digitsOnly === "") return "";

  const parsed = parseInt(digitsOnly, 10);
  return String(Math.min(SHELF_LIFE_PERCENT_MAX, parsed));
}

export default function CatalogDetailScreen() {
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === "dark";
  const { catalogId, catalogName, search, isPromo = false, children } = useLocalSearchParams<{
    catalogId: string;
    catalogName: string;
    search?: string;
    isPromo: boolean;
    children?: string;
  }>();

  const categories = useAppSelector((state) => state.auth.categories);
  const cartItems = useAppSelector((state) => state.catalog.cart);
  const me = useAppSelector((state) => state.auth.me);
  const templatePicker = useTemplatePicker();

  const subcategoriesFromProps = useMemo(() => {
    const mapChild = (child: any) => ({
      id: child.id,
      name: child.name,
      description: child.description || "",
      imageUrl: child.imageUrl || "",
    });

    const category = categories.find(
      (item) => String(item.id) === String(catalogId),
    );
    if (category?.children?.length) {
      return category.children.map(mapChild);
    }

    if (!children || typeof children !== "string") {
      return [];
    }

    try {
      const parsedChildren = JSON.parse(decodeURIComponent(children));
      return Array.isArray(parsedChildren) ? parsedChildren.map(mapChild) : [];
    } catch {
      return [];
    }
  }, [catalogId, categories, children]);

  // Состояния
  const [searchQuery, setSearchQuery] = useState(search || "");
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState<ProductSortId>(DEFAULT_PRODUCT_SORT);
  const [priceRange, setPriceRange] = useState({
    min: "",
    max: "",
  });
  const [shelfLifeRange, setShelfLifeRange] = useState({
    min: "",
    max: "",
  });

  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [showAddToCartModal, setShowAddToCartModal] = useState(false);
  const [showTownModal, setShowTownModal] = useState(false);
  const [hasAuthToken, setHasAuthToken] = useState(false);
  const pageSize = 10;

  const sortSheetRef = useRef<BottomSheetModalRef>(null);
  const filtersSheetRef = useRef<BottomSheetModalRef>(null);

  // Получаем состояние из Redux
  const products = useAppSelector((state) => state.catalog.products);
  const isLoading = useAppSelector((state) => state.catalog.isLoading);
  const isLoadingMore = useAppSelector((state) => state.catalog.isLoadingMore);
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
  const selectedSubcategoryId = useAppSelector(
    (state) => state.catalog.selectedSubcategoryId,
  );
  const activeProductListMode = useAppSelector(
    (state) => state.catalog.activeProductListMode,
  );
  const activeCategoryId = useAppSelector(
    (state) => state.catalog.activeCategoryId,
  );
  const [showSortModal, setShowSortModal] = useState(false);

  useFocusEffect(
    useCallback(() => {
      const checkAuthToken = async () => {
        const token = await AsyncStorage.getItem("token");
        setHasAuthToken(Boolean(token));
      };
      checkAuthToken();
    }, []),
  );

  const sortOptions = PRODUCT_SORT_OPTIONS;

  const handleSortSelect = (sortId: ProductSortId) => {
    sortSheetRef.current?.close(() => {
      setSortBy(sortId);
      flatListRef.current?.scrollToOffset({ offset: 0, animated: false });
      void loadProductsRef.current(false, searchQuery, undefined, undefined, sortId);
    });
  };

  const getCurrentSortLabel = () => getProductSortLabel(sortBy);
  // Подсчет примененных фильтров
  const appliedFiltersCount =
    selectedFilterIds.length +
    (priceRange.min ? 1 : 0) +
    (priceRange.max ? 1 : 0) +
    (shelfLifeRange.min ? 1 : 0) +
    (shelfLifeRange.max ? 1 : 0);

  const dispatch = useAppDispatch();
  const insets = useSafeAreaInsets();
  const filtersFooterPadding = Math.max(insets.bottom, 16);
  const sortModalBottomPadding =
    Math.max(insets.bottom, Platform.OS === "android" ? 28 : 16) + 12;
  const searchInputRef = useRef<TextInput>(null);
  const router = useRouter();
  const flatListRef = useRef<FlatList>(null);
  const modalScrollViewRef = useRef<ScrollView>(null);

  const catalogIdRef = useRef(catalogId);
  const isScreenFocusedRef = useRef(false);
  const loadGenerationRef = useRef(0);
  const isFetchingRef = useRef(false);
  const isNearBottomRef = useRef(false);
  const listViewportHeightRef = useRef(0);
  const fetchNextPageRef = useRef<() => void>(() => {});
  const loadProductsRef = useRef<
    (
      isLoadMore?: boolean,
      searchText?: string,
      forceStorageId?: string,
      forceSubcategoryId?: string | null,
      sortOverride?: ProductSortId,
    ) => Promise<void>
  >(async () => {});
  const resetAndLoadCategoryRef = useRef<() => void>(() => {});
  const paginationTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const autoFillAtCountRef = useRef(-1);
  const activeCategoryIdRef = useRef(activeCategoryId);
  const selectedSubcategoryIdRef = useRef<string | null>(selectedSubcategoryId);
  const activeProductListModeRef = useRef(activeProductListMode);
  const [isPagingMore, setIsPagingMore] = useState(false);

  activeCategoryIdRef.current = activeCategoryId;
  selectedSubcategoryIdRef.current = selectedSubcategoryId;
  activeProductListModeRef.current = activeProductListMode;

  useEffect(() => {
    catalogIdRef.current = catalogId;
  }, [catalogId]);

  const clearPaginationTimeout = useCallback(() => {
    if (paginationTimeoutRef.current) {
      clearTimeout(paginationTimeoutRef.current);
      paginationTimeoutRef.current = null;
    }
  }, []);

  const isLoadContextValid = useCallback(
    (generationAtStart: number, requireFocus = true) => {
      return (
        (!requireFocus || isScreenFocusedRef.current) &&
        loadGenerationRef.current === generationAtStart &&
        catalogIdRef.current === catalogId &&
        Boolean(catalogId)
      );
    },
    [catalogId],
  );

  const handleOpenFilters = useCallback(() => {
    if (showFilters) {
      return;
    }

    setShowFilters(true);

    if (!catalogId || isLoadingFilters) {
      return;
    }

    if (filtersCategoryId !== String(catalogId)) {
      void dispatch(getCategoryFilters(catalogId));
    }
  }, [catalogId, dispatch, filtersCategoryId, isLoadingFilters, showFilters]);

  // Загрузка продуктов
  const loadProducts = useCallback(
    async (
      isLoadMore: boolean = false,
      searchText: string = searchQuery,
      forceStorageId?: string,
      forceSubcategoryId?: string | null,
      sortOverride?: ProductSortId,
    ) => {
      const generationAtStart = loadGenerationRef.current;

      if (
        !isLoadContextValid(generationAtStart, isLoadMore) ||
        isFetchingRef.current
      ) {
        return;
      }

      if (isLoadMore && !hasMore) return;

      isFetchingRef.current = true;
      clearPaginationTimeout();
      if (isLoadMore) {
        setIsPagingMore(true);
      }

      const requestCategoryId = String(catalogId);
      const requestOffset = isLoadMore ? products.length : 0;

      try {
        const params: any = {
          isFavorite: false,
          categoryId: requestCategoryId,
          offset: requestOffset,
          count: pageSize,
          search: searchText,
          isPromo: isPromo,
          storageId: forceStorageId || me?.storageId,
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

        const minShelfLife = shelfLifeRange.min
          ? parseFloat(shelfLifeRange.min)
          : undefined;
        const maxShelfLife = shelfLifeRange.max
          ? parseFloat(shelfLifeRange.max)
          : undefined;

        if (minShelfLife !== undefined && !isNaN(minShelfLife)) {
          params.MinRemainingShelfLifePercent = Math.min(
            SHELF_LIFE_PERCENT_MAX,
            minShelfLife,
          );
        }
        if (maxShelfLife !== undefined && !isNaN(maxShelfLife)) {
          params.MaxRemainingShelfLifePercent = Math.min(
            SHELF_LIFE_PERCENT_MAX,
            maxShelfLife,
          );
        }

        const effectiveSubcategoryId =
          forceSubcategoryId !== undefined
            ? forceSubcategoryId
            : selectedSubcategoryIdRef.current;

        if (effectiveSubcategoryId && effectiveSubcategoryId !== "all") {
          params.subCategoryId = effectiveSubcategoryId;
        }

        applyProductSortToParams(params, sortOverride ?? sortBy);

        if (!isLoadContextValid(generationAtStart, isLoadMore)) {
          return;
        }

        const result = await dispatch(
          getProductList({
            params,
            isLoadMore,
          }),
        ).unwrap();

        if (!isLoadContextValid(generationAtStart, isLoadMore)) {
          return;
        }

        const loadedCount = result?.data?.data?.length ?? 0;
        const canRequestMore = loadedCount >= pageSize;
        if (isLoadMore && canRequestMore) {
          paginationTimeoutRef.current = setTimeout(() => {
            paginationTimeoutRef.current = null;
            if (
              isLoadContextValid(generationAtStart, true) &&
              isNearBottomRef.current &&
              !isFetchingRef.current
            ) {
              fetchNextPageRef.current();
            }
          }, 50);
        }
      } catch (error) {
        console.error("Ошибка загрузки:", error);
      } finally {
        isFetchingRef.current = false;
        if (isLoadMore) {
          setIsPagingMore(false);
        }
      }
    },
    [
      catalogId,
      clearPaginationTimeout,
      hasMore,
      isLoadContextValid,
      products.length,
      dispatch,
      priceRange,
      shelfLifeRange,
      searchQuery,
      selectedSubcategoryId,
      me?.storageId,
      isPromo,
      sortBy,
    ],
  );

  const resetAndLoadCategory = useCallback(() => {
    if (!catalogId) return;

    loadGenerationRef.current += 1;
    isFetchingRef.current = false;
    isNearBottomRef.current = false;
    autoFillAtCountRef.current = -1;
    clearPaginationTimeout();
    setIsPagingMore(false);

    const initialSearchQuery =
      typeof search === "string" ? decodeURIComponent(search).trim() : "";

    setSearchQuery(initialSearchQuery);
    dispatch(clearSelectedSubcategory());
    selectedSubcategoryIdRef.current = null;
    dispatch(clearSelectedFilters());
    setPriceRange({ min: "", max: "" });
    setShelfLifeRange({ min: "", max: "" });
    dispatch(resetPagination());
    void loadProductsRef.current(false, initialSearchQuery, undefined, null);
    queueMicrotask(() => {
      dispatch(getCategoryFilters(catalogId));
    });
  }, [catalogId, clearPaginationTimeout, dispatch, search]);

  loadProductsRef.current = loadProducts;
  resetAndLoadCategoryRef.current = resetAndLoadCategory;

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      resetAndLoadCategoryRef.current();
    });
    return () => cancelAnimationFrame(frame);
  }, [catalogId, isPromo, search]);

  useFocusEffect(
    useCallback(() => {
      isScreenFocusedRef.current = true;

      if (catalogId) {
        const activeCat = activeCategoryIdRef.current;
        const listMode = activeProductListModeRef.current;
        if (
          listMode === "favorites" ||
          (activeCat !== null && activeCat !== String(catalogId))
        ) {
          resetAndLoadCategoryRef.current();
        }
      }

      return () => {
        isScreenFocusedRef.current = false;
        isFetchingRef.current = false;
        isNearBottomRef.current = false;
        clearPaginationTimeout();
        setIsPagingMore(false);
        dispatch(interruptProductListLoading());
      };
    }, [catalogId, clearPaginationTimeout, dispatch]),
  );

  const isCategoryListPending =
    Boolean(catalogId) && activeCategoryId !== String(catalogId);

  const isSubcategorySwitching =
    (isLoading && !isLoadingMore) || isCategoryListPending;

  // Обработчик смены подкатегории
  const handleSubcategorySelect = useCallback(
    (subcategoryId: string | null) => {
      if (isSubcategorySwitching) {
        return;
      }

      const nextSubcategoryId = subcategoryId === "all" ? null : subcategoryId;
      if (nextSubcategoryId === selectedSubcategoryIdRef.current) {
        return;
      }

      loadGenerationRef.current += 1;
      dispatch(setSelectedSubcategory(nextSubcategoryId));
      selectedSubcategoryIdRef.current = nextSubcategoryId;

      flatListRef.current?.scrollToOffset({ offset: 0, animated: false });

      void loadProducts(false, searchQuery, undefined, nextSubcategoryId);
    },
    [dispatch, isSubcategorySwitching, loadProducts, searchQuery],
  );

  const displayProducts = useMemo(() => {
    if (!catalogId) return [];
    if (activeCategoryId !== String(catalogId)) {
      return [];
    }
    return products;
  }, [products, catalogId, activeCategoryId]);

  const showInitialLoader =
    isCategoryListPending ||
    (isLoading && !isLoadingMore && displayProducts.length === 0);

  const [existingCartItem, setExistingCartItem] = useState<any>(null);

  const handleAddToCartPress = (product: any) => {
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

  const fetchNextPage = useCallback(() => {
    if (
      !isScreenFocusedRef.current ||
      !catalogId ||
      !hasMore ||
      isCategoryListPending ||
      isLoading ||
      displayProducts.length === 0 ||
      isFetchingRef.current ||
      isLoadingMore ||
      isPagingMore
    ) {
      return;
    }
    void loadProducts(true, searchQuery);
  }, [
    catalogId,
    displayProducts.length,
    hasMore,
    isCategoryListPending,
    isLoading,
    isLoadingMore,
    isPagingMore,
    loadProducts,
    searchQuery,
  ]);

  useEffect(() => {
    fetchNextPageRef.current = fetchNextPage;
  }, [fetchNextPage]);

  const handleEndReached = useCallback(() => {
    if (!isScreenFocusedRef.current) {
      return;
    }
    isNearBottomRef.current = true;
    fetchNextPage();
  }, [fetchNextPage]);

  const handleListLayout = useCallback(
    (event: { nativeEvent: { layout: { height: number } } }) => {
      listViewportHeightRef.current = event.nativeEvent.layout.height;
    },
    [],
  );

  const handleScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      if (!isScreenFocusedRef.current) {
        return;
      }

      const { layoutMeasurement, contentOffset, contentSize } =
        event.nativeEvent;

      if (!contentSize.height || !layoutMeasurement.height) {
        return;
      }

      const distanceFromBottom =
        contentSize.height - layoutMeasurement.height - contentOffset.y;

      isNearBottomRef.current = distanceFromBottom <= BOTTOM_THRESHOLD;

      if (isNearBottomRef.current) {
        fetchNextPage();
      }
    },
    [fetchNextPage],
  );

  const handleContentSizeChange = useCallback(
    (_width: number, height: number) => {
      if (!isScreenFocusedRef.current) {
        return;
      }

      const viewportHeight = listViewportHeightRef.current;
      if (
        viewportHeight > 0 &&
        height <= viewportHeight + 32 &&
        hasMore &&
        displayProducts.length > 0 &&
        displayProducts.length !== autoFillAtCountRef.current &&
        !isCategoryListPending &&
        !isLoading &&
        !isFetchingRef.current &&
        !isLoadingMore &&
        !isPagingMore
      ) {
        autoFillAtCountRef.current = displayProducts.length;
        fetchNextPage();
      }
    },
    [
      displayProducts.length,
      fetchNextPage,
      hasMore,
      isCategoryListPending,
      isLoading,
      isLoadingMore,
      isPagingMore,
    ],
  );

  const renderProduct = useCallback(
    ({ item: product }: { item: any }) => (
      <ProductCard
        id={product.id}
        img={product.image}
        name={product.name}
        kgPrice={product.pricePerKg.toLocaleString("ru-RU")}
        fullPrice={product.price.toLocaleString("ru-RU")}
        isFrozen={product.isFrozen}
        isFavorite={product.isFavorite}
        productData={product}
        onAddToCartPress={handleAddToCartPress}
      />
    ),
    [handleAddToCartPress],
  );

  const keyExtractor = useCallback(
    (item: any) => String(item.id),
    [],
  );

  const listHeader = useMemo(
    () => (
      <ThemedView
        style={styles.themeContainerHeader}
        lightColor={"#FFFFFF"}
        darkColor="#040508"
      >
          <View style={styles.sortFilterRow}>
            <TouchableOpacity
              style={styles.sortButton}
              onPress={() => setShowSortModal(true)}
            >
              <SortIcon
                stroke={isDarkMode ? "#FBFCFF" : "#1B1B1C"}
                fill={isDarkMode ? "#FBFCFF" : "#1B1B1C"}
              />
              <ThemedText style={styles.sortButtonText}>
                {getCurrentSortLabel()}
              </ThemedText>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.filterButton}
              onPress={handleOpenFilters}
            >
              <View>
                {appliedFiltersCount > 0 && (
                  <View style={styles.filterBadge}></View>
                )}
                <FilterXsIcon
                  stroke={isDarkMode ? "#FBFCFF" : "#1B1B1C"}
                  fill={isDarkMode ? "#FBFCFF" : "#1B1B1C"}
                />
              </View>
              <ThemedText style={styles.filterButtonText}>
                Фильтры
              </ThemedText>
            </TouchableOpacity>
          </View>

          {subcategoriesFromProps.length > 0 && (
            <View style={styles.subcategoriesWrapper}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.subcategoriesContainer}
                contentContainerStyle={styles.subcategoriesContent}
              >
                <TouchableOpacity
                  key="all"
                  disabled={isSubcategorySwitching}
                  style={[
                    styles.subcategoryButton,
                    selectedSubcategoryId === null &&
                      styles.subcategoryButtonActive,
                    isDarkMode &&
                      !(selectedSubcategoryId === null) && {
                        backgroundColor: "#202022",
                      },
                    isDarkMode &&
                      selectedSubcategoryId === null && {
                        backgroundColor: "#3881EE",
                      },
                    isSubcategorySwitching && styles.subcategoryButtonDisabled,
                  ]}
                  onPress={() => handleSubcategorySelect("all")}
                >
                  <ThemedText
                    style={[
                      styles.subcategoryText,
                      selectedSubcategoryId === null &&
                        styles.subcategoryTextActive,
                      isDarkMode && {
                        color: "#FBFCFF",
                      },
                    ]}
                  >
                    Все
                  </ThemedText>
                </TouchableOpacity>

                {subcategoriesFromProps.map((subcategory: any) => (
                  <TouchableOpacity
                    key={subcategory.id}
                    disabled={isSubcategorySwitching}
                    style={[
                      styles.subcategoryButton,
                      selectedSubcategoryId === subcategory.id &&
                        styles.subcategoryButtonActive,
                      isDarkMode &&
                        !(selectedSubcategoryId === subcategory.id) && {
                          backgroundColor: "#202022",
                        },
                      isDarkMode &&
                        selectedSubcategoryId === subcategory.id && {
                          backgroundColor: "#3881EE",
                        },
                      isSubcategorySwitching && styles.subcategoryButtonDisabled,
                    ]}
                    onPress={() => handleSubcategorySelect(subcategory.id)}
                  >
                    <ThemedText
                      style={[
                        styles.subcategoryText,
                        selectedSubcategoryId === subcategory.id &&
                          styles.subcategoryTextActive,
                        isDarkMode && {
                          color: "#FBFCFF",
                        },
                      ]}
                    >
                      {subcategory.name}
                    </ThemedText>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}

          {hasAuthToken && (
            <TouchableOpacity onPress={() => setShowTownModal(true)}>
              <ThemedView
                darkColor="#202022"
                lightColor="#F2F4F7"
                style={styles.cityContainer}
              >
                <ThemedView
                  darkColor="#151516"
                  lightColor="#FFFFFF"
                  style={styles.cityIcon}
                >
                  <WarningIcon
                    stroke={isDarkMode ? "#FBFCFF" : "#1B1B1C"}
                    fill={isDarkMode ? "#FBFCFF" : "#1B1B1C"}
                  />
                </ThemedView>
                <ThemedText darkColor="#FBFCFF" style={styles.cityText}>
                  Укажите ваш город, чтобы увидеть наличие товаров
                </ThemedText>
                <ThemedText style={styles.arrowIcon}>›</ThemedText>
              </ThemedView>
            </TouchableOpacity>
          )}
          <View style={styles.productsListTopSpacer} />
      </ThemedView>
    ),
    [
      appliedFiltersCount,
      getCurrentSortLabel,
      handleOpenFilters,
      handleSubcategorySelect,
      hasAuthToken,
      isDarkMode,
      isSubcategorySwitching,
      selectedSubcategoryId,
      sortBy,
      subcategoriesFromProps,
    ],
  );

  const renderListEmpty = useCallback(() => {
    if ((isLoading && !isLoadingMore) || isCategoryListPending) {
      return (
        <View style={styles.initialLoadingContainer}>
          <ActivityIndicator
            size="large"
            color={isDarkMode ? "#4C94FF" : "#203686"}
          />
          <ThemedText style={styles.initialLoadingText}>
            Загрузка товаров...
          </ThemedText>
        </View>
      );
    }

    return (
      <View style={styles.emptyContainer}>
        <Image
          source={require("../../../assets/icons/png/noItems.png")}
          style={styles.image}
          resizeMode="contain"
        />
        <ThemedText
          lightColor="#1B1B1C"
          darkColor="#FBFCFF"
          style={styles.emptyText}
        >
          Ничего не найдено
        </ThemedText>
        <ThemedText
          lightColor="#80818B"
          darkColor="#80818B"
          style={styles.emptyTextSecond}
        >
          {`Попробуйте изменить\nили сбросить фильтры`}
        </ThemedText>
      </View>
    );
  }, [isCategoryListPending, isDarkMode, isLoading, isLoadingMore]);

  const renderListFooter = useCallback(() => {
    if (!isLoadingMore && !isPagingMore) {
      return null;
    }

    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color="#203686" />
        <ThemedText style={styles.loadingText}>Загрузка...</ThemedText>
      </View>
    );
  }, [isLoadingMore, isPagingMore]);

  // Обработчик поиска
  const handleSearchSubmit = useCallback((submittedText?: string) => {
    const effectiveSearch = (submittedText ?? searchQuery).trim();
    if (submittedText !== undefined) {
      setSearchQuery(submittedText);
    }
    if (catalogId) {
      console.log("Search submitted:", effectiveSearch);
      flatListRef.current?.scrollToOffset({ offset: 0, animated: false });
      loadProducts(false, effectiveSearch);
    }
  }, [catalogId, searchQuery, loadProducts]);

  const handleSearchClear = useCallback(() => {
    setSearchQuery("");
    if (!catalogId) return;
    flatListRef.current?.scrollToOffset({ offset: 0, animated: false });
    loadProducts(false, "");
  }, [catalogId, loadProducts]);

  const handleBack = useCallback(() => {
    clearPaginationTimeout();
    router.dismissTo("/dashboard");
  }, [clearPaginationTimeout, router]);

  useFocusEffect(
    useCallback(() => {
      const subscription = BackHandler.addEventListener("hardwareBackPress", () => {
        handleBack();
        return true;
      });
      return () => subscription.remove();
    }, [handleBack]),
  );

  // Переключение выбора фильтра
  const handleFilterToggle = (filterOptionId: string) => {
    dispatch(toggleFilterSelection(filterOptionId));
  };

  // Проверка выбран ли фильтр
  const isFilterSelected = (filterOptionId: string) => {
    return selectedFilterIds.includes(filterOptionId);
  };

  // Применение фильтров
  const applyFilters = () => {
    filtersSheetRef.current?.close(() => {
      flatListRef.current?.scrollToOffset({ offset: 0, animated: false });
      void loadProducts(false, searchQuery);
    });
  };

  // Сброс фильтров
  const resetFilters = () => {
    dispatch(clearSelectedFilters());
    setPriceRange({ min: "", max: "" });
    setShelfLifeRange({ min: "", max: "" });
    loadProducts(false, searchQuery);
  };

  // Сброс подкатегории
  const resetSubcategory = () => {
    dispatch(clearSelectedSubcategory());
    loadProducts(false, searchQuery);
  };

  // Рендер элемента фильтра
  const renderFilterItem = (filterOption: any, filterGroupId: string) => (
    <TouchableOpacity
      key={filterOption.id}
      style={[
        styles.filterItem,
        isDarkMode && {
          backgroundColor: "#202022",
          borderColor: "#323235",
        },
        isFilterSelected(filterOption.id) && styles.filterItemSelected,
        isDarkMode &&
          isFilterSelected(filterOption.id) && {
            backgroundColor: "#202022",
            borderColor: "#3881EE",
          },
      ]}
      onPress={() => handleFilterToggle(filterOption.id)}
    >
      <ThemedText style={styles.filterItemText}>
        {filterOption.value}
      </ThemedText>
    </TouchableOpacity>
  );
  return (
    <SafeAreaProvider>
      <ThemedView
        style={styles.safeArea}
        lightColor={"#EBEDF0"}
        darkColor="#040508"
      >
        <ModalHeader
          title={catalogName !== "undefined" ? catalogName : "Каталог"}
          showBackButton={true}
          onBackPress={handleBack}
          content={
            <SearchInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Найдите товар"
              isActiveButton={false}
              onSubmitEditing={handleSearchSubmit}
              onClear={handleSearchClear}
              ref={searchInputRef}
            />
          }
        />
        <View style={styles.mainContainer}>
          <TemplatePickerBanner />
          <FlatList
            ref={flatListRef}
            data={displayProducts}
            renderItem={renderProduct}
            keyExtractor={keyExtractor}
            numColumns={2}
            style={styles.container}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={[
              styles.scrollContent,
              styles.productsListContent,
              isDarkMode
                ? styles.productsListContentDark
                : styles.productsListContentLight,
            ]}
            columnWrapperStyle={styles.columnWrapper}
            ListHeaderComponent={listHeader}
            ListEmptyComponent={renderListEmpty}
            ListFooterComponent={renderListFooter}
            onLayout={handleListLayout}
            onScroll={handleScroll}
            scrollEventThrottle={16}
            onEndReached={handleEndReached}
            onEndReachedThreshold={0.35}
            onContentSizeChange={handleContentSizeChange}
            initialNumToRender={10}
            maxToRenderPerBatch={10}
            windowSize={11}
            removeClippedSubviews={false}
          />
          {showInitialLoader ? (
            <View
              style={[
                styles.fullScreenLoader,
                isDarkMode
                  ? styles.fullScreenLoaderDark
                  : styles.fullScreenLoaderLight,
              ]}
            >
              <ActivityIndicator
                size="large"
                color={isDarkMode ? "#4C94FF" : "#203686"}
              />
              <ThemedText style={styles.initialLoadingText}>
                Загрузка товаров...
              </ThemedText>
            </View>
          ) : null}
        </View>

        <TownSelectionModal
          visible={showTownModal}
          onClose={() => setShowTownModal(false)}
          storageId={me?.storageId}
          onTownSelected={(newStorageId) => {
            flatListRef.current?.scrollToOffset({ offset: 0, animated: false });
            void loadProducts(false, searchQuery, newStorageId);
          }}
        />

        <BottomSheetModal
          ref={filtersSheetRef}
          visible={showFilters}
          onClose={() => setShowFilters(false)}
          isDarkMode={isDarkMode}
          maxHeight="85%"
        >
          <TouchableOpacity
            style={styles.swipeHandleContainer}
            activeOpacity={0.7}
            onPress={() => filtersSheetRef.current?.close()}
          >
            <View style={styles.swipeHandle} />
          </TouchableOpacity>

          <View style={styles.modalHeader}>
            <ThemedText style={styles.modalTitle}>Фильтры</ThemedText>

            <TouchableOpacity onPress={resetFilters}>
              <ThemedText
                lightColor="#203686"
                darkColor="#4C94FF"
                style={styles.modalResetText}
              >
                Сбросить
              </ThemedText>
            </TouchableOpacity>
          </View>

          <ScrollView
            ref={modalScrollViewRef}
            style={styles.modalContent}
            showsVerticalScrollIndicator
            bounces
            scrollEventThrottle={16}
            nestedScrollEnabled
          >
            <View style={styles.filterSection}>
              <ThemedText style={styles.filterSectionTitle}>
                Цена за кг
              </ThemedText>
              <View style={styles.priceInputs}>
                <View style={styles.priceInputContainer}>
                  <AnimatedTextInput
                    placeholder="От"
                    placeholderTextColor="#80818B"
                    value={priceRange.min}
                    onChangeText={(text) =>
                      setPriceRange({ ...priceRange, min: text })
                    }
                    keyboardType="numeric"
                  />
                </View>

                <View style={styles.priceSeparator} />

                <View style={styles.priceInputContainer}>
                  <AnimatedTextInput
                    placeholder="До"
                    placeholderTextColor="#80818B"
                    value={priceRange.max}
                    onChangeText={(text) =>
                      setPriceRange({ ...priceRange, max: text })
                    }
                    keyboardType="numeric"
                  />
                </View>
              </View>
            </View>

            <View style={styles.filterSection}>
              <ThemedText style={styles.filterSectionTitle}>
                Остаток срока годности, %
              </ThemedText>
              <View style={styles.priceInputs}>
                <View style={styles.priceInputContainer}>
                  <AnimatedTextInput
                    placeholder="От"
                    placeholderTextColor="#80818B"
                    value={shelfLifeRange.min}
                    onChangeText={(text) =>
                      setShelfLifeRange({
                        ...shelfLifeRange,
                        min: normalizeShelfLifePercentInput(text),
                      })
                    }
                    keyboardType="numeric"
                  />
                </View>

                <View style={styles.priceSeparator} />

                <View style={styles.priceInputContainer}>
                  <AnimatedTextInput
                    placeholder="До"
                    placeholderTextColor="#80818B"
                    value={shelfLifeRange.max}
                    onChangeText={(text) =>
                      setShelfLifeRange({
                        ...shelfLifeRange,
                        max: normalizeShelfLifePercentInput(text),
                      })
                    }
                    keyboardType="numeric"
                  />
                </View>
              </View>
            </View>

            {isLoadingFilters && (
              <View style={styles.filtersLoadingContainer}>
                <ActivityIndicator size="small" color="#203686" />
                <ThemedText style={styles.filtersLoadingText}>
                  Загрузка фильтров...
                </ThemedText>
              </View>
            )}

            {!isLoadingFilters &&
              filters.length > 0 &&
              filters.map((filterGroup) => (
                <View key={filterGroup.id} style={styles.filterSection}>
                  <ThemedText
                    darkColor="#FBFCFF"
                    style={styles.filterSectionTitle}
                  >
                    {filterGroup.name}
                  </ThemedText>

                  <View style={styles.filterItems}>
                    {filterGroup.filterOptions.map((option) =>
                      renderFilterItem(option, filterGroup.id),
                    )}
                  </View>
                </View>
              ))}

            {!isLoadingFilters && filters.length === 0 && (
              <View style={styles.noFiltersContainer}>
                <ThemedText style={styles.noFiltersText}>
                  Нет доступных фильтров
                </ThemedText>
              </View>
            )}

            <View
              style={[
                styles.modalBottomSpacer,
                { height: 72 + filtersFooterPadding },
              ]}
            />
          </ScrollView>

          <ThemedView
            lightColor="#FFFFFF"
            darkColor="#202022"
            style={[
              styles.applyButtonContainer,
              { paddingBottom: filtersFooterPadding },
            ]}
          >
            <TouchableOpacity
              style={[
                styles.applyButton,
                isDarkMode && {
                  backgroundColor: "#3881EE",
                },
              ]}
              onPress={applyFilters}
            >
              <ThemedText style={styles.applyButtonText}>
                Применить{" "}
                {appliedFiltersCount > 0 ? `(${appliedFiltersCount})` : ""}
              </ThemedText>
            </TouchableOpacity>
          </ThemedView>
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
        />
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
            <ThemedText style={styles.modalTitle}>Сортировка</ThemedText>
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
    paddingTop: 8,

  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 32,
    borderRadius: 24
  
  },
  productsListContent: {
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  productsListContentLight: {
    backgroundColor: "#FFFFFF",
  },
  productsListContentDark: {
    backgroundColor: "#040508",
  },
  columnWrapper: {
    paddingHorizontal: 16,
    gap: 8,
    justifyContent: "space-between",
  },
  productsListTopSpacer: {
    height: 16,
  },
  themeContainerHeader: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    marginTop: 10,
  },
  sortFilterRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  sortButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  sortButtonText: {
    marginLeft: 8,
    fontFamily: "Montserrat",
    fontSize: 14,
  },
  filterButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    position: "relative",
  },
  filterButtonText: {
    marginLeft: 8,
    fontFamily: "Montserrat",
    fontSize: 14,
  },
  filterBadge: {
    position: "absolute",
    top: 1,
    right: -1,
    backgroundColor: "#FF3B30",
    borderRadius: 10,
    minWidth: 6,
    maxWidth: 6,
    width: 6,
    height: 6,
    zIndex: 1,
    alignItems: "center",
  },
  subcategoriesWrapper: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  subcategoriesContainer: {
    flexGrow: 0,
  },
  subcategoriesContent: {
    flexDirection: "row",
    paddingRight: 16,
  },
  subcategoryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: "#F5F5F5",
    borderRadius: 6,
    marginRight: 8,
  },
  subcategoryButtonActive: {
    backgroundColor: "#203686",
  },
  subcategoryButtonDisabled: {
    opacity: 0.45,
  },
  subcategoryText: {
    fontFamily: "Montserrat",
    fontSize: 14,
    color: "#1B1B1C",
  },
  subcategoryTextActive: {
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
  fullScreenLoader: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
  },
  fullScreenLoaderLight: {
    backgroundColor: "#EBEDF0",
  },
  fullScreenLoaderDark: {
    backgroundColor: "#040508",
  },
  initialLoadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#80818B",
  },
  productsGrid: {
    marginTop: 16,
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 16,
    gap: 8,
    minHeight: 200,
    paddingBottom: 20,
  },
  emptyContainer: {
    paddingVertical: 60,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyText: {
    marginTop: 24,
    fontSize: 24,
    fontWeight: "600",
  },
  emptyTextSecond: {
    marginTop: 8,
    fontSize: 16,
  },
  loadingContainer: {
    paddingVertical: 24,
    paddingBottom: 32,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 72,
  },
  loadingText: {
    marginTop: 8,
    fontSize: 14,
    color: "#80818B",
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
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  modalCloseText: {
    fontFamily: "Montserrat",
    fontSize: 16,
    color: "#80818B",
  },
  modalTitle: {
    fontFamily: "Montserrat",
    fontSize: 18,
    fontWeight: "600",
  },
  modalResetText: {
    fontFamily: "Montserrat",
    fontSize: 16,
    // color: "#203686",
  },
  modalContent: {
    paddingHorizontal: 20,
    maxHeight: screenHeight * 0.62,
  },
  modalBottomSpacer: {
    height: 72,
  },
  filterSection: {
    marginTop: 24,
  },
  filterSectionTitle: {
    fontFamily: "Montserrat",
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 12,
  },
  priceInputs: {
    flexDirection: "row",
    alignItems: "center",
  },
  priceInputContainer: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 8,
    overflow: "hidden",
  },
  priceInput: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontFamily: "Montserrat",
    fontSize: 16,
  },
  priceSeparator: {
    width: 16,
    height: 1,
    backgroundColor: "transparent",
    marginHorizontal: 8,
  },
  filterItems: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  filterItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: "#ffffff",
    borderRadius: 6,
    marginRight: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#D8DADE",
    minWidth: 100,
  },
  filterItemSelected: {
    backgroundColor: "#ffffff",
    borderColor: "#203686",
  },
  filterItemText: {
    fontFamily: "Montserrat",
    fontSize: 14,
  },
  applyButtonContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  applyButton: {
    backgroundColor: "#203686",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  applyButtonText: {
    color: "#FFFFFF",
    fontFamily: "Montserrat",
    fontSize: 16,
    fontWeight: "600",
  },
  filtersLoadingContainer: {
    paddingVertical: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  filtersLoadingText: {
    marginTop: 8,
    fontSize: 14,
    color: "#80818B",
  },
  noFiltersContainer: {
    paddingVertical: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  noFiltersText: {
    fontSize: 14,
    color: "#80818B",
  },
  image: {
    width: 86,
    height: 86,
  },

  cityContainer: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginHorizontal: 16,
    padding: 8,
    borderRadius: 16,
  },
  cityIcon: {
    padding: 10,
    borderRadius: 8,
  },
  cityText: {
    flex: 1,
    fontWeight: 500,
    fontSize: 14,
  },
  arrowIcon: {
    fontSize: 24,
    fontWeight: "400",
    paddingHorizontal: 8,
  },
  sortOptionsContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    maxHeight: "60%",
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
  sortOptionText: {
    fontFamily: "Montserrat",
    fontSize: 16,
    color: "#1B1B1C",
  },
  sortOptionTextSelected: {
    fontWeight: "600",
  },
});
