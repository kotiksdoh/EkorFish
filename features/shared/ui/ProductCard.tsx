import { CartIcon, LikeIcon, SnowflakeIcon } from "@/assets/icons/icons.js";
import { useTemplatePicker } from "@/features/templates/TemplatePickerContext";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { LoginModal } from "@/features/auth/ui/components/LoginModal";
import { putFavorite, putUnFavorite, getProduct, setProductPreview } from "@/features/catalog/catalogSlice";
import { buildProductPreviewFromList } from "@/features/shared/services/productSingleAdapter";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useColorScheme } from "@/hooks/use-color-scheme";
import {
  ActivityIndicator,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { Image } from "expo-image";

interface ProductCardProps {
  id?: number;
  img?: any;
  isFrozen?: boolean;
  name?: string;
  kgPrice?: any;
  fullPrice?: any;
  isImageLoading?: boolean;
  isFavorite?: boolean;
  productData?: any;
  onAddToCartPress?: (product: any) => void;
  isDis?: boolean;
  fullWidth?: boolean;
  returnTo?: "home" | "catalog";
}

// Заглушка для изображения
const PLACEHOLDER_IMAGE = require("@/assets/icons/png/noImage.png");

const ProductCardComponent: React.FC<ProductCardProps> = ({
  id,
  img,
  isFrozen,
  name,
  kgPrice,
  fullPrice,
  isImageLoading: externalLoading = false,
  isFavorite,
  productData,
  onAddToCartPress,
  isDis = false,
  fullWidth = false,
  returnTo,
}) => {
  const [isImageLoading, setIsImageLoading] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [isLiked, setIsLiked] = useState(isFavorite);
  const imageLoadTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const isMountedRef = useRef(true);

  const dispatch = useAppDispatch();
  const router = useRouter();
  const cartItems = useAppSelector((state) => state.catalog.cart);
  const isNavigatingRef = useRef(false);
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === "dark";
  const { pickingForTemplateId, getExistingTemplateLinesForProduct, liveTemplateItems } =
    useTemplatePicker();
  const isTemplatePick = !!pickingForTemplateId;

  const cartItem = useMemo(() => {
    if (!productData?.purchaseOptions?.[0]?.id) return null;
    return cartItems?.find(
      (item: any) =>
        item.productId === productData.id &&
        item.productPurchaseOptionId === productData.purchaseOptions[0].id,
    );
  }, [cartItems, productData]);

  useEffect(() => {
    setIsLiked(isFavorite);
  }, [isFavorite]);
  const [loginModalVisible, setLoginModalVisible] = useState(false);

  const handleLoginPress = () => {
    setLoginModalVisible(true);
  };

  const handleLogin = (phoneNumber: string) => {
    setLoginModalVisible(false);
  };
  const handleLikePress = async (e: any) => {
    e.stopPropagation();
    if (!id) return;
    const token = await AsyncStorage.getItem("token");
    if (!token) {
      handleLoginPress();
      return; // Выходим, если нет токена
    }
    if (isDis) {
      return;
    }
    if (isLiked) {
      dispatch(putUnFavorite(String(id))).then(() => setIsLiked(false));
    } else {
      dispatch(putFavorite(String(id))).then(() => setIsLiked(true));
    }
  };

  const handleCartPress = (e: any) => {
    e.stopPropagation();
    if (onAddToCartPress && productData) {
      onAddToCartPress(productData);
    }
  };

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (imageLoadTimeoutRef.current) {
        clearTimeout(imageLoadTimeoutRef.current);
      }
    };
  }, []);

  const handleImageLoadStart = useCallback(() => {
    if (!isMountedRef.current) return;
    setIsImageLoading(true);

    if (imageLoadTimeoutRef.current) {
      clearTimeout(imageLoadTimeoutRef.current);
    }

    // Только убираем спиннер — не подменяем фото заглушкой при медленной сети.
    imageLoadTimeoutRef.current = setTimeout(() => {
      if (!isMountedRef.current) return;
      setIsImageLoading(false);
    }, 30000);
  }, []);

  const handleImageLoaded = useCallback(() => {
    if (!isMountedRef.current) return;
    setIsImageLoading(false);
    setImageError(false);
    if (imageLoadTimeoutRef.current) {
      clearTimeout(imageLoadTimeoutRef.current);
    }
  }, []);

  const handleImageError = useCallback(() => {
    if (!isMountedRef.current) return;
    setIsImageLoading(false);
    setImageError(true);
    if (imageLoadTimeoutRef.current) {
      clearTimeout(imageLoadTimeoutRef.current);
    }
  }, []);

  const cartItemsForProduct = useMemo(() => {
    if (!productData?.purchaseOptions) return [];
    return (
      cartItems?.filter((item: any) => item.productId === productData.id) || []
    );
  }, [cartItems, productData]);

  const totalCartQuantity = useMemo(() => {
    if (!cartItemsForProduct.length) return null;
    const total = cartItemsForProduct.reduce(
      (sum, item) => sum + item.quantity,
      0,
    );
    if (total > 10) return "10+";
    return total.toString();
  }, [cartItemsForProduct]);

  const templateLinesForProduct = useMemo(() => {
    if (!isTemplatePick || !productData?.id) return [];
    return getExistingTemplateLinesForProduct(String(productData.id));
  }, [
    isTemplatePick,
    productData?.id,
    getExistingTemplateLinesForProduct,
    liveTemplateItems,
  ]);

  const totalTemplateQuantity = useMemo(() => {
    if (!templateLinesForProduct.length) return null;
    const total = templateLinesForProduct.reduce(
      (sum, item) => sum + item.quantity,
      0,
    );
    if (total > 10) return "10+";
    return total.toString();
  }, [templateLinesForProduct]);

  const toProductDetail = useCallback(() => {
    if (isDis || !id || !name || isNavigatingRef.current) {
      return;
    }

    isNavigatingRef.current = true;

    const productPath =
      returnTo === "home"
        ? `/(tabs)/dashboard/product/${encodeURIComponent(id)}?productId=${id}&returnTo=home`
        : `/(tabs)/dashboard/product/${encodeURIComponent(id)}?productId=${id}`;

    router.push(productPath as any);

    queueMicrotask(() => {
      const productIdStr = String(id);
      const preview = buildProductPreviewFromList(productData);
      if (preview) {
        dispatch(setProductPreview({ productId: productIdStr, preview }));
      }
      dispatch(getProduct(productIdStr));
    });

    setTimeout(() => {
      isNavigatingRef.current = false;
    }, 400);
  }, [dispatch, id, isDis, name, productData, returnTo, router]);

  // Определяем, является ли URL валидным
  const isValidImageUrl = useCallback((url: string): boolean => {
    if (!url || typeof url !== "string") return false;
    // Проверяем, что URL не пустой и не заканчивается на слеш
    return url.length > 10 && !url.endsWith("/") && url.startsWith("http");
  }, []);

  // Определяем источник изображения
  const imageSource = useMemo(() => {
    // Если нет изображения или оно невалидное
    if (!img || (typeof img === "string" && !isValidImageUrl(img))) {
      return PLACEHOLDER_IMAGE;
    }

    // Если это строка с URL
    if (typeof img === "string") {
      return { uri: img };
    }

    // Если это уже объект изображения (require)
    return img;
  }, [img, isValidImageUrl]);

  const hasValidImageUrl =
    Boolean(img) &&
    (typeof img !== "string" || isValidImageUrl(img));

  const showPlaceholder = !hasValidImageUrl || imageError;

  // Смена img сбрасывает ошибку; loading включается в onLoadStart (кэш может не вызвать start).
  useEffect(() => {
    setImageError(false);
    setIsImageLoading(false);
  }, [img]);

  const stockInfo = productData?.originalProduct?.stocks?.[0]?.stockInfo;
  const isOutOfStock = stockInfo === "Нет в наличии" || false;

  return (
    <>
      <TouchableOpacity
        onPress={toProductDetail}
        activeOpacity={isDarkMode ? 0.9 : 0.97}
        disabled={isDis}
        style={[
          styles.cardTouchable,
          fullWidth && { width: "100%" },
          isDis && styles.cardDisabled,
        ]}
      >
        <ThemedView lightColor="#FFFFFF" style={styles.container}>
          <View style={styles.imageContainer}>
            {/* Всегда показываем изображение, но с правильным источником */}
            <Image
              key={
                showPlaceholder || typeof img !== "string"
                  ? "placeholder-or-local"
                  : img
              }
              source={showPlaceholder ? PLACEHOLDER_IMAGE : imageSource}
              style={styles.image}
              contentFit="cover"
              cachePolicy="memory-disk"
              recyclingKey={
                typeof img === "string" && !showPlaceholder ? img : undefined
              }
              onLoadStart={!showPlaceholder ? handleImageLoadStart : undefined}
              onLoad={!showPlaceholder ? handleImageLoaded : undefined}
              onLoadEnd={!showPlaceholder ? handleImageLoaded : undefined}
              onError={!showPlaceholder ? handleImageError : undefined}
            />

            {/* Индикатор загрузки */}
            {!showPlaceholder && isImageLoading && (
              <View
                style={[StyleSheet.absoluteFill, styles.imageLoadingContainer]}
              >
                <ActivityIndicator size="small" color="#666666" />
              </View>
            )}

            {/* Иконка заморозки */}
            {isFrozen && !isImageLoading && !showPlaceholder && (
              <View style={styles.frozenIcon}>
                <SnowflakeIcon />
              </View>
            )}

            {/* Иконка лайка */}
            <TouchableOpacity
              style={[styles.heartIcon, isLiked && styles.heartIconActive]}
              onPress={handleLikePress}
              activeOpacity={0.7}
            >
              {isLiked ? (
                <LikeIcon isFilled={true} />
              ) : (
                <LikeIcon isFilled={false} />
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.infoContainer}>
            <ThemedText
              lightColor="#1B1B1C"
              darkColor="#FBFCFF"
              style={styles.name}
              numberOfLines={2}
              ellipsizeMode="tail"
            >
              {name || "Название товара"}
            </ThemedText>

            {stockInfo && (
              <ThemedView
                style={styles.stockInfo}
                lightColor={isOutOfStock ? "#FF860526" : "#101013"}
                darkColor={isOutOfStock ? "#FF860526" : "#2E2E32"}
              >
                <ThemedText
                  lightColor={isOutOfStock ? "#FF8605" : "#FFFFFF"}
                  darkColor={isOutOfStock ? "#FF8605" : "#FBFCFF"}
                  style={styles.stockInfoText}
                  numberOfLines={2}
                  ellipsizeMode="tail"
                >
                  {stockInfo}
                </ThemedText>
              </ThemedView>
            )}

            <View style={styles.priceRow}>
              <View style={styles.priceContainer}>
                <View style={styles.kgPriceRow}>
                  <ThemedText
                    lightColor="#203686"
                    darkColor="#4C94FF"
                    style={styles.kgPrice}
                  >
                    {kgPrice ? kgPrice : "0,00"}
                  </ThemedText>
                  <ThemedText
                    lightColor="#203686"
                    darkColor="#4C94FF"
                    style={styles.kgLabel}
                  >
                    ₽ / кг
                  </ThemedText>
                </View>

                <ThemedText
                  lightColor="#80818B"
                  darkColor="#FBFCFF80"
                  style={styles.fullPrice}
                >
                  {fullPrice ? `${fullPrice}₽` : "0,00 ₽"}
                </ThemedText>
              </View>

              {(isTemplatePick ? totalTemplateQuantity : totalCartQuantity) ? (
                <View style={styles.cartBadge}>
                  <ThemedText style={styles.cartBadgeText}>
                    {isTemplatePick
                      ? totalTemplateQuantity
                      : totalCartQuantity}
                  </ThemedText>
                </View>
              ) : null}

              <TouchableOpacity
                style={[
                  styles.cartButton,
                  (isTemplatePick
                    ? !!totalTemplateQuantity
                    : !!cartItem) && styles.cartButtonActive,
                ]}
                onPress={handleCartPress}
                activeOpacity={0.7}
              >
                {isTemplatePick ? (
                  <ThemedText
                    lightColor="#203686"
                    darkColor="#4C94FF"
                    style={styles.plusGlyph}
                  >
                    +
                  </ThemedText>
                ) : (
                  <CartIcon />
                )}
              </TouchableOpacity>
            </View>
          </View>

        </ThemedView>
      </TouchableOpacity>
      {loginModalVisible ? (
        <LoginModal
          visible={loginModalVisible}
          onClose={() => setLoginModalVisible(false)}
          onLogin={handleLogin}
          enumFlag={"login"}
        />
      ) : null}
    </>
  );
};

