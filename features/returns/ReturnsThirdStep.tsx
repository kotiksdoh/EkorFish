// MyReturnsThirdStep.tsx
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { setCompany } from "@/features/auth/authSlice";
import { ModalHeader } from "@/features/auth/ui/Header";
import { RecommendedOrderProducts } from "@/features/catalog/ui/components/RecommendedOrderProducts/RecommendedOrderProducts";
import { AddToCartModal } from "@/features/shared/ui/AddToCartModal";
import { AddressSelectionModal } from "@/features/shared/ui/AddressSelectionModal";
import { TownSelectionModal } from "@/features/shared/ui/TownSelectionModal";
import { PrimaryButton } from "@/features/shared/ui/components/PrimartyButton";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { Image as ExpoImage } from "expo-image";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, FlatList, Image, Platform, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { AppModal } from "@/features/shared/ui/AppModal";

import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AddToCart, createReturnRequest } from "../catalog/catalogSlice";
import { baseUrl } from "../shared/services/axios";
import type { ReturnReasonId } from "./returnReason";
import { isSameReturnReason } from "./returnReason";

function classifyReturnMethodByName(name: string | undefined): "address" | "storage" | "other" {
  if (!name) return "other";
  const n = name.toLowerCase();
  if (n.includes("склад") || (n.includes("привез") && n.includes("склад"))) {
    return "storage";
  }
  if (n.includes("следующ") || n.includes("забер")) {
    return "address";
  }
  return "other";
}

interface MyReturnsThirdStepProps {
  visible: boolean;
  onClose: () => void;
  /** Закрыть всё и перейти на главную (каталог). */
  onNavigateHome?: () => void;
  /** Остаться в возвратах: закрыть шаги мастера, обновить список. */
  onViewReturnDetails?: () => void;
}

