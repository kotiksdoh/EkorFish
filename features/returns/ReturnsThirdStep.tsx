// MyReturnsThirdStep.tsx
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { ModalHeader } from "@/features/auth/ui/Header";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { Image } from "expo-image";
import React, { useMemo, useState } from "react";
import {
    ActivityIndicator,
    FlatList,
    Modal,
    Platform,
    StyleSheet,
    TouchableOpacity,
    View,
    useColorScheme,
} from "react-native";
import { createReturnRequest } from "../catalog/catalogSlice";
import { baseUrl } from "../shared/services/axios";

interface MyReturnsThirdStepProps {
  visible: boolean;
  onClose: () => void;
  onBack?: () => void;
  onSuccess?: () => void;
}

export const MyReturnsThirdStep: React.FC<MyReturnsThirdStepProps> = ({
  visible,
  onClose,
  onBack,
  onSuccess,
}) => {
  const systemTheme = useColorScheme();
  const isDark = systemTheme === "dark";
  const dispatch = useAppDispatch();

  const returnableOrders = useAppSelector((state) => state.catalog.returnableOrders);
  const returnRequests = useAppSelector((state) => state.catalog.returnRequests);
  const returnsStatuses = useAppSelector((state) => state.catalog.returnsStatuses);
  const [loading, setLoading] = useState(false);

  const [selectedReturnMethod, setSelectedReturnMethod] = useState<number | null>(null);
  const [selectedRefundMethod, setSelectedRefundMethod] = useState<number | null>(null);

  // Получаем методы возврата и возврата денег из статусов
  const returnMethods = returnsStatuses?.returnMethods || [];
  const refundMethods = returnsStatuses?.refundMethods || [];

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
      reason: number;
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
            const reasonObj = returnsStatuses?.returnRequestStatuses?.find(
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

  const handleCreateReturn = async () => {
    debugger
    // if (!selectedReturnMethod || !selectedRefundMethod) return;
    debugger
    setLoading(true);
    debugger
    try {
      // Формируем тело запроса
      const payload = {
        refundMethod: selectedRefundMethod,
        returnMethod: selectedReturnMethod,
        // deliveryAddressId: "3fa85f64-5717-4562-b3fc-2c963f66afa6", // Временно зашито
        storageId: "019d48e5-6e7e-7f11-b6cf-da3fd8100b12", // Временно зашито
        orders: returnRequests.orders,
      };
      debugger
      await dispatch(createReturnRequest(payload)).unwrap();
      if (onSuccess) {
        onSuccess();
      }
      debugger
      onClose();
    } catch (error) {
      console.error("Error creating return request:", error);
    } finally {
      setLoading(false);
    }
  };

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
        <Image source={imageSource} style={styles.productImage} contentFit="cover" />
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

  const canSubmit = selectedReturnMethod !== null && selectedRefundMethod !== null;

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
      statusBarTranslucent={true}
    >
      <ThemedView
        lightColor="#EBEDF0"
        darkColor="#040508"
        style={styles.modalContainer}
      >
        <ModalHeader
          title="Заявка на возврат"
          subTitle="Шаг 3 из 3"
          showBackButton={true}
          showCloseButton={true}
          onBackPress={onBack}
        />

        <FlatList
          data={[{ id: "methods" }, { id: "products" }]}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => {
            if (item.id === "methods") {
              return (
                <View style={styles.methodsContainer}>
                  {/* Способ возврата */}
                  <View style={styles.section}>
                    <ThemedText
                      style={styles.sectionTitle}
                      lightColor="#202022"
                      darkColor="#F2F4F7"
                    >
                      Способ возврата
                    </ThemedText>
                    <View style={styles.optionsList}>
                      {returnMethods.map((method: any) => (
                        <TouchableOpacity
                          key={method.method}
                          style={[
                            styles.optionItem,
                            selectedReturnMethod === method.method && styles.optionSelected,
                            isDark && styles.optionDark,
                          ]}
                          onPress={() => setSelectedReturnMethod(method.method)}
                        >
                          <ThemedText
                            style={[
                              styles.optionText,
                              selectedReturnMethod === method.method && styles.optionTextSelected,
                            ]}
                            lightColor="#202022"
                            darkColor="#F2F4F7"
                          >
                            {method.name}
                          </ThemedText>
                          {selectedReturnMethod === method.method && (
                            <View style={styles.radioSelected}>
                              <View style={styles.radioInner} />
                            </View>
                          )}
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>

                  {/* Способ возврата денег */}
                  <View style={styles.section}>
                    <ThemedText
                      style={styles.sectionTitle}
                      lightColor="#202022"
                      darkColor="#F2F4F7"
                    >
                      Способ возврата денег
                    </ThemedText>
                    <View style={styles.optionsList}>
                      {refundMethods.map((method: any) => (
                        <TouchableOpacity
                          key={method.method}
                          style={[
                            styles.optionItem,
                            selectedRefundMethod === method.method && styles.optionSelected,
                            isDark && styles.optionDark,
                          ]}
                          onPress={() => setSelectedRefundMethod(method.method)}
                        >
                          <ThemedText
                            style={[
                              styles.optionText,
                              selectedRefundMethod === method.method && styles.optionTextSelected,
                            ]}
                            lightColor="#202022"
                            darkColor="#F2F4F7"
                          >
                            {method.name}
                          </ThemedText>
                          {selectedRefundMethod === method.method && (
                            <View style={styles.radioSelected}>
                              <View style={styles.radioInner} />
                            </View>
                          )}
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>

                  {/* Товары к возврату */}
                  <View style={styles.section}>
                    <ThemedText
                      style={styles.sectionTitle}
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

        {/* Фиксированная нижняя плашка */}
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

              <TouchableOpacity
                style={[
                  styles.bottomButton,
                  isDark && {
                    backgroundColor: "#3881EE",
                  },
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
            </View>

            {!canSubmit && (
              <ThemedText
                lightColor="#80818B"
                darkColor="#FBFCFF80"
                style={styles.bottomHintText}
              >
                Выберите способ возврата и способ возврата денег
              </ThemedText>
            )}
          </ThemedView>
        )}
      </ThemedView>
    </Modal>
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
    paddingTop: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 12,
  },
  optionsList: {
    gap: 8,
  },
  optionItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E5E5",
  },
  optionDark: {
    backgroundColor: "#151516",
    borderColor: "#252527",
  },
  optionSelected: {
    borderColor: "#203686",
    backgroundColor: "#E1F0FF",
  },
  optionText: {
    fontSize: 14,
    fontWeight: "500",
  },
  optionTextSelected: {
    color: "#203686",
  },
  radioSelected: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#203686",
    justifyContent: "center",
    alignItems: "center",
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#203686",
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
    flex: 1,
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
  buttonDisabled: {
    opacity: 0.5,
  },
});