// features/shared/ui/AddToCartModal.tsx
import { PackageIcon, RetailIcon, WholesaleIcon } from "@/assets/icons/icons";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import {
  QuantityStepperMinusIcon,
  QuantityStepperPlusIcon,
} from "@/features/shared/ui/components/QuantityStepperIcons";
import { getPurchaseOptionLabel } from "@/features/shared/utils/purchaseOptionLabels";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useThemeColor } from "@/hooks/use-theme-color";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Image } from "expo-image";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  PanResponder,
  Platform,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get("window");
const MODAL_HEIGHT = SCREEN_HEIGHT * 0.44;
const PLACEHOLDER_IMAGE = require("@/assets/icons/png/noImage.png");

function hasValidProductImage(image?: string | null): boolean {
  if (!image || typeof image !== "string") return false;
  return image.length > 10 && !image.endsWith("/") && image.startsWith("http");
}

interface PurchaseOption {
  id: string;
  code: string;
  name: string;
  price: number;
  minQuantity: number;
  maxQuantity: number;
  step: number;
}

interface ProductStock {
  id?: string;
  name?: string;
  stockInfo?: string;
  quantity?: number;
}

interface Product {
  id: string;
  name: string;
  purchaseOptions: PurchaseOption[];
  measureType: string;
  image: string;
  stocks?: ProductStock[];
  originalProduct?: { stocks?: ProductStock[] };
}

/** Первый склад: quantity — потолок; нет stocks/quantity — без лимита */
export function getMaxQuantityFromStocks(product: Product | null): number | null {
  if (!product) return null;

  const stocks = product.stocks ?? product.originalProduct?.stocks;
  if (!Array.isArray(stocks) || stocks.length === 0) return null;

  const rawQuantity = stocks[0]?.quantity;
  if (rawQuantity === undefined || rawQuantity === null) return null;

  const qty = Number(rawQuantity);
  return Number.isFinite(qty) ? qty : null;
}

export function getTotalWeightKg(
  measureType: string,
  quantity: number,
  step = 1,
): number {
  if (quantity <= 0) return 0;

  const isKilogram =
    measureType === "килограмм" || measureType.toLowerCase() === "кг";
  const weight = isKilogram ? quantity : quantity * step;

  return parseFloat(weight.toFixed(2));
}

interface AddToCartModalProps {
  visible: boolean;
  onClose: () => void;
  product: Product | null;
  onAddToCart: (productId: string, optionId: string, quantity: number) => void;
  existingCartItem?: any[];
  /** Режим добавления в шаблон заказа вместо корзины */
  variant?: "cart" | "template";
  /**
   * Модалка открыта поверх другой full-screen Modal (например, «Спасибо за заказ!»).
   * Добавляет нижний padding, чтобы кнопки не перекрывались системной навигацией.
   */
  nestedInModal?: boolean;
  /** Скрыть фото и название (экран товара со слайдером) */
  hideProductHeader?: boolean;
  /** Вызывается, если пользователь не авторизован при добавлении в корзину */
  onAuthRequired?: () => void;
}

// Маппинг иконок по кодам
const getIconForCode = (
  code: string,
  isActive: boolean,
  isDarkMode: boolean,
) => {
  const activeColor = !isDarkMode ? "#203686" : "#4C94FF";
  const inactiveColor = "#80818B";
  const fillColor = isActive ? activeColor : inactiveColor;

  switch (code) {
    // 
    case "retail":
      return  <WholesaleIcon fill={fillColor} width={16} height={16} />;
    case "wholesale":
    case "wholesale_small":
    case "wholesale_large":
      return <PackageIcon fill={fillColor} width={16} height={16} />;
    case "package":
      return <RetailIcon fill={fillColor} width={16} height={16} />;
    case "promo":
      return <RetailIcon fill={fillColor} width={16} height={16} />;
    default:
      return null;
  }
};

