// HeartScreen.tsx
import { SortIcon } from "@/assets/icons/icons";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { ModalHeader } from "@/features/auth/ui/Header";
import SearchInput from "@/features/auth/ui/components/SearchInput";
import {
  clearProducts,
  clearSelectedFilters,
  getCategoryFilters,
  getProductList,
  toggleFilterSelection,
} from "@/features/catalog/catalogSlice";
import { ProductCard } from "@/features/shared/ui/ProductCard";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
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
  View, useColorScheme
} from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";

const { width: screenWidth, height: screenHeight } = Dimensions.get("window");

export default function HeartScreen() {
  const colorScheme = useColorScheme();
//TODO
  const isDarkMode = colorScheme === "dark";
  // Состояния
  const [searchQuery, setSearchQuery] = useState("");
  const [showSortModal, setShowSortModal] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [selectedFilterGroup, setSelectedFilterGroup] = useState<any>(null);
  const [sortBy, setSortBy] = useState("alphabet");
  const [priceRange, setPriceRange] = useState({
    min: "",
    max: "",
  });

  const pageSize = 10;

  // Анимация для модалок
  const sortModalTranslateY = useRef(new Animated.Value(screenHeight)).current;
  const filterModalTranslateY = useRef(
    new Animated.Value(screenHeight),
  ).current;
  const [isClosingSortModal, setIsClosingSortModal] = useState(false);
  const [isClosingFilterModal, setIsClosingFilterModal] = useState(false);

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

  const dispatch = useAppDispatch();
  const searchInputRef = useRef<TextInput>(null);
  const router = useRouter();
  const scrollViewRef = useRef<ScrollView>(null);

  // Ref для предотвращения двойных запросов
  const isFetchingRef = useRef(false);

  // Опции сортировки
  const sortOptions = [
    { id: "alphabet", label: "По алфавиту" },
    { id: "priceAsc", label: "Дешевле" },
    { id: "priceDesc", label: "Дороже" },
    { id: "new", label: "Новые" },
    { id: "discount", label: "Со скидками" },
  ];

  // Функция для закрытия модалки сортировки с анимацией
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

  // Функция для закрытия модалки фильтров с анимацией
  const closeFilterModalWithAnimation = useCallback(() => {
    if (isClosingFilterModal) return;

    setIsClosingFilterModal(true);
    Animated.timing(filterModalTranslateY, {
      toValue: screenHeight,
      duration: 250,
      useNativeDriver: true,
    }).start(() => {
      setShowFilterModal(false);
      setSelectedFilterGroup(null);
      setIsClosingFilterModal(false);
    });
  }, [isClosingFilterModal]);

  // Обработчики нажатия на overlay
  const handleSortOverlayPress = useCallback(() => {
    if (!isClosingSortModal) {
      closeSortModalWithAnimation();
    }
  }, [isClosingSortModal, closeSortModalWithAnimation]);

  const handleFilterOverlayPress = useCallback(() => {
    if (!isClosingFilterModal) {
      closeFilterModalWithAnimation();
    }
  }, [isClosingFilterModal, closeFilterModalWithAnimation]);

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

  // Эффект для анимации появления модалки фильтров
  useEffect(() => {
    if (showFilterModal) {
      filterModalTranslateY.setValue(screenHeight);
      Animated.spring(filterModalTranslateY, {
        toValue: 0,
        useNativeDriver: true,
        damping: 20,
        stiffness: 90,
        mass: 0.8,
      }).start();
    } else {
      filterModalTranslateY.setValue(screenHeight);
    }
  }, [showFilterModal]);

  // Обработчик открытия модалки фильтра
  const handleFilterGroupPress = (filterGroup: any) => {
    setSelectedFilterGroup(filterGroup);
    setShowFilterModal(true);
  };

  // Проверка, есть ли в группе выбранные фильтры
  const hasSelectedFiltersInGroup = (filterGroup: any) => {
    return filterGroup.filterOptions.some((option: any) =>
      selectedFilterIds.includes(option.id),
    );
  };

  // Подсчет выбранных фильтров в группе
  const countSelectedFiltersInGroup = (filterGroup: any) => {
    return filterGroup.filterOptions.filter((option: any) =>
      selectedFilterIds.includes(option.id),
    ).length;
  };

  // Проверка выбран ли фильтр
  const isFilterSelected = (filterOptionId: string) => {
    return selectedFilterIds.includes(filterOptionId);
  };
  const me = useAppSelector((state) => state.auth.me);

  // Загрузка продуктов ИЗБРАННОГО
  const loadProducts = useCallback(
    async (isLoadMore: boolean = false, searchText: string = searchQuery) => {
      if (isFetchingRef.current) return;

      isFetchingRef.current = true;

      try {
        const params: any = {
          isFavorite: true,
          offset: isLoadMore ? (currentPage + 1) * pageSize : 0,
          count: pageSize,
          storageId: me?.storageId,
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

        // Добавляем выбранные фильтры если они есть
        if (selectedFilterIds.length > 0) {
          params.FilterIds = selectedFilterIds.join(",");
        }

        console.log("Loading favorite products:", {
          isLoadMore,
          offset: params.offset,
          search: searchText,
          filters: selectedFilterIds,
          params,
        });

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
    [currentPage, dispatch, priceRange, searchQuery, selectedFilterIds],
  );

  // Загрузка фильтров для избранного
  // useEffect(() => {
  //   console.log("Loading filters for favorites");
  //   dispatch(getCategoryFilters(null));
  // }, [dispatch]);

  // // Эффект для начальной загрузки продуктов
  // useEffect(() => {
  //   dispatch(clearProducts());
  //   console.log("Initial load for favorites");
  //   loadProducts(false, "");
  // }, []);

  useFocusEffect(
    useCallback(() => {
      console.log("Heart screen focused - loading favorites");

      // Очищаем предыдущие товары
      dispatch(clearProducts());

      // Загружаем избранное
      loadProducts(false, "");

      // Загружаем фильтры для избранного
      dispatch(getCategoryFilters(null));

      // Опционально: функция очистки при уходе с экрана
      return () => {
        console.log("Heart screen unfocused");
        // Можно отменить запросы если нужно
        // isFetchingRef.current = false;
      };
    }, []), // Добавьте зависимости
  );

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
  const handleSearchSubmit = useCallback(() => {
    console.log("Search submitted in favorites:", searchQuery);
    scrollViewRef.current?.scrollTo({ y: 0, animated: false });
    loadProducts(false, searchQuery);
  }, [searchQuery, loadProducts]);

  // Обработчик выбора сортировки
  const handleSortSelect = (sortId: string) => {
    setSortBy(sortId);
    closeSortModalWithAnimation();
  };

  // Обработчик переключения фильтра
  const handleFilterToggle = (filterOptionId: string) => {
    dispatch(toggleFilterSelection(filterOptionId));
  };

  // Сброс фильтров в текущей группе
  const resetCurrentGroupFilters = () => {
    if (selectedFilterGroup) {
      selectedFilterGroup.filterOptions.forEach((option: any) => {
        if (isFilterSelected(option.id)) {
          dispatch(toggleFilterSelection(option.id));
        }
      });
    }
  };

  // Применение фильтров
  const applyFilters = () => {
    closeFilterModalWithAnimation();
    // Перезагружаем товары с новыми фильтрами
    setTimeout(() => {
      scrollViewRef.current?.scrollTo({ y: 0, animated: false });
      loadProducts(false, searchQuery);
    }, 300);
  };

  // Сброс всех фильтров
  const resetAllFilters = () => {
    dispatch(clearSelectedFilters());
    setPriceRange({ min: "", max: "" });
    loadProducts(false, searchQuery);
  };

  // Сортировка продуктов
  const getSortedProducts = useCallback(() => {
    if (!products || products.length === 0) return [];

    const sorted = [...products];

    switch (sortBy) {
      case "alphabet":
        return sorted.sort((a, b) => a.name.localeCompare(b.name));
      case "priceAsc":
        return sorted.sort((a, b) => a.pricePerKg - b.pricePerKg);
      case "priceDesc":
        return sorted.sort((a, b) => b.pricePerKg - a.pricePerKg);
      case "new":
        return sorted.sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        );
      case "discount":
        return sorted.sort((a, b) => {
          const aHasDiscount = a.discount && a.discount > 0;
          const bHasDiscount = b.discount && b.discount > 0;
          if (aHasDiscount && !bHasDiscount) return -1;
          if (!aHasDiscount && bHasDiscount) return 1;
          return 0;
        });
      default:
        return sorted;
    }
  }, [products, sortBy]);

  const sortedProducts = getSortedProducts();

  // Получаем текущую выбранную сортировку для отображения
  const getCurrentSortLabel = () => {
    const option = sortOptions.find((opt) => opt.id === sortBy);
    return option ? option.label : "Сортировка";
  };

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
            backgroundColor: '#202022'
          },
          hasSelected && styles.filterGroupButtonActive,
          isDarkMode && hasSelected && {
            backgroundColor: '#3881EE'
          }
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
                    style={[styles.sortFilterButton,
                      isDarkMode && {
                        backgroundColor: '#202022'
                      }
                    ]}
                    onPress={() => setShowSortModal(true)}
                  >
                    <SortIcon stroke={isDarkMode ? '#FBFCFF' : "#1B1B1C"} fill={isDarkMode ? '#FBFCFF' : "#1B1B1C"} size={16} />
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

              {/* Индикатор начальной загрузки */}
              {isLoading && !isLoadingMore && sortedProducts.length === 0 && (
                <View style={styles.initialLoadingContainer}>
                  <ActivityIndicator size="large" color="#203686" />
                  <ThemedText style={styles.initialLoadingText}>
                    Загрузка избранного...
                  </ThemedText>
                </View>
              )}

              {/* Сетка товаров */}
              {!isLoading && sortedProducts.length > 0 && (
                <View style={styles.productsGrid}>
                  {sortedProducts.map((product) => (
                    <ProductCard
                      key={`${product.id}-${currentPage}`}
                      id={product.id}
                      img={product.image}
                      name={product.name}
                      kgPrice={product.pricePerKg.toLocaleString("ru-RU")}
                      fullPrice={product.price.toLocaleString("ru-RU")}
                      isFrozen={product.isFrozen}
                      isFavorite={product.isFavorite}
                    />
                  ))}
                </View>
              )}

              {/* Сообщение если товаров нет */}
              {!isLoading && sortedProducts.length === 0 && (
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

        {/* Модальное окно сортировки */}
        <Modal
          visible={showSortModal}
          animationType="none"
          transparent={true}
          onRequestClose={closeSortModalWithAnimation}
          statusBarTranslucent={true}
        >
          <TouchableWithoutFeedback onPress={handleSortOverlayPress}>
            <View style={styles.modalOverlay}>
              <TouchableWithoutFeedback>
                <Animated.View
                  style={[
                    styles.modalContainer,
                    isDarkMode && {
                      backgroundColor: '#202022'
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
                    <ThemedText style={styles.modalTitle}>
                      Показывать сначала
                    </ThemedText>
                    <TouchableOpacity onPress={closeSortModalWithAnimation}>
                      {/* <ThemedText style={styles.modalCloseText}>Готово</ThemedText> */}
                    </TouchableOpacity>
                  </View>

                  <View style={styles.sortOptionsContainer}>
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
                      <View style={[styles.sortOptionRadioInner, isDarkMode && { backgroundColor: "#FFFFFF" }]} />
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
                  </View>
                </Animated.View>
              </TouchableWithoutFeedback>
            </View>
          </TouchableWithoutFeedback>
        </Modal>

        {/* Модальное окно фильтров */}
        <Modal
          visible={showFilterModal}
          animationType="none"
          transparent={true}
          onRequestClose={closeFilterModalWithAnimation}
          statusBarTranslucent={true}
        >
          <TouchableWithoutFeedback onPress={handleFilterOverlayPress}>
            <View style={styles.modalOverlay}>
              <TouchableWithoutFeedback>
                <Animated.View
                  style={[
                    styles.modalContainer,
                    isDarkMode && {
                      backgroundColor: '#202022'
                    },
                    {
                      transform: [{ translateY: filterModalTranslateY }],
                    },
                  ]}
                >
                  {/* Защелка для свайпа */}
                  <TouchableOpacity
                    style={styles.swipeHandleContainer}
                    activeOpacity={0.7}
                    onPress={closeFilterModalWithAnimation}
                  >
                    <View style={styles.swipeHandle} />
                  </TouchableOpacity>

                  <View style={styles.modalHeader}>
                    <TouchableOpacity onPress={resetCurrentGroupFilters}>
                      <ThemedText style={styles.modalResetText}>
                        {/* {selectedFilterGroup && countSelectedFiltersInGroup(selectedFilterGroup) > 0 ? 'Сбросить' : ''} */}
                      </ThemedText>
                    </TouchableOpacity>

                    <ThemedText style={styles.modalTitle}>
                      {selectedFilterGroup?.name || "Фильтры"}
                    </ThemedText>

                    <TouchableOpacity onPress={closeFilterModalWithAnimation}>
                      {/* <ThemedText style={styles.modalCloseText}>Готово</ThemedText> */}
                    </TouchableOpacity>
                  </View>

                  <ScrollView
                    style={styles.filterOptionsContainer}
                    showsVerticalScrollIndicator={true}
                  >
                    {/*  */}
                    {selectedFilterGroup?.filterOptions.map((option: any) => (
                      <TouchableOpacity
                        key={option.id}
                        style={styles.filterOptionItem}
                        onPress={() => handleFilterToggle(option.id)}
                      >
                        <View
                          style={[
                            styles.radioOuter,
                            isFilterSelected(option.id) &&
                              styles.radioOuterSelected,
                              isDarkMode &&
                              isFilterSelected(option.id) && {
                                borderColor: "#4C94FF",
                              },
                          ]}
                        >
                          {isFilterSelected(option.id) && (
                            <View style={styles.radioInner} />
                          )}
                        </View>
                        <ThemedText
                          style={[
                            styles.filterOptionText,
                            isFilterSelected(option.id) &&
                              styles.filterOptionTextSelected,
                          ]}
                        >
                          {option.value}
                        </ThemedText>
                      </TouchableOpacity>
                    ))}
                    {/*  */}
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
  horizontalFiltersWrapper: {
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 16,
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
  sortFilterButtonText: {
    fontFamily: "Montserrat",
    fontSize: 14,
    color: "#1B1B1C",
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
    color: "#1B1B1C",
  },
  filterGroupTextActive: {
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
    marginTop: 8,
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
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    // borderBottomWidth: 1,
    // borderBottomColor: "#F0F0F0",
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
    fontFamily: "Montserrat",
    fontSize: 18,
    fontWeight: "600",
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
    maxHeight: "60%",
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
    color: "#1B1B1C",
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
