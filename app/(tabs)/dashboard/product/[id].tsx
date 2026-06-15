import { CheckCircleIcon, CloseCircleIcon } from "@/assets/icons/icons";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { ModalHeader } from "@/features/auth/ui/Header";
import {
  AddToCart,
  getProduct,
  setProductNavigationPending,
} from "@/features/catalog/catalogSlice";
import { ProductDetailGallery } from "@/features/catalog/ui/components/ProductDetailGallery";
import { buildTemplateLineFromProduct } from "@/features/templates/buildTemplateLine";
import { useTemplatePicker } from "@/features/templates/TemplatePickerContext";
import { AddToCartModal } from "@/features/shared/ui/AddToCartModal";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useColorScheme } from "@/hooks/use-color-scheme";
import {
  ActivityIndicator,
  Animated,
  BackHandler,
  Dimensions,
  LayoutAnimation,
  LayoutChangeEvent,
  Platform,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  UIManager,
  View,
} from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";

// Включаем LayoutAnimation для Android
if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const { width: screenWidth, height: screenHeight } = Dimensions.get("window");

export default function ProductDetailScreen() {
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === "dark";
  const params = useLocalSearchParams<{
    productId: string;
    productName?: string;
    returnTo?: string;
  }>();
  const productId = Array.isArray(params.productId)
    ? params.productId[0]
    : params.productId;
  const productName = Array.isArray(params.productName)
    ? params.productName[0]
    : params.productName;
  const returnTo = Array.isArray(params.returnTo)
    ? params.returnTo[0]
    : params.returnTo;
  const cameFromHomeRef = useRef(false);

  useEffect(() => {
    if (returnTo === "home") {
      cameFromHomeRef.current = true;
    }
  }, [returnTo]);

  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedPurchaseOptionIndex, setSelectedPurchaseOptionIndex] =
    useState(0);
  const [quantity, setQuantity] = useState(0);
  const [selectedTab, setSelectedTab] = useState<
    "description" | "characteristics"
  >("description");
  const [tabContainerWidth, setTabContainerWidth] = useState(0);
  const [tabAnim] = useState(new Animated.Value(0));
  const [isCartModalVisible, setIsCartModalVisible] = useState(false);
  const [existingCartItem, setExistingCartItem] = useState<any>(null);
  const [hasAuthToken, setHasAuthToken] = useState(false);

  const tabContainerRef = useRef<View>(null);

  const router = useRouter();
  const dispatch = useAppDispatch();
  const storedProduct = useAppSelector((state) => state.catalog.product);
  const activeProductId = useAppSelector((state) => state.catalog.activeProductId);
  const isLoadingProduct = useAppSelector((state) => state.catalog.isLoadingProduct);
  const cartItems = useAppSelector((state) => state.catalog.cart);

  const product = useMemo(() => {
    if (!productId || String(activeProductId) !== String(productId)) {
      return null;
    }
    if (!storedProduct || String(storedProduct.id) !== String(productId)) {
      return null;
    }
    return storedProduct;
  }, [storedProduct, productId, activeProductId]);
  const templatePicker = useTemplatePicker();
  const selectedPurchaseOption =
    product?.purchaseOptions?.[selectedPurchaseOptionIndex];
  const totalPrice = selectedPurchaseOption
    ? quantity * selectedPurchaseOption.price
    : 0;

  useFocusEffect(
    useCallback(() => {
      const checkAuthToken = async () => {
        const token = await AsyncStorage.getItem("token");
        setHasAuthToken(Boolean(token));
      };
      checkAuthToken();

      return () => {
        dispatch(setProductNavigationPending(false));
      };
    }, [dispatch]),
  );

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
    console.log("Buy now:", { productId, quantity, totalPrice });
  };

  const handleOpenCartModal = () => {
    if (templatePicker.pickingForTemplateId && product?.purchaseOptions) {
      let existingLine: any = null;
      for (const option of product.purchaseOptions) {
        const match = templatePicker
          .getExistingTemplateLinesForProduct(String(productId))
          .find(
            (l) =>
              String(l.productPurchaseOptionId) === String(option.id),
          );
        if (match) {
          existingLine = match;
          const optionIndex = product.purchaseOptions.findIndex(
            (opt: any) => String(opt.id) === String(option.id),
          );
          if (optionIndex !== -1) {
            setSelectedPurchaseOptionIndex(optionIndex);
          }
          break;
        }
      }
      setExistingCartItem(existingLine ? [existingLine] : null);
      setIsCartModalVisible(true);
      return;
    }

    // Ищем товар в корзине по ВСЕМ опциям, а не только первой
    let existingItem = null;

    if (product?.purchaseOptions) {
      for (const option of product.purchaseOptions) {
        const item = cartItems?.find(
          (item: any) =>
            item.productId === productId &&
            item.productPurchaseOptionId === option.id,
        );
        if (item) {
          existingItem = item;
          // Устанавливаем выбранную опцию равной той, что в корзине
          const optionIndex = product.purchaseOptions.findIndex(
            (opt: any) => opt.id === option.id,
          );
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

  const handleAddToCart = (
    productId: string,
    optionId: string,
    quantity: number,
  ) => {
    if (templatePicker.pickingForTemplateId && product) {
      void templatePicker.addLineFromProduct(
        buildTemplateLineFromProduct(product, optionId, quantity),
      );
      setIsCartModalVisible(false);
      return;
    }
    console.log("Add to cart:", { productId, optionId, quantity });
    // ИСПРАВЛЕНО: Добавляем dispatch
    dispatch(
      AddToCart({
        productId: productId,
        productPurchaseOptionId: optionId,
        quantity: quantity,
      }),
    );
    setIsCartModalVisible(false);
  };

  useEffect(() => {
    if (!productId) return;

    setIsExpanded(false);
    setSelectedPurchaseOptionIndex(0);
    setSelectedTab("description");
    setIsCartModalVisible(false);
    setExistingCartItem(null);

    const isSameProduct = String(activeProductId) === String(productId);
    const hasProductData =
      storedProduct && String(storedProduct.id) === String(productId);
    const alreadyHandled =
      isSameProduct && (isLoadingProduct || hasProductData);

    if (!alreadyHandled) {
      dispatch(getProduct(productId));
    }
  }, [
    productId,
    dispatch,
    activeProductId,
    storedProduct,
    isLoadingProduct,
  ]);

  const handleBack = useCallback(() => {
    if (cameFromHomeRef.current) {
      if (router.canDismiss()) {
        router.dismiss();
      } else {
        router.dismissTo("/dashboard");
      }
      requestAnimationFrame(() => {
        router.replace("/");
      });
      return;
    }
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace("/dashboard");
  }, [router]);

  useFocusEffect(
    useCallback(() => {
      const subscription = BackHandler.addEventListener("hardwareBackPress", () => {
        handleBack();
        return true;
      });
      return () => subscription.remove();
    }, [handleBack]),
  );

  const toggleExpanded = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setIsExpanded(!isExpanded);
  };

  const handleTabChange = (tab: "description" | "characteristics") => {
    Animated.spring(tabAnim, {
      toValue: tab === "description" ? 0 : 1,
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
    return (
      cartItems?.filter((item: any) => item.productId === product.id) || []
    );
  }, [cartItems, product]);

  const templateLinesForProduct = useMemo(() => {
    if (!templatePicker.pickingForTemplateId || !product?.id) return [];
    return templatePicker.getExistingTemplateLinesForProduct(String(product.id));
  }, [
    templatePicker.pickingForTemplateId,
    templatePicker.liveTemplateItems,
    product?.id,
    templatePicker.getExistingTemplateLinesForProduct,
  ]);

  const linesForBottomBar = templatePicker.pickingForTemplateId
    ? templateLinesForProduct
    : cartItemsForProduct;

  const totalCartQuantity = useMemo(() => {
    if (!linesForBottomBar.length) return null;
    return linesForBottomBar.reduce((sum, item) => sum + item.quantity, 0);
  }, [linesForBottomBar]);

  const productSliderItems = useMemo(
    () =>
      (product?.images ?? []).map(
        (image: { imageUrl?: string }, index: number) => ({
          id: `product-${product?.id ?? "unknown"}-${index}`,
          imageUrl: image.imageUrl ?? "",
        }),
      ),
    [product?.images, product?.id],
  );
  return (
    <SafeAreaProvider>
      <ThemedView
        style={styles.safeArea}
        lightColor={"#EBEDF0"}
        darkColor="#040508"
      >
        <ModalHeader
          showBackButton={true}
          onBackPress={handleBack}
          isProduct={true}
          productId={productId}
          isFavorite={product?.isFavorite}
        />

        <View style={styles.mainContainer}>
          {isLoadingProduct ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator
                size="large"
                color={isDarkMode ? "#4C94FF" : "#1B1B1C"}
              />
            </View>
          ) : (
          <>
          <ScrollView
            style={styles.container}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
            nestedScrollEnabled
          >
            <ThemedView
              style={styles.themeContainer}
              lightColor={"#FFFFFF"}
              darkColor="#040508"
            >
              <ProductDetailGallery
                key={String(product?.id ?? productId)}
                items={productSliderItems}
                autoPlayInterval={4000}
                showIndicators={productSliderItems.length > 1}
              />

              <View style={styles.productNameWrapper}>
                <ThemedText
                  style={styles.themeName}
                  lightColor="#1B1B1C"
                  darkColor="#FBFCFF"
                  numberOfLines={isExpanded ? undefined : 2}
                  ellipsizeMode="tail"
                >
                  {product?.name || ""}
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

            <ThemedView
              style={styles.themeContainer}
              lightColor={"#FFFFFF"}
              darkColor="#040508"
            >
              <ThemedView
                lightColor={"#F2F4F7"}
                darkColor="#202022"
                style={styles.subContainer}
              >
                <ThemedText
                  style={styles.subContainerName}
                  lightColor={"#80818B"}
                  darkColor="#FBFCFF80"
                >
                  Вид цены – упаковками
                </ThemedText>
                <ThemedText
                  style={styles.subContainerPrice}
                  lightColor={"#1B1B1C"}
                  darkColor="#FBFCFF"
                >
                  {selectedPurchaseOption?.price?.toLocaleString("ru-RU")} ₽
                </ThemedText>
              </ThemedView>

              <ThemedView
                lightColor={"#F2F4F7"}
                darkColor="#202022"
                style={styles.subContainer}
              >
                <ThemedText
                  style={styles.subContainerName}
                  lightColor={"#80818B"}
                  darkColor="#FBFCFF80"
                >
                  Наличие
                </ThemedText>
                {product?.stocks?.map((stock: any, index: number) => (
                  <View key={index} style={styles.subContainerMainSub}>
                    {stock.stockInfo !== "Нет в наличии" ? (
                      <CheckCircleIcon />
                    ) : (
                      <CloseCircleIcon />
                    )}
                    <View style={styles.subContainerSubSub}>
                      <ThemedText
                        style={styles.subContainerCity}
                        lightColor={"#1B1B1C"}
                        darkColor="#FBFCFF"
                      >
                        {stock.name}
                      </ThemedText>
                      <ThemedText
                        style={styles.subContainerCityInfo}
                        lightColor={"#1B1B1C"}
                        darkColor="#FBFCFF"
                      >
                        {stock.stockInfo}
                      </ThemedText>
                    </View>
                  </View>
                ))}
              </ThemedView>
            </ThemedView>

            <ThemedView
              style={styles.themeContainer}
              lightColor="#FFFFFF"
              darkColor="#040508"
            >
              <ThemedView
                style={styles.tabsContainer}
                lightColor={"#F2F4F7"}
                darkColor="#202022"
                onLayout={handleTabContainerLayout}
                ref={tabContainerRef}
              >
                <Animated.View
                  style={[
                    styles.activeTabIndicator,
                    isDarkMode && {
                      backgroundColor: "#101013",
                    },
                    {
                      width: tabContainerWidth,
                      transform: [{ translateX: indicatorPosition }],
                    },
                  ]}
                />

                <TouchableOpacity
                  style={[
                    styles.tabButton,
                    selectedTab === "description" && styles.activeTabButton,
                  ]}
                  onPress={() => handleTabChange("description")}
                  activeOpacity={0.7}
                >
                  <ThemedText
                    style={[
                      styles.tabText,
                      selectedTab === "description" && styles.activeTabText,
                    ]}
                    lightColor={
                      selectedTab === "description" ? "#1B1B1C" : "#80818B"
                    }
                    darkColor={
                      selectedTab === "description" ? "#FBFCFF" : "#FBFCFF80"
                    }
                  >
                    Описание
                  </ThemedText>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.tabButton,
                    selectedTab === "characteristics" && styles.activeTabButton,
                  ]}
                  onPress={() => handleTabChange("characteristics")}
                  activeOpacity={0.7}
                >
                  <ThemedText
                    style={[
                      styles.tabText,
                      selectedTab === "characteristics" && styles.activeTabText,
                    ]}
                    lightColor={
                      selectedTab === "characteristics" ? "#1B1B1C" : "#80818B"
                    }
                    darkColor={
                      selectedTab === "characteristics"
                        ? "#FBFCFF"
                        : "#FBFCFF80"
                    }
                  >
                    Характеристика
                  </ThemedText>
                </TouchableOpacity>
              </ThemedView>

              <View style={styles.tabContent}>
                {selectedTab === "description" ? (
                  product?.description ? (
                    <ThemedText
                      style={styles.descriptionText}
                      lightColor="#1B1B1C"
                      darkColor="#FBFCFF"
                    >
                      {product.description}
                    </ThemedText>
                  ) : (
                    <ThemedText
                      style={styles.descriptionText}
                      lightColor="#80818B"
                      darkColor="#FBFCFF80"
                    >
                      Описание товара отсутствует
                    </ThemedText>
                  )
                ) : (
                  <View style={styles.characteristicsContainer}>
                    <View style={styles.dates}>
                      <View style={styles.onceDate}>
                        <ThemedText
                          style={styles.onceDateTitle}
                          lightColor="#80818B"
                          darkColor="#FBFCFF80"
                        >
                          Дата выработки
                        </ThemedText>
                        <ThemedText
                          style={styles.onceDateValue}
                          lightColor="#1B1B1C"
                          darkColor="#FBFCFF"
                        >
                          {product?.dateFrom
                            ? new Date(product.dateFrom).toLocaleDateString(
                                "ru-RU",
                              )
                            : "—"}
                        </ThemedText>
                      </View>
                      <View style={styles.onceDate}>
                        <ThemedText
                          style={styles.onceDateTitle}
                          lightColor="#80818B"
                          darkColor="#FBFCFF80"
                        >
                          Срок годности
                        </ThemedText>
                        <ThemedText
                          style={styles.onceDateValue}
                          lightColor="#1B1B1C"
                          darkColor="#FBFCFF"
                        >
                          {product?.dateTo
                            ? new Date(product.dateTo).toLocaleDateString(
                                "ru-RU",
                              )
                            : "—"}
                        </ThemedText>
                      </View>
                    </View>

                    {product?.filterOptions &&
                    product.filterOptions.length > 0 ? (
                      <View style={styles.characteristicsList}>
                        {product.filterOptions.map(
                          (char: any, index: number) => (
                            <View key={index} style={styles.characteristicItem}>
                              <ThemedText
                                style={styles.characteristicLabel}
                                lightColor="#80818B"
                                darkColor="#FBFCFF80"
                              >
                                {char.name}:
                              </ThemedText>
                              <ThemedText
                                style={styles.characteristicValue}
                                lightColor="#1B1B1C"
                                darkColor="#FBFCFF"
                              >
                                {char.filterOptions[0]?.value || ""}
                              </ThemedText>
                            </View>
                          ),
                        )}
                      </View>
                    ) : (
                      <ThemedText
                        style={styles.characteristicsText}
                        lightColor="#1B1B1C"
                        darkColor="#FBFCFF"
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
              onPress={hasAuthToken ? handleOpenCartModal : undefined}
              disabled={!hasAuthToken}
              activeOpacity={hasAuthToken ? 0.9 : 1}
            >
              <View style={styles.addToCartContent}>
                <View style={styles.cartIconContainer}>
                  {templatePicker.pickingForTemplateId ? (
                    <ThemedText style={styles.templatePlusIcon}>+</ThemedText>
                  ) : (
                    <Ionicons name="cart-outline" size={24} color="#FFFFFF" />
                  )}
                  {totalCartQuantity != null && totalCartQuantity > 0 && (
                    <View style={styles.cartBadge}>
                      <ThemedText style={styles.cartBadgeText}>
                        {totalCartQuantity > 10 ? "10+" : totalCartQuantity}
                      </ThemedText>
                    </View>
                  )}
                </View>
                <ThemedText style={styles.addToCartText}>
                  {templatePicker.pickingForTemplateId
                    ? "Добавить в шаблон"
                    : cartItemsForProduct.length > 0
                      ? `${cartItemsForProduct.length} товар(а) в корзине`
                      : "Добавить в корзину"}
                </ThemedText>
              </View>
            </TouchableOpacity>
          </View>
          </>
          )}

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
            variant={
              templatePicker.pickingForTemplateId ? "template" : "cart"
            }
          />
        </View>
      </ThemedView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  safeArea: {
    flex: 1,
  },
  mainContainer: {
    flex: 1,
    position: "relative",
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
    flexDirection: "row",
    alignItems: "flex-start",
    marginTop: 20,
    marginBottom: 16,
  },
  themeName: {
    fontWeight: "600",
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
    justifyContent: "center",
    alignItems: "center",
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
    display: "flex",
    flexDirection: "column",
    borderRadius: 16,
    padding: 16,
    gap: 8,
    marginBottom: 8,
  },
  subContainerName: {
    fontWeight: "500",
    fontSize: 14,
  },
  subContainerPrice: {
    fontWeight: "600",
    fontSize: 20,
  },
  subContainerCityInfo: {
    fontWeight: "500",
    fontSize: 14,
  },
  subContainerCity: {
    fontWeight: "600",
    fontSize: 16,
  },
  subContainerMainSub: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
    marginTop: 4,
  },
  subContainerSubSub: {
    flexDirection: "column",
  },
  tabsContainer: {
    borderRadius: 12,
    padding: 3,
    // backgroundColor: '#F2F4F7',
    flexDirection: "row",
    position: "relative",
    marginBottom: 16,
    ...Platform.select({
      ios: {
        backdropFilter: "blur(40px)",
      },
    }),
  },
  tabButton: {
    flex: 1,
    backgroundColor: "transparent",
    borderRadius: 7,
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1,
  },
  activeTabButton: {
    backgroundColor: "transparent",
  },
  activeTabIndicator: {
    position: "absolute",
    backgroundColor: "#FFFFFF",
    borderRadius: 7,
    height: "100%",
    top: 3,
    left: 3,
    shadowColor: "#000",
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
    fontWeight: "500",
    textAlign: "center",
  },
  activeTabText: {
    fontWeight: "600",
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
    fontWeight: "500",
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
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
  },
  characteristicLabel: {
    fontSize: 14,
    fontWeight: "400",
  },
  characteristicValue: {
    fontSize: 14,
    fontWeight: "500",
  },
  dates: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  onceDate: {
    flexDirection: "column",
  },
  onceDateTitle: {
    fontSize: 16,
    fontWeight: "500",
  },
  onceDateValue: {
    fontSize: 16,
    fontWeight: "600",
  },
  // Стили для нижней панели
  bottomPanel: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: Platform.OS === "ios" ? 34 : 20,
  },
  templatePlusIcon: {
    fontSize: 28,
    fontWeight: "700",
    color: "#FFFFFF",
    lineHeight: 30,
  },
  addToCartButton: {
    backgroundColor: "#203686",
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 24,
    width: "100%",
  },
  addToCartContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  addToCartText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
    fontFamily: "Montserrat",
  },
  cartIconContainer: {
    position: "relative",
    marginRight: 8,
  },
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
});
