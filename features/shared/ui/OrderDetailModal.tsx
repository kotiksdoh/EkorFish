import {
  ArrowIconLeft,
  ArrowIconRight,
  CalendarFilledIcon,
  Copy,
  IconAccept,
  IconCard,
  IconCompanyNew,
  IconDocument,
  IconGeo,
  IconMessage,
  IconNumber,
  IconUser,
  RepeatOrderIcon
} from "@/assets/icons/icons";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import {
  checkForReorder,
  getCart,
  reorderOrder,
} from "@/features/catalog/catalogSlice";
import { axdef, baseUrl } from "@/features/shared/services/axios";
import { openTelegramByPhone } from "@/features/shared/utils/phoneLinking";
import { SnapBottomSheet } from "@/features/shared/ui/SnapBottomSheet";
import {
  BottomSheetModal,
  type BottomSheetModalRef,
} from "@/features/shared/ui/BottomSheetModal";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useAppDispatch } from "@/store/hooks";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Clipboard from "expo-clipboard";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  InteractionManager,
  Linking,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { PrimaryButton } from "./components/PrimartyButton";

const { height: screenHeight } = Dimensions.get("window");
const PRODUCTS_SHEET_MAX_HEIGHT = screenHeight * 0.85;
const PRODUCTS_LIST_MAX_HEIGHT = PRODUCTS_SHEET_MAX_HEIGHT - 88;

interface OrderProduct {
  id: string;
  productId: string;
  productName: string;
  image?: string;
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
  date: string;
  code?: string;
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
  profileFullName?: string;
}

interface OrderDocument {
  id: string;
  fileName: string;
  fileUrl: string;
  createdAt: string;
}

interface OrderDetailsModalProps {
  visible: boolean;
  onClose: () => void;
  orderId: any;
  onReorderSuccess?: () => void;
}

interface CompanyManager {
  id: string;
  name?: string;
  phoneNumber?: string;
}

