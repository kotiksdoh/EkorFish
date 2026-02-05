// features/shared/ui/AddToCartModal.tsx
import { PackageIcon, RetailIcon, WholesaleIcon } from '@/assets/icons/icons';
import { ThemedText } from '@/components/themed-text';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Image,
  Modal,
  PanResponder,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get('window');
const MODAL_HEIGHT = SCREEN_HEIGHT * 0.44;

interface PurchaseOption {
  id: string;
  code: string;
  name: string;
  price: number;
  minQuantity: number;
  maxQuantity: number;
  step: number;
}

interface Product {
  id: string;
  name: string;
  purchaseOptions: PurchaseOption[];
  measureType: string;
  image: string;
}

interface AddToCartModalProps {
  visible: boolean;
  onClose: () => void;
  product: Product | null;
  onAddToCart: (productId: string, optionId: string, quantity: number) => void;
}

// Маппинг иконок по кодам
const getIconForCode = (code: string, isActive: boolean) => {
  const activeColor = '#203686';
  const inactiveColor = '#80818B';
  const fillColor = isActive ? activeColor : inactiveColor;
  
  switch (code) {
    case 'retail':
      return <RetailIcon fill={fillColor} width={16} height={16} />;
    case 'wholesale':
    case 'wholesale_small':
    case 'wholesale_large':
      return <WholesaleIcon fill={fillColor} width={16} height={16} />;
    case 'package':
      return <PackageIcon fill={fillColor} width={16} height={16} />;
    default:
      return null;
  }
};

