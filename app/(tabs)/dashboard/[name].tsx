// CatalogDetailScreen.tsx
import { FilterXsIcon, SortIcon, WarningIcon } from "@/assets/icons/icons";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { ModalHeader } from "@/features/auth/ui/Header";
import SearchInput from "@/features/auth/ui/components/SearchInput";
import {
  AddToCart,
  clearProducts,
  clearSelectedFilters,
  clearSelectedSubcategory,
  getCategoryFilters,
  getProductList,
  setSelectedSubcategory,
  toggleFilterSelection,
} from "@/features/catalog/catalogSlice";
import {
  DEFAULT_PRODUCT_SORT,
  applyProductSortToParams,
  getProductSortLabel,
  PRODUCT_SORT_OPTIONS,
  type ProductSortId,
} from "@/features/catalog/productSort";
import { AddToCartModal } from "@/features/shared/ui/AddToCartModal";
import { ProductCard } from "@/features/shared/ui/ProductCard";
import { TownSelectionModal } from "@/features/shared/ui/TownSelectionModal";
import AnimatedTextInput from "@/features/shared/ui/components/CustomInput";
import { TemplatePickerBanner } from "@/features/templates/TemplatePickerBanner";
import { useTemplatePicker } from "@/features/templates/TemplatePickerContext";
import { buildTemplateLineFromProduct } from "@/features/templates/buildTemplateLine";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { useColorScheme } from "@/hooks/use-color-scheme";
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  Image,
  Modal,
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";

const { width: screenWidth, height: screenHeight } = Dimensions.get("window");

const SHELF_LIFE_PERCENT_MAX = 100;

function normalizeShelfLifePercentInput(text: string): string {
  if (text === "") return "";

  const digitsOnly = text.replace(/\D/g, "");
  if (digitsOnly === "") return "";

  const parsed = parseInt(digitsOnly, 10);
  return String(Math.min(SHELF_LIFE_PERCENT_MAX, parsed));
}