export const OrderDetailsModal: React.FC<OrderDetailsModalProps> = ({
  visible,
  onClose,
  orderId,
  onReorderSuccess,
}) => {
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === "dark";
  const insets = useSafeAreaInsets();
  const dispatch = useAppDispatch();
  const router = useRouter();
  const productsSheetRef = useRef<BottomSheetModalRef>(null);
  const [orderDetails, setOrderDetails] = useState<OrderDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCheckingReorder, setIsCheckingReorder] = useState(false);
  const [isReordering, setIsReordering] = useState(false);
  const [reorderModalVisible, setReorderModalVisible] = useState(false);
  const [documentsModalVisible, setDocumentsModalVisible] = useState(false);
  const [documents, setDocuments] = useState<OrderDocument[]>([]);
  const [isLoadingDocuments, setIsLoadingDocuments] = useState(false);
  const [canReorderFully, setCanReorderFully] = useState<boolean | null>(null);
  const [productsModalVisible, setProductsModalVisible] = useState(false);
  const [statusModalVisible, setStatusModalVisible] = useState(false);
  const [companyManager, setCompanyManager] = useState<CompanyManager | null>(null);

  const productsListBottomPadding = Math.max(insets.bottom, 16) + 16;

  // Загрузка деталей заказа
  useEffect(() => {
    if (visible && orderId) {
      loadOrderDetails();
    } else {
      setOrderDetails(null);
      setReorderModalVisible(false);
      setStatusModalVisible(false);
      setDocumentsModalVisible(false);
      setProductsModalVisible(false);
      setIsReordering(false);
      setIsCheckingReorder(false);
    }
  }, [visible, orderId]);

  useEffect(() => {
    const hydrateCompanyManager = async () => {
      if (!visible) {
        setCompanyManager(null);
        return;
      }
      try {
        const storedCompanyRaw = await AsyncStorage.getItem("company");
        const storedCompany = storedCompanyRaw ? JSON.parse(storedCompanyRaw) : null;
        setCompanyManager(storedCompany?.manager || null);
      } catch (error) {
        console.error("Error loading company manager from storage:", error);
        setCompanyManager(null);
      }
    };

    void hydrateCompanyManager();
  }, [visible]);

  const closeStatusModal = () => setStatusModalVisible(false);

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
      await Clipboard.setStringAsync(orderDetails?.orderId?.toString());
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

  const formatStatusDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("ru-RU", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatPrice = (price: number) => {
    return price.toLocaleString("ru-RU", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const formatMoneyNoFraction = (price: number) => {
    return price.toLocaleString("ru-RU");
  };

  const getOrderTotalQuantity = () => {
    return (
      orderDetails?.products?.reduce((sum, product) => {
        return sum + Number(product.quantity || 0);
      }, 0) || 0
    );
  };

  const getOrderTotalWeightOrQuantity = () => {
    if (typeof orderDetails?.totalWeight === "number" && orderDetails.totalWeight > 0) {
      return `${orderDetails.totalWeight} кг`;
    }
    return `${getOrderTotalQuantity()} шт`;
  };
  
  const getCurrentStatusName = () => {
    return orderDetails?.statuses.at(-1)?.name || ''
  };

  const getCurrentStatusIndex = () => {
    if (!orderDetails?.statuses) return -1;
    // Текущий статус - последний в массиве
    return orderDetails.statuses.length - 1;
  };

  const isStatusCompleted = (index: number) => {
    const currentIndex = getCurrentStatusIndex();
    return index <= currentIndex;
  };

  const isStatusCurrent = (index: number) => {
    const currentIndex = getCurrentStatusIndex();
    return index === currentIndex;
  };
  const canRepeatOrderByStatus = Boolean(
    orderDetails?.statuses?.some(
      (status) =>
        status?.code?.toLowerCase() === "received" ||
        status?.name?.toLowerCase() === "получен",
    ),
  );

  const openReorderModal = async () => {
    if (!orderDetails || isCheckingReorder || !canRepeatOrderByStatus) return;
    setIsCheckingReorder(true);
    try {
      const result = await dispatch(checkForReorder(orderDetails.orderId)).unwrap();
      setCanReorderFully(Boolean(result));
      setReorderModalVisible(true);
    } catch (error) {
      Alert.alert("Ошибка", "Не удалось проверить возможность повторного заказа");
    } finally {
      setIsCheckingReorder(false);
    }
  };

  const openDocumentsModal = async () => {
    if (!orderDetails?.orderId) return;
    setDocumentsModalVisible(true);
    setIsLoadingDocuments(true);
    try {
      const response = await axdef.get(`/api/Order/${orderDetails.orderId}/documents`);
      setDocuments(response?.data?.data || []);
    } catch (error) {
      console.error("Error loading order documents:", error);
      Alert.alert("Ошибка", "Не удалось загрузить документы заказа");
      setDocuments([]);
    } finally {
      setIsLoadingDocuments(false);
    }
  };

  const handleOpenDocument = async (fileUrl: string) => {
    try {
      const normalizedUrl =
        fileUrl?.startsWith("http://") || fileUrl?.startsWith("https://")
          ? fileUrl
          : `${baseUrl}/${String(fileUrl || "").replace(/^\/+/, "")}`;

      const canOpen = await Linking.canOpenURL(normalizedUrl);
      if (!canOpen) {
        Alert.alert("Ошибка", "Не удалось открыть документ");
        return;
      }
      await Linking.openURL(normalizedUrl);
    } catch (error) {
      console.error("Error opening document:", error);
      Alert.alert("Ошибка", "Не удалось открыть документ");
    }
  };

  const closeModalsAndGoToCart = useCallback(() => {
    onClose();
    const finish = () => {
      onReorderSuccess?.();
      router.replace("/(tabs)/shop");
    };
    if (Platform.OS === "ios") {
      InteractionManager.runAfterInteractions(() => {
        setTimeout(finish, 320);
      });
    } else {
      finish();
    }
  }, [onClose, onReorderSuccess, router]);

  const handleReorder = async () => {
    if (!orderDetails || isReordering) return;
    setIsReordering(true);
    try {
      await dispatch(reorderOrder(orderDetails.orderId)).unwrap();
      await dispatch(getCart()).unwrap();
      setReorderModalVisible(false);

      const proceed = () => {
        setIsReordering(false);
        closeModalsAndGoToCart();
      };

      if (Platform.OS === "ios") {
        setTimeout(proceed, 280);
      } else {
        proceed();
      }
    } catch (error) {
      setIsReordering(false);
      Alert.alert("Ошибка", "Не удалось повторить заказ. Попробуйте позже.");
    }
  };
  const handleMessageManager = () => {
    void openTelegramByPhone(companyManager);
  };

  return (
    <>
      <Modal
        visible={visible}
        animationType="none"
        transparent={false}
        onRequestClose={onClose}
        presentationStyle="fullScreen"
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
              <ArrowIconLeft color={isDarkMode ? "#FBFCFF" : "#1B1B1C"} />
            </TouchableOpacity>

            <View style={styles.headerTitleContainer}>
              <ThemedText style={styles.headerTitle}>Детали заказа</ThemedText>
            </View>

            <TouchableOpacity onPress={handleCopyId} style={styles.copyButton}>
              <Copy fill={isDarkMode ? "#FBFCFF" : "#1B1B1C"} />
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
                  style={[styles.statusRow]}
                  onPress={() => setStatusModalVisible(true)}
                >
                  <ThemedText
                    lightColor="#203686"
                    darkColor="#4C94FF"
                    style={styles.statusText}
                  >
                    {getCurrentStatusName()}
                  </ThemedText>
                  <ArrowIconRight />
                </TouchableOpacity>

                {/* Информационные блоки */}
                <View style={styles.infoContainer}>
                  {/* Номер заказа */}
                  <View style={styles.infoRow}>
                    <ThemedView
                      lightColor="#F2F4F7"
                      darkColor="#202022"
                      style={styles.iconPlaceholder}
                    >
                      <IconNumber />
                    </ThemedView>
                    <View
                      style={[
                        styles.infoContent,
                        isDarkMode && {
                          borderColor: "#252527",
                        },
                      ]}
                    >
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
                    <ThemedView
                      lightColor="#F2F4F7"
                      darkColor="#202022"
                      style={styles.iconPlaceholder}
                    >
                      <CalendarFilledIcon stroke="#80818B" fill="none" />
                    </ThemedView>
                    <View
                      style={[
                        styles.infoContent,
                        isDarkMode && {
                          borderColor: "#252527",
                        },
                      ]}
                    >
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
                    <ThemedView
                      lightColor="#F2F4F7"
                      darkColor="#202022"
                      style={styles.iconPlaceholder}
                    >
                      <IconCompanyNew />
                    </ThemedView>

                    <View
                      style={[
                        styles.infoContent,
                        isDarkMode && {
                          borderColor: "#252527",
                        },
                      ]}
                    >
                      <ThemedText lightColor="#80818B" style={styles.infoLabel}>
                        Компания
                      </ThemedText>
                      <ThemedText style={styles.infoValue}>
                        {orderDetails.companyName ||
                          orderDetails?.company ||
                          orderDetails?.profileFullName ||
                          "-"}
                      </ThemedText>
                    </View>
                  </View>

                  {/* Адрес доставки */}
                  <View style={styles.infoRow}>
                    <ThemedView
                      lightColor="#F2F4F7"
                      darkColor="#202022"
                      style={styles.iconPlaceholder}
                    >
                      <IconGeo />
                    </ThemedView>

                    <View
                      style={[
                        styles.infoContent,
                        isDarkMode && {
                          borderColor: "#252527",
                        },
                      ]}
                    >
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
                    <ThemedView
                      lightColor="#F2F4F7"
                      darkColor="#202022"
                      style={styles.iconPlaceholder}
                    >
                      <IconUser />
                    </ThemedView>
                    <View
                      style={[
                        styles.infoContent,
                        isDarkMode && {
                          borderColor: "#252527",
                        },
                      ]}
                    >
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
                    <ThemedView
                      lightColor="#F2F4F7"
                      darkColor="#202022"
                      style={styles.iconPlaceholder}
                    >
                      <IconCard />
                    </ThemedView>
                    <View
                      style={[
                        styles.infoContent,
                        isDarkMode && {
                          borderColor: "#252527",
                        },
                      ]}
                    >
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
                    title={isCheckingReorder ? "Проверяем..." : "Повторить"}
                    onPress={openReorderModal}
                    variant="third"
                    size="md"
                    activeOpacity={0.8}
                    fullWidth
                    style={styles.cancelButton}
                    disabled={isCheckingReorder || !canRepeatOrderByStatus}
                    customIcon={
                      <RepeatOrderIcon fill={isDarkMode ? "#FBFCFF" : "#1B1B1C"} />
                    }
                  />
                  <PrimaryButton
                    title="Написать"
                    onPress={handleMessageManager}
                    variant="third"
                    size="md"
                    style={styles.messageButton}
                    activeOpacity={0.8}
                    fullWidth
                    disabled={!companyManager}
                    customIcon={
                      <IconMessage color={isDarkMode ? "#FBFCFF" : "#1B1B1C"} />
                    }
                  />
                </View>
                <PrimaryButton
                  title="Документы"
                  onPress={openDocumentsModal}
                  variant="third"
                  size="md"
                  style={styles.documentsButton}
                  activeOpacity={0.8}
                  fullWidth
                  customIcon={
                    <IconDocument color={isDarkMode ? "#FBFCFF" : "#1B1B1C"} />
                  }
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
        {/* Модалка со всеми товарами */}
        <BottomSheetModal
          ref={productsSheetRef}
          visible={productsModalVisible}
          onClose={() => setProductsModalVisible(false)}
          isDarkMode={isDarkMode}
          maxHeight={PRODUCTS_SHEET_MAX_HEIGHT}
        >
          <TouchableOpacity
            style={styles.swipeHandleContainer}
            activeOpacity={0.7}
            onPress={() => productsSheetRef.current?.close()}
          >
            <View style={styles.swipeHandle} />
          </TouchableOpacity>

          <View style={styles.modalHeader}>
            <ThemedText style={styles.modalTitle}>Состав заказа</ThemedText>
          </View>

          <ScrollView
            style={[
              styles.productsList,
              { maxHeight: PRODUCTS_LIST_MAX_HEIGHT },
            ]}
            contentContainerStyle={[
              styles.productsListContent,
              { paddingBottom: productsListBottomPadding },
            ]}
            showsVerticalScrollIndicator
            nestedScrollEnabled
            bounces
            keyboardShouldPersistTaps="handled"
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
        </BottomSheetModal>

      <SnapBottomSheet
        visible={statusModalVisible}
        title="Статус вашего заказа"
        titleAlign="left"
        onClose={closeStatusModal}
      >
        <ScrollView
          style={styles.statusesList}
          showsVerticalScrollIndicator
          nestedScrollEnabled
          bounces
          contentContainerStyle={styles.statusesListContent}
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
                          if (!isDarkMode) {
                            lineColors = ["#203686", "#203686"]; // Для пройденных и текущего - синяя
                          } else {
                            lineColors = ["#3881EE", "#3881EE"];
                          }
                        } else if (isNext) {
                          if (!isDarkMode) {
                            lineColors = ["#203686", "#80818B"]; // Для следующего - градиент синий -> серый
                          } else {
                            lineColors = ["#3881EE", "#80818B"];
                          }
                        } else {
                          lineColors = ["#80818B", "#80818B"]; // Для будущих - серая
                        }

                        return (
                          <View
                            key={status.id}
                            style={styles.statusItemContainer}
                          >
                            <View style={styles.statusLeftColumn}>
                              {/* Кружок статуса */}
                              <View
                                style={[
                                  styles.statusCircle,
                                  (isPast || isCurrent) &&
                                    styles.statusCircleCompleted,
                                  isDarkMode &&
                                    (isPast || isCurrent) && {
                                      borderColor: "#3881EE",
                                      backgroundColor: "#3881EE",
                                    },
                                  isNext && styles.statusCircleNext,
                                  isDarkMode &&
                                    isNext && {
                                      backgroundColor: "#202022",
                                      borderColor: "#3881EE",
                                    },
                                  isFuture && styles.statusCirclePending,
                                  isDarkMode &&
                                    isFuture && {
                                      backgroundColor: "#202022",
                                    },
                                ]}
                              >
                                {(isPast || isCurrent) && (
                                  <View style={styles.statusCircleCheckmark}>
                                    <IconAccept />
                                  </View>
                                )}
                                {isNext && (
                                  <View
                                    style={[
                                      styles.statusCurrentDot,
                                      isDarkMode && {
                                        backgroundColor: "#3881EE",
                                      },
                                    ]}
                                  />
                                )}
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

                            {/* Название статуса и дата - центрируем по вертикали */}
                            <View style={styles.statusRightColumn}>
                              <View style={styles.statusTextContainer}>
                                <ThemedText
                                  style={[
                                    styles.statusName,
                                    (isPast || isCurrent || isNext) &&
                                      styles.statusNameCompleted,
                                    isDarkMode &&
                                      (isPast || isCurrent || isNext) && {
                                        color: "#FBFCFF",
                                      },
                                  ]}
                                >
                                  {status.name}
                                </ThemedText>
                                <ThemedText
                                  lightColor="#80818B"
                                  darkColor="#80818B"
                                  style={styles.statusDate}
                                >
                                  {formatStatusDate(status.date)}
                                </ThemedText>
                              </View>
                            </View>
                          </View>
                        );
            })}
        </ScrollView>
      </SnapBottomSheet>
      <SnapBottomSheet
        visible={documentsModalVisible}
        title="Документы заказа"
        titleAlign="left"
        onClose={() => setDocumentsModalVisible(false)}
      >
        {isLoadingDocuments ? (
          <View style={styles.documentsLoader}>
            <ActivityIndicator size="small" color={isDarkMode ? "#4C94FF" : "#203686"} />
          </View>
        ) : documents.length === 0 ? (
          <ThemedText style={styles.documentsEmpty} lightColor="#80818B" darkColor="#FBFCFF80">
            Документы не найдены
          </ThemedText>
        ) : (
          <View style={styles.documentsList}>
            {documents.map((doc) => (
              <TouchableOpacity
                key={doc.id}
                style={[
                  styles.documentItem,
                  { backgroundColor: isDarkMode ? "#2E2E32" : "#F2F4F7" },
                ]}
                activeOpacity={0.7}
                onPress={() => handleOpenDocument(doc.fileUrl)}
              >
                <ThemedText style={styles.documentName} numberOfLines={1}>
                  {doc.fileName}
                </ThemedText>
                <ArrowIconRight />
              </TouchableOpacity>
            ))}
          </View>
        )}
      </SnapBottomSheet>
      <SnapBottomSheet
        visible={reorderModalVisible}
        title={
          canReorderFully
            ? `Повторить заказ №${orderDetails?.orderId}`
            : `Повторить заказ №${orderDetails?.orderId}?`
        }
        titleAlign="left"
        onClose={() => setReorderModalVisible(false)}
      >
        {canReorderFully ? (
          <>
            <ThemedText
              style={styles.reorderSubTitle}
              lightColor="#80818B"
              darkColor="#FBFCFF80"
            >
              В корзину будет добавлено:
            </ThemedText>
            <View style={styles.reorderList}>
              <ThemedText style={styles.reorderListItem} lightColor="#1B1B1C" darkColor="#FBFCFF">
                • {orderDetails?.products?.length || 0} товара
              </ThemedText>
              <ThemedText style={styles.reorderListItem} lightColor="#1B1B1C" darkColor="#FBFCFF">
                • {getOrderTotalWeightOrQuantity()}
              </ThemedText>
              <ThemedText style={styles.reorderListItem} lightColor="#1B1B1C" darkColor="#FBFCFF">
                • На сумму {formatMoneyNoFraction(orderDetails?.totalAmount || 0)} ₽
              </ThemedText>
            </View>
            <ThemedText style={styles.reorderWarning} lightColor="#C12B2B" darkColor="#FF6B6B">
              Текущая корзина будет очищена
            </ThemedText>
            <View
              style={[
                styles.reorderButtonsRow,
                Platform.OS === "android" && { paddingBottom: 2 },
              ]}
            >
              <PrimaryButton
                title="Отмена"
                onPress={() => setReorderModalVisible(false)}
                variant="third"
                fullWidth
                style={styles.reorderButton}
              />
              <PrimaryButton
                title={isReordering ? "Загрузка..." : "Повторить"}
                onPress={handleReorder}
                variant="primary"
                fullWidth
                style={styles.reorderButton}
                disabled={isReordering}
              />
            </View>
          </>
        ) : (
          <>
            <ThemedText style={styles.reorderMissingTitle} lightColor="#1B1B1C" darkColor="#FBFCFF">
              Некоторые товары сейчас отсутствуют.
            </ThemedText>
            <ThemedText
              style={styles.reorderMissingText}
              lightColor="#80818B"
              darkColor="#80818B"
            >
              При повторении заказа система автоматически подберет аналоги из той же
              ценовой группы. Если подходящей замены не найдется, будут предложены
              товары из той же категории.
            </ThemedText>
            <ThemedText style={styles.reorderWarning} lightColor="#C12B2B" darkColor="#FF6B6B">
              Текущая корзина будет очищена
            </ThemedText>
            <View
              style={[
                styles.reorderButtonsColumn,
                Platform.OS === "android" && { paddingBottom: 28 },
              ]}
            >
              <PrimaryButton
                title={isReordering ? "Загрузка..." : "Повторить с заменой"}
                onPress={handleReorder}
                variant="primary"
                fullWidth
                disabled={isReordering}
              />
              <View style={{ height: 10 }} />
              <PrimaryButton
                title="Отмена"
                onPress={() => setReorderModalVisible(false)}
                variant="third"
                fullWidth
              />
            </View>
          </>
        )}
      </SnapBottomSheet>
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
    marginBottom: 16,
  },
  statusText: {
    fontSize: 20,
    fontWeight: "600",
  },
  infoContainer: {
    marginBottom: 20,
  },
  infoRow: {
    flexDirection: "row",
    gap: 12,
    alignItems: "center",
  },
  iconPlaceholder: {
    padding: 8,
    borderRadius: 8,
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
  },
  infoValue: {
    fontSize: 16,
    fontWeight: "500",
  },
  totalContainer: {
    flexDirection: "column",
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
    alignItems: "center",
    marginBottom: 12,
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
  productInfoMain: {
    flex: 1,
    marginRight: 8,
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
    maxHeight: "90%", // Ограничиваем максимальную высоту
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
  },
  // Стили для списка товаров
  productsList: {
    flexGrow: 0,
    flexShrink: 1,
  },
  productsListContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  modalProductCard: {
    flexDirection: "row",
    marginBottom: 12,
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
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  modalProductName: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 4,
    flexShrink: 1,
  },
  modalProductQuantity: {
    fontSize: 12,
    fontWeight: "400",
  },
  productPriceContainer: {
    justifyContent: "flex-start",
    alignItems: "flex-end",
    minWidth: 70,
  },
  modalProductPrice: {
    fontSize: 14,
    fontWeight: "600",
    textAlign: "right",
  },
  // Стили для списка статусов
  statusesList: {
    maxHeight: screenHeight * 0.55,
  },
  statusesListContent: {
    paddingHorizontal: 20,
    paddingVertical: 16,
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
    marginTop: 10,
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 2,
  },
  statusCircleCurrent: {
    borderColor: "#203686",
    borderWidth: 2,
    padding: 2,
  },
  statusRightColumn: {
    flex: 1,
    paddingLeft: 12,
    // paddingBottom: 20,
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
    // marginBottom: 4,
  },
  statusNameCompleted: {
    color: "#1B1B1C",
  },
  statusDate: {
    fontSize: 12,
    fontWeight: "400",
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
  statusTextContainer: {
  },
  reorderSubTitle: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 10,
  },
  reorderList: {
    gap: 6,
    marginBottom: 14,
  },
  reorderListItem: {
    fontSize: 14,
    fontWeight: "500",
  },
  reorderWarning: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 12,
  },
  reorderButtonsRow: {
    flexDirection: "row",
    gap: 10,
    paddingBottom: 8,
  },
  reorderButton: {
    flex: 1,
  },
  reorderMissingTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
  },
  reorderMissingText: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 12,
    lineHeight: 22,
  },
  reorderButtonsColumn: {
    paddingBottom: 8,
  },
  documentsLoader: {
    paddingVertical: 20,
    alignItems: "center",
  },
  documentsEmpty: {
    fontSize: 14,
    fontWeight: "500",
    paddingBottom: 16,
  },
  documentsList: {
    gap: 8,
    paddingBottom: 16,
  },
  documentItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  documentName: {
    flex: 1,
    fontSize: 14,
    fontWeight: "500",
    marginRight: 8,
  },
});