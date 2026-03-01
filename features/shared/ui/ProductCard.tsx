import { CartIcon, LikeIcon, SnowflakeIcon } from "@/assets/icons/icons.js";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { LoginModal } from "@/features/auth/ui/components/LoginModal";
import { putFavorite, putUnFavorite } from "@/features/catalog/catalogSlice";
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
import {
  ActivityIndicator,
  Image,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";

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
}

// Заглушка для изображения
const PLACEHOLDER_IMAGE = require("@/assets/icons/png/noImage.png");

export const ProductCard: React.FC<ProductCardProps> = ({
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
}) => {
  const [isImageLoading, setIsImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);
  const [isLiked, setIsLiked] = useState(isFavorite);
  const imageLoadTimeoutRef = useRef<NodeJS.Timeout>();

  const dispatch = useAppDispatch();
  const router = useRouter();
  const cartItems = useAppSelector((state) => state.catalog.cart);

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
    console.log("Login with:", phoneNumber);
    setLoginModalVisible(false);
  };
  const handleLikePress = async (e: any) => {
    e.stopPropagation();
    const token = await AsyncStorage.getItem("token");
    if (!token) {
      handleLoginPress();
      return; // Выходим, если нет токена
    }
    if (isDis) {
      return;
    }
    if (isLiked) {
      dispatch(putUnFavorite(id)).then(() => setIsLiked(false));
    } else {
      dispatch(putFavorite(id)).then(() => setIsLiked(true));
    }
  };

  const handleCartPress = (e: any) => {
    e.stopPropagation();
    if (onAddToCartPress && productData) {
      onAddToCartPress(productData);
    }
  };

  // Очищаем таймаут при размонтировании
  useEffect(() => {
    return () => {
      if (imageLoadTimeoutRef.current) {
        clearTimeout(imageLoadTimeoutRef.current);
      }
    };
  }, []);

  const handleImageLoadStart = useCallback(() => {
    setIsImageLoading(true);
    setImageError(false);

    // Устанавливаем таймаут на случай, если изображение загружается слишком долго
    if (imageLoadTimeoutRef.current) {
      clearTimeout(imageLoadTimeoutRef.current);
    }

    imageLoadTimeoutRef.current = setTimeout(() => {
      if (isImageLoading) {
        console.log("Image loading timeout:", img);
        setIsImageLoading(false);
        setImageError(true);
      }
    }, 10000); // 10 секунд таймаут
  }, [img, isImageLoading]);

  const handleImageLoadEnd = useCallback(() => {
    setIsImageLoading(false);
    setImageError(false);
    if (imageLoadTimeoutRef.current) {
      clearTimeout(imageLoadTimeoutRef.current);
    }
  }, []);

  const handleImageError = useCallback(() => {
    console.log("Image failed to load:", img);
    setIsImageLoading(false);
    setImageError(true);
    if (imageLoadTimeoutRef.current) {
      clearTimeout(imageLoadTimeoutRef.current);
    }
  }, [img]);

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

  const toProductDetail = () => {
    if (!isDis) {
      router.push(
        `dashboard/product/${encodeURIComponent(id)}?productId=${id}&productName=${encodeURIComponent(name)}`,
      );
    }
  };

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
      return {
        uri: img,
        cache: "force-cache",
      };
    }

    // Если это уже объект изображения (require)
    return img;
  }, [img, isValidImageUrl]);

  // Проверяем, нужно ли показывать заглушку
  const showPlaceholder =
    !img || imageError || (typeof img === "string" && !isValidImageUrl(img));

  // Сбрасываем состояние при изменении img
  useEffect(() => {
    if (showPlaceholder) {
      setIsImageLoading(false);
      setImageError(true);
    } else {
      setIsImageLoading(true);
      setImageError(false);
    }
  }, [img, showPlaceholder]);

  const stockInfo = productData?.originalProduct?.stocks?.[0]?.stockInfo;
  const isOutOfStock = stockInfo === "Нет в наличии" || false;

  return (
    <>
      <TouchableOpacity
        onPress={toProductDetail}
        activeOpacity={0.9}
        style={styles.cardTouchable}
      >
        <ThemedView lightColor="#FFFFFF" style={styles.container}>
          <View style={styles.imageContainer}>
            {/* Всегда показываем изображение, но с правильным источником */}
            <Image
              source={showPlaceholder ? PLACEHOLDER_IMAGE : imageSource}
              style={styles.image}
              resizeMode="cover"
              onLoadStart={!showPlaceholder ? handleImageLoadStart : undefined}
              onLoadEnd={!showPlaceholder ? handleImageLoadEnd : undefined}
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

              {totalCartQuantity && (
                <View style={styles.cartBadge}>
                  <ThemedText style={styles.cartBadgeText}>
                    {totalCartQuantity}
                  </ThemedText>
                </View>
              )}

              <TouchableOpacity
                style={[styles.cartButton, cartItem && styles.cartButtonActive]}
                onPress={handleCartPress}
                activeOpacity={0.7}
              >
                <CartIcon />
              </TouchableOpacity>
            </View>
          </View>
        </ThemedView>
      </TouchableOpacity>
      <LoginModal
        visible={loginModalVisible}
        onClose={() => setLoginModalVisible(false)}
        onLogin={handleLogin}
        enumFlag={"login"}
      />
    </>
  );
};

const styles = StyleSheet.create({
  cardTouchable: {
    width: "48.8%",
    marginBottom: 12,
  },
  container: {
    flexDirection: "column",
    width: "100%",
    borderRadius: 8,
    overflow: "hidden",
    elevation: 3,
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
    borderRadius: 12,
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
