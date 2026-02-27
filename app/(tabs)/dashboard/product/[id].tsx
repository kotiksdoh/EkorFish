import { CheckCircleIcon, CloseCircleIcon } from '@/assets/icons/icons';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { ModalHeader } from '@/features/auth/ui/Header';
import { AddToCartModal } from '@/features/shared/ui/AddToCartModal';
import { getProduct, AddToCart } from '@/features/catalog/catalogSlice'; // Импортируем AddToCart
import { AutoSlider } from '@/features/home';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Dimensions,
  LayoutAnimation,
  LayoutChangeEvent,
  Platform,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  UIManager,
  View
} from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Animated } from 'react-native';

// Включаем LayoutAnimation для Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export default function ProductDetailScreen() {
  const { productId, productName } = useLocalSearchParams<{
    productId: string;
    productName?: string; 
  }>();

  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedPurchaseOptionIndex, setSelectedPurchaseOptionIndex] = useState(0);
  const [quantity, setQuantity] = useState(0);
  const [selectedTab, setSelectedTab] = useState<'description' | 'characteristics'>('description');
  const [tabContainerWidth, setTabContainerWidth] = useState(0);
  const [tabAnim] = useState(new Animated.Value(0));
  const [isCartModalVisible, setIsCartModalVisible] = useState(false);
  const [existingCartItem, setExistingCartItem] = useState<any>(null);
  
  const tabContainerRef = useRef<View>(null);

  const router = useRouter();
  const dispatch = useAppDispatch();
  const product = useAppSelector((state) => state.catalog.product);
  const cartItems = useAppSelector((state) => state.catalog.cart);
  const selectedPurchaseOption = product?.purchaseOptions?.[selectedPurchaseOptionIndex];
  const totalPrice = selectedPurchaseOption ? (quantity * selectedPurchaseOption.price) : 0;

  useEffect(() => {
    if (selectedPurchaseOption) {
      setQuantity(selectedPurchaseOption.minQuantity);
    }
  }, [selectedPurchaseOption]);
  
  const handleDecreaseQuantity = () => {
    if (!selectedPurchaseOption) return;
    const newQuantity = quantity - selectedPurchaseOption.step;
    if (newQuantity >= selectedPurchaseOption.minQuantity) {
      setQuantity(newQuantity);
    }
  };
  
  const handleIncreaseQuantity = () => {
    if (!selectedPurchaseOption) return;
    const newQuantity = quantity + selectedPurchaseOption.step;
    if (newQuantity <= selectedPurchaseOption.maxQuantity) {
      setQuantity(newQuantity);
    }
  };
  
  const handleBuyNow = () => {
    console.log('Buy now:', { productId, quantity, totalPrice });
  };

  const handleOpenCartModal = () => {
    // Ищем товар в корзине по ВСЕМ опциям, а не только первой
    let existingItem = null;
    
    if (product?.purchaseOptions) {
      for (const option of product.purchaseOptions) {
        const item = cartItems?.find(
          (item: any) => 
            item.productId === productId && 
            item.productPurchaseOptionId === option.id
        );
        if (item) {
          existingItem = item;
          // Устанавливаем выбранную опцию равной той, что в корзине
          const optionIndex = product.purchaseOptions.findIndex((opt: any) => opt.id === option.id);
          if (optionIndex !== -1) {
            setSelectedPurchaseOptionIndex(optionIndex);
          }
          break;
        }
      }
    }
    
    setExistingCartItem(existingItem);
    setIsCartModalVisible(true);
  };

  const handleAddToCart = (productId: string, optionId: string, quantity: number) => {
    console.log('Add to cart:', { productId, optionId, quantity });
    // ИСПРАВЛЕНО: Добавляем dispatch
    dispatch(AddToCart({
      productId: productId,
      productPurchaseOptionId: optionId,
      quantity: quantity
    }));
    setIsCartModalVisible(false);
  };

  const loadProduct = () => {
    dispatch(getProduct(productId));
  };

  useEffect(() => {
    if (productId) {
      console.log('Initial load for product:', productId);
      loadProduct();
    }
  }, [productId]);

  const handleBack = () => {
    router.back();
  };

  const toggleExpanded = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setIsExpanded(!isExpanded);
  };

  const handleTabChange = (tab: 'description' | 'characteristics') => {
    Animated.spring(tabAnim, {
      toValue: tab === 'description' ? 0 : 1,
      useNativeDriver: false,
      tension: 50,
      friction: 7,
    }).start();
    setSelectedTab(tab);
  };

  const handleTabContainerLayout = (event: LayoutChangeEvent) => {
    const { width } = event.nativeEvent.layout;
    const cleanWidth = width - 6;
    const tabWidth = cleanWidth / 2;
    setTabContainerWidth(tabWidth);
  };

  const indicatorPosition = tabAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, tabContainerWidth] as number[],
  });

  const needsExpandButton = product?.name && product.name.length > 40;

  const cartItemsForProduct = useMemo(() => {
    if (!product?.id) return [];
    return cartItems?.filter(
      (item: any) => item.productId === product.id
    ) || [];
  }, [cartItems, product]);
  
  const totalCartQuantity = useMemo(() => {
    if (!cartItemsForProduct.length) return null;
    return cartItemsForProduct.reduce((sum, item) => sum + item.quantity, 0);
  }, [cartItemsForProduct]);
  console.log('product?.images', product?.images)
  return (
    <SafeAreaProvider>
      <ThemedView style={styles.safeArea} lightColor={'#EBEDF0'} darkColor='#040508'>
        <ModalHeader
          showBackButton={true}
          onBackPress={handleBack}
          isProduct={true}
          productId={productId}
          isFavorite={product?.isFavorite}
        />
        
        <View style={styles.mainContainer}>
          <ScrollView 
            style={styles.container}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            <ThemedView style={styles.themeContainer} lightColor={'#FFFFFF'} darkColor='#040508'>
              <AutoSlider
                items={product?.images || []}
                autoPlayInterval={4000}
                showIndicators={true}
                isProduct={true}
              />
              
              <View style={styles.productNameWrapper}>
                <ThemedText 
                  style={styles.themeName} 
                  lightColor='#1B1B1C' 
                  darkColor='#FBFCFF'
                  numberOfLines={isExpanded ? undefined : 2}
                  ellipsizeMode="tail"
                >
                  {product?.name || ''}
                </ThemedText>
                
                {needsExpandButton && (
                  <TouchableOpacity 
                    style={styles.expandButton}
                    onPress={toggleExpanded}
                    activeOpacity={0.7}
                  >
                    <Ionicons 
                      name={isExpanded ? "chevron-up" : "chevron-forward"} 
                      size={20} 
                      color="#1B1B1C" 
                    />
                  </TouchableOpacity>
                )}
              </View>
            </ThemedView>
            
            <ThemedView style={styles.themeContainer} lightColor={'#FFFFFF'} darkColor='#040508'>
              <ThemedView lightColor={'#F2F4F7'} darkColor='#202022' style={styles.subContainer}>
                <ThemedText style={styles.subContainerName} lightColor={'#80818B'} darkColor='#FBFCFF80'>
                  Вид цены – упаковками
                </ThemedText>
                <ThemedText style={styles.subContainerPrice} lightColor={'#1B1B1C'} darkColor='#FBFCFF'>
                  {selectedPurchaseOption?.price?.toLocaleString('ru-RU')} ₽
                </ThemedText>
              </ThemedView>

              <ThemedView lightColor={'#F2F4F7'} darkColor='#202022' style={styles.subContainer}>
                <ThemedText style={styles.subContainerName} lightColor={'#80818B'} darkColor='#FBFCFF80'>
                  Наличие
                </ThemedText>
                {product?.stocks?.map((stock: any, index: number) => (
                  <View key={index} style={styles.subContainerMainSub}>
                    {stock.stockInfo !== 'Нет в наличии' ? (
                      <CheckCircleIcon/>
                    ) : (
                      <CloseCircleIcon/>
                    )}
                    <View style={styles.subContainerSubSub}>
                      <ThemedText style={styles.subContainerCity} lightColor={'#1B1B1C'} darkColor='#FBFCFF'>
                        {stock.name}
                      </ThemedText>
                      <ThemedText style={styles.subContainerCityInfo} lightColor={'#1B1B1C'} darkColor='#FBFCFF'>
                        {stock.stockInfo}
                      </ThemedText>
                    </View>
                  </View>
                ))}
              </ThemedView>
            </ThemedView>
            
            <ThemedView 
              style={styles.themeContainer} 
              lightColor={'#FFFFFF'} 
              darkColor='#040508'
            >
              <ThemedView 
                style={styles.tabsContainer} 
                lightColor={'#F2F4F7'} 
                darkColor='#202022'
                onLayout={handleTabContainerLayout}
                ref={tabContainerRef}
              >
                <Animated.View style={[
                  styles.activeTabIndicator,
                  {
                    width: tabContainerWidth,
                    transform: [{ translateX: indicatorPosition }]
                  }
                ]} />
                
                <TouchableOpacity
                  style={[
                    styles.tabButton,
                    selectedTab === 'description' && styles.activeTabButton
                  ]}
                  onPress={() => handleTabChange('description')}
                  activeOpacity={0.7}
                >
                  <ThemedText 
                    style={[
                      styles.tabText,
                      selectedTab === 'description' && styles.activeTabText
                    ]}
                    lightColor={selectedTab === 'description' ? '#1B1B1C' : '#80818B'}
                    darkColor={selectedTab === 'description' ? '#FBFCFF' : '#FBFCFF80'}
                  >
                    Описание
                  </ThemedText>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[
                    styles.tabButton,
                    selectedTab === 'characteristics' && styles.activeTabButton
                  ]}
                  onPress={() => handleTabChange('characteristics')}
                  activeOpacity={0.7}
                >
                  <ThemedText 
                    style={[
                      styles.tabText,
                      selectedTab === 'characteristics' && styles.activeTabText
                    ]}
                    lightColor={selectedTab === 'characteristics' ? '#1B1B1C' : '#80818B'}
                    darkColor={selectedTab === 'characteristics' ? '#FBFCFF' : '#FBFCFF80'}
                  >
                    Характеристика
                  </ThemedText>
                </TouchableOpacity>
              </ThemedView>
              
              <View style={styles.tabContent}>
                {selectedTab === 'description' ? (
                  product?.description ? (
                    <ThemedText 
                      style={styles.descriptionText}
                      lightColor='#1B1B1C'
                      darkColor='#FBFCFF'
                    >
                      {product.description}
                    </ThemedText>
                  ) : (
                    <ThemedText 
                      style={styles.descriptionText}
                      lightColor='#80818B'
                      darkColor='#FBFCFF80'
                    >
                      Описание товара отсутствует
                    </ThemedText>
                  )
                ) : (
                  <View style={styles.characteristicsContainer}>
                    <View style={styles.dates}>
                      <View style={styles.onceDate}>
                           <ThemedText style={styles.onceDateTitle} lightColor='#80818B'
                              darkColor='#FBFCFF80'>
                             Дата выработки
                           </ThemedText>
                            <ThemedText 
                              style={styles.onceDateValue}
                              lightColor='#1B1B1C'
                              darkColor='#FBFCFF'
                            >
                              {product?.dateFrom ? new Date(product.dateFrom).toLocaleDateString('ru-RU') : '—'}
                            </ThemedText>
                      </View>
                      <View style={styles.onceDate}>
                           <ThemedText style={styles.onceDateTitle} lightColor='#80818B'
                              darkColor='#FBFCFF80'>
                             Срок годности
                           </ThemedText>
                           <ThemedText 
                              style={styles.onceDateValue}
                              lightColor='#1B1B1C'
                              darkColor='#FBFCFF'
                            >
                              {product?.dateTo ? new Date(product.dateTo).toLocaleDateString('ru-RU') : '—'}
                            </ThemedText>
                      </View>
                    </View>

                    {product?.filterOptions && product.filterOptions.length > 0 ? (
                      <View style={styles.characteristicsList}>
                        {product.filterOptions.map((char: any, index: number) => (
                          <View key={index} style={styles.characteristicItem}>
                            <ThemedText 
                              style={styles.characteristicLabel}
                              lightColor='#80818B'
                              darkColor='#FBFCFF80'
                            >
                              {char.name}:
                            </ThemedText>
                            <ThemedText 
                              style={styles.characteristicValue}
                              lightColor='#1B1B1C'
                              darkColor='#FBFCFF'
                            >
                              {char.filterOptions[0]?.value || ''}
                            </ThemedText>
                          </View>
                        ))}
                      </View>
                    ) : (
                      <ThemedText 
                        style={styles.characteristicsText}
                        lightColor='#1B1B1C'
                        darkColor='#FBFCFF'
                      >
                        Характеристики товара отсутствуют
                      </ThemedText>
                    )}
                  </View>
                )}
              </View>
            </ThemedView>
          </ScrollView>

          {/* Нижняя панель с кнопкой добавления в корзину */}
          <View style={styles.bottomPanel}>
            <TouchableOpacity
              style={styles.addToCartButton}
              onPress={handleOpenCartModal}
              activeOpacity={0.9}
            >
              <View style={styles.addToCartContent}>
                <View style={styles.cartIconContainer}>
                  <Ionicons name="cart-outline" size={24} color="#FFFFFF" />
                  {totalCartQuantity > 0 && (
                    <View style={styles.cartBadge}>
                      <ThemedText style={styles.cartBadgeText}>
                        {totalCartQuantity > 10 ? '10+' : totalCartQuantity}
                      </ThemedText>
                    </View>
                  )}
                </View>
                <ThemedText style={styles.addToCartText}>
                  {cartItemsForProduct.length > 0 
                    ? `${cartItemsForProduct.length} товар(а) в корзине` 
                    : 'Добавить в корзину'}
                </ThemedText>
              </View>
            </TouchableOpacity>
          </View>

          {/* Модалка добавления в корзину */}
          <AddToCartModal
            visible={isCartModalVisible}
            onClose={() => {
              setIsCartModalVisible(false);
              setExistingCartItem(null);
            }}
            product={product}
            onAddToCart={handleAddToCart}
            existingCartItem={existingCartItem}
          />
        </View>
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
    position: 'relative',
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 100, // Отступ для нижней панели
  },
  themeContainer: {
    borderRadius: 24,
    marginTop: 10,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  productNameWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 20,
    marginBottom: 16,
  },
  themeName: {
    fontWeight: '600',
    fontSize: 20,
    lineHeight: 24,
    flex: 1,
    marginRight: 8,
    paddingRight: 4,
  },
  expandButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    // backgroundColor: '#F2F2F7',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  productContent: {
    marginTop: 8,
  },
  productDescription: {
    fontSize: 16,
    lineHeight: 22,
    marginTop: 8,
  },
  subContainer: {
    display: 'flex',
    flexDirection: 'column',
    borderRadius: 16,
    padding: 16,
    gap: 8,
    marginBottom: 8,
  },
  subContainerName: {
    fontWeight: '500',
    fontSize: 14,
  },
  subContainerPrice: {
    fontWeight: '600',
    fontSize: 20,
  },
  subContainerCityInfo: {
    fontWeight: '500',
    fontSize: 14,
  },
  subContainerCity: {
    fontWeight: '600',
    fontSize: 16,
  },
  subContainerMainSub: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    marginTop: 4,
  },
  subContainerSubSub: {
    flexDirection: 'column',
  },
  tabsContainer: {
    borderRadius: 12,
    padding: 3,
    backgroundColor: '#F2F4F7',
    flexDirection: 'row',
    position: 'relative',
    marginBottom: 16,
    ...Platform.select({
      ios: {
        backdropFilter: 'blur(40px)',
      },
    }),
  },
  tabButton: {
    flex: 1,
    backgroundColor: 'transparent',
    borderRadius: 7,
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  activeTabButton: {
    backgroundColor: 'transparent',
  },
  activeTabIndicator: {
    position: 'absolute',
    backgroundColor: '#FFFFFF',
    borderRadius: 7,
    height: '100%',
    top: 3,
    left: 3,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
  activeTabText: {
    fontWeight: '600',
  },
  tabContent: {
    marginTop: 8,
    minHeight: 100,
  },
  descriptionText: {
    fontSize: 16,
    lineHeight: 22,
  },
  characteristicsContainer: {
    gap: 12,
  },
  characteristicsTitle: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
  },
  characteristicsText: {
    fontSize: 16,
    lineHeight: 22,
    marginBottom: 12,
  },
  characteristicsList: {
    gap: 8,
  },
  characteristicItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  characteristicLabel: {
    fontSize: 14,
    fontWeight: '400',
  },
  characteristicValue: {
    fontSize: 14,
    fontWeight: '500',
  },
  dates: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  onceDate: {
    flexDirection: 'column',
  },
  onceDateTitle: {
    fontSize: 16,
    fontWeight: '500',
  },
  onceDateValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  // Стили для нижней панели
  bottomPanel: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,

  },
  addToCartButton: {
    backgroundColor: '#203686',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 24,
    width: '100%',
  },
  addToCartContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  addToCartText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Montserrat',
  },
  cartIconContainer: {
    position: 'relative',
    marginRight: 8,
  },
  cartBadge: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#FF3B30',
    borderRadius: 12,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  cartBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
    fontFamily: 'Montserrat',
  },
});