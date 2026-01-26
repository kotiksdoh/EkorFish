import { FilterXsIcon, SortIcon } from '@/assets/icons/icons';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { ModalHeader } from '@/features/auth/ui/Header';
import SearchInput from '@/features/auth/ui/components/SearchInput';
import { ProductCard } from '@/features/shared/ui/ProductCard';
import { useAppSelector } from '@/store/hooks';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  Dimensions,
  Modal,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
// import { BackArrowIcon, FilterIcon, SortIcon, CheckIcon } from '@/assets/icons/icons';

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

interface Product {
  id: number;
  name: string;
  price: number;
  pricePerKg: number;
  image: any;
  isFrozen?: boolean;
  country?: string;
  cut?: string;
  grade?: string;
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

  // Пример товаров
  // const products: Product[] = [
  //   {
  //     id: 1,
  //     name: 'Говяжья вырезка премиум',
  //     price: 4500,
  //     pricePerKg: 2500,
  //     image: '',
  //     isFrozen: false,
  //     country: 'Россия',
  //     cut: 'Стейк',
  //     grade: 'Высший сорт',
  //   },
  //   {
  //     id: 2,
  //     name: 'Стейк Рибай',
  //     price: 5200,
  //     pricePerKg: 3200,
  //     image: '',
  //     isFrozen: true,
  //     country: 'США',
  //     cut: 'Стейк',
  //     grade: 'Высший сорт',
  //   },
  //   // Добавьте больше товаров...
  // ];
  const products = useAppSelector((state) => state.catalog.products);
  useEffect(() => {
    
  })
  const router = useRouter();
  // Обработчики
  const handleBack = () => {
    router.back();
  };

  const handleFilterToggle = (sectionIndex: number, itemId: string) => {
    const updatedSections = [...filterSections];
    const section = updatedSections[sectionIndex];
    const item = section.items.find(item => item.id === itemId);

    if (item) {
      if (section.type === 'single') {
        // Для одиночного выбора снимаем все, кроме текущего
        section.items.forEach(i => {
          i.selected = i.id === itemId;
        });
      } else {
        // Для множественного инвертируем выбор
        item.selected = !item.selected;
      }

      setFilterSections(updatedSections);
    }
  };

  const applyFilters = () => {
    // Подсчет примененных фильтров
    let count = 0;
    filterSections.forEach(section => {
      count += section.items.filter(item => item.selected).length;
    });
    if (priceRange.min || priceRange.max) count++;

    setAppliedFiltersCount(count);
    setShowFilters(false);
    // Здесь должна быть логика применения фильтров к товарам
  };

  const resetFilters = () => {
    const resetSections = filterSections.map(section => ({
      ...section,
      items: section.items.map(item => ({ ...item, selected: false })),
    }));
    setFilterSections(resetSections);
    setPriceRange({ min: '', max: '' });
    setAppliedFiltersCount(0);
  };

  const renderFilterItem = ({ item, sectionIndex }: { item: FilterItem; sectionIndex: number }) => (
    <TouchableOpacity
      style={[styles.filterItem, item.selected && styles.filterItemSelected]}
      onPress={() => handleFilterToggle(sectionIndex, item.id)}
    >
      <ThemedText style={styles.filterItemText}>{item.name}</ThemedText>
      {/* {item.selected && <CheckIcon style={styles.checkIcon} />} */}
    </TouchableOpacity>
  );

  return (
    // <SafeAreaView style={styles.safeArea}>
    <SafeAreaProvider>
      <ThemedView lightColor={'#EBEDF0'} darkColor='#040508' >
      <ModalHeader
              title={catalogName || 'Каталог'}
              showBackButton={true}
              onBackPress={
                () =>{
                  handleBack()
                }
              }
              content={        
              <SearchInput 
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="Найдите товар"
                isActiveButton={false}
              //   useSafeArea={false}
              />
            }
            />
      <ScrollView 
        style={styles.container}
        showsVerticalScrollIndicator={false}
      >
        <ThemedView lightColor={'#FFFFFF'} darkColor='#040508' style={styles.themeContainer}>
        <View style={styles.sortFilterRow}>
          <TouchableOpacity 
            style={styles.sortButton}
            onPress={() => {
              const sortOptions = ['По алфавиту', 'По цене (возр.)', 'По цене (убыв.)'];
              setSortBy(sortBy === 'alphabet' ? 'priceAsc' : 'alphabet');
            }}
          >
            <SortIcon/>
            <ThemedText style={styles.sortButtonText}>По алфавиту</ThemedText>
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
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.categoriesContainer}
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

        {/* Сетка товаров */}
        <View style={styles.productsGrid}>
          {products.map((product) => (
              <ProductCard
                id={product.id}
                img={product.image}
                name={product.name}
                kgPrice={product.pricePerKg.toLocaleString('ru-RU')}
                fullPrice={product.price.toLocaleString('ru-RU')}
                isFrozen={product.isFrozen}
              />
          ))}
        </View>
        </ThemedView>
      </ScrollView>

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
    {/* </SafeAreaView> */}
    </ThemedView>
    </SafeAreaProvider>

  );
};

const styles = StyleSheet.create({
  safeArea: {
    // flex: 1,
    // backgroundColor: '#FFFFFF',
  },
  container: {
    height: '100%'
    // flex: 1,
  },
  themeContainer:{
    borderRadius: 24,
    marginTop: 10
  },

  searchContainer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
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
    // backgroundColor: '#F5F5F5',
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
    // backgroundColor: '#F5F5F5',
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
  categoriesContainer: {
    marginHorizontal: 16,
    // marginBottom: 56,
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
  productsGrid: {
    marginTop: 16,
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    gap: 8,
    // marginHorizontal: 12,
    // flexWrap: 'wrap',
    // paddingHorizontal: 8,
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
    // flex: 1,
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
  checkIcon: {
    marginLeft: 8,
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