export default function CatalogDetailScreen() {
  const colorScheme = useColorScheme();
  //TODO
  const isDarkMode = colorScheme === "dark";
  const { catalogId, catalogName, search, isPromo = false, children } = useLocalSearchParams<{
    catalogId: string;
    catalogName: string;
    search?: string;
    isPromo: boolean
    children?: string; // Добавляем children
  }>();

  // Парсим children из строки
  const parsedChildren = children
    ? JSON.parse(decodeURIComponent(children))
    : [];
  const cartItems = useAppSelector((state) => state.catalog.cart);
  const me = useAppSelector((state) => state.auth.me);
  const templatePicker = useTemplatePicker();

  // Преобразуем в массив подкатегорий
  const subcategoriesFromProps = parsedChildren.map((child: any) => ({
    id: child.id,
    name: child.name,
    description: child.description || "",
    imageUrl: child.imageUrl || "",
  }));

  // Состояния
  const [searchQuery, setSearchQuery] = useState(search || "");
  const [showFilters, setShowFilters] = useState(false);
  const [isOpeningFilters, setIsOpeningFilters] = useState(false);
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

  // Анимация для свайпа модалки
  const modalTranslateY = useRef(new Animated.Value(screenHeight)).current;
  const [isClosing, setIsClosing] = useState(false);

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
  const selectedFilterIds = useAppSelector(
    (state) => state.catalog.selectedFilterIds,
  );
  const selectedSubcategoryId = useAppSelector(
    (state) => state.catalog.selectedSubcategoryId,
  );
  const [showSortModal, setShowSortModal] = useState(false);
  const sortModalTranslateY = useRef(new Animated.Value(screenHeight)).current;
  const [isClosingSortModal, setIsClosingSortModal] = useState(false);

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
  const closeSortModalWithAnimation = useCallback(() => {
    if (isClosingSortModal) return;

    setIsClosingSortModal(true);
    Animated.timing(sortModalTranslateY, {
      toValue: screenHeight,
      duration: 250,
      useNativeDriver: true,
    }).start(() => {
      setShowSortModal(false);
      setIsClosingSortModal(false);
    });
  }, [isClosingSortModal]);

  // Обработчик нажатия на overlay сортировки
  const handleSortOverlayPress = useCallback(() => {
    if (!isClosingSortModal) {
      closeSortModalWithAnimation();
    }
  }, [isClosingSortModal, closeSortModalWithAnimation]);

  // Эффект для анимации появления модалки сортировки
  useEffect(() => {
    if (showSortModal) {
      sortModalTranslateY.setValue(screenHeight);
      Animated.spring(sortModalTranslateY, {
        toValue: 0,
        useNativeDriver: true,
        damping: 20,
        stiffness: 90,
        mass: 0.8,
      }).start();
    } else {
      sortModalTranslateY.setValue(screenHeight);
    }
  }, [showSortModal]);

  // Обработчик выбора сортировки
  const handleSortSelect = (sortId: ProductSortId) => {
    setSortBy(sortId);
    closeSortModalWithAnimation();
    setTimeout(() => {
      scrollViewRef.current?.scrollTo({ y: 0, animated: false });
      loadProducts(false, searchQuery, undefined, undefined, sortId);
    }, 300);
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
  const searchInputRef = useRef<TextInput>(null);
  const router = useRouter();
  const scrollViewRef = useRef<ScrollView>(null);
  const modalScrollViewRef = useRef<ScrollView>(null);

  // Ref для предотвращения двойных запросов
  const isFetchingRef = useRef(false);

  // Функция для закрытия модалки с анимацией
  const closeModalWithAnimation = useCallback(() => {
    if (isClosing) return;

    setIsClosing(true);
    Animated.timing(modalTranslateY, {
      toValue: screenHeight,
      duration: 250,
      useNativeDriver: true,
    }).start(() => {
      setShowFilters(false);
      setIsClosing(false);
    });
  }, [isClosing]);

  // Обработчик нажатия на overlay
  const handleOverlayPress = useCallback(() => {
    if (!isClosing) {
      closeModalWithAnimation();
    }
  }, [isClosing, closeModalWithAnimation]);

  // Эффект для анимации появления модалки
  useEffect(() => {
    if (showFilters) {
      modalTranslateY.setValue(screenHeight);
      Animated.spring(modalTranslateY, {
        toValue: 0,
        useNativeDriver: true,
        damping: 20,
        stiffness: 90,
        mass: 0.8,
      }).start();
    } else {
      modalTranslateY.setValue(screenHeight);
    }
  }, [showFilters]);

  // Простой обработчик свайпа для защелки
  const handleSwipeHandlePress = useCallback(() => {
    closeModalWithAnimation();
  }, [closeModalWithAnimation]);

  const handleOpenFilters = useCallback(async () => {
    setShowFilters(true);

    // Подгружаем фильтры при открытии, если их еще нет.
    if (!catalogId || isLoadingFilters || filters.length > 0) {
      return;
    }

    try {
      setIsOpeningFilters(true);
      await dispatch(getCategoryFilters(catalogId));
    } finally {
      setIsOpeningFilters(false);
    }
  }, [catalogId, dispatch, filters.length, isLoadingFilters]);

  // Загрузка продуктов
  const loadProducts = useCallback(
    async (
      isLoadMore: boolean = false,
      searchText: string = searchQuery,
      forceStorageId?: string,
      forceSubcategoryId?: string | null,
      sortOverride?: ProductSortId,
    ) => {
      if (isFetchingRef.current || !catalogId) return;

      isFetchingRef.current = true;

      try {
        const params: any = {
          isFavorite: false,
          categoryId: catalogId,
          offset: isLoadMore ? (currentPage + 1) * pageSize : 0,
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

        // Добавляем subCategoryId если выбрана подкатегория
        const effectiveSubcategoryId =
          forceSubcategoryId === undefined
            ? selectedSubcategoryId
            : forceSubcategoryId;

        if (effectiveSubcategoryId && effectiveSubcategoryId !== "all") {
          params.subCategoryId = effectiveSubcategoryId;
        }

        applyProductSortToParams(params, sortOverride ?? sortBy);

        console.log("Loading products:", {
          isLoadMore,
          offset: params.offset,
          search: searchText,
          subcategoryId: effectiveSubcategoryId,
          params,
        });

        dispatch(
          getProductList({
            params,
            isLoadMore,
          }),
        );
      } catch (error) {
        console.error("Ошибка загрузки:", error);
      } finally {
        setTimeout(() => {
          isFetchingRef.current = false;
        }, 500);
      }
    },
    [
      catalogId,
      currentPage,
      search,
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

  useEffect(() => {
    if (!catalogId) return;
    const initialSearchQuery =
      typeof search === "string" ? decodeURIComponent(search).trim() : "";

    dispatch(clearProducts());
    void loadProducts(false, initialSearchQuery);
    dispatch(getCategoryFilters(catalogId));
  }, [catalogId, dispatch, isPromo, me?.storageId, search]);
  // Обработчик смены подкатегории
  const handleSubcategorySelect = useCallback(
    (subcategoryId: string | null) => {
      const nextSubcategoryId = subcategoryId === "all" ? null : subcategoryId;
      dispatch(setSelectedSubcategory(nextSubcategoryId));

      scrollViewRef.current?.scrollTo({ y: 0, animated: false });

      // Грузим по явно выбранной подкатегории, без ожидания Redux-state
      void loadProducts(false, searchQuery, undefined, nextSubcategoryId);
    },
    [dispatch, loadProducts, searchQuery],
  );

  // Эффект для сброса выбранной подкатегории при монтировании
  useEffect(() => {
    // При первом открытии сбрасываем выбранную подкатегорию
    dispatch(setSelectedSubcategory(null));
  }, [dispatch]);

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
    if (catalogId) {
      console.log("Search submitted:", effectiveSearch);
      scrollViewRef.current?.scrollTo({ y: 0, animated: false });
      loadProducts(false, effectiveSearch);
    }
  }, [catalogId, searchQuery, loadProducts]);

  // Обработчик возврата
  const handleBack = () => {
    // router.back();
    router.navigate("/dashboard");
  };

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
    closeModalWithAnimation();

    // Перезагружаем товары с новыми фильтрами
    if (catalogId) {
      setTimeout(() => {
        scrollViewRef.current?.scrollTo({ y: 0, animated: false });
        loadProducts(false, searchQuery);
      }, 300);
    }
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
          // belowTitleRow={<TemplatePickerBanner />}
          content={
            <SearchInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Найдите товар"
              isActiveButton={false}
              onSubmitEditing={handleSearchSubmit}
              ref={searchInputRef}
            />
          }
        />
        <View style={styles.mainContainer}>
          <ScrollView
            ref={scrollViewRef}
            style={styles.container}
            showsVerticalScrollIndicator={false}
            onScroll={handleScroll}
            scrollEventThrottle={100}
            contentContainerStyle={styles.scrollContent}
          >
        <TemplatePickerBanner />
            
            <ThemedView
              style={styles.themeContainer}
              lightColor={"#FFFFFF"}
              darkColor="#040508"
            >
              {/* Сортировка и фильтры */}
              <View style={styles.sortFilterRow}>
                <TouchableOpacity
                  style={styles.sortButton}
                  onPress={() => setShowSortModal(true)} // Открываем модалку
                >
                  <SortIcon
                    stroke={isDarkMode ? "#FBFCFF" : "#1B1B1C"}
                    fill={isDarkMode ? "#FBFCFF" : "#1B1B1C"}
                  />
                  <ThemedText style={styles.sortButtonText}>
                    {getCurrentSortLabel()}
                  </ThemedText>
                </TouchableOpacity>

                {/* Кнопка фильтров остается без изменений */}
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

              {/* Подкатегории (если они есть) */}
              {subcategoriesFromProps.length > 0 && (
                <View style={styles.subcategoriesWrapper}>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={styles.subcategoriesContainer}
                    contentContainerStyle={styles.subcategoriesContent}
                  >
                    {/* Кнопка "Все" */}
                    <TouchableOpacity
                      key="all"
                      style={[
                        styles.subcategoryButton,
                        selectedSubcategoryId === null &&
                          styles.subcategoryButtonActive,
                        // Для темной темы: фон для невыбранных
                        isDarkMode &&
                          !(selectedSubcategoryId === null) && {
                            backgroundColor: "#202022",
                          },
                        // Для темной темы: фон для выбранных
                        isDarkMode &&
                          selectedSubcategoryId === null && {
                            backgroundColor: "#3881EE",
                          },
                      ]}
                      onPress={() => handleSubcategorySelect("all")}
                    >
                      <ThemedText
                        style={[
                          styles.subcategoryText,
                          selectedSubcategoryId === null &&
                            styles.subcategoryTextActive,
                          // Для темной темы: текст всегда #FBFCFF
                          isDarkMode && {
                            color: "#FBFCFF",
                          },
                        ]}
                      >
                        Все
                      </ThemedText>
                    </TouchableOpacity>

                    {/* Подкатегории из props */}
                    {subcategoriesFromProps.map((subcategory: any) => (
                      <TouchableOpacity
                        key={subcategory.id}
                        style={[
                          styles.subcategoryButton,
                          selectedSubcategoryId === subcategory.id &&
                            styles.subcategoryButtonActive,
                          // Для темной темы: фон для невыбранных
                          isDarkMode &&
                            !(selectedSubcategoryId === subcategory.id) && {
                              backgroundColor: "#202022",
                            },
                          // Для темной темы: фон для выбранных
                          isDarkMode &&
                            selectedSubcategoryId === subcategory.id && {
                              backgroundColor: "#3881EE",
                            },
                        ]}
                        onPress={() => handleSubcategorySelect(subcategory.id)}
                      >
                        <ThemedText
                          style={[
                            styles.subcategoryText,
                            selectedSubcategoryId === subcategory.id &&
                              styles.subcategoryTextActive,
                            // Для темной темы: текст всегда #FBFCFF
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
              {/* { !me?.storageId ? */}
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

              {/* : null
              } */}
              <TownSelectionModal
                visible={showTownModal}
                onClose={() => setShowTownModal(false)}
                storageId={me?.storageId}
                onTownSelected={(newStorageId) => {
                  // ← ПОЛУЧАЕМ НОВЫЙ ID
                  console.log(
                    "Получили новый storageId из модалки:",
                    newStorageId,
                  );
                  // Используем новый ID напрямую, не ждем Redux!
                  loadProducts(false, searchQuery, newStorageId); // ← передаем в loadProducts
                }}
              />
              {/* Индикатор начальной загрузки */}
              {isLoading && !isLoadingMore && products.length === 0 && (
                <View style={styles.initialLoadingContainer}>
                  <ActivityIndicator size="large" color="#203686" />
                  <ThemedText style={styles.initialLoadingText}>
                    Загрузка товаров...
                  </ThemedText>
                </View>
              )}

              {/* Сетка товаров */}
              {!isLoading && products.length > 0 && (
                <View style={styles.productsGrid}>
                  {products.map((product) => (
                    <ProductCard
                      key={`${product.id}`}
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
                  ))}
                </View>
              )}

              {/* Сообщение если товаров нет */}
              {!isLoading && products.length === 0 && (
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
              )}

              {/* Индикатор загрузки следующей страницы */}
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

        {/* Модальное окно фильтров */}
        <Modal
          visible={showFilters}
          animationType="none"
          transparent={true}
          onRequestClose={closeModalWithAnimation}
          presentationStyle="overFullScreen"
          statusBarTranslucent={true}
        >
          <TouchableWithoutFeedback onPress={handleOverlayPress}>
            <View style={styles.modalOverlay}>
              <TouchableWithoutFeedback>
                <Animated.View
                  style={[
                    styles.modalContainer,
                    isDarkMode
                      ? {
                          backgroundColor: "#202022",
                        }
                      : {
                          backgroundColor: "#FFFFFF",
                        },
                    {
                      transform: [{ translateY: modalTranslateY }],
                    },
                  ]}
                >
                  {/* Защелка для свайпа */}
                  <TouchableOpacity
                    style={styles.swipeHandleContainer}
                    activeOpacity={0.7}
                    onPress={handleSwipeHandlePress}
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

                  {((isLoadingFilters || isOpeningFilters) && filters.length === 0) ? (
                    <View style={styles.filtersFullScreenLoadingContainer}>
                      <ActivityIndicator size="large" color="#203686" />
                      <ThemedText style={styles.filtersLoadingText}>
                        Загружаем фильтры...
                      </ThemedText>
                    </View>
                  ) : (
                    <ScrollView
                      ref={modalScrollViewRef}
                      style={styles.modalContent}
                      showsVerticalScrollIndicator={true}
                      bounces={true}
                      scrollEventThrottle={16}
                    >
                    {/* Фильтр по цене */}
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

                    {/* Индикатор загрузки фильтров */}
                    {isLoadingFilters && (
                      <View style={styles.filtersLoadingContainer}>
                        <ActivityIndicator size="small" color="#203686" />
                        <ThemedText style={styles.filtersLoadingText}>
                          Загрузка фильтров...
                        </ThemedText>
                      </View>
                    )}

                    {/* Динамические фильтры с бекенда */}
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

                    {/* Сообщение если нет фильтров */}
                    {!isLoadingFilters && filters.length === 0 && (
                      <View style={styles.noFiltersContainer}>
                        <ThemedText style={styles.noFiltersText}>
                          Нет доступных фильтров
                        </ThemedText>
                      </View>
                    )}

                    {/* Добавляем отступ внизу чтобы контент не прилипал к кнопке */}
                      <View style={styles.modalBottomSpacer} />
                    </ScrollView>
                  )}

                  {/* Кнопка применения */}
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
                      {appliedFiltersCount > 0
                        ? `(${appliedFiltersCount})`
                        : ""}
                    </ThemedText>
                  </TouchableOpacity>
                </Animated.View>
              </TouchableWithoutFeedback>
            </View>
          </TouchableWithoutFeedback>
        </Modal>
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
        <Modal
          visible={showSortModal}
          animationType="none"
          transparent={true}
          onRequestClose={closeSortModalWithAnimation}
          presentationStyle="overFullScreen"
          statusBarTranslucent={true}
        >
          <TouchableWithoutFeedback onPress={handleSortOverlayPress}>
            <View style={styles.modalOverlay}>
              <TouchableWithoutFeedback>
                <Animated.View
                  style={[
                    styles.modalContainer,
                    isDarkMode && {
                      backgroundColor: "#202022",
                    },
                    {
                      transform: [{ translateY: sortModalTranslateY }],
                    },
                  ]}
                >
                  {/* Защелка для свайпа */}
                  <TouchableOpacity
                    style={styles.swipeHandleContainer}
                    activeOpacity={0.7}
                    onPress={closeSortModalWithAnimation}
                  >
                    <View style={styles.swipeHandle} />
                  </TouchableOpacity>

                  <View style={styles.modalHeader}>
                    <TouchableOpacity>
                      {/* Пустая слева для симметрии */}
                    </TouchableOpacity>

                    <ThemedText style={styles.modalTitle}>
                      Сортировка
                    </ThemedText>

                    <TouchableOpacity onPress={closeSortModalWithAnimation}>
                      {/* Пустая справа для симметрии */}
                    </TouchableOpacity>
                  </View>

                  <ScrollView
                    style={styles.sortOptionsContainer}
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
                              sortBy === option.id &&
                                styles.sortOptionRadioSelected,
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
                </Animated.View>
              </TouchableWithoutFeedback>
            </View>
          </TouchableWithoutFeedback>
        </Modal>
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
  subcategoryText: {
    fontFamily: "Montserrat",
    fontSize: 14,
    color: "#1B1B1C",
  },
  subcategoryTextActive: {
    color: "#FFFFFF",
    fontWeight: "600",
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
    maxHeight: "85%",
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
    maxHeight: "70%",
  },
  modalBottomSpacer: {
    height: 100,
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
  applyButton: {
    backgroundColor: "#203686",
    marginHorizontal: 20,
    marginVertical: 20,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
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
