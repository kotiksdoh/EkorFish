import { CartIcon, LikeIcon, SnowflakeIcon } from "@/assets/icons/icons.js";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { LoginModal } from "@/features/auth/ui/components/LoginModal";
import { getProduct, putFavorite, putUnFavorite, setProductPreview } from "@/features/catalog/catalogSlice";
import { buildProductPreviewFromList } from "@/features/shared/services/productSingleAdapter";
import { useTemplatePicker } from "@/features/templates/TemplatePickerContext";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
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
  isFavorite?: boolean;
  productData?: any;
  onAddToCartPress?: (product: any) => void;
  isDis?: boolean;
  fullWidth?: boolean;
  returnTo?: "home" | "heart" | "catalog" | "shop" | "user";
  onBeforeNavigate?: () => void;
}

// Заглушка для изображения
const PLACEHOLDER_IMAGE = require("@/assets/icons/png/noImage.png");

function formatProductListDate(value?: string | null): string | null {
  if (!value || typeof value !== "string") return null;

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;

  return `${date.toLocaleDateString("ru-RU")} г.`;
}

const ProductCardComponent: React.FC<ProductCardProps> = ({
  id,
  img,
  isFrozen,
  name,
  kgPrice,
  fullPrice,
  isFavorite,
  productData,
  onAddToCartPress,
  isDis = false,
  fullWidth = false,
  returnTo,
  onBeforeNavigate,
}) => {
  const [imageError, setImageError] = useState(false);
  const [isLiked, setIsLiked] = useState(isFavorite);
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

  const handleCartPress = async (e: any) => {
    e.stopPropagation();
    if (!onAddToCartPress || !productData) return;

    if (!isTemplatePick) {
      const token = await AsyncStorage.getItem("token");
      if (!token) {
        handleLoginPress();
        return;
      }
    }

    onAddToCartPress(productData);
  };

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const handleImageError = useCallback(() => {
    if (!isMountedRef.current) return;
    setImageError(true);
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

    onBeforeNavigate?.();

    const productId = String(id);
    let productPath: string;
    if (returnTo === "heart") {
      productPath = `/(tabs)/heart/product/${encodeURIComponent(productId)}?productId=${productId}`;
    } else if (returnTo === "home") {
      productPath = `/product/${encodeURIComponent(productId)}?productId=${productId}`;
    } else if (returnTo === "shop") {
      productPath = `/(tabs)/shop/product/${encodeURIComponent(productId)}?productId=${productId}`;
    } else if (returnTo === "user") {
      productPath = `/(tabs)/user/product/${encodeURIComponent(productId)}?productId=${productId}`;
    } else {
      productPath = `/(tabs)/dashboard/product/${encodeURIComponent(productId)}?productId=${productId}`;
    }

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
  }, [dispatch, id, isDis, name, onBeforeNavigate, productData, returnTo, router]);

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

  useEffect(() => {
    setImageError(false);
  }, [img]);

  const imageRecyclingKey =
    typeof img === "string" && hasValidImageUrl ? img : `product-${id ?? "unknown"}`;

  const stockInfo = productData?.originalProduct?.stocks?.[0]?.stockInfo;
  const isOutOfStock = stockInfo === "Нет в наличии" || false;

  const formattedDateFrom = useMemo(
    () => formatProductListDate(productData?.dateFrom),
    [productData?.dateFrom],
  );
  const formattedDateTo = useMemo(
    () => formatProductListDate(productData?.dateTo),
    [productData?.dateTo],
  );
  const hasDates = Boolean(formattedDateFrom || formattedDateTo);

  const measureShort = useMemo(() => {
    const measureType =
      productData?.measureType ?? productData?.originalProduct?.measureType;
    const normalized = String(measureType || "").toLowerCase();
    return normalized === "килограмм" || normalized === "кг" ? "кг" : "шт";
  }, [productData?.measureType, productData?.originalProduct?.measureType]);

  const quantityBadgeLabel = isTemplatePick
    ? totalTemplateQuantity
    : totalCartQuantity;
  const badgeLabelLength = quantityBadgeLabel?.length ?? 0;

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
        <ThemedView
          lightColor="#FFFFFF"
          darkColor="#151516"
          style={styles.container}
        >
          <View
            style={[
              styles.imageContainer,
              isDarkMode
                ? styles.imageContainerDark
                : styles.imageContainerLight,
            ]}
          >
            <Image
              source={showPlaceholder ? PLACEHOLDER_IMAGE : imageSource}
              style={styles.image}
              contentFit="cover"
              cachePolicy="disk"
              recyclingKey={imageRecyclingKey}
              transition={0}
              onError={handleImageError}
            />

            {isFrozen && !showPlaceholder && (
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

            {hasDates ? (
              <View style={styles.datesContainer}>
                {formattedDateFrom ? (
                  <ThemedText
                    style={styles.dateText}
                    lightColor="#80818B"
                    darkColor="#FBFCFF80"
                  >
                    Выработка: {formattedDateFrom}
                  </ThemedText>
                ) : null}
                {formattedDateTo ? (
                  <ThemedText
                    style={styles.dateText}
                    lightColor="#80818B"
                    darkColor="#FBFCFF80"
                  >
                    Годен до: {formattedDateTo}
                  </ThemedText>
                ) : null}
              </View>
            ) : null}

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
                    {kgPrice ? kgPrice : "0,00"}{' '}
                  </ThemedText>
                  <ThemedText
                    lightColor="#203686"
                    darkColor="#4C94FF"
                    style={styles.kgLabel}
                  >
                    {" "}₽ / {measureShort}
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

              <LinearGradient
                colors={
                  isDarkMode
                    ? ["rgba(21, 21, 22, 0)", "#151516"]
                    : ["rgba(255, 255, 255, 0)", "#FFFFFF"]
                }
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.priceFade}
                pointerEvents="none"
              />

              <View style={styles.cartButtonWrapper}>
                {quantityBadgeLabel ? (
                  <View
                    style={[
                      styles.cartBadge,
                      badgeLabelLength >= 3 && styles.cartBadgeWide,
                      badgeLabelLength === 2 && styles.cartBadgeMedium,
                      isTemplatePick && styles.cartBadgeTemplate,
                    ]}
                  >
                    <ThemedText
                      style={[
                        styles.cartBadgeText,
                        badgeLabelLength >= 2 && styles.cartBadgeTextCompact,
                      ]}
                      numberOfLines={1}
                    >
                      {quantityBadgeLabel}
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
    position: "relative",
  },
  imageContainer: {
    position: "relative",
    width: "100%",
    height: 138,
    borderRadius: 8,
  },
  imageContainerLight: {
    backgroundColor: "#F5F5F5",
  },
  imageContainerDark: {
    backgroundColor: "#2E2E32",
  },
  image: {
    width: "100%",
    height: "100%",
    borderRadius: 8,
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
  cartButtonWrapper: {
    position: "relative",
    marginLeft: 8,
  },
  cartBadge: {
    position: "absolute",
    top: -6,
    right: -4,
    backgroundColor: "#FF3B30",
    borderRadius: 9,
    minWidth: 18,
    height: 18,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 4,
    zIndex: 3,
  },
  cartBadgeMedium: {
    minWidth: 22,
    paddingHorizontal: 4,
  },
  cartBadgeWide: {
    minWidth: 28,
    paddingHorizontal: 5,
  },
  cartBadgeTemplate: {
    top: -8,
    right: -10,
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
  cartBadgeTextCompact: {
    fontSize: 10,
    lineHeight: 12,
    letterSpacing: -0.2,
  },
  infoContainer: {
    padding: 8,
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
  datesContainer: {
    marginBottom: 8,
    gap: 2,
  },
  dateText: {
    fontFamily: "Montserrat",
    fontWeight: "500",
    fontSize: 12,
    lineHeight: 14.4,
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
    position: "relative",
  },
  priceContainer: {
    flex: 1,
  },
  priceFade: {
    position: "absolute",
    right: 40,
    top: 0,
    bottom: 0,
    width: 20,
    zIndex: 1,
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
    fontWeight: "600",
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
    prevProps.productData?.dateFrom === nextProps.productData?.dateFrom &&
    prevProps.productData?.dateTo === nextProps.productData?.dateTo &&
    prevProps.productData?.measureType === nextProps.productData?.measureType &&
    prevProps.fullWidth === nextProps.fullWidth &&
    prevProps.isDis === nextProps.isDis &&
    prevProps.onAddToCartPress === nextProps.onAddToCartPress
  );
});
