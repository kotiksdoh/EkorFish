import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { ModalHeader } from "@/features/auth/ui/Header";
import { clearReturnRequests, getMyReturnableOrders } from "@/features/catalog/catalogSlice";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { useFocusEffect } from "expo-router";
import React, { useCallback, useMemo } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Modal,
  Platform,
  StyleSheet,
  TouchableOpacity,
  View,
  useColorScheme
} from "react-native";
import ReturnsOrderCard from "./ReturnOrderCard";

const { width: screenWidth } = Dimensions.get("window");

interface MyReturnsFirstStepProps {
  visible: boolean;
  onClose: () => void;
  onNext?: () => void;
}

export const MyReturnsFirstStep: React.FC<MyReturnsFirstStepProps> = ({
  visible,
  onClose,
  onNext,
}) => {
  const insets = useSafeAreaInsets();
  const systemTheme = useColorScheme();
  const currentTheme = systemTheme || "light";
  const isDark = currentTheme === "dark";

  const loading = useAppSelector((state) => state.catalog.returnableOrdersLoading);
  const returnsStatuses = useAppSelector((state) => state.catalog.returnsStatuses);
  const returnableOrders = useAppSelector((state) => state.catalog.returnableOrders);
  const returnRequests = useAppSelector((state) => state.catalog.returnRequests);

  const dispatch = useAppDispatch();

  // Подсчет итогов выбранных товаров
  const totals = useMemo(() => {
    let totalItems = 0;
    let totalPrice = 0;
    let selectedProductsCount = 0;

    // Проходим по всем заказам в returnRequests
    returnRequests.orders.forEach((requestOrder) => {
      // Находим соответствующий заказ в returnableOrders
      const originalOrder = returnableOrders.find(
        (order) => order.orderId === requestOrder.orderId
      );

      if (originalOrder) {
        // Проходим по выбранным товарам в этом заказе
        requestOrder.items.forEach((selectedItem) => {
          // Находим оригинальный товар
          const originalProduct = originalOrder.products.find(
            (product: any) => product.id === selectedItem.orderProductId
          );

          if (originalProduct && selectedItem.returnQuantity > 0) {
            totalItems += selectedItem.returnQuantity;
            selectedProductsCount += 1;
            // Цена за единицу * количество возврата
            totalPrice += originalProduct.price * selectedItem.returnQuantity;
          }
        });
      }
    });

    return {
      totalItems,
      totalPrice,
      selectedProductsCount,
      hasSelectedItems: totalItems > 0,
    };
  }, [returnRequests, returnableOrders]);

  // Форматирование цены
  const formatPrice = (price: number) => {
    return price.toLocaleString("ru-RU", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  // Получение склонения для слов
  const getDeclension = (count: number, words: [string, string, string]) => {
    const cases = [2, 0, 1, 1, 1, 2];
    return words[
      count % 100 > 4 && count % 100 < 20 ? 2 : cases[Math.min(count % 10, 5)]
    ];
  };

  const onCreateReturn = () => {
    if (totals.hasSelectedItems && onNext) {
      onNext();
    }
  };

  const handleClose = () => {
    // Очищаем выбранные товары при закрытии
    dispatch(clearReturnRequests());
    onClose();
  };

  useFocusEffect(
    useCallback(() => {
      const checkTokenAndLoad = async () => {
        if (visible) {
          dispatch(getMyReturnableOrders());
        }
      };
      checkTokenAndLoad();

      return () => {
        // Не очищаем при потере фокуса, чтобы сохранить выбранные товары
      };
    }, [visible])
  );

  const renderLoadingState = () => (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color={isDark ? "#FBFCFF" : "#203686"} />
      <ThemedText
        style={styles.loadingText}
        lightColor="#80818B"
        darkColor="#FBFCFF80"
      >
        Загрузка заказов...
      </ThemedText>
    </View>
  );

  const renderReturnsList = () => (
    <FlatList
      data={returnableOrders}
      keyExtractor={(item) => item.orderId.toString()}
      showsVerticalScrollIndicator={false}
      renderItem={({ item }) => (
        <ReturnsOrderCard 
          returnsOrder={item} 
          fullWidth={true} 
          statuses={returnsStatuses}
        />
      )}
      contentContainerStyle={styles.returnsList}
      ListEmptyComponent={!loading ? (
        <View style={styles.emptyContainer}>
          <ThemedText style={styles.emptyTextMain} lightColor="#1B1B1C" darkColor="#FBFCFF">
            Нет заказов для возврата
          </ThemedText>
          <ThemedText style={styles.emptyText} lightColor="#80818B" darkColor="#FBFCFF80">
            У вас нет заказов, которые можно вернуть
          </ThemedText>
        </View>
      ) : null}
    />
  );

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={handleClose}
      statusBarTranslucent={true}
    >
      <ThemedView
        lightColor="#EBEDF0"
        darkColor="#040508"
        style={styles.modalContainer}
      >
        <ModalHeader
          title="Заявка на возврат"
          subTitle="Шаг 1 из 3"
          showBackButton={false}
          showCloseButton={true}
          onBackPress={handleClose}
        />

        <View style={styles.content}>
          {loading ? (
            renderLoadingState()
          ) : returnableOrders.length > 0 ? (
            <View style={styles.returnsContent}>
              {renderReturnsList()}
            </View>
          ) : (
            <View style={styles.emptyContainer}>
              <ThemedText style={styles.emptyTextMain} lightColor="#1B1B1C" darkColor="#FBFCFF">
                Нет заказов для возврата
              </ThemedText>
              <ThemedText style={styles.emptyText} lightColor="#80818B" darkColor="#FBFCFF80">
                У вас нет заказов, которые можно вернуть
              </ThemedText>
            </View>
          )}
        </View>

        {/* Фиксированная нижняя плашка */}
        {returnableOrders.length > 0 && !loading && (
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
                <ThemedText darkColor="#FBFCFF" lightColor="#1B1B1C" style={styles.bottomTotalPrice}>
                  {formatPrice(totals.totalPrice)} ₽
                </ThemedText>
                <ThemedText 
                  lightColor="#80818B" 
                  darkColor="#FBFCFF80" 
                  style={styles.bottomItemsCount}
                >
                  {totals.selectedProductsCount > 0 ? (
                    `${totals.selectedProductsCount} ${getDeclension(totals.selectedProductsCount, ["товар", "товара", "товаров"])}`
                  ) : (
                    "Товары не выбраны"
                  )}
                </ThemedText>
              </View>


            </View>
            <TouchableOpacity
                style={[
                  styles.bottomCheckoutButton,
                  isDark && {
                    backgroundColor: "#3881EE",
                  },
                  !totals.hasSelectedItems && styles.checkoutButtonDisabled,
                ]}
                disabled={!totals.hasSelectedItems}
                onPress={onCreateReturn}
              >
                <ThemedText style={styles.bottomCheckoutButtonText}>
                  Продолжить
                </ThemedText>
              </TouchableOpacity>
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
  content: {
    marginTop: 8,
    flex: 1,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  returnsList: {
    gap: 8,
    paddingBottom: 120, // Добавляем отступ для нижней панели
  },
  headerButtons: {
    marginBottom: 16,
  },
  createReturnButton: {
    backgroundColor: "#203686",
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  createReturnButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
  returnsContent: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 40,
    gap: 24,
  },
  emptyImage: {
    width: 86,
    height: 86,
  },
  emptyText: {
    fontSize: 16,
    textAlign: "center",
  },
  emptyTextMain: {
    fontSize: 24,
    fontWeight: '600',
    textAlign: "center",
    marginBottom: 8
  },
  createButton: {
    backgroundColor: "#203686",
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 20,
    marginTop: 8,
  },
  createButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 40,
    gap: 16,
  },
  loadingText: {
    fontSize: 14,
    textAlign: "center",
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
  bottomSpacer: {
    height: 100,
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
    marginBottom: 16
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
  bottomCheckoutButton: {
    backgroundColor: "#203686",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    minWidth: 150,
    alignItems: "center",
  },
  bottomCheckoutButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  bottomHintText: {
    fontSize: 12,
    textAlign: "center",
    marginTop: 8,
  },
  checkoutButtonDisabled: {
    opacity: 0.5,
  },
});