export const AddToCartModal: React.FC<AddToCartModalProps> = ({
  visible,
  onClose,
  product,
  onAddToCart,
  existingCartItem,
  variant = "cart",
  nestedInModal = false,
  hideProductHeader = false,
  onAuthRequired,
}) => {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === "dark";
  const modalBottomPadding = nestedInModal
    ? Math.max(insets.bottom, Platform.OS === "android" ? 48 : 34) + 20
    : 20;
  const [selectedTab, setSelectedTab] = useState<string>("");
  const [quantity, setQuantity] = useState<number>(0);
  const [selectedOption, setSelectedOption] = useState<PurchaseOption | null>(
    null,
  );
  const [imageError, setImageError] = useState(false);

  const translateY = useRef(new Animated.Value(MODAL_HEIGHT)).current;

  const backgroundColor = useThemeColor({}, "background");
  const getQuantityForOption = useCallback(
    (optionId: string) => {
      if (!existingCartItem?.length) return 0;
      const item = existingCartItem.find(
        (item) => item.productPurchaseOptionId === optionId,
      );
      return item?.quantity || 0;
    },
    [existingCartItem],
  );

  useEffect(() => {
    if (visible && product) {
      setImageError(false);
      if (existingCartItem && existingCartItem?.length > 0) {
        const firstCartItem = existingCartItem[0];
        const option = product.purchaseOptions.find(
          (opt) => opt.id === firstCartItem.productPurchaseOptionId,
        );
        if (option) {
          setSelectedTab(option.id);
          setSelectedOption(option);
          setQuantity(firstCartItem.quantity);
        } else {
          const firstOption = product.purchaseOptions[0];
          setSelectedTab(firstOption.id);
          setSelectedOption(firstOption);
          setQuantity(firstOption.minQuantity);
        }
      } else {
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
      setSelectedTab("");
      setQuantity(0);
      setSelectedOption(null);
      setImageError(false);
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
    }),
  ).current;

  const closeModal = useCallback(() => {
    Animated.timing(translateY, {
      toValue: MODAL_HEIGHT,
      duration: 250,
      useNativeDriver: true,
    }).start(() => {
      onClose();
      setSelectedTab("");
      setQuantity(0);
      setSelectedOption(null);
    });
  }, [onClose]);

  const handleTabChange = useCallback(
    (tabId: string) => {
      setSelectedTab(tabId);
      const option = product?.purchaseOptions.find((opt) => opt.id === tabId);
      if (option) {
        setSelectedOption(option);
        setQuantity(option.minQuantity);
      }
    },
    [product],
  );

  const handleIncreaseQuantity = useCallback(() => {
    if (!selectedOption || !product) return;

    const newQuantity = quantity + selectedOption.step;
    const maxStockQuantity = getMaxQuantityFromStocks(product);
    if (maxStockQuantity === null || newQuantity <= maxStockQuantity) {
      setQuantity(parseFloat(newQuantity.toFixed(2)));
    }
  }, [quantity, selectedOption, product]);

  const handleDecreaseQuantity = useCallback(() => {
    if (!selectedOption) return;

    const newQuantity = quantity - selectedOption.step;
    if (newQuantity >= selectedOption.minQuantity) {
      setQuantity(parseFloat(newQuantity.toFixed(2)));
    }
  }, [quantity, selectedOption]);

  const handleAddToCart = useCallback(async () => {
    if (variant === "cart") {
      const token = await AsyncStorage.getItem("token");
      if (!token) {
        closeModal();
        onAuthRequired?.();
        return;
      }
    }
    if (product && selectedOption) {
      onAddToCart(product.id, selectedOption.id, quantity);
      closeModal();
    }
  }, [product, selectedOption, quantity, onAddToCart, closeModal, variant, onAuthRequired]);

  const showProductPlaceholder = useMemo(() => {
    if (!product) return true;
    return !hasValidProductImage(product.image) || imageError;
  }, [product, imageError]);

  const productImageSource = useMemo(() => {
    if (!product || showProductPlaceholder) {
      return PLACEHOLDER_IMAGE;
    }
    return { uri: product.image };
  }, [product, showProductPlaceholder]);

  const productImageRecyclingKey = useMemo(() => {
    if (!product) return "no-product";
    return hasValidProductImage(product.image) && !imageError
      ? product.image
      : `product-${product.id}`;
  }, [product, imageError]);

  if (!product || !visible) return null;

  const maxStockQuantity = getMaxQuantityFromStocks(product);
  const isAtMaxStock =
    maxStockQuantity !== null && quantity >= maxStockQuantity;
  const totalPrice = selectedOption ? selectedOption.price * quantity : 0;
  const totalWeightKg = selectedOption
    ? getTotalWeightKg(product.measureType, quantity, selectedOption.step)
    : 0;
  const isAddToCartDisabled =
    !selectedOption ||
    quantity <= 0 ||
    (maxStockQuantity !== null &&
      (maxStockQuantity <= 0 || quantity > maxStockQuantity));
  const optionsCount = product.purchaseOptions.length;

  // Динамический расчет ширины табов с учетом отступов
  const tabContainerPadding = 6; // padding у tabsContainer (3px с каждой стороны)
  const tabMargin = 4; // marginHorizontal у tabButton (2px с каждой стороны)
  const availableWidth = SCREEN_WIDTH - 32 - tabContainerPadding - (optionsCount * tabMargin * 2);
  let tabWidth = Math.max(70, availableWidth / optionsCount); // Минимальная ширина 70px
  
  // Если ширина слишком маленькая для текста, уменьшаем отступы
  if (tabWidth < 80 && optionsCount >= 3) {
    tabWidth = 70; // Фиксируем минимальную ширину
  }

  // Функция для определения размера шрифта в зависимости от длины названия
  const getTabTextFontSize = (text: string, tabWidth: number) => {
    if (text.length > 15) return 10;
    if (text.length > 12) return 11;
    if (tabWidth < 80) return 10;
    return 12;
  };

  return (
    <Animated.View
      style={[
        styles.modalContainer,
        {
          transform: [{ translateY }],
          backgroundColor,
          paddingBottom: modalBottomPadding,
        },
        !isDarkMode && {
          borderColor: "#D8DADE",
          shadowColor: "#1B1B1C",
        },
        isDarkMode && {
          borderColor: "#323235",
          shadowColor: "#000000",
        },
      ]}
      {...panResponder.panHandlers}
    >
      <View style={styles.swipeIndicatorContainer}>
        <View style={[styles.swipeIndicator, { backgroundColor: "#C0C0C5" }]} />
      </View>

      {!hideProductHeader ? (
        <View style={styles.header}>
          <View
            style={[
              styles.productImageWrapper,
              isDarkMode
                ? styles.productImageWrapperDark
                : styles.productImageWrapperLight,
            ]}
          >
            <Image
              source={productImageSource}
              style={styles.productImage}
              contentFit={showProductPlaceholder ? "contain" : "cover"}
              cachePolicy="disk"
              recyclingKey={productImageRecyclingKey}
              transition={0}
              onError={() => setImageError(true)}
            />
          </View>
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
      ) : null}

      <ThemedView
        style={[
          styles.mainContentContainer,
          isDarkMode && {
            borderColor: "#252527",
          },
        ]}
      >
        <ThemedView lightColor="#F2F4F7" darkColor="#202022" style={styles.tabsContainer}>
          {product.purchaseOptions.map((option) => {
            const isActive = selectedTab === option.id;
            const optionLabel = getPurchaseOptionLabel(option.code, option.name);
            const fontSize = getTabTextFontSize(optionLabel, tabWidth);

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
                  {getIconForCode(option.code, isActive, isDarkMode)}
                  <ThemedText
                    style={[
                      styles.tabText,
                      { fontSize },
                      isActive && styles.activeTabText,
                      isDarkMode &&
                        isActive && {
                          color: "#4C94FF",
                        },
                    ]}
                    lightColor={isActive ? "#1B1B1C" : "#80818B"}
                    darkColor={isActive ? "#FBFCFF" : "#FBFCFF80"}
                    numberOfLines={2}
                    adjustsFontSizeToFit
                    minimumFontScale={0.8}
                  >
                    {optionLabel}
                  </ThemedText>
                </View>
              </TouchableOpacity>
            );
          })}
        </ThemedView>

        {selectedOption && (
          <View style={styles.pricesContainer}>
            <View style={styles.priceRow}>
              <ThemedText style={styles.priceValue}>
                {selectedOption.price.toLocaleString("ru-RU")} ₽/
                {product.measureType === "кг" ? "кг" : "шт"}
              </ThemedText>
              <View style={styles.totalPriceGroup}>
                <ThemedText style={styles.totalPriceValue}>
                  {totalPrice.toLocaleString("ru-RU", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}{" "}
                  ₽
                </ThemedText>
                {totalWeightKg > 0 ? (
                  <ThemedText
                    style={styles.totalWeightValue}
                    lightColor="#80818B"
                    darkColor="#FBFCFF80"
                  >
                    {'('}
                    {totalWeightKg.toLocaleString("ru-RU", {
                      minimumFractionDigits: 0,
                      maximumFractionDigits: 2,
                    })}{" "}
                      {product.measureType === "кг" ? "кг" : "шт"}
                    {')'}
                  </ThemedText>
                ) : null}
              </View>
            </View>
          </View>
        )}
      </ThemedView>

      {selectedOption && (
        <View style={styles.actionsContainer}>
          <View
            style={[
              styles.quantityControls,
              isDarkMode && {
                backgroundColor: "#202022",
              },
            ]}
          >
            <TouchableOpacity
              style={[
                styles.quantityButton,
                quantity <= selectedOption.minQuantity &&
                  styles.quantityButtonDisabled,
              ]}
              onPress={handleDecreaseQuantity}
              disabled={quantity <= selectedOption.minQuantity}
            >
              <QuantityStepperMinusIcon
                disabled={quantity <= selectedOption.minQuantity}
              />
            </TouchableOpacity>

            <View style={styles.quantityDisplay}>
              <ThemedText style={styles.quantityText}>
                {quantity} {product.measureType === "кг" ? "кг" : "шт"}
              </ThemedText>
            </View>

            <TouchableOpacity
              style={[
                styles.quantityButton,
                isAtMaxStock && styles.quantityButtonDisabled,
              ]}
              onPress={handleIncreaseQuantity}
              disabled={isAtMaxStock}
            >
              <QuantityStepperPlusIcon disabled={isAtMaxStock} />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[
              styles.addToCartButton,
              isAddToCartDisabled && styles.addToCartButtonDisabled,
            ]}
            onPress={handleAddToCart}
            disabled={isAddToCartDisabled}
          >
            <ThemedText
              lightColor="#1B1B1C"
              darkColor="#1B1B1C"
              style={styles.addToCartButtonText}
            >
              {variant === "template" ? "В шаблон" : "В корзину"}
            </ThemedText>
          </TouchableOpacity>
        </View>
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderColor: "#F0F3F7",
    paddingHorizontal: 16,
    paddingTop: 8,
    borderWidth: 1,
    zIndex: 9999,
    shadowOffset: {
      width: 0,
      height: -6,
    },
    shadowOpacity: 0.12,
    shadowRadius: 14,
    elevation: 10,
  },
  swipeIndicatorContainer: {
    alignItems: "center",
    marginBottom: 16,
  },
  swipeIndicator: {
    width: 40,
    height: 4,
    borderRadius: 2,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  productImageWrapper: {
    width: 71,
    height: 55,
    marginRight: 12,
    borderRadius: 8,
    overflow: "hidden",
  },
  productImageWrapperLight: {
    backgroundColor: "#F5F5F5",
  },
  productImageWrapperDark: {
    backgroundColor: "#2E2E32",
  },
  productImage: {
    width: 71,
    height: 55,
    borderRadius: 8,
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: 14,
    fontWeight: "600",
    fontFamily: "Montserrat",
  },
  mainContentContainer: {
    borderWidth: 1,
    borderRadius: 16,
    borderColor: "#F0F3F7",
  },
  tabsContainer: {
    // backgroundColor: '#F2F4F7',
    justifyContent:'center',
    flexDirection: "row",
    borderRadius: 16,
    padding: 3,
    minHeight: 54,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
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
    paddingVertical: 8,
    paddingHorizontal: 2,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 2,
  },
  activeTabButton: {
    ...Platform.select({
      ios: {
        shadowColor: "#000",
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
    alignItems: "center",
    justifyContent: "center",
    minHeight: 40,
    width: "100%",
  },
  tabText: {
    fontWeight: "500",
    textAlign: "center",
    fontFamily: "Montserrat",
    fontVariant: ["lining-nums", "proportional-nums"],
    lineHeight: 14,
    marginTop: 4,
    flexWrap: "wrap",
  },
  activeTabText: {
    fontWeight: "500",
    color: "#1B1B1C",
  },
  pricesContainer: {
    marginTop: 20,
    marginBottom: 11.5,
    paddingHorizontal: 12,
  },
  priceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginBottom: 4,
  },
  priceValue: {
    fontSize: 14,
    fontWeight: "500",
    fontFamily: "Montserrat",
  },
  totalPriceValue: {
    fontSize: 14,
    fontWeight: "500",
    fontFamily: "Montserrat",
  },
  totalPriceGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  totalWeightValue: {
    fontSize: 14,
    fontWeight: "500",
    fontFamily: "Montserrat",
  },
  actionsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 16,
  },
  addToCartButton: {
    backgroundColor: "#FFED32",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    justifyContent: "center",
    alignItems: "center",
    flex: 1,
    marginLeft: 12,
  },
  addToCartButtonDisabled: {
    opacity: 0.5,
  },
  addToCartButtonText: {
    fontSize: 14,
    fontWeight: "600",
    fontFamily: "Montserrat",
  },
  quantityControls: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F5F5F5",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  quantityButton: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    // ...Platform.select({
    //   ios: {
    //     shadowColor: "#000",
    //     shadowOffset: {
    //       width: 0,
    //       height: 1,
    //     },
    //     shadowOpacity: 0.1,
    //     shadowRadius: 2,
    //   },
    //   android: {
    //     elevation: 2,
    //   },
    // }),
  },
  quantityButtonDisabled: {
    opacity: 0.2,
  },
  quantityDisplay: {
    marginHorizontal: 16,
    minWidth: 50,
    alignItems: "center",
  },
  quantityText: {
    fontSize: 16,
    fontWeight: "600",
    fontFamily: "Montserrat",
  },
  tabBadge: {
    position: "absolute",
    top: -4,
    right: -4,
    backgroundColor: "#FF3B30",
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 3,
  },
  tabBadgeText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "700",
    fontFamily: "Montserrat",
  },
});