export const AddToCartModal: React.FC<AddToCartModalProps> = ({
  visible,
  onClose,
  product,
  onAddToCart,
}) => {
  const [selectedTab, setSelectedTab] = useState<string>('');
  const [quantity, setQuantity] = useState<number>(0);
  const [selectedOption, setSelectedOption] = useState<PurchaseOption | null>(null);
  
  const translateY = useRef(new Animated.Value(MODAL_HEIGHT)).current;
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dy) > 10;
      },
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dy > 0) {
          translateY.setValue(gestureState.dy);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy > 100 || gestureState.vy > 0.5) {
          closeModal();
        } else {
          Animated.spring(translateY, {
            toValue: 0,
            useNativeDriver: true,
            damping: 20,
            stiffness: 90,
          }).start();
        }
      },
    })
  ).current;

  useEffect(() => {
    if (visible && product) {
      if (product.purchaseOptions.length > 0) {
        const firstOption = product.purchaseOptions[0];
        setSelectedTab(firstOption.id);
        setSelectedOption(firstOption);
        setQuantity(firstOption.minQuantity);
      }
      
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
        damping: 20,
        stiffness: 90,
      }).start();
    } else {
      translateY.setValue(MODAL_HEIGHT);
    }
  }, [visible, product]);

  const closeModal = useCallback(() => {
    Animated.timing(translateY, {
      toValue: MODAL_HEIGHT,
      duration: 250,
      useNativeDriver: true,
    }).start(() => {
      onClose();
      setSelectedTab('');
      setQuantity(0);
      setSelectedOption(null);
    });
  }, [onClose]);

  const handleTabChange = useCallback((tabId: string) => {
    setSelectedTab(tabId);
    const option = product?.purchaseOptions.find(opt => opt.id === tabId);
    if (option) {
      setSelectedOption(option);
      setQuantity(option.minQuantity);
    }
  }, [product]);

  const handleIncreaseQuantity = useCallback(() => {
    if (!selectedOption) return;
    
    const newQuantity = quantity + selectedOption.step;
    if (newQuantity <= selectedOption.maxQuantity) {
      setQuantity(parseFloat(newQuantity.toFixed(2)));
    }
  }, [quantity, selectedOption]);

  const handleDecreaseQuantity = useCallback(() => {
    if (!selectedOption) return;
    
    const newQuantity = quantity - selectedOption.step;
    if (newQuantity >= selectedOption.minQuantity) {
      setQuantity(parseFloat(newQuantity.toFixed(2)));
    }
  }, [quantity, selectedOption]);

  const handleAddToCart = useCallback(() => {
    if (product && selectedOption) {
      onAddToCart(product.id, selectedOption.id, quantity);
      closeModal();
    }
  }, [product, selectedOption, quantity, onAddToCart, closeModal]);

  if (!product) return null;

  const totalPrice = selectedOption ? selectedOption.price * quantity : 0;
  const optionsCount = product.purchaseOptions.length;
  
  // Рассчитываем ширину таба в зависимости от количества
  const tabWidth = optionsCount > 0 
    ? (SCREEN_WIDTH - 32 - 6 - (optionsCount * 4)) / optionsCount // 32 padding, 6 padding табов, 4 margin между табами
    : 0;

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="none"
      onRequestClose={closeModal}
    >
      <View style={styles.overlay}>
        <TouchableOpacity
          style={styles.overlayTouchable}
          activeOpacity={1}
          onPress={closeModal}
        >
          <Animated.View
            style={[
              styles.modalContainer,
              {
                transform: [{ translateY }],
                height: MODAL_HEIGHT,
              },
            ]}
            {...panResponder.panHandlers}
          >
            {/* Свайп-индикатор */}
            <View style={styles.swipeIndicatorContainer}>
              <View style={styles.swipeIndicator} />
            </View>

            {/* Заголовок с фото и названием */}
            <View style={styles.header}>
              {product.image && product.image.length > 0 ? (
                <Image
                  source={{ uri: product.image }}
                  style={styles.productImage}
                  resizeMode="cover"
                />
              ) : (
                <View style={[styles.productImage, styles.noImage]}>
                  <Text style={styles.noImageText}>Нет фото</Text>
                </View>
              )}
              <View style={styles.productInfo}>
                <ThemedText 
                  style={styles.productName}
                  numberOfLines={2}
                  ellipsizeMode="tail"
                >
                  {product.name}
                </ThemedText>
              </View>
            </View>

            {/* Основной контейнер с табами, ценами и кнопками */}
            <View style={styles.mainContentContainer}>
              {/* Табы с опциями покупки - теперь без скролла */}
              <View style={styles.tabsContainer}>
                {product.purchaseOptions.map((option) => {
                  const isActive = selectedTab === option.id;
                  return (
                    <TouchableOpacity
                      key={option.id}
                      style={[
                        styles.tabButton,
                        { width: tabWidth },
                        isActive && styles.activeTabButton,
                      ]}
                      onPress={() => handleTabChange(option.id)}
                      activeOpacity={0.7}
                    >
                      <View style={styles.tabContent}>
                        {getIconForCode(option.code, isActive)}
                        <ThemedText
                          style={[
                            styles.tabText,
                            isActive && styles.activeTabText,
                          ]}
                          lightColor={isActive ? '#1B1B1C' : '#80818B'}
                          darkColor={isActive ? '#FBFCFF' : '#FBFCFF80'}
                          numberOfLines={1}
                        >
                          {option.name}
                        </ThemedText>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Контейнер с ценами */}
              {selectedOption && (
                <View style={styles.pricesContainer}>
                  <View style={styles.priceRow}>
                    <ThemedText style={styles.priceValue}>
                      {selectedOption.price.toLocaleString('ru-RU')} ₽/{product.measureType === 'килограмм' ? 'кг' : 'шт'}
                    </ThemedText>
                    <ThemedText style={styles.totalPriceValue}>
                      {totalPrice.toLocaleString('ru-RU', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                    })} ₽
                    </ThemedText>
                  </View>
                  
                  <View style={styles.priceLabelsRow}>
                    <ThemedText style={styles.priceLabel}>
                    </ThemedText>
                  </View>
                </View>
              )}

              {/* Кнопки добавления в корзину и управления количеством */}
              
            </View>
            {selectedOption && (
                <View style={styles.actionsContainer}>
                  <TouchableOpacity
                    style={styles.addToCartButton}
                    onPress={handleAddToCart}
                  >
                    <ThemedText style={styles.addToCartButtonText}>
                      Добавить в корзину
                    </ThemedText>
                  </TouchableOpacity>

                  <View style={styles.quantityControls}>
                    <TouchableOpacity
                      style={[
                        styles.quantityButton,
                        quantity <= selectedOption.minQuantity && styles.quantityButtonDisabled,
                      ]}
                      onPress={handleDecreaseQuantity}
                      disabled={quantity <= selectedOption.minQuantity}
                    >
                      <Text style={styles.quantityButtonText}>-</Text>
                    </TouchableOpacity>
                    
                    <View style={styles.quantityDisplay}>
                      <ThemedText style={styles.quantityText}>
                        {quantity} {product.measureType === 'килограмм' ? 'кг' : 'шт'}
                      </ThemedText>
                    </View>
                    
                    <TouchableOpacity
                      style={[
                        styles.quantityButton,
                        quantity >= selectedOption.maxQuantity && styles.quantityButtonDisabled,
                      ]}
                      onPress={handleIncreaseQuantity}
                      disabled={quantity >= selectedOption.maxQuantity}
                    >
                      <Text style={styles.quantityButtonText}>+</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
          </Animated.View>
        </TouchableOpacity>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    zIndex: 9999,
    flex: 1,
    // backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
    // marginBottom: 30
  },
  overlayTouchable: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 20,
    borderColor: '#F0F3F7',
    borderWidth: 1,
  },
  swipeIndicatorContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  swipeIndicator: {
    width: 40,
    height: 4,
    backgroundColor: '#E0E0E0',
    borderRadius: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  productImage: {
    width: 71,
    height: 55,
    borderRadius: 8,
    marginRight: 12,
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
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Montserrat',
  },
  // Основной контейнер с бордером
  mainContentContainer: {
    borderWidth: 1,
    borderColor: '#F0F3F7',
    borderRadius: 16,
    // padding: 16,
    backgroundColor: '#FFFFFF',
  },
  // Табы без скролла
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#F2F4F7',
    borderRadius: 16,
    padding: 3,
    height: 54,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  tabButton: {
    minWidth: 100,
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 2,
  },
  activeTabButton: {
    backgroundColor: '#FFFFFF',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: {
          width: 0,
          height: 1,
        },
        shadowOpacity: 0.1,
        shadowRadius: 2,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  tabContent: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 40,
  },
  tabText: {
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
    fontFamily: 'Montserrat',
    fontVariant: ['lining-nums', 'proportional-nums'],
    lineHeight: 14,
    marginTop: 4,
  },
  activeTabText: {
    fontWeight: '500',
    color: '#1B1B1C',
  },
  // Контейнер с ценами
  pricesContainer: {
    marginTop: 20,
    marginBottom: 11.5,
    paddingHorizontal: 12,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 4,
  },
  priceLabelsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  priceValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#203686',
    fontFamily: 'Montserrat',
  },
  totalPriceValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1B1B1C',
    fontFamily: 'Montserrat',
  },
  priceLabel: {
    fontSize: 12,
    color: '#80818B',
    fontFamily: 'Montserrat',
  },
  totalPriceLabel: {
    fontSize: 12,
    color: '#80818B',
    fontFamily: 'Montserrat',
  },
  // Контейнер с действиями
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
  },
  addToCartButton: {
    backgroundColor: '#F2F4F7',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    // width: 181,
    // height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addToCartButtonText: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Montserrat',
    color: '#1B1B1C',
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  quantityButton: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: {
          width: 0,
          height: 1,
        },
        shadowOpacity: 0.1,
        shadowRadius: 2,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  quantityButtonDisabled: {
    backgroundColor: '#F0F0F0',
    opacity: 0.5,
  },
  quantityButtonText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1B1B1C',
  },
  quantityDisplay: {
    marginHorizontal: 16,
    minWidth: 60,
    alignItems: 'center',
  },
  quantityText: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Montserrat',
    color: '#1B1B1C',
  },
});