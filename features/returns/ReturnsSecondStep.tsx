// MyReturnsSecondStep.tsx
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { ModalHeader } from "@/features/auth/ui/Header";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import React, { useMemo, useState } from "react";
import {
    FlatList,
    Modal,
    Platform,
    StyleSheet,
    TouchableOpacity,
    View,
    useColorScheme,
} from "react-native";
import { ReasonModal } from "./ReasonModal";
import { SelectedReturnItem } from "./SelectedReturnItem";

interface MyReturnsSecondStepProps {
  visible: boolean;
  onClose: () => void;
  onBack?: () => void;
  onNext?: () => void;
}

export const MyReturnsSecondStep: React.FC<MyReturnsSecondStepProps> = ({
  visible,
  onClose,
  onBack,
  onNext,
}) => {
  const systemTheme = useColorScheme();
  const isDark = systemTheme === "dark";

  const returnableOrders = useAppSelector((state) => state.catalog.returnableOrders);
  const returnRequests = useAppSelector((state) => state.catalog.returnRequests);
  const returnsStatuses = useAppSelector((state) => state.catalog.returnsStatuses);
  const dispatch = useAppDispatch();

  const [reasonModalVisible, setReasonModalVisible] = useState(false);
  const [currentItem, setCurrentItem] = useState<{
    orderId: number;
    orderProductId: string;
    reason?: number;
    comment?: string;
  } | null>(null);

  // Получаем причины из returnsStatuses
  const reasons = returnsStatuses?.returnReasons || [];

  // Собираем все выбранные товары в один массив
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
      comment?: string;
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
            const reasonObj = reasons.find(
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
              comment: selectedItem.comment,
            });
          }
        });
      }
    });

    return products;
  }, [returnRequests, returnableOrders, reasons]);

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

  const handleSelectReason = (orderId: number, orderProductId: string, currentReason?: number, currentComment?: string) => {
    setCurrentItem({
      orderId,
      orderProductId,
      reason: currentReason,
      comment: currentComment,
    });
    setReasonModalVisible(true);
  };

  const handleReasonSelect = (reasonId: number, comment: string) => {
    if (currentItem) {
      dispatch({
        type: "catalog/updateReturnItemReason",
        payload: {
          orderId: currentItem.orderId,
          orderProductId: currentItem.orderProductId,
          reason: reasonId,
          comment: comment,
        },
      });
    }
    setReasonModalVisible(false);
    setCurrentItem(null);
  };

  const handleNext = () => {
    const allHaveReason = selectedProducts.every((product) => product.reason && product.reason > 0);
    console.log('allHaveReason && onNext', allHaveReason && onNext)
    if (allHaveReason && onNext) {
      onNext();
    }
  };

  const renderItem = ({ item }: { item: typeof selectedProducts[0] }) => (
    <SelectedReturnItem
      item={item}
      onSelectReason={() =>
        handleSelectReason(item.orderId, item.id, item.reason, item.comment)
      }
    />
  );

  return (
    <>
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
            subTitle="Шаг 2 из 3"
            showBackButton={true}
            showCloseButton={true}
            onBackPress={onBack}
          />

          <View style={styles.content}>
            <FlatList
              data={selectedProducts}
              keyExtractor={(item) => `${item.orderId}-${item.id}`}
              showsVerticalScrollIndicator={false}
              renderItem={renderItem}
              contentContainerStyle={styles.listContent}
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <ThemedText
                    style={styles.emptyTextMain}
                    lightColor="#1B1B1C"
                    darkColor="#FBFCFF"
                  >
                    Нет выбранных товаров
                  </ThemedText>
                  <ThemedText
                    style={styles.emptyText}
                    lightColor="#80818B"
                    darkColor="#FBFCFF80"
                  >
                    Вернитесь на предыдущий шаг и выберите товары для возврата
                  </ThemedText>
                </View>
              }
            />
          </View>

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
                    (!totals.hasSelectedItems ||
                      !selectedProducts.every((p) => p.reason && p.reason > 0)) &&
                      styles.buttonDisabled,
                  ]}
                  disabled={
                    !totals.hasSelectedItems ||
                    !selectedProducts.every((p) => p.reason && p.reason > 0)
                  }
                  onPress={handleNext}
                >
                  <ThemedText style={styles.bottomButtonText}>
                    Продолжить
                  </ThemedText>
                </TouchableOpacity>
              </View>

              {!selectedProducts.every((p) => p.reason && p.reason > 0) && (
                <ThemedText
                  lightColor="#80818B"
                  darkColor="#FBFCFF80"
                  style={styles.bottomHintText}
                >
                  Для продолжения выберите причину возврата для всех товаров
                </ThemedText>
              )}
            </ThemedView>
          )}
        </ThemedView>
      </Modal>

      <ReasonModal
        visible={reasonModalVisible}
        onClose={() => {
          setReasonModalVisible(false);
          setCurrentItem(null);
        }}
        onSelect={handleReasonSelect}
        selectedReasonId={currentItem?.reason}
        selectedComment={currentItem?.comment}
        reasons={reasons}
      />
    </>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
  },
  content: {
    marginTop: 8,
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  listContent: {
    paddingBottom: 120,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 40,
    gap: 24,
  },
  emptyText: {
    fontSize: 16,
    textAlign: "center",
  },
  emptyTextMain: {
    fontSize: 24,
    fontWeight: "600",
    textAlign: "center",
    marginBottom: 8,
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