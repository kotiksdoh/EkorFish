// features/shared/ui/AddToCartModal.tsx
import { PackageIcon, RetailIcon, WholesaleIcon } from '@/assets/icons/icons';
import { ThemedText } from '@/components/themed-text';
import { useThemeColor } from '@/hooks/use-theme-color';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Image,
  PanResponder,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useColorScheme,
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
  existingCartItem?: any[]; // Изменяем на массив
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
  existingCartItem
}) => {
  const colorScheme = useColorScheme();
  //TODO
    const isDarkMode = colorScheme === "dark";
  const [selectedTab, setSelectedTab] = useState<string>('');
  const [quantity, setQuantity] = useState<number>(0);
  const [selectedOption, setSelectedOption] = useState<PurchaseOption | null>(null);
  
  const translateY = useRef(new Animated.Value(MODAL_HEIGHT)).current;
  
  const backgroundColor = useThemeColor({}, 'background');

  const getQuantityForOption = useCallback((optionId: string) => {
    if (!existingCartItem?.length) return 0;
    const item = existingCartItem.find(item => item.productPurchaseOptionId === optionId);
    return item?.quantity || 0;
  }, [existingCartItem]);


  useEffect(() => {
    if (visible && product) {
      if (existingCartItem && existingCartItem?.length > 0) {
        const firstCartItem = existingCartItem[0];
        const option = product.purchaseOptions.find(
          opt => opt.id === firstCartItem.productPurchaseOptionId
        );
        if (option) {
          setSelectedTab(option.id);
          setSelectedOption(option);
          setQuantity(firstCartItem.quantity);
        } else {
          // Если опция не найдена, берем первую
          const firstOption = product.purchaseOptions[0];
          setSelectedTab(firstOption.id);
          setSelectedOption(firstOption);
          setQuantity(firstOption.minQuantity);
        }
      } else {
        // Если товара нет в корзине, берем первую опцию
        if (product.purchaseOptions.length > 0) {
          const firstOption = product.purchaseOptions[0];
          setSelectedTab(firstOption.id);
          setSelectedOption(firstOption);
          setQuantity(firstOption.minQuantity);
        }
      }
      
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
        damping: 20,
        stiffness: 90,
      }).start();
    } else {
      translateY.setValue(MODAL_HEIGHT);
      setSelectedTab('');
      setQuantity(0);
      setSelectedOption(null);
    }
  }, [visible, product, existingCartItem]);

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

  const closeModal = useCallback(() => {
    Animated.timing(translateY, {
      toValue: MODAL_HEIGHT,
      duration: 250,
      useNativeDriver: true,
    }).start(() => {
      onClose();
      // Сбрасываем состояния
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

  if (!product || !visible) return null;

  const totalPrice = selectedOption ? selectedOption.price * quantity : 0;
  const optionsCount = product.purchaseOptions.length;
  
  const tabWidth = optionsCount > 0 
    ? (SCREEN_WIDTH - 32 - 6 - (optionsCount * 4)) / optionsCount
    : 0;

  return (
    <Animated.View
      style={[
        styles.modalContainer,
        {
          transform: [{ translateY }],
          backgroundColor,
        },
      ]}
      {...panResponder.panHandlers}
    >
      <View style={styles.swipeIndicatorContainer}>
        <View style={[styles.swipeIndicator, { backgroundColor: '#C0C0C5' }]} />
      </View>

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

      <View style={[styles.mainContentContainer]}>
        <View style={styles.tabsContainer}>
{product.purchaseOptions.map((option) => {
  const isActive = selectedTab === option.id;
  const quantityInCart = getQuantityForOption(option.id);
  
  return (
    <TouchableOpacity
      key={option.id}
      style={[
        styles.tabButton,
        { width: tabWidth },
        isActive && [styles.activeTabButton, { backgroundColor }],
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
        {quantityInCart > 0 && (
          <View style={styles.tabBadge}>
            <Text style={styles.tabBadgeText}>
              {quantityInCart > 10 ? '10+' : quantityInCart}
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
})}
        </View>

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
          </View>
        )}
      </View>

      {selectedOption && (
        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={styles.addToCartButton}
            onPress={handleAddToCart}
          >
            <ThemedText style={styles.addToCartButtonText}>
              {/* {existingCartItem ? 'Обновить корзину' : 'Добавить в корзину'}
               */}
               Добавить в корзину
            </ThemedText>
          </TouchableOpacity>

          <View style={styles.quantityControls}>
            <TouchableOpacity
              style={[
                styles.quantityButton,
                { backgroundColor },
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
                { backgroundColor },
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
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderColor: '#F0F3F7',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 20,
    borderWidth: 1,
    zIndex: 9999,
  },
  swipeIndicatorContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  swipeIndicator: {
    width: 40,
    height: 4,
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
  mainContentContainer: {
    borderWidth: 1,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderColor: '#F0F3F7',
  },
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
  tabBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#FF3B30',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 3,
  },
  tabBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
    fontFamily: 'Montserrat',
  },
});