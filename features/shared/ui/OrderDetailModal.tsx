import { ArrowIconRight, Copy } from "@/assets/icons/icons";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { axdef, baseUrl } from "@/features/shared/services/axios";
import * as Clipboard from "expo-clipboard";
import { Image } from "expo-image";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Animated,
    Dimensions,
    Modal,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    TouchableWithoutFeedback,
    View,
} from "react-native";

const { height: screenHeight } = Dimensions.get("window");

interface OrderProduct {
  id: string;
  productId: string;
  productName: string;
  productImage?: string;
  price: number;
  quantity: number;
  totalPrice: number;
  measureType: string;
}

interface OrderDetails {
  id: number;
  orderStatus: string;
  products: OrderProduct[];
  deliveryDate: string;
  company: string;
  deliveryAddress: string;
  recipient: string;
  payment: string;
  totalAmount: number;
  totalWeight: number;
  createdAt: string;
}

interface OrderDetailsModalProps {
  visible: boolean;
  onClose: () => void;
  orderId: number;
}

export const OrderDetailsModal: React.FC<OrderDetailsModalProps> = ({
  visible,
  onClose,
  orderId,
}) => {
  const [orderDetails, setOrderDetails] = useState<OrderDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [productsModalVisible, setProductsModalVisible] = useState(false);
  const [modalTranslateY] = useState(new Animated.Value(screenHeight));
  const [isClosing, setIsClosing] = useState(false);

  // Загрузка деталей заказа
  useEffect(() => {
    if (visible && orderId) {
      loadOrderDetails();
    } else {
      setOrderDetails(null);
    }
  }, [visible, orderId]);

  // Анимация для модалки с товарами
  useEffect(() => {
    if (productsModalVisible) {
      modalTranslateY.setValue(screenHeight);
      Animated.spring(modalTranslateY, {
        toValue: 0,
        useNativeDriver: true,
        damping: 20,
        stiffness: 90,
        mass: 0.8,
      }).start();
    }
  }, [productsModalVisible]);

  const closeProductsModal = () => {
    if (isClosing) return;

    setIsClosing(true);
    Animated.timing(modalTranslateY, {
      toValue: screenHeight,
      duration: 250,
      useNativeDriver: true,
    }).start(() => {
      setIsClosing(false);
      setProductsModalVisible(false);
    });
  };

  const loadOrderDetails = async () => {
    setIsLoading(true);
    try {
      const response = await axdef.get(`/api/Order/${orderId}`);
      setOrderDetails(response.data.data);
    } catch (error) {
      console.error("Error loading order details:", error);
      Alert.alert("Ошибка", "Не удалось загрузить детали заказа");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyId = async () => {
    if (orderDetails) {
      await Clipboard.setStringAsync(orderDetails.id.toString());
      Alert.alert("Скопировано", "ID заказа скопирован в буфер обмена");
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return (
      date.toLocaleDateString("ru-RU", {
        day: "numeric",
        month: "long",
        year: "numeric",
      }) +
      ", " +
      date.toLocaleTimeString("ru-RU", {
        hour: "2-digit",
        minute: "2-digit",
      })
    );
  };

  const formatPrice = (price: number) => {
    return price.toLocaleString("ru-RU", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  if (!visible) return null;

  return (
    <>
      <Modal
        visible={visible}
        animationType="slide"
        transparent={false}
        onRequestClose={onClose}
      >
        <ThemedView
          style={styles.container}
          lightColor="#EBEDF0"
          darkColor="#040508"
        >
          {/* Хедер как в SearchScreenWithHistory */}
          <ThemedView style={styles.header}>
            <TouchableOpacity onPress={onClose} style={styles.backButton}>
              <ThemedText style={styles.backArrow}>←</ThemedText>
            </TouchableOpacity>

            <View style={styles.headerTitleContainer}>
              <ThemedText style={styles.headerTitle}>Детали заказа</ThemedText>
            </View>

            <TouchableOpacity onPress={handleCopyId} style={styles.copyButton}>
              <Copy />
            </TouchableOpacity>
          </ThemedView>

          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#203686" />
              <ThemedText style={styles.loadingText}>Загрузка...</ThemedText>
            </View>
          ) : !orderDetails ? (
            <View style={styles.errorContainer}>
              <ThemedText>Заказ не найден</ThemedText>
            </View>
          ) : (
            <ScrollView
              showsVerticalScrollIndicator={false}
              style={styles.content}
            >
              {/* Белый блок */}
              <ThemedView lightColor="#FFFFFF" style={styles.whiteBlock}>
                {/* Статус заказа */}
                <View style={styles.statusRow}>
                  <ThemedText style={styles.statusText}>
                    {orderDetails.orderStatus}
                  </ThemedText>
                  <ArrowIconRight />
                </View>

                {/* Информационные блоки */}
                <View style={styles.infoContainer}>
                  {/* Номер заказа */}
                  <View style={styles.infoRow}>
                    <View style={styles.iconPlaceholder} />
                    <View style={styles.infoContent}>
                      <ThemedText lightColor="#80818B" style={styles.infoLabel}>
                        Номер заказа
                      </ThemedText>
                      <ThemedText style={styles.infoValue}>
                        №{orderDetails.id}
                      </ThemedText>
                    </View>
                  </View>

                  {/* Ожидаемая дата доставки */}
                  <View style={styles.infoRow}>
                    <View style={styles.iconPlaceholder} />
                    <View style={styles.infoContent}>
                      <ThemedText lightColor="#80818B" style={styles.infoLabel}>
                        Ожидаемая дата доставки
                      </ThemedText>
                      <ThemedText style={styles.infoValue}>
                        {formatDate(orderDetails.deliveryDate)}
                      </ThemedText>
                    </View>
                  </View>

                  {/* Компания */}
                  <View style={styles.infoRow}>
                    <View style={styles.iconPlaceholder} />
                    <View style={styles.infoContent}>
                      <ThemedText lightColor="#80818B" style={styles.infoLabel}>
                        Компания
                      </ThemedText>
                      <ThemedText style={styles.infoValue}>
                        {orderDetails.company || 'ООО "ЭкорФиш"'}
                      </ThemedText>
                    </View>
                  </View>

                  {/* Адрес доставки */}
                  <View style={styles.infoRow}>
                    <View style={styles.iconPlaceholder} />
                    <View style={styles.infoContent}>
                      <ThemedText lightColor="#80818B" style={styles.infoLabel}>
                        Адрес доставки
                      </ThemedText>
                      <ThemedText style={styles.infoValue}>
                        {orderDetails.deliveryAddress ||
                          "г. Москва, ул. Примерная, д. 1"}
                      </ThemedText>
                    </View>
                  </View>

                  {/* Получатель */}
                  <View style={styles.infoRow}>
                    <View style={styles.iconPlaceholder} />
                    <View style={styles.infoContent}>
                      <ThemedText lightColor="#80818B" style={styles.infoLabel}>
                        Получатель
                      </ThemedText>
                      <ThemedText style={styles.infoValue}>
                        {orderDetails.recipient || "Иванов Иван Иванович"}
                      </ThemedText>
                    </View>
                  </View>

                  {/* Оплата */}
                  <View style={styles.infoRow}>
                    <View style={styles.iconPlaceholder} />
                    <View style={styles.infoContent}>
                      <ThemedText lightColor="#80818B" style={styles.infoLabel}>
                        Оплата
                      </ThemedText>
                      <ThemedText style={styles.infoValue}>
                        {orderDetails.payment || "Наличными при получении"}
                      </ThemedText>
                    </View>
                  </View>
                </View>

                {/* Итого */}
                <View style={styles.totalContainer}>
                  <ThemedText style={styles.totalLabel}>Итого</ThemedText>
                  <ThemedText style={styles.totalValue}>
                    {formatPrice(orderDetails.totalAmount)} ₽
                  </ThemedText>
                </View>

                {/* Общий вес */}
                <View style={styles.weightContainer}>
                  <ThemedText lightColor="#80818B" style={styles.weightLabel}>
                    Общий вес заказа
                  </ThemedText>
                  <ThemedText style={styles.weightValue}>
                    {orderDetails.totalWeight ||
                      orderDetails.products?.reduce(
                        (acc, p) => acc + p.quantity,
                        0,
                      ) ||
                      0}{" "}
                    кг
                  </ThemedText>
                </View>

                {/* Кнопки */}
                <View style={styles.buttonsRow}>
                  <TouchableOpacity style={styles.cancelButton}>
                    <ThemedText style={styles.cancelButtonText}>
                      Отменить
                    </ThemedText>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.messageButton}>
                    <ThemedText style={styles.messageButtonText}>
                      Написать
                    </ThemedText>
                  </TouchableOpacity>
                </View>

                <TouchableOpacity style={styles.documentsButton}>
                  <ThemedText style={styles.documentsButtonText}>
                    Документы
                  </ThemedText>
                </TouchableOpacity>
              </ThemedView>

              {/* Состав заказа */}
              <ThemedView lightColor="#FFFFFF" style={styles.productsBlock}>
                <View style={styles.productsHeader}>
                  <ThemedText style={styles.productsTitle}>
                    Состав заказа
                  </ThemedText>
                  <TouchableOpacity
                    onPress={() => setProductsModalVisible(true)}
                  >
                    <ThemedText lightColor="#203686" style={styles.moreButton}>
                      Подробнее
                    </ThemedText>
                  </TouchableOpacity>
                </View>

                {/* Показываем первые 2 товара */}
                {orderDetails.products?.slice(0, 2).map((item) => (
                  <View key={item.id} style={styles.productCard}>
                    <View style={styles.productImageContainer}>
                      {item.productImage ? (
                        <Image
                          source={{ uri: `${baseUrl}/${item.productImage}` }}
                          style={styles.productImage}
                          contentFit="cover"
                        />
                      ) : (
                        <Image
                          source={require("@/assets/icons/png/noImage.png")}
                          style={styles.productImage}
                          contentFit="cover"
                        />
                      )}
                    </View>
                    <View style={styles.productInfo}>
                      <ThemedText style={styles.productName} numberOfLines={2}>
                        {item.productName}
                      </ThemedText>
                      <View style={styles.productPriceRow}>
                        <ThemedText style={styles.productPrice}>
                          {formatPrice(item.totalPrice)} ₽
                        </ThemedText>
                      </View>
                      <ThemedText
                        lightColor="#80818B"
                        style={styles.productQuantity}
                      >
                        {item.price}₽ /{" "}
                        {item.measureType === "килограмм" ? "кг" : "шт"} •{" "}
                        {item.quantity}{" "}
                        {item.measureType === "килограмм" ? "кг" : "шт"}
                      </ThemedText>
                    </View>
                  </View>
                ))}

                {orderDetails.products?.length > 2 && (
                  <TouchableOpacity
                    style={styles.showAllButton}
                    onPress={() => setProductsModalVisible(true)}
                  >
                    <ThemedText lightColor="#203686" style={styles.showAllText}>
                      Показать все товары ({orderDetails.products.length})
                    </ThemedText>
                  </TouchableOpacity>
                )}
              </ThemedView>

              {/* Отступ снизу */}
              <View style={styles.bottomSpacer} />
            </ScrollView>
          )}
        </ThemedView>
      </Modal>

      {/* Модалка со всеми товарами как AddressSelectionModal */}
      <Modal
        visible={productsModalVisible}
        animationType="none"
        transparent={true}
        onRequestClose={closeProductsModal}
      >
        <TouchableWithoutFeedback onPress={closeProductsModal}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <Animated.View
                style={[
                  styles.modalContainer,
                  {
                    transform: [{ translateY: modalTranslateY }],
                  },
                ]}
              >
                {/* Защелка для свайпа */}
                <TouchableOpacity
                  style={styles.swipeHandleContainer}
                  activeOpacity={0.7}
                  onPress={closeProductsModal}
                >
                  <View style={styles.swipeHandle} />
                </TouchableOpacity>

                <View style={styles.modalHeader}>
                  <ThemedText style={styles.modalTitle}>
                    Состав заказа
                  </ThemedText>
                </View>

                {/* Список товаров */}
                <ScrollView
                  style={styles.productsList}
                  showsVerticalScrollIndicator={false}
                >
                  {orderDetails?.products?.map((item) => (
                    <View key={item.id} style={styles.modalProductCard}>
                      <View style={styles.modalProductImageContainer}>
                        {item.productImage ? (
                          <Image
                            source={{ uri: `${baseUrl}/${item.productImage}` }}
                            style={styles.modalProductImage}
                            contentFit="cover"
                          />
                        ) : (
                          <Image
                            source={require("@/assets/icons/png/noImage.png")}
                            style={styles.modalProductImage}
                            contentFit="cover"
                          />
                        )}
                      </View>
                      <View style={styles.modalProductInfo}>
                        <ThemedText
                          style={styles.modalProductName}
                          numberOfLines={2}
                        >
                          {item.productName}
                        </ThemedText>
                        <View style={styles.modalProductPriceRow}>
                          <ThemedText style={styles.modalProductPrice}>
                            {formatPrice(item.totalPrice)} ₽
                          </ThemedText>
                        </View>
                        <ThemedText
                          lightColor="#80818B"
                          style={styles.modalProductQuantity}
                        >
                          {item.price}₽ /{" "}
                          {item.measureType === "килограмм" ? "кг" : "шт"} •{" "}
                          {item.quantity}{" "}
                          {item.measureType === "килограмм" ? "кг" : "шт"}
                        </ThemedText>
                      </View>
                    </View>
                  ))}
                </ScrollView>

                {/* Кнопка внизу */}
                <View style={styles.modalFooter}>
                  <TouchableOpacity
                    style={styles.modalCloseButton}
                    onPress={closeProductsModal}
                  >
                    <ThemedText style={styles.modalCloseButtonText}>
                      Закрыть
                    </ThemedText>
                  </TouchableOpacity>
                </View>
              </Animated.View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 8,
    gap: 12,
  },
  backButton: {
    padding: 8,
  },
  backArrow: {
    fontSize: 24,
  },
  headerTitleContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  copyButton: {
    padding: 8,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  whiteBlock: {
    borderRadius: 24,
    padding: 20,
    marginBottom: 16,
  },
  statusRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F3F7",
    marginBottom: 16,
  },
  statusText: {
    fontSize: 16,
    fontWeight: "600",
  },
  infoContainer: {
    gap: 16,
    marginBottom: 20,
  },
  infoRow: {
    flexDirection: "row",
    gap: 12,
  },
  iconPlaceholder: {
    width: 24,
    height: 24,
    borderRadius: 8,
    backgroundColor: "#F2F4F7",
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    fontWeight: "400",
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: "500",
  },
  totalContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: "#F0F3F7",
  },
  totalLabel: {
    fontSize: 14,
    fontWeight: "500",
  },
  totalValue: {
    fontSize: 16,
    fontWeight: "600",
  },
  weightContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingBottom: 16,
  },
  weightLabel: {
    fontSize: 14,
    fontWeight: "400",
  },
  weightValue: {
    fontSize: 14,
    fontWeight: "500",
  },
  buttonsRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#FF3B30",
    alignItems: "center",
  },
  cancelButtonText: {
    color: "#FF3B30",
    fontSize: 14,
    fontWeight: "500",
  },
  messageButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#203686",
    alignItems: "center",
  },
  messageButtonText: {
    color: "#203686",
    fontSize: 14,
    fontWeight: "500",
  },
  documentsButton: {
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: "#F2F4F7",
    alignItems: "center",
  },
  documentsButtonText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#1B1B1C",
  },
  productsBlock: {
    borderRadius: 24,
    padding: 20,
    marginBottom: 16,
  },
  productsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  productsTitle: {
    fontSize: 16,
    fontWeight: "600",
  },
  moreButton: {
    fontSize: 14,
    fontWeight: "500",
  },
  productCard: {
    flexDirection: "row",
    marginBottom: 16,
    gap: 12,
  },
  productImageContainer: {
    width: 74,
    height: 55,
    borderRadius: 12,
    overflow: "hidden",
  },
  productImage: {
    width: "100%",
    height: "100%",
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 4,
  },
  productPriceRow: {
    flexDirection: "row",
    marginBottom: 4,
  },
  productPrice: {
    fontSize: 14,
    fontWeight: "600",
  },
  productQuantity: {
    fontSize: 12,
    fontWeight: "400",
  },
  showAllButton: {
    alignItems: "center",
    paddingVertical: 12,
  },
  showAllText: {
    fontSize: 14,
    fontWeight: "500",
  },
  bottomSpacer: {
    height: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
  },
  loadingText: {
    fontSize: 16,
    color: "#80818B",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  // Стили для модалки как в AddressSelectionModal
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContainer: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "80%",
  },
  swipeHandleContainer: {
    alignItems: "center",
    paddingTop: 12,
    paddingBottom: 8,
    width: "100%",
  },
  swipeHandle: {
    width: 40,
    height: 4,
    backgroundColor: "#E0E0E0",
    borderRadius: 2,
  },
  modalHeader: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#1B1B1C",
  },
  productsList: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    maxHeight: "50%",
  },
  modalProductCard: {
    flexDirection: "row",
    marginBottom: 16,
    gap: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  modalProductImageContainer: {
    width: 74,
    height: 55,
    borderRadius: 12,
    overflow: "hidden",
  },
  modalProductImage: {
    width: "100%",
    height: "100%",
  },
  modalProductInfo: {
    flex: 1,
  },
  modalProductName: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 4,
  },
  modalProductPriceRow: {
    flexDirection: "row",
    marginBottom: 4,
  },
  modalProductPrice: {
    fontSize: 14,
    fontWeight: "600",
  },
  modalProductQuantity: {
    fontSize: 12,
    fontWeight: "400",
  },
  modalFooter: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  modalCloseButton: {
    backgroundColor: "#203686",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  modalCloseButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
});
