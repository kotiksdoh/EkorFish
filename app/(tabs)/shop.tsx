// app/shop.tsx
import { ArrowIconRight, CartIcon, IconCompany, InfoIcon, LikeIcon, TrashIcon } from '@/assets/icons/icons';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { loadCompanyFromStorage, selectCompany } from '@/features/auth/authSlice';
import { ModalHeader } from '@/features/auth/ui/Header';
import {
  getCart,
  removeFromCart,
  toggleCartItemFavorite,
  updateCartItemQuantitys
} from '@/features/catalog/catalogSlice';
import { PrimaryButton } from '@/features/home';
import CheckoutModal from '@/features/order/ui/Order';
import { baseUrl } from '@/features/shared/services/axios';
import { CompanySelectModal } from '@/features/shared/ui/CompanySelectModal';
import { CompanySelectionModal } from '@/features/shared/ui/CompanySelectionModalSmall';
import { CustomCheckbox } from '@/features/shared/ui/components/CustomCheckBox';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

interface CartItem {
  id: string;
  productId: string;
  productName: string;
  productImage?: string;
  productPurchaseOptionId: string;
  purchaseOptionStep: number;
  price: number;
  quantity: number;
  totalPrice: number;
  measureType: string;
  isFavorite: boolean;
}

export default function ShopScreen() {
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [checkoutModalVisible, setCheckoutModalVisible] = useState(false);

  const router = useRouter();
  const dispatch = useAppDispatch();
  const cartItems = useAppSelector((state) => state.catalog.cart) as CartItem[];
  const currentCompany = useAppSelector((state) => state.auth.currentCompany);
  const me = useAppSelector((state) => state.auth.me);
  const [companyModalVisible, setCompanyModalVisible] = useState(false);
  const [registerModalVisible, setRegisterModalVisible] = useState(false)

  useEffect(() => {
    console.log('currentCompany' , currentCompany)
  },[currentCompany])
  // Загрузка корзины при монтировании
  useEffect(() => {
    loadCart();
  }, []);

  useEffect(() => {
    if (me) {
      dispatch(loadCompanyFromStorage());
    }
  }, [me]);

  const handleSelectCompany = (company: any) => {
    dispatch(selectCompany(company));
    setCompanyModalVisible(false);
  };

  const handleOpenRegisterModal = () => {
    setRegisterModalVisible(true);
  };

  const loadCart = async () => {
    setIsLoading(true);
    try {
      await dispatch(getCart()).unwrap();
    } catch (error) {
      console.error('Error loading cart:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Выбрать/снять все
  const toggleSelectAll = () => {
    if (selectedItems.size === cartItems.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(cartItems.map(item => item.id)));
    }
  };

  // Выбрать/снять один товар
  const toggleSelectItem = (itemId: string) => {
    const newSelected = new Set(selectedItems);
    if (newSelected.has(itemId)) {
      newSelected.delete(itemId);
    } else {
      newSelected.add(itemId);
    }
    setSelectedItems(newSelected);
  };

  // Удалить товар
  const handleRemoveItem = async (cartItemId: string) => {
    try {
      await dispatch(removeFromCart(cartItemId)).unwrap();
      const newSelected = new Set(selectedItems);
      newSelected.delete(cartItemId);
      setSelectedItems(newSelected);
    } catch (error) {
      console.error('Error removing item:', error);
    }
  };

  // Изменить количество
  const handleUpdateQuantity = async (cartItemId: string, newQuantity: number, minQuantity: number, maxQuantity: number) => {
    if (newQuantity < minQuantity || newQuantity > maxQuantity) return;
    
    try {
      await dispatch(updateCartItemQuantitys({ 
        cartItemId, 
        quantity: newQuantity 
      })).unwrap()
    } catch (error) {
      console.error('Error updating quantity:', error);
    }
  };

  // Переключить избранное
  const handleToggleFavorite = async (cartItemId: string, productId: string, isFavorite: boolean) => {
    try {
      await dispatch(toggleCartItemFavorite({ 
        cartItemId, 
        productId, 
        isFavorite: !isFavorite 
      })).unwrap();
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  };

  // Подсчет итогов
  const totals = useMemo(() => {
    const selectedItemsArray = cartItems.filter(item => selectedItems.has(item.id));
    const totalItems = selectedItemsArray.length;
    const totalPrice = selectedItemsArray.reduce((sum, item) => sum + item.totalPrice, 0);
    const totalWeight = selectedItemsArray.reduce((sum, item) => sum + item.quantity, 0);

    return { totalItems, totalPrice, totalWeight };
  }, [cartItems, selectedItems]);

  // Форматирование цены
  const formatPrice = (price: number) => {
    return price.toLocaleString('ru-RU', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  // Рендер товара
  const renderCartItem = (item: CartItem) => {
    const isSelected = selectedItems.has(item.id);
    console.log('item', item)
    return (
      <ThemedView key={item.id} lightColor='#FFFFFF' style={styles.cartItem}>


        {/* Изображение товара */}
        <View style={styles.imageContainer}>
          <ThemedView lightColor='#FFFFFF' style={styles.checkboxPhoto}>
            <CustomCheckbox
                style={styles.checkboxPhoto}
                value={isSelected}
                onValueChange={() => toggleSelectItem(item.id)}
                lightColor={'#F2F4F7'}
                darkColor={'#202022'}
              /> 
          </ThemedView>
          {item.productImage ? (
            <Image
              source={{ uri: `${baseUrl}/${item.productImage || ''}` }}
              style={styles.image}
              contentFit="cover"
            />
          ) : (
            <Image
              source={require('@/assets/icons/png/noImage.png')} 
              style={styles.image}
              contentFit="cover"
            />
          )}
        </View>

        {/* Информация о товаре */}
        <View style={styles.dopItemInfo}>
        <View style={styles.itemInfo}>
          <ThemedText style={styles.productName} numberOfLines={2}>
            {item.productName}
          </ThemedText>
        
          <View style={styles.priceRow}>
            <ThemedText style={styles.pricePerUnit} numberOfLines={1}>
              {formatPrice(item.totalPrice)} ₽
            </ThemedText>
          </View>

          {/* Действия с товаром */}
        </View>
        <View style={styles.priceRow}>
          <ThemedText lightColor='#80818B' style={styles.quantityTextKg}>
            {item.price}₽ / {item.measureType === 'килограмм' ? 'кг' : 'шт'}  •  {item.quantity} {item.measureType === 'килограмм' ? 'кг' : 'шт'}
          </ThemedText>
        </View>

        <View style={styles.priceRow}>
            <TouchableOpacity
              style={styles.favoriteButton}
              onPress={() => handleToggleFavorite(item.id, item.productId, item.isFavorite)}
            >
              <ThemedView style={styles.favoriteTheme} lightColor='#F2F4F7'>
                <LikeIcon isFilled={item.isFavorite} />
              </ThemedView>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.deleteButton}
              onPress={() => handleRemoveItem(item.id)}
            >
              <ThemedView style={styles.favoriteTheme} lightColor='#F2F4F7'>
              <TrashIcon/>
              </ThemedView>
            </TouchableOpacity>

            <ThemedView style={styles.quantityControls}>
            <TouchableOpacity
              style={styles.quantityButton}
              onPress={() => handleUpdateQuantity(
                item.id, 
                item.quantity - item.purchaseOptionStep,
                item.purchaseOptionStep,
                Infinity
              )}
              disabled={item.quantity <= item.purchaseOptionStep}
            >
              <ThemedText style={styles.plusMinus}>-</ThemedText>
            </TouchableOpacity>
            
            <ThemedText style={styles.quantityText}>
              {item.quantity} {item.measureType === 'килограмм' ? 'кг' : 'шт'}
            </ThemedText>
            
            <TouchableOpacity
              style={styles.quantityButton}
              onPress={() => handleUpdateQuantity(
                item.id, 
                item.quantity + item.purchaseOptionStep,
                item.purchaseOptionStep,
                Infinity
              )}
            >
              <ThemedText style={styles.plusMinus}>+</ThemedText>
            </TouchableOpacity>
          </ThemedView>
        </View>
        </View>
        {/* Управление количеством и цена */}

      </ThemedView>
    );
  };

  // Состояние загрузки
  if (isLoading) {
    return (
      <SafeAreaProvider>
        <ThemedView style={styles.safeArea} lightColor={'#EBEDF0'} darkColor='#040508'>
          <ModalHeader showBackButton={false} 
            content={
              <TouchableOpacity 
                onPress={() => {
                  if (me?.companies?.length > 1) {
                    console.log('Open company selector');
                  }
                }}
                style={{ flexDirection: 'row', alignItems: 'center', gap: 8, justifyContent: 'space-between',  }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <IconCompany/>
                <ThemedText numberOfLines={1} style={{ maxWidth: 150 }}>
                  {currentCompany?.name || me?.companies?.[0]?.name || ''}
                </ThemedText>
                </View>
                <ArrowIconRight/>
              </TouchableOpacity>
            }/>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#203686" />
            <ThemedText style={styles.loadingText}>Загрузка корзины...</ThemedText>
          </View>
        </ThemedView>
      </SafeAreaProvider>
    );
  }

  // Пустая корзина
  if (!cartItems?.length) {
    return (
      <SafeAreaProvider>
        <ThemedView style={styles.safeArea} lightColor={'#EBEDF0'} darkColor='#040508'>
          <ModalHeader showBackButton={false} 
          content={
            <TouchableOpacity 
            onPress={() => {
              if (me?.companies?.length > 1) {
                console.log('Open company selector');
              }
            }}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 8, justifyContent: 'space-between' }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <IconCompany/>
            <ThemedText numberOfLines={1} style={{ maxWidth: 150 }}>
              {currentCompany?.name || me?.companies?.[0]?.name || ''}
            </ThemedText>
            </View>
            <ArrowIconRight/>
          </TouchableOpacity>
          }
          />
          <View style={styles.emptyContainer}>
            <CartIcon width={80} height={80} fill="#80818B" />
            <ThemedText style={styles.emptyTitle}>Корзина пуста</ThemedText>
            <ThemedText style={styles.emptyDescription}>
              Добавьте товары из каталога,{'\n'}чтобы оформить заказ
            </ThemedText>
            <TouchableOpacity 
              style={styles.catalogButton}
              onPress={() => router.push('/dashboard')}
            >
              <ThemedText style={styles.catalogButtonText}>
                Перейти в каталог
              </ThemedText>
            </TouchableOpacity>
          </View>
        </ThemedView>
      </SafeAreaProvider>
    );
  }
console.log('totals', totals)
  return (
    <SafeAreaProvider>
      <ThemedView style={styles.safeArea} lightColor={'#EBEDF0'} darkColor='#040508'>
        <ModalHeader showBackButton={false} 
                  content={
                    <TouchableOpacity 
                    onPress={() => {
                      setCompanyModalVisible(true);
                    }}
                    style={{ flexDirection: 'row', alignItems: 'center', gap: 8, justifyContent: 'space-between', paddingHorizontal: 10 }}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <IconCompany/>
                    <ThemedText numberOfLines={1} style={{ maxWidth: 150 }}>
                      {currentCompany?.name || me?.companies?.[0]?.name || ''}
                    </ThemedText>
                    </View>
                    <ArrowIconRight/>
                  </TouchableOpacity>
                  }/>
        
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <ThemedView lightColor='#FFFFFF' style={styles.mainCont}>
          {/* Шапка с выбором всех товаров */}
          <View style={styles.headerActions}>
            <View style={styles.checkboxRow}>
            <CustomCheckbox
                        style={styles.checkbox}
                        value={selectedItems.size === cartItems.length}
                        onValueChange={toggleSelectAll}
                        lightColor={'#F2F4F7'}
                        darkColor={'#202022'}
              /> 
            <ThemedText style={styles.selectAllText}>
                  {selectedItems.size === cartItems.length ? 'Снять все' : 'Выбрать все'}
            </ThemedText>
            </View>
              <TouchableOpacity 
                style={[
                  styles.deleteSelectedButton,
                  selectedItems.size === 0 && { opacity: 0.5 }
                ]}
                onPress={() => {
                  selectedItems.size > 0 && selectedItems.forEach(id => handleRemoveItem(id));
                }}
              >
                <TrashIcon/>

              </TouchableOpacity>
          </View>
          {/* Список товаров */}
          <View style={styles.cartList}>
            {cartItems.map(item => renderCartItem(item))}
          </View>
          </ThemedView>

          <ThemedView lightColor={'#FFFFFF'} darkColor='#040508' style={styles.secondMain}>
          {totals.totalItems > 0 ?
            <View style={styles.uCart}>
              <View style={styles.uCartMain}>
                  <ThemedText style={styles.uCartMainText} lightColor='#1B1B1C'>
                     Ваша корзина
                  </ThemedText>
                  <ThemedText style={styles.uCartSecondText} lightColor='#80818B'>
                     {totals.totalItems} {getDeclension(totals.totalItems, ['товар', 'товара', 'товаров']) } • {totals.totalWeight} кг
                  </ThemedText>
              </View>
              <View style={styles.uCartMain}>
                  <ThemedText>
                    Товары ({totals.totalItems})
                  </ThemedText>
                  <ThemedText>
                    {formatPrice(totals.totalPrice)} ₽
                  </ThemedText>
              </View>

              <View style={styles.uCartMainLast}>
                  <ThemedText>
                    Скидка
                  </ThemedText>
                  <ThemedText lightColor='#6FBD15'>
                    0 ₽
                  </ThemedText>
              </View>

              <View style={styles.totalCountMain}>
                  <ThemedText>
                    ИТОГО
                  </ThemedText>
                  <ThemedText>
                    {formatPrice(totals.totalPrice)} ₽
                  </ThemedText>
              </View>


            </View>
            : null
          }
          <PrimaryButton
                title="Перейти к оформлению"
                onPress={() => {
                  setCheckoutModalVisible(true);
             
                }}
                variant="primary"
                size="md"
                activeOpacity={0.8}
                fullWidth
                style={styles.contButton}
                disabled={totals.totalItems === 0}
              />
              {totals.totalItems === 0 ?
              <ThemedView lightColor='#F2F4F7' style={styles.chooseProducts}>
                  <ThemedView lightColor='#FFFFFF' style={styles.iconStyleCont}>
                    <InfoIcon/>
                  </ThemedView>
                  <ThemedText>
                    Выберите товары, чтобы перейти к оформлению заказа
                  </ThemedText>
              </ThemedView>
              : null
              }

            <ThemedView lightColor='#E1F0FF' darkColor='#212945' style={styles.container}>
              <View style={styles.textContainer}>
                <ThemedText lightColor='#203686' style={styles.textContainerMain}>
                  Бесплатная доставка {'\n'}при заказе от — 10 000 ₽.
                </ThemedText>
                <ThemedText lightColor='#1B1B1C' darkColor='#FBFCFF' style={styles.text}>
                  Стоимость доставки по МСК и СПБ {'\n'}при заказе от 3000 ₽ до 10000 ₽ {'\n'}составит 1000 ₽. По областям 1500 ₽.
                </ThemedText>
                <ThemedText lightColor='#1B1B1C' darkColor='#FBFCFF' style={styles.text}>
                  Минимальная сумма заказа — 3 000 ₽.
                </ThemedText>

              </View>
              <Image
                source={require('@/assets/icons/png/carPng.png')} // Замените на путь к вашей картинке
                style={styles.imageCar}
                resizeMode="contain"
              />
            </ThemedView>
          </ThemedView>
          
          {/* Отступ для нижней плашки */}
          <View style={styles.bottomSpacer} />
        </ScrollView>

        {/* Фиксированная нижняя плашка */}
        <ThemedView lightColor='#FFFFFF' style={styles.bottomPanel}>
          <View style={styles.bottomPanelContent}>
            <View style={styles.bottomLeft}>

              <ThemedText style={styles.bottomTotalPrice}>
                {formatPrice(totals.totalPrice)} ₽
              </ThemedText>
              <ThemedText style={styles.bottomItemsCount}>
               {totals.totalItems > 0 && totals.totalItems} {totals.totalItems > 0 ? getDeclension(totals.totalItems, ['товар', 'товара', 'товаров']) : 'Товары не выбраны'}
              </ThemedText>
            </View>

            <TouchableOpacity
              style={[
                styles.bottomCheckoutButton,
                totals.totalItems === 0 && styles.checkoutButtonDisabled
              ]}
              disabled={totals.totalItems === 0}
              onPress={() => setCheckoutModalVisible(true)}
            >
              <ThemedText style={styles.bottomCheckoutButtonText}>
                Перейти к оформлению
              </ThemedText>
            </TouchableOpacity>
          </View>
          
          {/* {totals.totalItems === 0 && (
            <ThemedText style={styles.bottomHintText}>
              Выберите товары чтобы перейти к оформлению заказа
            </ThemedText>
          )} */}
        </ThemedView>

        <CheckoutModal
          visible={checkoutModalVisible}
          onClose={() => setCheckoutModalVisible(false)}
          selectedItems={selectedItems}
          cartItems={cartItems}
          totals={totals}
        />
          <CompanySelectionModal
            visible={companyModalVisible}
            onClose={() => setCompanyModalVisible(false)}
            companies={me?.companies || []}
            selectedCompanyId={currentCompany?.id}
            onSelectCompany={handleSelectCompany}
            onAddCompany={handleOpenRegisterModal}
          />

          <CompanySelectModal
            visible={registerModalVisible}
            onClose={() => setRegisterModalVisible(false)}
            companies={me?.companies || []}
            selectedCompanyId={currentCompany?.id}
            onSelectCompany={handleSelectCompany}
            screenScene={'register'}
            onAddCompany={() => {}}
          />

      </ThemedView>
    </SafeAreaProvider>
  );
}

const getDeclension = (count: number, words: [string, string, string]) => {
  const cases = [2, 0, 1, 1, 1, 2];
  return words[
    count % 100 > 4 && count % 100 < 20 ? 2 : cases[Math.min(count % 10, 5)]
  ];
};

const styles = StyleSheet.create({
  mainCont: {
    borderRadius: 24,
  },
  safeArea: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    // paddingHorizontal: 16,
    paddingTop: 10,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#80818B',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 14,
    color: '#80818B',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  catalogButton: {
    backgroundColor: '#203686',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  catalogButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  headerActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    // borderRadius: 24,
    // marginBottom: 8,
  },
  selectAllButton: {
    padding: 4,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  checkboxInner: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#203686',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  checkboxSelected: {
    backgroundColor: '#203686',
  },
  checkmark: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  selectAllText: {
    fontSize: 14,
    fontWeight: '500',
  },
  deleteSelectedButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 4,
  },
  deleteSelectedText: {
    fontSize: 14,
    color: '#FF3B30',
    marginLeft: 4,
  },
  cartList: {
    marginBottom: 16,
  },
  cartItem: {
    flexDirection: 'row',
    padding: 16,
  },
  checkbox: {
    marginRight: 12,
    justifyContent: 'center',
  },
  checkboxPhoto: {
    padding: 2,
    position: 'absolute',
    top: 2,
    left: 10,
    borderRadius: 10,
    minWidth: 6,
    maxWidth: 6,
    width: 6,
    height: 6,
    zIndex: 1,
    alignItems: 'center',
  },
  imageContainer: {
    width: 74,
    height: 55,
    borderRadius: 12,
    overflow: 'hidden',
    marginRight: 12,
    position: 'relative'
  },
  image: {
    width: '100%',
    height: '100%',
  },
  noImage: {
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  noImageText: {
    fontSize: 10,
    color: '#80818B',
  },
  dopItemInfo: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column'

  },
  itemInfo: {
    flex: 1,
    display: 'flex',
    flexDirection: 'row',
    justifyContent:'space-between'
    // marginRight: 12,
  },
  productName: {
    fontSize: 14,
    fontWeight: '500',
    // marginBottom: 4,
    lineHeight: 18,
  },
  priceRow: {
    flexDirection: 'row',
    // alignItems: 'center',
    // marginBottom: 8,
  },
  pricePerUnit: {
    fontSize: 14,
    fontWeight: '600',
  },
  itemActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  favoriteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 4,
  },
  favoriteTheme: {
    borderRadius: 8,
    padding: 3
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionText: {
    fontSize: 12,
    marginLeft: 4,
    color: '#80818B',
  },
  rightColumn: {
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    paddingHorizontal: 6,
    // padding: 4,
    marginLeft: 4
  },
  quantityButton: {
    // width: 28,
    // height: 28,
    paddingHorizontal: 6,

    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  plusMinus:{
    fontSize: 16,
  },
  quantityTextKg:{
    fontSize: 12,
    fontWeight: '500',

  },
  quantityText: {
    fontSize: 16,
    fontWeight: '500',
    // marginHorizontal: 8,
    minWidth: 144,
    textAlign: 'center',
  },
  itemTotalPrice: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1B1B1C',
  },
  recommendations: {
    borderRadius: 24,
    marginBottom: 20,
  },
  recommendationsTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  bottomSpacer: {
    height: 100,
  },
  bottomPanelContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bottomLeft: {
    flex: 1,
  },
  bottomItemsCount: {
    fontSize: 14,
    color: '#80818B',
    marginBottom: 4,
  },
  bottomTotalPrice: {
    fontSize: 16,
    fontWeight: '600',
  },
  bottomCheckoutButton: {
    backgroundColor: '#203686',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 12,
    minWidth: 180,
    alignItems: 'center',
  },
  bottomCheckoutButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },
  bottomHintText: {
    fontSize: 12,
    color: '#80818B',
    textAlign: 'center',
    marginTop: 12,
  },
  bottomPanel: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: Platform.OS === 'ios' ? 8 : 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 5,
  },
  checkoutButtonDisabled: {
    // backgroundColor: '#A0A0A0',
    opacity: 0.5,
  },
  secondMain:{
    marginTop: 16,
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  contButton: {
    marginTop: 20,
  },
  chooseProducts: {
    marginTop: 24,
    padding: 8,
    display: 'flex',
    flexDirection: 'row',
    borderRadius: 16,
    alignItems: 'center',
    gap: 12
  },
  chooseProductsText: {
    fontWeight: 500,
    fontSize: 14,
  },
  iconStyleCont: {
    borderRadius: 10,
    padding: 10,
  },


  container: {
    flexDirection: 'row',
    alignItems: 'center',
    // justifyContent: 'space-between',
    // backgroundColor: ,
    // paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8, 
    // margin: 16,
    marginTop: 16,

    padding: 16,
    overflow: 'hidden',
    position: 'relative',
  },
  textContainerMain: {
    fontSize: 16,
    fontWeight: 600,
    lineHeight: 20,

  },
  textContainer: {
    flex: 1,
    justifyContent: 'flex-start'
    // marginRight: 12,
  },
  text: {
    marginTop: 8,
    fontFamily: 'Montserrat-Medium', 
    fontWeight: '500',
    fontSize: 14,
    lineHeight: 18.2, 
    letterSpacing: 0,
    // color: '#000000', 
    width: '80%'

  },
  imageCar: {
    opacity: 0.1,
    position: 'absolute',
    width: 267,
    height: 110,
    transform: [{ scaleX: -1 }] ,
    right: -80,
    bottom: 1
  },

  uCart:{
    display: 'flex',
    flexDirection: 'column',
    paddingTop: 16
  },
  uCartMain:{
    paddingTop: 16,
    flexDirection:'row',
    justifyContent: 'space-between'
  },
  uCartMainLast:{
    paddingTop: 16,
    flexDirection:'row',
    justifyContent: 'space-between',
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F3F7'
  },
  totalCountMain:{
    flexDirection:'row',
    justifyContent: 'space-between',
    // paddingBottom: 16,
    paddingTop: 16,
  },
  uCartMainText:{
    fontWeight: 600,
    fontSize: 20
  },
  uCartSecondText:{
    fontWeight: 500,
    fontSize: 14
  }


});