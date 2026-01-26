import { FilterXsIcon, SortIcon } from '@/assets/icons/icons';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { ModalHeader } from '@/features/auth/ui/Header';
import SearchInput from '@/features/auth/ui/components/SearchInput';
import { getProductList } from '@/features/catalog/catalogSlice';
import { ProductCard } from '@/features/shared/ui/ProductCard';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  Modal,
  NativeSyntheticEvent,
  NativeScrollEvent,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

// Типы для фильтров
interface FilterItem {
  id: string;
  name: string;
  selected: boolean;
}

interface FilterSection {
  title: string;
  items: FilterItem[];
  type: 'single' | 'multiple';
}

const { width: screenWidth } = Dimensions.get('window');

export default function CatalogDetailScreen() {
  const { catalogId, catalogName } = useLocalSearchParams<{
    catalogId: string;
    catalogName: string;
  }>();

  // Состояния
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('Вырезка');
  const [showFilters, setShowFilters] = useState(false);
  const [appliedFiltersCount, setAppliedFiltersCount] = useState(0);
  const [sortBy, setSortBy] = useState('alphabet');

  // Фильтры
  const [filterSections, setFilterSections] = useState<FilterSection[]>([
    {
      title: 'Склад наличия',
      type: 'multiple',
      items: [
        { id: 'stock1', name: 'Основной склад', selected: false },
        { id: 'stock2', name: 'Склад А', selected: false },
        { id: 'stock3', name: 'Склад Б', selected: false },
      ],
    },
    {
      title: 'Страна происхождения',
      type: 'multiple',
      items: [
        { id: 'country1', name: 'Россия', selected: false },
        { id: 'country2', name: 'Бразилия', selected: false },
        { id: 'country3', name: 'Аргентина', selected: false },
        { id: 'country4', name: 'США', selected: false },
      ],
    },
    {
      title: 'Состояние',
      type: 'multiple',
      items: [
        { id: 'state1', name: 'Свежее', selected: false },
        { id: 'state2', name: 'Замороженное', selected: false },
        { id: 'state3', name: 'Охлажденное', selected: false },
      ],
    },
    {
      title: 'Сорт мяса',
      type: 'multiple',
      items: [
        { id: 'grade1', name: 'Высший сорт', selected: false },
        { id: 'grade2', name: 'Первый сорт', selected: false },
        { id: 'grade3', name: 'Второй сорт', selected: false },
      ],
    },
    {
      title: 'Нарезка/подготовка',
      type: 'multiple',
      items: [
        { id: 'cut1', name: 'Стейк', selected: false },
        { id: 'cut2', name: 'Фарш', selected: false },
        { id: 'cut3', name: 'Цельный кусок', selected: false },
        { id: 'cut4', name: 'На кости', selected: false },
      ],
    },
  ]);

  const [priceRange, setPriceRange] = useState({
    min: '',
    max: '',
  });

  // Категории
  const categories = [
    'Вырезка',
    'Говядина',
    'Глазной мускул',
    'Корейка',
    'Окорок',
    'Лопатка',
    'Грудинка',
    'Рулька',
  ];

  const pageSize = 10;

  // Получаем состояние из Redux
  const products = useAppSelector((state) => state.catalog.products);
  const isLoading = useAppSelector((state) => state.catalog.isLoading);
  const isLoadingMore = useAppSelector((state) => state.catalog.isLoadingMore);
  const hasMore = useAppSelector((state) => state.catalog.hasMore);
  const currentPage = useAppSelector((state) => state.catalog.currentPage);
  
  const dispatch = useAppDispatch();
  const searchInputRef = useRef<TextInput>(null);
  const router = useRouter();
  const scrollViewRef = useRef<ScrollView>(null);

  // Ref для предотвращения двойных запросов
  const isFetchingRef = useRef(false);

  // Загрузка продуктов
  const loadProducts = useCallback(async (isLoadMore: boolean = false, searchText: string = searchQuery) => {
    // Защита от двойных запросов
    if (isFetchingRef.current) return;
    
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
      
      if (priceRange.min) {
        params.MinPrice = parseFloat(priceRange.min);
      }
      if (priceRange.max) {
        params.MaxPrice = parseFloat(priceRange.max);
      }
      
      console.log('Loading products:', { isLoadMore, offset: params.offset, search: searchText });
      
      dispatch(getProductList({ 
        params,
        isLoadMore 
      }));
      
    } catch (error) {
      console.error('Ошибка загрузки:', error);
    } finally {
      // Сбрасываем флаг после небольшой задержки
      setTimeout(() => {
        isFetchingRef.current = false;
      }, 500);
    }
  }, [catalogId, currentPage, dispatch, priceRange, searchQuery]);

  // Эффект для начальной загрузки
  useEffect(() => {
    if (catalogId) {
      console.log('Initial load for catalog:', catalogId);
      loadProducts(false, '');
    }
  }, [catalogId]);

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
    const paddingToBottom = 50; // Отступ от нижнего края для начала загрузки
    
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
      // Сбросим позицию скролла наверх
      scrollViewRef.current?.scrollTo({ y: 0, animated: false });
      loadProducts(false, searchQuery);
    }
  }, [catalogId, searchQuery, loadProducts]);

  // Обработчик возврата
  const handleBack = () => {
    router.back();
  };

  // Переключение фильтров
  const handleFilterToggle = (sectionIndex: number, itemId: string) => {
    const updatedSections = [...filterSections];
    const section = updatedSections[sectionIndex];
    const item = section.items.find(item => item.id === itemId);

    if (item) {
      if (section.type === 'single') {
        section.items.forEach(i => {
          i.selected = i.id === itemId;
        });
      } else {
        item.selected = !item.selected;
      }

      setFilterSections(updatedSections);
    }
  };

  // Применение фильтров
  const applyFilters = () => {
    let count = 0;
    filterSections.forEach(section => {
      count += section.items.filter(item => item.selected).length;
    });
    if (priceRange.min || priceRange.max) count++;

    setAppliedFiltersCount(count);
    setShowFilters(false);
    
    // Применяем фильтры к товарам
    if (catalogId) {
      scrollViewRef.current?.scrollTo({ y: 0, animated: false });
      loadProducts(false, searchQuery);
    }
  };

  // Сброс фильтров
  const resetFilters = () => {
    const resetSections = filterSections.map(section => ({
      ...section,
      items: section.items.map(item => ({ ...item, selected: false })),
    }));
    setFilterSections(resetSections);
    setPriceRange({ min: '', max: '' });
    setAppliedFiltersCount(0);
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
  const renderFilterItem = ({ item, sectionIndex }: { item: FilterItem; sectionIndex: number }) => (
    <TouchableOpacity
      style={[styles.filterItem, item.selected && styles.filterItemSelected]}
      onPress={() => handleFilterToggle(sectionIndex, item.id)}
    >
      <ThemedText style={styles.filterItemText}>{item.name}</ThemedText>
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
                  <FilterXsIcon />
                  <ThemedText style={styles.filterButtonText}>Фильтры</ThemedText>
                  {appliedFiltersCount > 0 && (
                    <View style={styles.filterBadge}>
                      <ThemedText style={styles.filterBadgeText}>
                        {appliedFiltersCount}
                      </ThemedText>
                    </View>
                  )}
                </TouchableOpacity>
              </View>

              {/* Категории */}
              <View style={styles.categoriesWrapper}>
                <ScrollView 
                  horizontal 
                  showsHorizontalScrollIndicator={false}
                  style={styles.categoriesContainer}
                  contentContainerStyle={styles.categoriesContent}
                >
                  {categories.map((category) => (
                    <TouchableOpacity
                      key={category}
                      style={[
                        styles.categoryButton,
                        activeCategory === category && styles.categoryButtonActive,
                      ]}
                      onPress={() => setActiveCategory(category)}
                    >
                      <ThemedText
                        style={[
                          styles.categoryText,
                          activeCategory === category && styles.categoryTextActive,
                        ]}
                      >
                        {category}
                      </ThemedText>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

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
                      key={`${product.id}-${currentPage}`}
                      id={product.id}
                      img={product.image}
                      name={product.name}
                      kgPrice={product.pricePerKg.toLocaleString('ru-RU')}
                      fullPrice={product.price.toLocaleString('ru-RU')}
                      isFrozen={product.isFrozen}
                    />
                  ))}
                </View>
              )}

              {/* Сообщение если товаров нет */}
              {!isLoading && sortedProducts.length === 0 && (
                <View style={styles.emptyContainer}>
                  <ThemedText style={styles.emptyText}>Товары не найдены</ThemedText>
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
          animationType="slide"
          transparent={true}
          onRequestClose={() => setShowFilters(false)}
        >
          <View style={styles.modalOverlay}>
            <ThemedView style={styles.modalContainer}>
              <View style={styles.modalHeader}>
                <TouchableOpacity onPress={() => setShowFilters(false)}>
                  <ThemedText style={styles.modalCloseText}>Отмена</ThemedText>
                </TouchableOpacity>
                
                <ThemedText style={styles.modalTitle}>Фильтры</ThemedText>
                
                <TouchableOpacity onPress={resetFilters}>
                  <ThemedText style={styles.modalResetText}>Сбросить</ThemedText>
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.modalContent}>
                <View style={styles.filterSection}>
                  <ThemedText style={styles.filterSectionTitle}>Цена за кг, ₽</ThemedText>
                  <View style={styles.priceInputs}>
                    <View style={styles.priceInputContainer}>
                      <TextInput
                        style={styles.priceInput}
                        placeholder="От"
                        value={priceRange.min}
                        onChangeText={(text) => setPriceRange({ ...priceRange, min: text })}
                        keyboardType="numeric"
                      />
                    </View>
                    
                    <View style={styles.priceSeparator} />
                    
                    <View style={styles.priceInputContainer}>
                      <TextInput
                        style={styles.priceInput}
                        placeholder="До"
                        value={priceRange.max}
                        onChangeText={(text) => setPriceRange({ ...priceRange, max: text })}
                        keyboardType="numeric"
                      />
                    </View>
                  </View>
                </View>

                {/* Секции фильтров */}
                {filterSections.map((section, sectionIndex) => (
                  <View key={section.title} style={styles.filterSection}>
                    <ThemedText style={styles.filterSectionTitle}>
                      {section.title}
                    </ThemedText>
                    
                    <View style={styles.filterItems}>
                      {section.items.map((item) => (
                        <React.Fragment key={item.id}>
                          {renderFilterItem({ item, sectionIndex })}
                        </React.Fragment>
                      ))}
                    </View>
                  </View>
                ))}
              </ScrollView>

              {/* Кнопка применения */}
              <TouchableOpacity style={styles.applyButton} onPress={applyFilters}>
                <ThemedText style={styles.applyButtonText}>Применить фильтры</ThemedText>
              </TouchableOpacity>
            </ThemedView>
          </View>
        </Modal>
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
    top: -4,
    right: -4,
    backgroundColor: '#FF3B30',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  filterBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  categoriesWrapper: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  categoriesContainer: {
    flexGrow: 0,
  },
  categoriesContent: {
    flexDirection: 'row',
    paddingRight: 16,
  },
  categoryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#F5F5F5',
    borderRadius: 6,
    marginRight: 8,
  },
  categoryButtonActive: {
    backgroundColor: '#203686',
  },
  categoryText: {
    fontFamily: 'Montserrat',
    fontSize: 14,
    color: '#1B1B1C',
  },
  categoryTextActive: {
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
    fontSize: 16,
    color: '#80818B',
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
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
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
    paddingBottom: 20,
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
    backgroundColor: '#F5F5F5',
    borderRadius: 20,
    marginRight: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  filterItemSelected: {
    backgroundColor: '#E8F0FE',
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
  },
  applyButtonText: {
    color: '#FFFFFF',
    fontFamily: 'Montserrat',
    fontSize: 16,
    fontWeight: '600',
  },
});