const styles = StyleSheet.create({
  cardTouchable: {
    width: "48.5%",
    marginBottom: 12,
  },
  cardDisabled: {
    opacity: 0.55,
  },
  container: {
    flexDirection: "column",
    width: "100%",
    borderRadius: 8,
    overflow: "hidden",
    elevation: 3,
    position: "relative",
  },
  imageContainer: {
    position: "relative",
    width: "100%",
    height: 138,
  },
  image: {
    width: "100%",
    height: "100%",
  },
  imageHidden: {
    opacity: 0,
    position: "absolute",
  },
  imageLoadingContainer: {
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F5F5F5",
  },
  imageErrorContainer: {
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FEE",
  },
  errorText: {
    fontSize: 10,
    color: "#721C24",
    textAlign: "center",
    padding: 4,
  },
  loader: {
    position: "absolute",
  },
  frozenIcon: {
    width: 16,
    height: 16,
    position: "absolute",
    top: 2,
    left: 2,
    padding: 2,
    borderRadius: 4,
    zIndex: 2,
  },
  heartIcon: {
    width: 16,
    height: 16,
    position: "absolute",
    top: 2,
    right: 4,
    padding: 2,
    borderRadius: 4,
    zIndex: 2,
  },
  heartIconActive: {},
  cartBadge: {
    position: "absolute",
    top: -8,
    right: -8,
    backgroundColor: "#FF3B30",
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 4,
    zIndex: 3,
  },
  cartBadgeText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "700",
    fontFamily: "Montserrat",
    lineHeight: 12,
    textAlign: "center",
    textAlignVertical: "center",
    includeFontPadding: false,
  },
  infoContainer: {
    padding: 12,
  },
  name: {
    fontFamily: "Montserrat",
    fontWeight: "600",
    fontSize: 14,
    lineHeight: 17.5,
    letterSpacing: 0,
    marginBottom: 8,
    minHeight: 35,
  },
  stockInfo: {
    borderRadius: 6,
    display: "flex",
    marginRight: 50,
    alignItems: "center",
  },
  stockInfoText: {
    fontWeight: "500",
    fontSize: 12,
  },
  priceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
  priceContainer: {
    flex: 1,
  },
  kgPriceRow: {
    flexDirection: "row",
    alignItems: "baseline",
    marginBottom: 2,
  },
  kgPrice: {
    fontFamily: "Montserrat",
    fontWeight: "600",
    fontSize: 16,
    lineHeight: 19.8,
    letterSpacing: 0,
    fontVariant: ["lining-nums", "proportional-nums"],
  },
  kgLabel: {
    fontFamily: "Montserrat",
    fontWeight: "400",
    fontSize: 18,
  },
  fullPrice: {
    fontFamily: "Montserrat",
    fontWeight: "500",
    fontSize: 12,
    lineHeight: 14.4,
    letterSpacing: -0.02,
    fontVariant: ["lining-nums", "proportional-nums"],
  },
  plusGlyph: {
    fontSize: 22,
    fontWeight: "700",
    lineHeight: 24,
  },
  cartButton: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: "#FFED32",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 12,
    marginLeft: 8,
  },
  cartButtonActive: {
    backgroundColor: "#FFED32", // Можно сделать другой цвет
  },
});

export const ProductCard = React.memo(ProductCardComponent, (prevProps, nextProps) => {
  return (
    prevProps.id === nextProps.id &&
    prevProps.img === nextProps.img &&
    prevProps.isFrozen === nextProps.isFrozen &&
    prevProps.name === nextProps.name &&
    prevProps.kgPrice === nextProps.kgPrice &&
    prevProps.fullPrice === nextProps.fullPrice &&
    prevProps.isFavorite === nextProps.isFavorite &&
    prevProps.fullWidth === nextProps.fullWidth &&
    prevProps.isDis === nextProps.isDis &&
    prevProps.onAddToCartPress === nextProps.onAddToCartPress
  );
});
