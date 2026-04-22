// MyReturnsThirdStep.tsx
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { setCompany } from "@/features/auth/authSlice";
import { ModalHeader } from "@/features/auth/ui/Header";
import { AddressSelectionModal } from "@/features/shared/ui/AddressSelectionModal";
import { PrimaryButton } from "@/features/shared/ui/components/PrimartyButton";
import { TownSelectionModal } from "@/features/shared/ui/TownSelectionModal";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { Image as ExpoImage } from "expo-image";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Modal,
  Platform,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { createReturnRequest } from "../catalog/catalogSlice";
import { baseUrl } from "../shared/services/axios";

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
  onBack?: () => void;
  /** Закрыть всё и перейти на главную (каталог). */
  onNavigateHome?: () => void;
  /** Остаться в возвратах: закрыть шаги мастера, обновить список. */
  onViewReturnDetails?: () => void;
}

export const MyReturnsThirdStep: React.FC<MyReturnsThirdStepProps> = ({
  visible,
  onClose,
  onBack,
  onNavigateHome,
  onViewReturnDetails,
}) => {
  const systemTheme = useColorScheme();
  const isDark = systemTheme === "dark";
  const dispatch = useAppDispatch();

  const returnableOrders = useAppSelector((state) => state.catalog.returnableOrders);
  const returnRequests = useAppSelector((state) => state.catalog.returnRequests);
  const returnsStatuses = useAppSelector((state) => state.catalog.returnsStatuses);
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

  useEffect(() => {
    if (!visible) {
      setShowSuccessContent(false);
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
      reason?: number;
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
              (r: any) => r.reason === selectedItem.reason
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
            reason: item.reason ?? 0,
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

  const renderProductItem = ({ item }: { item: typeof selectedProducts[0] }) => {
    const imageSource = item.productImage
      ? { uri: `${baseUrl}/${item.productImage}` }
      : require("@/assets/icons/png/noImage.png");

    return (
      <ThemedView
        darkColor="#151516"
        lightColor="#FFFFFF"
        style={styles.productItem}
      >
        <ExpoImage source={imageSource} style={styles.productImage} contentFit="cover" />
        <View style={styles.productInfo}>
          <ThemedText
            style={styles.productName}
            numberOfLines={2}
            lightColor="#202022"
            darkColor="#F2F4F7"
          >
            {item.productName}
          </ThemedText>
          <ThemedText
            lightColor="#80818B"
            darkColor="#FBFCFF80"
            style={styles.productQuantity}
          >
            {item.returnQuantity} {item.measureType === "килограмм" ? "кг" : "шт"} × {formatPrice(item.price)} ₽
          </ThemedText>
          <ThemedText
            style={styles.productTotal}
            lightColor="#202022"
            darkColor="#F2F4F7"
          >
            {formatPrice(item.price * item.returnQuantity)} ₽
          </ThemedText>
          {item.reasonName && (
            <ThemedText
              style={styles.productReason}
              lightColor="#203686"
              darkColor="#4C94FF"
            >
              Причина: {item.reasonName}
            </ThemedText>
          )}
        </View>
      </ThemedView>
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
    <>
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={() => {
        if (showSuccessContent) {
          setShowSuccessContent(false);
          onViewReturnDetails?.();
        } else {
          onClose();
        }
      }}
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
              onBack?.();
            }
          }}
        />

        {showSuccessContent ? (
          <ThemedView style={styles.successContainer}>
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
              <PrimaryButton
                title="Детали возврата"
                onPress={() => {
                  setShowSuccessContent(false);
                  onViewReturnDetails?.();
                }}
                variant="third"
                size="md"
                style={styles.successButton}
              />
              <PrimaryButton
                title="На главную"
                onPress={() => {
                  setShowSuccessContent(false);
                  onNavigateHome?.();
                }}
                variant="primary"
                size="md"
                style={styles.successButton}
              />
            </View>
          </ThemedView>
        ) : (
          <>
            <FlatList
              data={[{ id: "methods" }, { id: "products" }]}
              keyExtractor={(item) => item.id}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.listContent}
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

                      <View style={styles.productsHeading}>
                        <ThemedText
                          style={styles.sectionTitleMuted}
                          lightColor="#202022"
                          darkColor="#F2F4F7"
                        >
                          Товары к возврату ({selectedProducts.length})
                        </ThemedText>
                      </View>
                    </View>
                  );
                }
                return (
                  <View style={styles.productsList}>
                    {selectedProducts.map((product) => (
                      <View key={`${product.orderId}-${product.id}`}>
                        {renderProductItem({ item: product })}
                      </View>
                    ))}
                  </View>
                );
              }}
            />

            {selectedProducts.length > 0 && (
              <ThemedView
                darkColor="#151516"
                lightColor="#FFFFFF"
                style={styles.bottomPanel}
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
      </ThemedView>
    </Modal>

    <AddressSelectionModal
      visible={visible && showAddressModal}
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
      visible={visible && showTownModal}
      onClose={() => setShowTownModal(false)}
      storageId={storageIdForReturn || (me as any)?.storageId || ""}
      onTownSelected={handleTownSelectedForReturn}
    />
    </>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
  },
  listContent: {
    paddingBottom: 120,
  },
  methodsContainer: {
    paddingHorizontal: 16,
    paddingTop: 8,
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
  productsHeading: {
    marginTop: 8,
    marginBottom: 8,
  },
  sectionTitleMuted: {
    fontSize: 16,
    fontWeight: "600",
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
  productsList: {
    paddingHorizontal: 16,
  },
  productItem: {
    flexDirection: "row",
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
  },
  productImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 12,
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 4,
  },
  productQuantity: {
    fontSize: 12,
    marginBottom: 2,
  },
  productTotal: {
    fontSize: 14,
    fontWeight: "600",
  },
  productReason: {
    fontSize: 12,
    marginTop: 4,
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
  successContainer: {
    marginTop: 8,
    padding: 24,
    alignItems: "center",
    borderRadius: 24,
    flex: 1,
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
    gap: 12,
    width: "100%",
  },
  successButton: {
    flex: 1,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
});