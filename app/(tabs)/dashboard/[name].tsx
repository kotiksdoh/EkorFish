// CatalogDetailScreen.tsx
import { FilterXsIcon, SortIcon } from '@/assets/icons/icons';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { ModalHeader } from '@/features/auth/ui/Header';
import SearchInput from '@/features/auth/ui/components/SearchInput';
import {
  AddToCart,
  clearSelectedFilters,
  clearSelectedSubcategory,
  getCategoryFilters,
  getProductList,
  setSelectedSubcategory,
  toggleFilterSelection
} from '@/features/catalog/catalogSlice';
import { AddToCartModal } from '@/features/shared/ui/AddToCartModal';
import { ProductCard } from '@/features/shared/ui/ProductCard';
import AnimatedTextInput from '@/features/shared/ui/components/CustomInput';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
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
} from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export default function CatalogDetailScreen() {
  const { catalogId, catalogName, children } = useLocalSearchParams<{
    catalogId: string;
    catalogName: string;
    children?: string; // Добавляем children
  }>();

  // Парсим children из строки
  const parsedChildren = children ? JSON.parse(decodeURIComponent(children)) : [];
  
  // Преобразуем в массив подкатегорий
  const subcategoriesFromProps = parsedChildren.map((child: any) => ({
    id: child.id,
    name: child.name,
    description: child.description || '',
    imageUrl: child.imageUrl || '',
  }));

  // Состояния
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState('alphabet');
  const [priceRange, setPriceRange] = useState({
    min: '',
    max: '',
  });

  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [showAddToCartModal, setShowAddToCartModal] = useState(false);

  const pageSize = 10;

  // Анимация для свайпа модалки
  const modalTranslateY = useRef(new Animated.Value(screenHeight)).current;
  const [isClosing, setIsClosing] = useState(false);

  // Получаем состояние из Redux
  const products = useAppSelector((state) => state.catalog.products);
  const isLoading = useAppSelector((state) => state.catalog.isLoading);
  const isLoadingMore = useAppSelector((state) => state.catalog.isLoadingMore);
  const isLoadingFilters = useAppSelector((state) => state.catalog.isLoadingFilters);
  const hasMore = useAppSelector((state) => state.catalog.hasMore);
  const currentPage = useAppSelector((state) => state.catalog.currentPage);
  const filters = useAppSelector((state) => state.catalog.filters);
  const selectedFilterIds = useAppSelector((state) => state.catalog.selectedFilterIds);
  const selectedSubcategoryId = useAppSelector((state) => state.catalog.selectedSubcategoryId);
  
  // Подсчет примененных фильтров
  const appliedFiltersCount = selectedFilterIds.length + (priceRange.min ? 1 : 0) + (priceRange.max ? 1 : 0);
  
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

  // Загрузка продуктов
  const loadProducts = useCallback(async (isLoadMore: boolean = false, searchText: string = searchQuery) => {
    if (isFetchingRef.current || !catalogId) return;
    
    isFetchingRef.current = true;
    
    try {
      const params: any = {
        isFavorite: false,
        categoryId: catalogId, 
        offset: isLoadMore ? (currentPage + 1) * pageSize : 0,
        count: pageSize,
      };
      
      if (searchText) {
        params.Search = searchText;
      }
      
      // Преобразуем в числа
      const minPrice = priceRange.min ? parseFloat(priceRange.min) : undefined;
      const maxPrice = priceRange.max ? parseFloat(priceRange.max) : undefined;
      
      if (minPrice !== undefined && !isNaN(minPrice)) {
        params.MinPrice = minPrice;
      }
      if (maxPrice !== undefined && !isNaN(maxPrice)) {
        params.MaxPrice = maxPrice;
      }
      
      // Добавляем subCategoryId если выбрана подкатегория
      if (selectedSubcategoryId && selectedSubcategoryId !== 'all') {
        params.subCategoryId = selectedSubcategoryId;
      }
      
      console.log('Loading products:', { 
        isLoadMore, 
        offset: params.offset, 
        search: searchText,
        subcategoryId: selectedSubcategoryId,
        params
      });
      
      dispatch(getProductList({ 
        params,
        isLoadMore
      }));
      
    } catch (error) {
      console.error('Ошибка загрузки:', error);
    } finally {
      setTimeout(() => {
        isFetchingRef.current = false;
      }, 500);
    }
  }, [catalogId, currentPage, dispatch, priceRange, searchQuery, selectedSubcategoryId]);

  // Загрузка фильтров при загрузке компоненты
  useEffect(() => {
    if (catalogId) {
      console.log('Loading filters for catalog:', catalogId);
      dispatch(getCategoryFilters(catalogId));
    }
  }, [catalogId, dispatch]);

  // Эффект для начальной загрузки продуктов
  useEffect(() => {
    if (catalogId) {
      console.log('Initial load for catalog:', catalogId);
      loadProducts(false, '');
    }
  }, [catalogId]);

  // Обработчик смены подкатегории
  const handleSubcategorySelect = useCallback((subcategoryId: string | null) => {
    if (subcategoryId === 'all') {
      dispatch(setSelectedSubcategory(null));
    } else {
      dispatch(setSelectedSubcategory(subcategoryId));
    }
    
    scrollViewRef.current?.scrollTo({ y: 0, animated: false });
    
    // Загружаем продукты через небольшой таймаут чтобы Redux успел обновиться
    setTimeout(() => {
      loadProducts(false, searchQuery);
    }, 100);
  }, [dispatch, loadProducts, searchQuery]);

  // Эффект для сброса выбранной подкатегории при монтировании
  useEffect(() => {
    // При первом открытии сбрасываем выбранную подкатегорию
    dispatch(setSelectedSubcategory(null));
  }, [dispatch]);

  const handleAddToCartPress = (product: any) => {
    setSelectedProduct(product);
    setShowAddToCartModal(true);
  };

  const handleAddToCart = (productId: string, optionId: string, quantity: number) => {
    console.log('Добавлено в корзину:', {
      productId,
      optionId,
      quantity,
    });
    dispatch(AddToCart({productId: productId, productPurchaseOptionId: optionId, quantity: quantity}))
  };

  // Обработчик прокрутки
  const handleScroll = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const nativeEvent = event.nativeEvent;
    
    if (!nativeEvent || 
        !nativeEvent.layoutMeasurement || 
        !nativeEvent.contentOffset || 
        !nativeEvent.contentSize ||
        isLoading || 
        isLoadingMore || 
        !hasMore ||
        isFetchingRef.current) {
      return;
    }
    
    const { layoutMeasurement, contentOffset, contentSize } = nativeEvent;
    const paddingToBottom = 50;
    
    const distanceFromBottom = contentSize.height - layoutMeasurement.height - contentOffset.y;
    
    if (distanceFromBottom < paddingToBottom) {
      console.log('Loading more...');
      loadProducts(true, searchQuery);
    }
  }, [isLoading, isLoadingMore, hasMore, loadProducts, searchQuery]);

  // Обработчик поиска
  const handleSearchSubmit = useCallback(() => {
    if (catalogId) {
      console.log('Search submitted:', searchQuery);
      scrollViewRef.current?.scrollTo({ y: 0, animated: false });
      loadProducts(false, searchQuery);
    }
  }, [catalogId, searchQuery, loadProducts]);

  // Обработчик возврата
  const handleBack = () => {
    // router.back();
    router.navigate('/dashboard')
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
    setPriceRange({ min: '', max: '' });
    loadProducts(false, searchQuery);
  };

  // Сброс подкатегории
  const resetSubcategory = () => {
    dispatch(clearSelectedSubcategory());
    loadProducts(false, searchQuery);
  };

  // Сортировка продуктов
  const getSortedProducts = useCallback(() => {
    if (!products || products.length === 0) return [];
    
    const sorted = [...products];
    
    switch (sortBy) {
      case 'alphabet':
        return sorted.sort((a, b) => a.name.localeCompare(b.name));
      case 'priceAsc':
        return sorted.sort((a, b) => a.pricePerKg - b.pricePerKg);
      case 'priceDesc':
        return sorted.sort((a, b) => b.pricePerKg - a.pricePerKg);
      default:
        return sorted;
    }
  }, [products, sortBy]);

  const sortedProducts = getSortedProducts();

  // Рендер элемента фильтра
  const renderFilterItem = (filterOption: any, filterGroupId: string) => (
    <TouchableOpacity
      key={filterOption.id}
      style={[
        styles.filterItem, 
        isFilterSelected(filterOption.id) && styles.filterItemSelected
      ]}
      onPress={() => handleFilterToggle(filterOption.id)}
    >
      <ThemedText style={styles.filterItemText}>{filterOption.value}</ThemedText>
    </TouchableOpacity>
  );

  return (
    <SafeAreaProvider>
      <ThemedView style={styles.safeArea} lightColor={'#EBEDF0'} darkColor='#040508'>
        <ModalHeader
          title={catalogName || 'Каталог'}
          showBackButton={true}
          onBackPress={handleBack}
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
            <ThemedView style={styles.themeContainer} lightColor={'#FFFFFF'} darkColor='#040508'>
              {/* Сортировка и фильтры */}
              <View style={styles.sortFilterRow}>
                <TouchableOpacity 
                  style={styles.sortButton}
                  onPress={() => {
                    if (sortBy === 'alphabet') setSortBy('priceAsc');
                    else if (sortBy === 'priceAsc') setSortBy('priceDesc');
                    else setSortBy('alphabet');
                  }}
                >
                  <SortIcon/>
                  <ThemedText style={styles.sortButtonText}>
                    {sortBy === 'alphabet' ? 'По алфавиту' : 
                     sortBy === 'priceAsc' ? 'По цене (возр.)' : 'По цене (убыв.)'}
                  </ThemedText>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={styles.filterButton}
                  onPress={() => setShowFilters(true)}
                >
                  <View>
                    {appliedFiltersCount > 0 && (
                      <View style={styles.filterBadge}></View>
                    )}
                    <FilterXsIcon />
                  </View>
                  <ThemedText style={styles.filterButtonText}>Фильтры</ThemedText>
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
                        selectedSubcategoryId === null && styles.subcategoryButtonActive,
                      ]}
                      onPress={() => handleSubcategorySelect('all')}
                    >
                      <ThemedText
                        style={[
                          styles.subcategoryText,
                          selectedSubcategoryId === null && styles.subcategoryTextActive,
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
                          selectedSubcategoryId === subcategory.id && styles.subcategoryButtonActive,
                        ]}
                        onPress={() => handleSubcategorySelect(subcategory.id)}
                      >
                        <ThemedText
                          style={[
                            styles.subcategoryText,
                            selectedSubcategoryId === subcategory.id && styles.subcategoryTextActive,
                          ]}
                        >
                          {subcategory.name}
                        </ThemedText>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}

              {/* Индикатор начальной загрузки */}
              {isLoading && !isLoadingMore && sortedProducts.length === 0 && (
                <View style={styles.initialLoadingContainer}>
                  <ActivityIndicator size="large" color="#203686" />
                  <ThemedText style={styles.initialLoadingText}>Загрузка товаров...</ThemedText>
                </View>
              )}

              {/* Сетка товаров */}
              {!isLoading && sortedProducts.length > 0 && (
                <View style={styles.productsGrid}>
                  {sortedProducts.map((product) => (
                    <ProductCard
                      key={`${product.id}-${currentPage}-${selectedSubcategoryId}`}
                      id={product.id}
                      img={product.image}
                      name={product.name}
                      kgPrice={product.pricePerKg.toLocaleString('ru-RU')}
                      fullPrice={product.price.toLocaleString('ru-RU')}
                      isFrozen={product.isFrozen}
                      isFavorite={product.isFavorite}
                      productData={product} 
                      onAddToCartPress={handleAddToCartPress}
                    />
                  ))}
                </View>
              )}

              {/* Сообщение если товаров нет */}
              {!isLoading && sortedProducts.length === 0 && (
                <View style={styles.emptyContainer}>
                  <Image
                    source={require('../../../assets/icons/png/noItems.png')} 
                    style={styles.image}
                    resizeMode="contain"
                  />
                  <ThemedText lightColor='#1B1B1C' darkColor='#FBFCFF' style={styles.emptyText}>
                    Ничего не найдено
                  </ThemedText>
                  <ThemedText lightColor='#80818B' darkColor='#80818B' style={styles.emptyTextSecond}>
                    {`Попробуйте изменить\nили сбросить фильтры`}
                  </ThemedText>
                </View>
              )}

              {/* Индикатор загрузки следующей страницы */}
              {isLoadingMore && (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="small" color="#203686" />
                  <ThemedText style={styles.loadingText}>Загрузка...</ThemedText>
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
        >
          <TouchableWithoutFeedback onPress={handleOverlayPress}>
            <View style={styles.modalOverlay}>
              <TouchableWithoutFeedback>
                <Animated.View 
                  style={[
                    styles.modalContainer,
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
                    <TouchableOpacity >
                      {/* <ThemedText style={styles.modalCloseText}>Отмена</ThemedText> */}
                    </TouchableOpacity>
                    
                    <ThemedText style={styles.modalTitle}>Фильтры</ThemedText>
                    
                    <TouchableOpacity onPress={resetFilters}>
                      <ThemedText style={styles.modalResetText}>Сбросить</ThemedText>
                    </TouchableOpacity>
                  </View>

                  <ScrollView 
                    ref={modalScrollViewRef}
                    style={styles.modalContent}
                    showsVerticalScrollIndicator={true}
                    bounces={true}
                    scrollEventThrottle={16}
                  >
                    {/* Фильтр по цене */}
                    <View style={styles.filterSection}>
                      <ThemedText style={styles.filterSectionTitle}>Цена за кг</ThemedText>
                      <View style={styles.priceInputs}>
                        <View style={styles.priceInputContainer}>
                          <AnimatedTextInput
                            placeholder="От"
                            placeholderTextColor="#80818B"
                            value={priceRange.min}
                            onChangeText={(text) => setPriceRange({ ...priceRange, min: text })}
                            keyboardType="numeric"
                          />
                        </View>
                        
                        <View style={styles.priceSeparator} />
                        
                        <View style={styles.priceInputContainer}>
                          <AnimatedTextInput
                            placeholder="До"
                            placeholderTextColor="#80818B"
                            value={priceRange.max}
                            onChangeText={(text) => setPriceRange({ ...priceRange, max: text })}
                            keyboardType="numeric"
                          />
                        </View>
                      </View>
                    </View>

                    {/* Индикатор загрузки фильтров */}
                    {isLoadingFilters && (
                      <View style={styles.filtersLoadingContainer}>
                        <ActivityIndicator size="small" color="#203686" />
                        <ThemedText style={styles.filtersLoadingText}>Загрузка фильтров...</ThemedText>
                      </View>
                    )}

                    {/* Динамические фильтры с бекенда */}
                    {!isLoadingFilters && filters.length > 0 && filters.map((filterGroup) => (
                      <View key={filterGroup.id} style={styles.filterSection}>
                        <ThemedText style={styles.filterSectionTitle}>
                          {filterGroup.name}
                        </ThemedText>
                        
                        <View style={styles.filterItems}>
                          {filterGroup.filterOptions.map((option) => 
                            renderFilterItem(option, filterGroup.id)
                          )}
                        </View>
                      </View>
                    ))}

                    {/* Сообщение если нет фильтров */}
                    {!isLoadingFilters && filters.length === 0 && (
                      <View style={styles.noFiltersContainer}>
                        <ThemedText style={styles.noFiltersText}>Нет доступных фильтров</ThemedText>
                      </View>
                    )}

                    {/* Добавляем отступ внизу чтобы контент не прилипал к кнопке */}
                    <View style={styles.modalBottomSpacer} />
                  </ScrollView>

                  {/* Кнопка применения */}
                  <TouchableOpacity style={styles.applyButton} onPress={applyFilters}>
                    <ThemedText style={styles.applyButtonText}>
                      Применить фильтры {appliedFiltersCount > 0 ? `(${appliedFiltersCount})` : ''}
                    </ThemedText>
                  </TouchableOpacity>
                </Animated.View>
              </TouchableWithoutFeedback>
            </View>
          </TouchableWithoutFeedback>
        </Modal>
        <AddToCartModal
        visible={showAddToCartModal}
        onClose={() => setShowAddToCartModal(false)}
        product={selectedProduct}
        onAddToCart={handleAddToCart}
      />
      </ThemedView>

    </SafeAreaProvider>
  );
};

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
    minHeight: '100%',
  },
  sortFilterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  sortButtonText: {
    marginLeft: 8,
    fontFamily: 'Montserrat',
    fontSize: 14,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    position: 'relative',
  },
  filterButtonText: {
    marginLeft: 8,
    fontFamily: 'Montserrat',
    fontSize: 14,
  },
  filterBadge: {
    position: 'absolute',
    top: 1,
    right: -1,
    backgroundColor: '#FF3B30',
    borderRadius: 10,
    minWidth: 6,
    maxWidth: 6,
    width: 6,
    height: 6,
    zIndex: 1,
    alignItems: 'center',
  },
  subcategoriesWrapper: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  subcategoriesContainer: {
    flexGrow: 0,
  },
  subcategoriesContent: {
    flexDirection: 'row',
    paddingRight: 16,
  },
  subcategoryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#F5F5F5',
    borderRadius: 6,
    marginRight: 8,
  },
  subcategoryButtonActive: {
    backgroundColor: '#203686',
  },
  subcategoryText: {
    fontFamily: 'Montserrat',
    fontSize: 14,
    color: '#1B1B1C',
  },
  subcategoryTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  initialLoadingContainer: {
    paddingVertical: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initialLoadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#80818B',
  },
  productsGrid: {
    marginTop: 16,
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    gap: 8,
    minHeight: 200,
    paddingBottom: 20,
  },
  emptyContainer: {
    paddingVertical: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    marginTop: 24,
    fontSize: 24,
    fontWeight: '600',
  },
  emptyTextSecond: {
    marginTop: 8,
    fontSize: 16,
  },
  loadingContainer: {
    paddingVertical: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 8,
    fontSize: 14,
    color: '#80818B',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '85%',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  swipeHandleContainer: {
    alignItems: 'center',
    paddingTop: 12,
    paddingBottom: 8,
    width: '100%',
  },
  swipeHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#E0E0E0',
    borderRadius: 2,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  modalCloseText: {
    fontFamily: 'Montserrat',
    fontSize: 16,
    color: '#80818B',
  },
  modalTitle: {
    fontFamily: 'Montserrat',
    fontSize: 18,
    fontWeight: '600',
  },
  modalResetText: {
    fontFamily: 'Montserrat',
    fontSize: 16,
    color: '#203686',
  },
  modalContent: {
    paddingHorizontal: 20,
    maxHeight: '70%',
  },
  modalBottomSpacer: {
    height: 100,
  },
  filterSection: {
    marginTop: 24,
  },
  filterSectionTitle: {
    fontFamily: 'Montserrat',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  priceInputs: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  priceInputContainer: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    overflow: 'hidden',
  },
  priceInput: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontFamily: 'Montserrat',
    fontSize: 16,
  },
  priceSeparator: {
    width: 16,
    height: 1,
    backgroundColor: '#80818B',
    marginHorizontal: 8,
  },
  filterItems: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  filterItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#ffffff',
    borderRadius: 6,
    marginRight: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#D8DADE',
    minWidth: 100,
  },
  filterItemSelected: {
    backgroundColor: '#ffffff',
    borderColor: '#203686',
  },
  filterItemText: {
    fontFamily: 'Montserrat',
    fontSize: 14,
    color: '#1B1B1C',
  },
  applyButton: {
    backgroundColor: '#203686',
    marginHorizontal: 20,
    marginVertical: 20,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  applyButtonText: {
    color: '#FFFFFF',
    fontFamily: 'Montserrat',
    fontSize: 16,
    fontWeight: '600',
  },
  filtersLoadingContainer: {
    paddingVertical: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filtersLoadingText: {
    marginTop: 8,
    fontSize: 14,
    color: '#80818B',
  },
  noFiltersContainer: {
    paddingVertical: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noFiltersText: {
    fontSize: 14,
    color: '#80818B',
  },
  image: {
    width: 86,
    height: 86,
  },
});