export const MyReturnsThirdStep: React.FC<MyReturnsThirdStepProps> = ({
  visible,
  onClose,
  onNavigateHome,
  onViewReturnDetails,
}) => {
  const insets = useSafeAreaInsets();
  const systemTheme = useColorScheme();
  const isDark = systemTheme === "dark";
  const dispatch = useAppDispatch();

  const returnableOrders = useAppSelector((state) => state.catalog.returnableOrders);
  const returnRequests = useAppSelector((state) => state.catalog.returnRequests);
  const returnsStatuses = useAppSelector((state) => state.catalog.returnsStatuses);
  const cartItems = useAppSelector((state) => state.catalog.cart);
  const currentCompany = useAppSelector((state) => state.auth.currentCompany);
  const me = useAppSelector((state) => state.auth.me);
  const [loading, setLoading] = useState(false);

  const [selectedReturnMethod, setSelectedReturnMethod] = useState<number | null>(null);
  const [selectedRefundMethod, setSelectedRefundMethod] = useState<number | null>(null);
  const [deliveryAddressId, setDeliveryAddressId] = useState<string | null>(null);
  const [storageIdForReturn, setStorageIdForReturn] = useState<string | null>(null);
  const [selectedAddressForReturn, setSelectedAddressForReturn] = useState<any | null>(null);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [showTownModal, setShowTownModal] = useState(false);
  const [showSuccessContent, setShowSuccessContent] = useState(false);
  const [selectedProductForCart, setSelectedProductForCart] = useState<any>(null);
  const [existingCartItem, setExistingCartItem] = useState<any>(null);
  const [showAddToCartModal, setShowAddToCartModal] = useState(false);

  useEffect(() => {
    if (!visible) {
      setShowSuccessContent(false);
      setShowAddressModal(false);
      setShowTownModal(false);
    }
  }, [visible]);

  // Получаем методы возврата и возврата денег из статусов
  const returnMethods = (returnsStatuses as any)?.returnMethods || [];
  const refundMethods = (returnsStatuses as any)?.refundMethods || [];

  // Собираем все выбранные товары
  const selectedProducts = useMemo(() => {
    const products: Array<{
      id: string;
      orderId: number;
      productName: string;
      productImage?: string;
      price: number;
      returnQuantity: number;
      measureType: string;
      reason?: ReturnReasonId;
      reasonName?: string;
      comment: string;
    }> = [];

    returnRequests.orders.forEach((requestOrder) => {
      const originalOrder = returnableOrders.find(
        (order) => order.orderId === requestOrder.orderId
      );

      if (originalOrder) {
        requestOrder.items.forEach((selectedItem) => {
          const originalProduct = originalOrder.products.find(
            (product: any) => product.id === selectedItem.orderProductId
          );

          if (originalProduct && selectedItem.returnQuantity > 0) {
            const reasonObj = (returnsStatuses as any)?.returnReasons?.find(
              (r: any) => isSameReturnReason(r.reason, selectedItem.reason),
            );
            
            products.push({
              id: selectedItem.orderProductId,
              orderId: requestOrder.orderId,
              productName: originalProduct.productName,
              productImage: originalProduct.productImage,
              price: originalProduct.price,
              returnQuantity: selectedItem.returnQuantity,
              measureType: originalProduct.measureType,
              reason: selectedItem.reason,
              reasonName: reasonObj?.name,
              comment: selectedItem.comment || "",
            });
          }
        });
      }
    });

    return products;
  }, [returnRequests, returnableOrders, returnsStatuses]);

  // Подсчет итогов
  const totals = useMemo(() => {
    let totalItems = 0;
    let totalPrice = 0;

    selectedProducts.forEach((product) => {
      totalItems += product.returnQuantity;
      totalPrice += product.price * product.returnQuantity;
    });

    return {
      totalItems,
      totalPrice,
      hasSelectedItems: totalItems > 0,
    };
  }, [selectedProducts]);

  const formatPrice = (price: number) => {
    return price.toLocaleString("ru-RU", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const getDeclension = (count: number, words: [string, string, string]) => {
    const cases = [2, 0, 1, 1, 1, 2];
    return words[
      count % 100 > 4 && count % 100 < 20 ? 2 : cases[Math.min(count % 10, 5)]
    ];
  };

  const selectedReturnMethodMeta = useMemo(() => {
    return returnMethods.find((m: any) => m.method === selectedReturnMethod);
  }, [returnMethods, selectedReturnMethod]);

  const returnMethodKind = useMemo(() => {
    return classifyReturnMethodByName(selectedReturnMethodMeta?.name);
  }, [selectedReturnMethodMeta]);

  const handleReturnMethodSelect = useCallback(
    (method: any) => {
      setSelectedReturnMethod(method.method);
      const kind = classifyReturnMethodByName(method.name);
      if (kind === "address") {
        setStorageIdForReturn(null);
        setShowAddressModal(true);
      } else if (kind === "storage") {
        setDeliveryAddressId(null);
        setSelectedAddressForReturn(null);
        setShowTownModal(true);
      } else {
        setDeliveryAddressId(null);
        setStorageIdForReturn(null);
        setSelectedAddressForReturn(null);
      }
    },
    []
  );

  const handleSelectAddressForReturn = useCallback((address: any) => {
    setSelectedAddressForReturn(address);
    setDeliveryAddressId(address?.id ? String(address.id) : null);
  }, []);

  const handleTownSelectedForReturn = useCallback((selectedStorageId: string) => {
    setStorageIdForReturn(selectedStorageId);
  }, []);

  const handleSelectCompanyForReturn = useCallback(
    (company: any) => {
      dispatch(setCompany(company));
      setSelectedAddressForReturn(null);
      setDeliveryAddressId(null);
    },
    [dispatch]
  );

  const handleAddCompanyForReturn = useCallback(() => {
    setShowAddressModal(false);
  }, []);

  const hasRequiredReturnLocation = useMemo(() => {
    if (returnMethodKind === "address") {
      return !!deliveryAddressId;
    }
    if (returnMethodKind === "storage") {
      return !!storageIdForReturn;
    }
    return true;
  }, [returnMethodKind, deliveryAddressId, storageIdForReturn]);

  const handleCreateReturn = async () => {
    if (
      selectedReturnMethod === null ||
      selectedRefundMethod === null ||
      !hasRequiredReturnLocation
    ) {
      return;
    }
    setLoading(true);
    try {
      const selectedOrder = returnRequests.orders.find((order) =>
        order.items.some((item) => item.returnQuantity > 0)
      );
      if (!selectedOrder) {
        return;
      }

      const payload: Record<string, unknown> = {
        refundMethod: selectedRefundMethod,
        returnMethod: selectedReturnMethod,
        orderId: selectedOrder.orderId,
        items: selectedOrder.items
          .filter((item) => item.returnQuantity > 0)
          .map((item) => ({
            orderProductId: item.orderProductId,
            returnQuantity: item.returnQuantity,
            reason: item.reason,
            comment: item.comment || "",
          })),
      };
      if (returnMethodKind === "address" && deliveryAddressId) {
        payload.deliveryAddressId = deliveryAddressId;
      }
      if (returnMethodKind === "storage" && storageIdForReturn) {
        payload.storageId = storageIdForReturn;
      }

      await dispatch(createReturnRequest(payload)).unwrap();
      setShowSuccessContent(true);
    } catch (error) {
      console.error("Error creating return request:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRecommendedAddToCartPress = useCallback(
    (product: any) => {
      const cartItemsForProduct =
        cartItems?.filter((item: any) => item.productId === product.id) || [];
      setSelectedProductForCart(product);
      setExistingCartItem(cartItemsForProduct);
      setShowAddToCartModal(true);
    },
    [cartItems],
  );

  const handleRecommendedAddToCart = useCallback(
    (productId: string, optionId: string, quantity: number) => {
      dispatch(
        AddToCart({
          productId,
          productPurchaseOptionId: optionId,
          quantity,
        }),
      );
      setShowAddToCartModal(false);
      setSelectedProductForCart(null);
      setExistingCartItem(null);
    },
    [dispatch],
  );

  const bottomHintMessage = useMemo(() => {
    if (selectedReturnMethod === null || selectedRefundMethod === null) {
      return "Выберите способ возврата и способ возврата денег";
    }
    if (returnMethodKind === "address" && !deliveryAddressId) {
      return "Выберите адрес доставки для возврата";
    }
    if (returnMethodKind === "storage" && !storageIdForReturn) {
      return "Выберите склад для возврата";
    }
    return "Выберите способ возврата и способ возврата денег";
  }, [
    selectedReturnMethod,
    selectedRefundMethod,
    returnMethodKind,
    deliveryAddressId,
    storageIdForReturn,
  ]);

  const renderProductRow = (item: (typeof selectedProducts)[0], isLast: boolean) => {
    const imageSource = item.productImage
      ? { uri: `${baseUrl}/${item.productImage}` }
      : require("@/assets/icons/png/noImage.png");

    return (
      <View
        style={[
          styles.productRow,
          !isLast && styles.productRowBorder,
          !isLast && isDark && styles.productRowBorderDark,
        ]}
      >
        <ExpoImage
          source={imageSource}
          style={styles.productImage}
          contentFit="cover"
        />
        <ThemedText
          style={styles.productName}
          numberOfLines={2}
          lightColor="#202022"
          darkColor="#F2F4F7"
        >
          {item.productName}
        </ThemedText>
        <ThemedText
          style={styles.productTotal}
          lightColor="#202022"
          darkColor="#F2F4F7"
        >
          {formatPrice(item.price * item.returnQuantity)} ₽
        </ThemedText>
      </View>
    );
  };

  const canSubmit =
    selectedReturnMethod !== null &&
    selectedRefundMethod !== null &&
    hasRequiredReturnLocation;

  const showBottomHint =
    selectedProducts.length > 0 &&
    (selectedReturnMethod === null ||
      selectedRefundMethod === null ||
      !hasRequiredReturnLocation);

  const listBottomPadding = useMemo(() => {
    const panelTop = 12;
    const totalsRow = 52;
    const buttonBlock = 48;
    const hintBlock = showBottomHint ? 40 : 0;
    const panelBottomPadding =
      (Platform.OS === "ios" ? 34 : 16) + insets.bottom;
    return panelTop + totalsRow + buttonBlock + hintBlock + panelBottomPadding + 16;
  }, [insets.bottom, showBottomHint]);

  const renderMethodOption = (
    method: any,
    selectedId: number | null,
    onSelect: (m: any) => void
  ) => {
    const selected = selectedId === method.method;
    return (
      <TouchableOpacity
        key={method.method}
        style={styles.methodRow}
        onPress={() => onSelect(method)}
        activeOpacity={0.7}
      >
        <View
          style={[
            styles.radioOuter,
            selected && styles.radioOuterSelected,
            isDark && selected && styles.radioOuterSelectedDark,
          ]}
        >
          {selected && <View style={styles.radioInner} />}
        </View>
        <ThemedText
          style={[
            styles.methodRowText,
            selected && styles.methodRowTextSelected,
            isDark && styles.methodRowTextDark,
          ]}
          lightColor="#202022"
          darkColor="#F2F4F7"
        >
          {method.name}
        </ThemedText>
      </TouchableOpacity>
    );
  };

  return (
    <AppModal
      animationType="slide"
      transparent={false}
      visible={visible}
      onRequestClose={() => {
        if (showAddressModal) {
          setShowAddressModal(false);
          return;
        }
        if (showTownModal) {
          setShowTownModal(false);
          return;
        }
        if (showSuccessContent) {
          setShowSuccessContent(false);
          onViewReturnDetails?.();
        } else {
          onClose();
        }
      }}
      presentationStyle="fullScreen"
      statusBarTranslucent={true}
    >
      <ThemedView
        lightColor="#EBEDF0"
        darkColor="#040508"
        style={styles.modalContainer}
      >
        <ModalHeader
          title="Заявка на возврат"
          subTitle={showSuccessContent ? undefined : "Шаг 3 из 3"}
          showBackButton={!showSuccessContent}
          showCloseButton={true}
          onBackPress={() => {
            if (showSuccessContent) {
              setShowSuccessContent(false);
              onViewReturnDetails?.();
            } else {
              onClose();
            }
          }}
        />

        {showSuccessContent ? (
          <ScrollView
            style={styles.successScrollView}
            contentContainerStyle={[
              styles.successScrollContent,
              { paddingBottom: Math.max(insets.bottom, 24) + 24 },
            ]}
            showsVerticalScrollIndicator={false}
          >
            <ThemedView
              lightColor="#FFFFFF"
              darkColor="#151516"
              style={styles.successContainer}
            >
              <Image
                source={require("@/assets/icons/png/Icon.png")}
                resizeMode="contain"
              />
              <ThemedText
                style={styles.successTitle}
                lightColor="#1B1B1C"
                darkColor="#FBFCFF"
              >
                Заявка на возврат создана
              </ThemedText>
              <ThemedText
                style={styles.successText}
                lightColor="#80818B"
                darkColor="#FBFCFF80"
              >
                Менеджер проверит заявку и свяжется с вами в течение 2 часов.
              </ThemedText>

              <View style={styles.successButtons}>
                <View style={styles.successButtonDetails}>
                  <PrimaryButton
                    title="Детали возврата"
                    onPress={() => {
                      setShowSuccessContent(false);
                      onViewReturnDetails?.();
                    }}
                    variant="third"
                    size="md"
                    fullWidth
                    style={styles.successActionButton}
                  />
                </View>
                <View style={styles.successButtonHome}>
                  <PrimaryButton
                    title="На главную"
                    onPress={() => {
                      setShowSuccessContent(false);
                      onNavigateHome?.();
                    }}
                    variant="primary"
                    size="md"
                    fullWidth
                    style={styles.successActionButton}
                  />
                </View>
              </View>
            </ThemedView>

            <RecommendedOrderProducts
              visible={showSuccessContent}
              onAddToCartPress={handleRecommendedAddToCartPress}
              returnTo="catalog"
            />
          </ScrollView>
        ) : (
          <>
            <FlatList
              style={styles.list}
              data={[{ id: "methods" }, { id: "products" }]}
              keyExtractor={(item) => item.id}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={[
                styles.listContent,
                { paddingBottom: listBottomPadding },
              ]}
              renderItem={({ item }) => {
                if (item.id === "methods") {
                  return (
                    <View style={styles.methodsContainer}>
                      <ThemedView
                        darkColor="#151516"
                        lightColor="#FFFFFF"
                        style={styles.methodBlock}
                      >
                        <ThemedText
                          style={styles.blockTitle}
                          lightColor="#202022"
                          darkColor="#F2F4F7"
                        >
                          Способ возврата
                        </ThemedText>
                        <View style={styles.methodOptionsList}>
                          {returnMethods.map((method: any) =>
                            renderMethodOption(
                              method,
                              selectedReturnMethod,
                              handleReturnMethodSelect
                            )
                          )}
                        </View>
                      </ThemedView>

                      <ThemedView
                        darkColor="#151516"
                        lightColor="#FFFFFF"
                        style={styles.methodBlock}
                      >
                        <ThemedText
                          style={styles.blockTitle}
                          lightColor="#202022"
                          darkColor="#F2F4F7"
                        >
                          Способ возврата денег
                        </ThemedText>
                        <View style={styles.methodOptionsList}>
                          {refundMethods.map((method: any) =>
                            renderMethodOption(method, selectedRefundMethod, (m) =>
                              setSelectedRefundMethod(m.method)
                            )
                          )}
                        </View>
                      </ThemedView>
                    </View>
                  );
                }
                return (
                  <ThemedView
                    darkColor="#151516"
                    lightColor="#FFFFFF"
                    style={styles.productsBlock}
                  >
                    <ThemedText
                      style={styles.blockTitle}
                      lightColor="#202022"
                      darkColor="#F2F4F7"
                    >
                      Товары
                    </ThemedText>
                    {selectedProducts.map((product, index) => (
                      <View key={`${product.orderId}-${product.id}`}>
                        {renderProductRow(
                          product,
                          index === selectedProducts.length - 1,
                        )}
                      </View>
                    ))}
                  </ThemedView>
                );
              }}
            />

            {selectedProducts.length > 0 && (
              <ThemedView
                darkColor="#151516"
                lightColor="#FFFFFF"
                style={[
                  styles.bottomPanel,
                  { paddingBottom: (Platform.OS === "ios" ? 34 : 16) + insets.bottom },
                ]}
              >
                <View style={styles.bottomPanelContent}>
                  <View style={styles.bottomLeft}>
                    <ThemedText
                      darkColor="#FBFCFF"
                      lightColor="#1B1B1C"
                      style={styles.bottomTotalPrice}
                    >
                      {formatPrice(totals.totalPrice)} ₽
                    </ThemedText>
                    <ThemedText
                      lightColor="#80818B"
                      darkColor="#FBFCFF80"
                      style={styles.bottomItemsCount}
                    >
                      {totals.totalItems > 0
                        ? `${totals.totalItems} ${getDeclension(totals.totalItems, [
                            "товар",
                            "товара",
                            "товаров",
                          ])}`
                        : "Товары не выбраны"}
                    </ThemedText>
                  </View>
                </View>

                <TouchableOpacity
                  style={[
                    styles.bottomButton,
                    (!canSubmit || loading) && styles.buttonDisabled,
                  ]}
                  disabled={!canSubmit || loading}
                  onPress={handleCreateReturn}
                >
                  {loading ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <ThemedText style={styles.bottomButtonText}>
                      Создать заявку
                    </ThemedText>
                  )}
                </TouchableOpacity>

                {showBottomHint && (
                  <ThemedText
                    lightColor="#80818B"
                    darkColor="#FBFCFF80"
                    style={styles.bottomHintText}
                  >
                    {bottomHintMessage}
                  </ThemedText>
                )}
              </ThemedView>
            )}
          </>
        )}

        <AddressSelectionModal
          stacked
          visible={showAddressModal}
          onClose={() => setShowAddressModal(false)}
          currentCompany={currentCompany}
          companies={me?.companies || []}
          selectedCompanyId={currentCompany?.id}
          selectedAddressId={selectedAddressForReturn?.id}
          onSelectCompany={handleSelectCompanyForReturn}
          onSelectAddress={handleSelectAddressForReturn}
          onAddCompany={handleAddCompanyForReturn}
        />

        <TownSelectionModal
          stacked
          selectionOnly
          visible={showTownModal}
          onClose={() => setShowTownModal(false)}
          storageId={storageIdForReturn || (me as any)?.storageId || ""}
          onTownSelected={handleTownSelectedForReturn}
        />

        <AddToCartModal
          visible={showAddToCartModal}
          onClose={() => {
            setShowAddToCartModal(false);
            setSelectedProductForCart(null);
            setExistingCartItem(null);
          }}
          product={selectedProductForCart}
          onAddToCart={handleRecommendedAddToCart}
          existingCartItem={existingCartItem}
          nestedInModal={showSuccessContent}
        />
      </ThemedView>
    </AppModal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
  },
  list: {
    flex: 1,
  },
  listContent: {
    flexGrow: 1,
  },
  methodsContainer: {
    paddingTop: 8,
    // paddingHorizontal: 16,
  },
  methodBlock: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
  },
  blockTitle: {
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 16,
  },
  methodOptionsList: {
    gap: 0,
  },
  methodRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  methodRowText: {
    flex: 1,
    fontSize: 14,
    fontWeight: "500",
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
    paddingBottom: 10,
    marginBottom: 10,
  },
  methodRowTextSelected: {
    color: "#203686",
  },
  methodRowTextDark: {
    borderBottomColor: "#323235",
  },
  productsBlock: {
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
    // marginHorizontal: 16,
    marginBottom: 8,
  },
  productRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 12,
  },
  productRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  productRowBorderDark: {
    borderBottomColor: "#323235",
  },
  radioOuter: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#D8DADE",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FBFCFF",
    marginBottom: 10,
  },
  radioOuterSelected: {
    borderColor: "#203686",
    borderWidth: 5,
  },
  radioOuterSelectedDark: {
    borderColor: "#4C94FF",
  },
  radioInner: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: "#FFFFFF",
  },
  productImage: {
    width: 48,
    height: 48,
    borderRadius: 8,
    flexShrink: 0,
  },
  productName: {
    flex: 1,
    fontSize: 14,
    fontWeight: "500",
    lineHeight: 18,
  },
  productTotal: {
    fontSize: 14,
    fontWeight: "600",
    flexShrink: 0,
    marginLeft: 8,
  },
  bottomPanel: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: Platform.OS === "ios" ? 34 : 16,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 5,
  },
  bottomPanelContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  bottomLeft: {
    flexDirection: "row",
    justifyContent: "space-between",
    flex: 1,
    marginBottom: 16,
  },
  bottomItemsCount: {
    fontSize: 14,
    marginBottom: 4,
  },
  bottomTotalPrice: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 4,
  },
  bottomButton: {
    backgroundColor: "#203686",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    minWidth: 150,
    alignItems: "center",
  },
  bottomButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  bottomHintText: {
    fontSize: 12,
    textAlign: "center",
    marginTop: 8,
  },
  successScrollView: {
    flex: 1,
  },
  successScrollContent: {
    paddingTop: 8,
    // paddingHorizontal: 16,
  },
  successContainer: {
    padding: 12,
    alignItems: "center",
    borderRadius: 24,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: "600",
    marginBottom: 16,
    marginTop: 24,
    textAlign: "center",
  },
  successText: {
    fontSize: 16,
    fontWeight: "500",
    textAlign: "center",
    marginBottom: 32,
    lineHeight: 22,
  },
  successButtons: {
    flexDirection: "row",
    gap: 8,
    width: "100%",
    alignSelf: "stretch",
  },
  successButtonDetails: {
    flex: 3,
    minWidth: 0,
  },
  successButtonHome: {
    flex: 2,
    minWidth: 0,
  },
  successActionButton: {
    paddingHorizontal: 12,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
});