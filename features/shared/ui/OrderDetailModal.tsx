import {
  ArrowIconLeft,
  ArrowIconRight,
  CalendarFilledIcon,
  Copy,
  IconAccept,
  IconCard,
  IconCloseNew,
  IconCompanyNew,
  IconDocument,
  IconGeo,
  IconMessage,
  IconNumber,
  IconUser,
} from "@/assets/icons/icons";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { axdef, baseUrl } from "@/features/shared/services/axios";
import * as Clipboard from "expo-clipboard";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
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
import { PrimaryButton } from "./components/PrimartyButton";

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
  unitPrice: any;
}

interface OrderStatus {
  id: string;
  name: string;
}

interface OrderDetails {
  id: number;
  orderId: any;
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
  // Новые поля из бэка
  currentStatusId: string;
  statuses: OrderStatus[];
  recipientName?: string;
  recipientPhone?: string;
  recipientEmail?: string;
  paymentType?: string;
  companyName?: string;
  companyAddress?: string;
}

interface OrderDetailsModalProps {
  visible: boolean;
  onClose: () => void;
  orderId: any;
}

export const OrderDetailsModal: React.FC<OrderDetailsModalProps> = ({
  visible,
  onClose,
  orderId,
}) => {
  const [orderDetails, setOrderDetails] = useState<OrderDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [productsModalVisible, setProductsModalVisible] = useState(false);
  const [statusModalVisible, setStatusModalVisible] = useState(false);
  const [productsModalTranslateY] = useState(new Animated.Value(screenHeight));
  const [statusModalTranslateY] = useState(new Animated.Value(screenHeight));
  const [isProductsModalClosing, setIsProductsModalClosing] = useState(false);
  const [isStatusModalClosing, setIsStatusModalClosing] = useState(false);

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
      productsModalTranslateY.setValue(screenHeight);
      Animated.spring(productsModalTranslateY, {
        toValue: 0,
        useNativeDriver: true,
        damping: 20,
        stiffness: 90,
        mass: 0.8,
      }).start();
    }
  }, [productsModalVisible]);

  // Анимация для модалки со статусами
  useEffect(() => {
    if (statusModalVisible) {
      statusModalTranslateY.setValue(screenHeight);
      Animated.spring(statusModalTranslateY, {
        toValue: 0,
        useNativeDriver: true,
        damping: 20,
        stiffness: 90,
        mass: 0.8,
      }).start();
    }
  }, [statusModalVisible]);

  const closeProductsModal = () => {
    if (isProductsModalClosing) return;

    setIsProductsModalClosing(true);
    Animated.timing(productsModalTranslateY, {
      toValue: screenHeight,
      duration: 250,
      useNativeDriver: true,
    }).start(() => {
      setIsProductsModalClosing(false);
      setProductsModalVisible(false);
    });
  };

  const closeStatusModal = () => {
    if (isStatusModalClosing) return;

    setIsStatusModalClosing(true);
    Animated.timing(statusModalTranslateY, {
      toValue: screenHeight,
      duration: 250,
      useNativeDriver: true,
    }).start(() => {
      setIsStatusModalClosing(false);
      setStatusModalVisible(false);
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

  const getCurrentStatusName = () => {
    if (!orderDetails?.statuses || !orderDetails?.currentStatusId)
      return orderDetails?.orderStatus || "";
    const currentStatus = orderDetails.statuses.find(
      (status) => status.id === orderDetails.currentStatusId,
    );
    return currentStatus?.name || orderDetails.orderStatus || "";
  };

  const getCurrentStatusIndex = () => {
    if (!orderDetails?.statuses || !orderDetails?.currentStatusId) return -1;
    return orderDetails.statuses.findIndex(
      (status) => status.id === orderDetails.currentStatusId,
    );
  };

  const isStatusCompleted = (index: number) => {
    const currentIndex = getCurrentStatusIndex();
    return index <= currentIndex;
  };

  const isStatusCurrent = (index: number) => {
    const currentIndex = getCurrentStatusIndex();
    return index === currentIndex;
  };

  if (!visible) return null;

  return (
    <>
      <Modal
        visible={visible}
        animationType="slide"
        transparent={false}
        onRequestClose={onClose}
        statusBarTranslucent={true}
      >
        <ThemedView
          style={styles.container}
          lightColor="#EBEDF0"
          darkColor="#040508"
        >
          {/* Хедер как в SearchScreenWithHistory */}
          <ThemedView style={styles.header}>
            <TouchableOpacity onPress={onClose} style={styles.backButton}>
              <ArrowIconLeft />
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
                {/* Статус заказа - теперь кликабельный */}
                <TouchableOpacity
                  style={styles.statusRow}
                  onPress={() => setStatusModalVisible(true)}
                >
                  <ThemedText lightColor="#203686" style={styles.statusText}>
                    {getCurrentStatusName()}
                  </ThemedText>
                  <ArrowIconRight />
                </TouchableOpacity>

                {/* Информационные блоки */}
                <View style={styles.infoContainer}>
                  {/* Номер заказа */}
                  <View style={styles.infoRow}>
                    <View style={styles.iconPlaceholder}>
                      <IconNumber />
                    </View>
                    <View style={styles.infoContent}>
                      <ThemedText lightColor="#80818B" style={styles.infoLabel}>
                        Номер заказа
                      </ThemedText>
                      <ThemedText style={styles.infoValue}>
                        №{orderDetails.orderId}
                      </ThemedText>
                    </View>
                  </View>

                  {/* Ожидаемая дата доставки */}
                  <View style={styles.infoRow}>
                    <View style={styles.iconPlaceholder}>
                      <CalendarFilledIcon />
                    </View>
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
                    <View style={styles.iconPlaceholder}>
                      <IconCompanyNew />
                    </View>

                    <View style={styles.infoContent}>
                      <ThemedText lightColor="#80818B" style={styles.infoLabel}>
                        Компания
                      </ThemedText>
                      <ThemedText style={styles.infoValue}>
                        {orderDetails.companyName ||
                          orderDetails.company ||
                          orderDetails.profileFullName ||
                          'ООО "ЭкорФиш"'}
                      </ThemedText>
                    </View>
                  </View>

                  {/* Адрес доставки */}
                  <View style={styles.infoRow}>
                    <View style={styles.iconPlaceholder}>
                      <IconGeo />
                    </View>

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
                    <View style={styles.iconPlaceholder}>
                      <IconUser />
                    </View>
                    <View style={styles.infoContent}>
                      <ThemedText lightColor="#80818B" style={styles.infoLabel}>
                        Получатель
                      </ThemedText>
                      <ThemedText style={styles.infoValue}>
                        {orderDetails.recipientName ||
                          orderDetails.recipient ||
                          "Иванов Иван Иванович"}
                      </ThemedText>
                    </View>
                  </View>

                  {/* Оплата */}
                  <View style={styles.infoRow}>
                    <View style={styles.iconPlaceholder}>
                      <IconCard />
                    </View>
                    <View style={styles.infoContent}>
                      <ThemedText lightColor="#80818B" style={styles.infoLabel}>
                        Оплата
                      </ThemedText>
                      <ThemedText style={styles.infoValue}>
                        {orderDetails.paymentType === "Cashless"
                          ? "Безналичный расчет"
                          : orderDetails.paymentType === "Cash"
                            ? "Наличными"
                            : orderDetails.payment || "Наличными при получении"}
                      </ThemedText>
                    </View>
                  </View>
                </View>

                {/* Итого */}
                <View style={styles.totalContainer}>
                  <ThemedText lightColor="#80818B" style={styles.totalLabel}>
                    Итого
                  </ThemedText>
                  <ThemedText style={styles.totalValue}>
                    {formatPrice(orderDetails.totalAmount)} ₽
                  </ThemedText>
                </View>

                {/* Общий вес */}
                <View style={styles.weightContainer}>
                  <ThemedText lightColor="#80818B" style={styles.weightLabel}>
                    Общий вес заказа
                  </ThemedText>
                  <ThemedText lightColor="#80818B" style={styles.weightValue}>
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
                  <PrimaryButton
                    title="Отменить"
                    onPress={() => console.log("Отменить заказ")}
                    variant="third"
                    size="md"
                    activeOpacity={0.8}
                    fullWidth
                    style={styles.cancelButton}
                    customIcon={<IconCloseNew />}
                  />
                  <PrimaryButton
                    title="Написать"
                    onPress={() => console.log("Написать сообщение")}
                    variant="third"
                    size="md"
                    style={styles.messageButton}
                    activeOpacity={0.8}
                    fullWidth
                    customIcon={<IconMessage />}
                  />
                </View>
                <PrimaryButton
                  title="Документы"
                  onPress={() => console.log("Документы")}
                  variant="third"
                  size="md"
                  style={styles.documentsButton}
                  activeOpacity={0.8}
                  fullWidth
                  customIcon={<IconDocument />}
                />
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
                      {item.image ? (
                        <Image
                          source={{ uri: `${baseUrl}/${item.image}` }}
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
                      <View style={styles.productInfoMain}>
                        <ThemedText
                          style={styles.productName}
                          numberOfLines={2}
                        >
                          {item.productName}
                        </ThemedText>

                        <ThemedText
                          lightColor="#80818B"
                          style={styles.productQuantity}
                        >
                          {item.unitPrice}₽ /{" "}
                          {item.measureType === "килограмм" ? "кг" : "шт"} •{" "}
                          {item.quantity}{" "}
                          {item.measureType === "килограмм" ? "кг" : "шт"}
                        </ThemedText>
                      </View>

                      <View>
                        <View style={styles.productPriceRow}>
                          <ThemedText style={styles.productPrice}>
                            {formatPrice(item.totalPrice)} ₽
                          </ThemedText>
                        </View>
                      </View>
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

      {/* Модалка со всеми товарами */}
      <Modal
        visible={productsModalVisible}
        animationType="none"
        transparent={true}
        onRequestClose={closeProductsModal}
        statusBarTranslucent={true}
      >
        <TouchableWithoutFeedback onPress={closeProductsModal}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <Animated.View
                style={[
                  styles.modalContainer,
                  {
                    transform: [{ translateY: productsModalTranslateY }],
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
                      {item.image ? (
                        <Image
                          source={{ uri: `${baseUrl}/${item.image}` }}
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
                      <View style={styles.productInfoMain}>
                        <ThemedText
                          style={styles.modalProductName}
                          numberOfLines={2}
                        >
                          {item.productName}
                        </ThemedText>
                        <ThemedText
                          lightColor="#80818B"
                          style={styles.modalProductQuantity}
                        >
                          {item.unitPrice}₽ /{" "}
                          {item.measureType === "килограмм" ? "кг" : "шт"} •{" "}
                          {item.quantity}{" "}
                          {item.measureType === "килограмм" ? "кг" : "шт"}
                        </ThemedText>
                      </View>
                      <View style={styles.productPriceContainer}>
                        <ThemedText style={styles.modalProductPrice}>
                          {formatPrice(item.totalPrice)} ₽
                        </ThemedText>
                      </View>
                    </View>
                  </View>
                  ))}
                </ScrollView>
              </Animated.View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* Модалка со статусами */}
      <Modal
        visible={statusModalVisible}
        animationType="none"
        transparent={true}
        onRequestClose={closeStatusModal}
        statusBarTranslucent={true}
      >
        <TouchableWithoutFeedback onPress={closeStatusModal}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <Animated.View
                style={[
                  styles.modalContainer,
                  {
                    transform: [{ translateY: statusModalTranslateY }],
                  },
                ]}
              >
                {/* Защелка для свайпа */}
                <TouchableOpacity
                  style={styles.swipeHandleContainer}
                  activeOpacity={0.7}
                  onPress={closeStatusModal}
                >
                  <View style={styles.swipeHandle} />
                </TouchableOpacity>

                <View style={styles.modalHeader}>
                  <ThemedText style={styles.modalTitle}>
                    Статус вашего заказа
                  </ThemedText>
                </View>

                {/* Список статусов */}
                <ScrollView
                  style={styles.statusesList}
                  showsVerticalScrollIndicator={false}
                >
                  {orderDetails?.statuses?.map((status, index) => {
                    const currentIndex = getCurrentStatusIndex();
                    const isCurrent = index === currentIndex;
                    const isNext = index === currentIndex + 1;
                    const isPast = index < currentIndex;
                    const isFuture = index > currentIndex + 1;
                    const isLast = index === orderDetails.statuses.length - 1;

                    // Определяем цвета линии
                    let lineColors: [string, string];
                    if (isPast || isCurrent) {
                      lineColors = ["#203686", "#203686"]; // Для пройденных и текущего - синяя
                    } else if (isNext) {
                      lineColors = ["#203686", "#80818B"]; // Для следующего - градиент синий -> серый
                    } else {
                      lineColors = ["#80818B", "#80818B"]; // Для будущих - серая
                    }

                    return (
                      <View key={status.id} style={styles.statusItemContainer}>
                        <View style={styles.statusLeftColumn}>
                          {/* Кружок статуса */}
                          <View
                            style={[
                              styles.statusCircle,
                              (isPast || isCurrent) &&
                                styles.statusCircleCompleted,
                              isNext && styles.statusCircleNext,
                              isFuture && styles.statusCirclePending,
                            ]}
                          >
                            {(isPast || isCurrent) && (
                              <View style={styles.statusCircleCheckmark}>
                                <IconAccept />
                                {/* <View style={styles.checkmarkKick} /> */}
                              </View>
                            )}
                            {isNext && <View style={styles.statusCurrentDot} />}
                          </View>

                          {/* Линия между статусами (кроме последнего) */}
                          {!isLast && (
                            <View style={styles.statusLineContainer}>
                              <LinearGradient
                                colors={lineColors}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 0, y: 1 }}
                                style={styles.statusLine}
                              />
                            </View>
                          )}
                        </View>

                        {/* Название статуса */}
                        <View style={styles.statusRightColumn}>
                          <ThemedText
                            style={[
                              styles.statusName,
                              (isPast || isCurrent || isNext) &&
                                styles.statusNameCompleted,
                            ]}
                          >
                            {status.name}
                          </ThemedText>
                        </View>
                      </View>
                    );
                  })}
                </ScrollView>
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
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  backButton: {
    padding: 8,
  },
  backArrow: {
    fontSize: 24,
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    alignItems: "center",
    justifyContent: "center",
  },
  copyButton: {
    padding: 8,
  },
  content: {
    flex: 1,
    // paddingHorizontal: 16,
    marginTop: 8,
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
    fontSize: 20,
    fontWeight: "600",
  },
  infoContainer: {
    // gap: 16,
    marginBottom: 20,
  },
  infoRow: {
    flexDirection: "row",
    gap: 12,
    alignItems: "center",
  },
  iconPlaceholder: {
    // width: 24,
    padding: 8,
    // height: 24,
    borderRadius: 8,
    backgroundColor: "#F2F4F7",
  },
  infoContent: {
    flex: 1,
    borderBottomWidth: 1,
    borderColor: "#F0F3F7",
    paddingBottom: 12,
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: "500",
    // marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: "500",
  },
  totalContainer: {
    flexDirection: "column",
    // paddingTop: 12,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: "500",
  },
  totalValue: {
    fontSize: 16,
    fontWeight: "600",
  },
  weightContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingBottom: 16,
    gap: 3,
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
    alignItems: "center",
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: "500",
  },
  messageButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
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
    // backgroundColor: "#F2F4F7",
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
    fontSize: 20,
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
    flexDirection: "row",
  },
  // productInfoMain: {
  //   display: "flex",
  //   flex: 1,
  //   flexDirection: "column",
  // },
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
  // Стили для модалок
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContainer: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "60%",
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
  // Стили для списка товаров
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
  flex: 1, // Важно: занимает оставшееся пространство
  flexDirection: "row",
  justifyContent: "space-between", // Распределяем пространство между элементами
  alignItems: "flex-start", // Выравниваем по верхнему краю
},
productInfoMain: {
  flex: 1, // Занимает доступное пространство
  marginRight: 8, // Отступ от цены
},
modalProductName: {
  fontSize: 14,
  fontWeight: "500",
  marginBottom: 4,
  flexShrink: 1, // Позволяет тексту сжиматься
},
modalProductQuantity: {
  fontSize: 12,
  fontWeight: "400",
},
productPriceContainer: {
  // Контейнер для цены
  justifyContent: "flex-start",
  alignItems: "flex-end",
  minWidth: 70, // Минимальная ширина для цены
},
modalProductPrice: {
  fontSize: 14,
  fontWeight: "600",
  textAlign: "right", // Выравнивание текста цены вправо
},
  // Стили для списка статусов
  statusesList: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    // maxHeight: "60%",
  },
  statusItemContainer: {
    flexDirection: "row",
    minHeight: 60,
  },
  statusLeftColumn: {
    width: 30,
    alignItems: "center",
    position: "relative",
  },
  statusCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    zIndex: 2,
  },

  statusCircleCurrent: {
    borderColor: "#203686",
    backgroundColor: "#FFFFFF",
    borderWidth: 2,
    padding: 2,
  },

  statusRightColumn: {
    flex: 1,
    paddingLeft: 12,
    paddingBottom: 20,
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
  statusCircleCompleted: {
    borderColor: "#203686",
    backgroundColor: "#203686",
  },
  statusCirclePending: {
    borderColor: "#80818B",
    backgroundColor: "#FFFFFF",
  },
  statusCircleNext: {
    borderColor: "#203686",
    backgroundColor: "#FFFFFF",
    borderWidth: 2,
  },
  statusCurrentDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#203686",
  },
  statusCircleCheckmark: {
    width: 10,
    height: 10,
    position: "relative",
  },
  checkmarkStem: {
    position: "absolute",
    width: 2,
    height: 6,
    backgroundColor: "#FFFFFF",
    left: 2,
    top: 0,
    transform: [{ rotate: "45deg" }],
  },
  checkmarkKick: {
    position: "absolute",
    width: 2,
    height: 3,
    backgroundColor: "#FFFFFF",
    left: 4,
    top: 4,
    transform: [{ rotate: "-45deg" }],
  },
  statusLineContainer: {
    position: "absolute",
    top: 20,
    width: 2,
    height: 45,
    alignItems: "center",
  },
  statusLine: {
    width: 2,
    height: "120%",
  },
  statusName: {
    fontSize: 16,
    fontWeight: "500",
    color: "#80818B",
    marginBottom: 4,
  },
  statusNameCompleted: {
    color: "#1B1B1C",
  },
  statusCurrentLabel: {
    fontSize: 12,
    color: "#203686",
    fontWeight: "500",
  },
  statusNextLabel: {
    fontSize: 12,
    color: "#203686",
    fontWeight: "500",
    opacity: 0.7,
  },
});
