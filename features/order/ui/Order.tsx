// app/modals/checkout.tsx
import {
  ArrowIconRight,
  IconCompanyNew,
  TrashIcon,
} from "@/assets/icons/icons";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import {
  getTowns,
  loadCompanyFromStorage,
  setCompany,
  updateUserTown,
} from "@/features/auth/authSlice";
import { useAuthGate } from "@/features/auth/hooks/useAuthGate";
import { ModalHeader } from "@/features/auth/ui/Header";
import {
  AddToCart,
  createOrder,
  createRecipient,
  deleteRecipient,
  getCart,
  getCheckoutPageData,
  getMyOrders,
  getRecipients,
} from "@/features/catalog/catalogSlice";
import { RecommendedOrderProducts } from "@/features/catalog/ui/components/RecommendedOrderProducts/RecommendedOrderProducts";
import { PrimaryButton } from "@/features/home";
import { getCheckoutOrderBlockers } from "@/features/order/checkoutBlockers";
import { CheckoutBlockerHint } from "@/features/order/ui/CheckoutBlockerHint";
import { getAxiosErrorMessage } from "@/features/shared/services/api";
import { useSavedAddress } from "@/features/shared/services/useSavedAddress";
import { AddAddressModal } from "@/features/shared/ui/AddAddressModal";
import { AddToCartModal } from "@/features/shared/ui/AddToCartModal";
import { AddressSelectionModal } from "@/features/shared/ui/AddressSelectionModal";
import { AnimatedStackedSheet } from "@/features/shared/ui/AnimatedStackedSheet";
import { AppModal } from "@/features/shared/ui/AppModal";
import { CompanySelectionModal } from "@/features/shared/ui/CompanySelectionModalSmall";
import { OrderDetailsModal } from "@/features/shared/ui/OrderDetailModal";
import { CustomCheckbox } from "@/features/shared/ui/components/CustomCheckBox";
import AnimatedTextInput from "@/features/shared/ui/components/CustomInput";
import {
  formatPhoneForApi,
  formatPhoneInput,
  isPhoneInputComplete,
  isRecipientContactComplete,
  isValidEmail,
  sanitizeEmailInput,
} from "@/features/shared/utils/contactInput";
import {
  formatAddressSummary,
  getCompanyDeliveryAddresses,
  getFirstCompanyDeliveryAddress,
  mergeAddressIntoCompany,
} from "@/features/shared/utils/deliveryAddress";
import {
  getTimeSlotsForDate,
  isWorkingDeliveryDay,
} from "@/features/shared/utils/nearestDelivery";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  FlatList,
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const { height: screenHeight } = Dimensions.get("window");

// Енумы из бекенда
enum DeliveryMethod {
  Delivery = 0,
  Pickup = 1,
}

enum PaymentType {
  Cashless = 0,
  Cash = 1,
}

const DELIVERY_METHOD_API_VALUE: Record<DeliveryMethod, string> = {
  [DeliveryMethod.Delivery]: "delivery",
  [DeliveryMethod.Pickup]: "pickup",
};

const PAYMENT_TYPE_API_VALUE: Record<PaymentType, string> = {
  [PaymentType.Cashless]: "cashless",
  [PaymentType.Cash]: "cash",
};

const isSameDeliveryMethod = (
  apiValue: unknown,
  method: DeliveryMethod,
): boolean =>
  apiValue === method || apiValue === DELIVERY_METHOD_API_VALUE[method];

const parsePaymentType = (value: unknown): PaymentType | null => {
  if (value === PaymentType.Cashless || value === "cashless") {
    return PaymentType.Cashless;
  }
  if (value === PaymentType.Cash || value === "cash") {
    return PaymentType.Cash;
  }
  return null;
};

interface CheckoutModalProps {
  visible: boolean;
  onClose: () => void;
  selectedItems: Set<string>;
  cartItems: any[];
  totals: {
    totalItems: number;
    totalPrice: number;
    totalWeight: number;
  };
}

interface Recipient {
  id: string;
  fullname: string;
  phoneNumber: string;
  email: string;
  deliveryAddressId?: string;
  isExisting?: boolean; // флаг для существующих получателей с бекенда
}

const MAX_ADDITIONAL_RECIPIENTS = 5;

interface DateTimeSelection {
  date: string;
  time: string;
}

export default function CheckoutModal({
  visible,
  onClose,
  selectedItems,
  cartItems,
  totals,
}: CheckoutModalProps) {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === "dark";
  // Состояние для выбранных значений
  const [selectedMethod, setSelectedMethod] = useState<DeliveryMethod>(
    DeliveryMethod.Delivery,
  );
  const [selectedPickupAddress, setSelectedPickupAddress] =
    useState<string>("");
  const [selectedDateTime, setSelectedDateTime] = useState<DateTimeSelection>({
    date: "",
    time: "",
  });
  const [selectedPaymentType, setSelectedPaymentType] = useState<PaymentType>(
    PaymentType.Cashless,
  );
  const [recipients, setRecipients] = useState<Recipient[]>([
    { id: "1", fullname: "", phoneNumber: "", email: "" },
  ]);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [showCalendarModal, setShowCalendarModal] = useState(false);
  const [showSuccessContent, setShowSuccessContent] = useState(false);
  const [showOrderDetailsModal, setShowOrderDetailsModal] = useState(false);
  const [createdOrderId, setCreatedOrderId] = useState<number | null>(null);
  const [showChangePickupModal, setShowChangePickupModal] = useState(false);
  const [pendingPickupAddress, setPendingPickupAddress] = useState<string | null>(null);
  const [showAddAddressModal, setShowAddAddressModal] = useState(false);
  const [showNeedAddressSheet, setShowNeedAddressSheet] = useState(false);
  const [selectedProductForCart, setSelectedProductForCart] = useState<any>(null);
  const [existingCartItem, setExistingCartItem] = useState<any>(null);
  const [showAddToCartModal, setShowAddToCartModal] = useState(false);

  const dispatch = useAppDispatch();
  const { requireAuth, openLogin, authGateModal } = useAuthGate();
  const tabContainerRef = useRef<View>(null);
  const [tabContainerWidth, setTabContainerWidth] = useState(0);
  const indicatorPosition = useRef(new Animated.Value(0)).current;

  // Данные с бекенда
  const orderData = useAppSelector((state) => state.catalog.order);
  const deliveryMethods = orderData?.deliveryMethods || [];
  const checkoutDeliverySchedule = useMemo(() => {
    if (!orderData?.deliverySchedule) return null;
    return {
      ...orderData.deliverySchedule,
      nearestDeliveryDate: orderData.nearestDeliveryDate,
    };
  }, [orderData]);
  const isLoadingCheckoutPageData = useAppSelector(
    (state) => state.catalog.isLoadingCheckoutPageData,
  );
  const towns = useAppSelector((state) => state.auth.towns);
  const isLoadingTowns = useAppSelector((state) => state.auth.isLoadingTowns);
  const isCheckoutDataLoading =
    isLoadingCheckoutPageData || isLoadingTowns;
  const savedRecipients = useAppSelector((state) => state.catalog.recipients);
  const isLoadingRecipients = useAppSelector(
    (state) => state.catalog.isLoadingRecipients,
  );
  const isCreatingOrder = useAppSelector(
    (state) => state.catalog.isCreatingOrder,
  );

  const [showAddressModal, setShowAddressModal] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState<any>(null);
  const [showCompanyModal, setShowCompanyModal] = useState(false);

  const currentCompany = useAppSelector((state) => state.auth.currentCompany);
  const me = useAppSelector((state) => state.auth.me);

  // Получаем доступные способы оплаты для текущего метода доставки
  const getAvailablePaymentTypes = (method: DeliveryMethod): PaymentType[] => {
    const methodConfig = deliveryMethods.find((m: any) =>
      isSameDeliveryMethod(m.method, method),
    );
    return (methodConfig?.availablePaymentTypes || [])
      .map((value: unknown) => parsePaymentType(value))
      .filter((type: PaymentType | null): type is PaymentType => type !== null);
  };

  // Проверяем, доступен ли метод доставки
  const isMethodAvailable = (method: DeliveryMethod): boolean => {
    return deliveryMethods.some((m: any) =>
      isSameDeliveryMethod(m.method, method),
    );
  };
  // const handlePickTown = async (id: any) => {
  //   await dispatch(
  //     updateUserTown({
  //       storageId: id,
  //       // townId: selectedTownId,
  //     }),
  //   ).then((res) => {
  //     if (updateUserTown.fulfilled.match(res)) {
  //       dispatch(getCart()).unwrap();
  //     }
  //   });
  //   setSelectedPickupAddress(id);
  // };
  const handlePickTown = async (id: any) => {
    setPendingPickupAddress(id);
    setShowChangePickupModal(true);
  };

  const confirmChangePickup = async () => {
    if (!pendingPickupAddress) return;
    
    setShowChangePickupModal(false);
    
    await dispatch(
      updateUserTown({
        storageId: pendingPickupAddress,
      }),
    ).then((res) => {
      if (updateUserTown.fulfilled.match(res)) {
        dispatch(getCart()).unwrap();
      }
    });
    setSelectedPickupAddress(pendingPickupAddress);
    setPendingPickupAddress(null);
  };

  const cancelChangePickup = () => {
    setShowChangePickupModal(false);
    setPendingPickupAddress(null);
  };
  // Получаем название способа оплаты для отображения
  const getPaymentTypeDisplayName = (type: PaymentType): string => {
    switch (type) {
      case PaymentType.Cashless:
        return "Безналичный расчёт";
      case PaymentType.Cash:
        return "Наличными";
      default:
        return "";
    }
  };

  // Загружаем данные при открытии модалки
  useEffect(() => {
    if (visible) {
      dispatch(getCheckoutPageData());
      dispatch(getTowns());
      dispatch(loadCompanyFromStorage());
      setShowAddAddressModal(false);
      setShowNeedAddressSheet(false);
    }
  }, [visible, dispatch]);

  // Загружаем получателей при выборе адреса
  useEffect(() => {
    if (selectedAddress?.id) {
      loadRecipients(selectedAddress.id);
    }
  }, [selectedAddress]);

  // Обновляем способ оплаты при смене метода доставки
  useEffect(() => {
    const availableTypes = getAvailablePaymentTypes(selectedMethod);
    if (
      availableTypes.length > 0 &&
      !availableTypes.includes(selectedPaymentType)
    ) {
      setSelectedPaymentType(availableTypes[0]);
    }
  }, [selectedMethod]);

  // Устанавливаем ближайшую дату и время при загрузке данных
  useEffect(() => {
    if (orderData?.nearestDeliveryDate && !selectedDateTime.date) {
      const nearestDate = new Date(orderData.nearestDeliveryDate);
      const timeSlots = getTimeSlotsForDate(
        nearestDate,
        orderData?.deliverySchedule,
      );
      const nearestTime =
        timeSlots.length > 0 ? formatTimeForDisplay(timeSlots[0]) : "";

      setSelectedDateTime({
        date: nearestDate.toDateString(),
        time: nearestTime,
      });
    }
  }, [orderData]);

  // Инициализируем получателей из сохраненных
  useEffect(() => {
    if (savedRecipients && savedRecipients.length > 0) {
      const formattedRecipients = savedRecipients.map((r: any) => ({
        id: r.id,
        fullname: r.fullname || "",
        phoneNumber: r.phoneNumber ? formatPhoneInput(r.phoneNumber) : "",
        email: r.email ? sanitizeEmailInput(r.email) : "",
        deliveryAddressId: r.deliveryAddressId,
        isExisting: true,
      }));
      setRecipients(formattedRecipients);
    }
  }, [savedRecipients]);

  const loadRecipients = async (addressId: string) => {
    try {
      await dispatch(getRecipients(addressId)).unwrap();
    } catch (error) {
      console.error("Error loading recipients:", error);
    }
  };

  const handleSelectCompany = (company: any) => {
    dispatch(setCompany(company));
    setSelectedAddress(null);
  };

  const { savedAddress, saveAddress } = useSavedAddress(currentCompany?.id);

  const companyDeliveryAddresses = useMemo(
    () => getCompanyDeliveryAddresses(currentCompany),
    [currentCompany],
  );

  const resolveDefaultCompanyAddress = useCallback(() => {
    if (companyDeliveryAddresses.length === 0) return null;
    if (
      savedAddress?.id &&
      companyDeliveryAddresses.some((a: any) => a.id === savedAddress.id)
    ) {
      return savedAddress;
    }
    return companyDeliveryAddresses[0];
  }, [companyDeliveryAddresses, savedAddress]);

  const displayAddress = selectedAddress ?? resolveDefaultCompanyAddress();

  useEffect(() => {
    if (currentCompany?.id && savedAddress && selectedMethod === DeliveryMethod.Delivery) {
      setSelectedAddress(savedAddress);
    }
  }, [currentCompany?.id, savedAddress, selectedMethod]);

  const handleAddressAdded = useCallback(
    async (newAddress: any) => {
      if (currentCompany && newAddress) {
        const updated = mergeAddressIntoCompany(currentCompany, newAddress);
        dispatch(setCompany(updated));
        setSelectedAddress(newAddress);
        await saveAddress(newAddress);
        if (newAddress.id) {
          await loadRecipients(newAddress.id);
        }
      }
      setShowAddAddressModal(false);
      setShowNeedAddressSheet(false);
    },
    [currentCompany, dispatch, saveAddress],
  );
  const handleSelectAddress = async (address: any) => {
    setSelectedAddress(address);
    if (currentCompany?.id) {
      await saveAddress(address);
    }
  };

  const handleAddCompany = () => {
    setShowAddressModal(false);
    setTimeout(() => {
      // открыть модалку регистрации компании
    }, 300);
  };

  const handleMethodChange = (method: DeliveryMethod) => {
    setSelectedMethod(method);

    const tabIndex = method === DeliveryMethod.Delivery ? 0 : 1;
    Animated.spring(indicatorPosition, {
      toValue: tabIndex * tabContainerWidth,
      useNativeDriver: true,
      damping: 15,
      mass: 1,
      stiffness: 120,
    }).start();
  };

  const addRecipient = () => {
    if (recipients.length - 1 >= MAX_ADDITIONAL_RECIPIENTS) {
      return;
    }

    const newRecipient: Recipient = {
      id: Date.now().toString(),
      fullname: "",
      phoneNumber: "",
      email: "",
    };
    setRecipients([...recipients, newRecipient]);
  };

  const removeRecipient = async (id: string) => {
    const recipient = recipients.find((r) => r.id === id);

    // Если получатель существовал на бекенде, удаляем его
    if (recipient?.isExisting && recipient.id) {
      try {
        await dispatch(deleteRecipient(recipient.id)).unwrap();
      } catch (error) {
        console.error("Error deleting recipient:", error);
      }
    }

    if (recipients.length > 1) {
      setRecipients(recipients?.filter((r) => r.id !== id));
    }
  };

  const updateRecipient = (
    id: string,
    field: keyof Recipient,
    value: string,
  ) => {
    const nextValue =
      field === "phoneNumber"
        ? formatPhoneInput(value)
        : field === "email"
          ? sanitizeEmailInput(value)
          : value;

    setRecipients(
      recipients.map((r) => (r.id === id ? { ...r, [field]: nextValue } : r)),
    );
  };

  const handleDateTimeConfirm = (dateTime: DateTimeSelection) => {
    setSelectedDateTime(dateTime);
  };

  const formatDateDisplay = (dateString: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    const months = [
      "января",
      "февраля",
      "марта",
      "апреля",
      "мая",
      "июня",
      "июля",
      "августа",
      "сентября",
      "октября",
      "ноября",
      "декабря",
    ];
    const days = [
      "воскресенье",
      "понедельник",
      "вторник",
      "среда",
      "четверг",
      "пятница",
      "суббота",
    ];

    return `${date.getDate()} ${months[date.getMonth()]}, ${days[date.getDay()]}`;
  };

  const formatDateTimeDisplay = () => {
    if (selectedDateTime.date && selectedDateTime.time) {
      return `${formatDateDisplay(selectedDateTime.date)} ${selectedDateTime.time}`;
    }

    if (orderData?.nearestDeliveryDate) {
      const nearestDate = new Date(orderData.nearestDeliveryDate);
      const timeSlots = getTimeSlotsForDate(
        nearestDate,
        orderData?.deliverySchedule,
      );
      const nearestTime =
        timeSlots.length > 0 ? formatTimeForDisplay(timeSlots[0]) : "";
      return `${formatDateDisplay(nearestDate.toDateString())} ${nearestTime}`;
    }

    return "Выберите дату и время";
  };

  // Валидация получателей
  const validateRecipients = (): boolean => {
    const mainRecipient = recipients[0];
    if (!mainRecipient?.fullname?.trim()) {
      Alert.alert("Ошибка", "Заполните ФИО основного получателя");
      return false;
    }
    if (!isPhoneInputComplete(mainRecipient.phoneNumber || "")) {
      Alert.alert("Ошибка", "Введите корректный номер телефона основного получателя");
      return false;
    }
    if (!isValidEmail(mainRecipient.email || "")) {
      Alert.alert("Ошибка", "Введите корректный email основного получателя");
      return false;
    }

    for (let i = 1; i < recipients.length; i++) {
      const recipient = recipients[i];
      const hasAnyField =
        recipient.fullname.trim() ||
        recipient.phoneNumber.trim() ||
        recipient.email.trim();

      if (hasAnyField && !isRecipientContactComplete(recipient)) {
        Alert.alert(
          "Ошибка",
          `Заполните корректно все поля дополнительного получателя ${i}`,
        );
        return false;
      }
    }

    return true;
  };
  const getFilledRecipientsForOrder = () =>
    recipients
      .filter((r) => isRecipientContactComplete(r))
      .map((r) => ({
        fullname: r.fullname.trim(),
        phoneNumber: formatPhoneForApi(r.phoneNumber),
        email: r.email.trim(),
      }));

  // Подготовка данных для создания заказа
  const prepareOrderData = () => {
    // Форматируем дату в ISO строку
    const date = new Date(selectedDateTime.date);
    const [hours, minutes] = selectedDateTime.time
      .split(" – ")[0]
      .split(":")
      .map(Number);
    date.setHours(hours, minutes, 0, 0);

    const deliveryDate = date.toISOString();

    // Подготавливаем продукты
    const products = selectedCartItems.map((item) => ({
      productId: item.productId,
      purchaseOptionId: item.productPurchaseOptionId,
      quantity: item.quantity,
    }));

    // Подготавливаем userInfo
    // if(currentCompany.type === 'individual'){

    // const userInfo: any = {
    //   companyId: currentCompany?.id,
    //   deliveryAddressId: selectedAddress?.id,
    // };
    // }else{
    //   const userInfo: any = {
    //   individualProfileId: currentCompany?.id,
    //   deliveryAddressId: selectedAddress?.id,
    // };
    // }
    const userInfo: Record<string, string> = {};

    if (selectedMethod === DeliveryMethod.Delivery) {
      const deliveryAddressId =
        selectedAddress?.id ??
        getFirstCompanyDeliveryAddress(currentCompany)?.id ??
        "";

      if (deliveryAddressId) {
        userInfo.deliveryAddressId = deliveryAddressId;
      }
    }

    if (selectedMethod === DeliveryMethod.Pickup) {
      userInfo.storageId = selectedPickupAddress;
    }

    if (currentCompany?.type === "individual") {
      userInfo.individualProfileId = currentCompany.id;
    } else if (currentCompany?.id) {
      userInfo.companyId = currentCompany.id;
    }

    if (me?.companies?.length === 0 && me?.individualProfile?.id) {
      userInfo.individualProfileId = me.individualProfile.id;
      delete userInfo.companyId;
    }

    const orderPayload: Record<string, unknown> = {
      deliveryMethod: DELIVERY_METHOD_API_VALUE[selectedMethod],
      deliveryDate,
      paymentType: PAYMENT_TYPE_API_VALUE[selectedPaymentType],
      notificationEnabled: notificationsEnabled,
      userInfo,
      products,
    };

    if (selectedMethod === DeliveryMethod.Pickup) {
      orderPayload.recipients = getFilledRecipientsForOrder();
    }

    return orderPayload;
  };

  // Создание получателей (только для доставки — привязка к адресу)
  const createRecipientsForOrder = async () => {
    if (!selectedAddress?.id) return false;
    // Фильтруем только заполненных получателей, которых еще нет на бекенде
    const recipientsToCreate = recipients
      ?.filter((r) => isRecipientContactComplete(r))
      ?.filter((r) => !r.isExisting); // Не создаем тех, кто уже есть

    if (recipientsToCreate.length === 0) return true;

    // Показываем индикатор загрузки
    // setIsCreatingRecipients(true);

    try {
      // Отправляем запрос для каждого получателя отдельно
      for (const recipient of recipientsToCreate) {
        const recipientData = {
          fullname: recipient.fullname.trim(),
          phoneNumber: formatPhoneForApi(recipient.phoneNumber),
          email: recipient.email.trim(),
        };

        await dispatch(
          createRecipient({
            deliveryAddressId: selectedAddress.id,
            recipientData,
          }),
        ).unwrap();

        // Небольшая задержка между запросами, чтобы не перегружать сервер
        await new Promise((resolve) => setTimeout(resolve, 100));
      }

      // После создания всех получателей, перезагружаем список
      await dispatch(getRecipients(selectedAddress.id)).unwrap();

      return true;
    } catch (error) {
      console.error("Error creating recipients:", error);
      Alert.alert("Ошибка", "Не удалось создать получателей");
      return false;
    } finally {
      // setIsCreatingRecipients(false);
    }
  };

  // Оформление заказа
  const handleCreateOrder = async () => {
    if (
      selectedMethod === DeliveryMethod.Delivery &&
      !selectedAddress?.id
    ) {
      Alert.alert("Ошибка", "Выберите адрес доставки");
      return;
    }

    if (
      selectedMethod === DeliveryMethod.Pickup &&
      !selectedPickupAddress
    ) {
      Alert.alert("Ошибка", "Выберите склад самовывоза");
      return;
    }

    if (!selectedDateTime.date || !selectedDateTime.time) {
      Alert.alert("Ошибка", "Выберите дату и время доставки");
      return;
    }

    if (!validateRecipients()) {
      return;
    }

    if (selectedMethod === DeliveryMethod.Delivery) {
      const recipientsCreated = await createRecipientsForOrder();
      if (!recipientsCreated) return;
    }

    try {
      const orderData = prepareOrderData();
      const result = await dispatch(createOrder(orderData)).unwrap();

      if (result?.data) {
        setCreatedOrderId(result.data);
        dispatch(getMyOrders()).unwrap();
      }
      setShowSuccessContent(true);
    } catch (error) {
      console.error("Error creating order:", error);
      Alert.alert(
        "Ошибка",
        getAxiosErrorMessage(error, "Не удалось оформить заказ"),
      );
    }
  };
  const closeSuccessAndRefreshCart = async () => {
    setShowSuccessContent(false);
    try {
      await dispatch(getCart()).unwrap();
    } catch (error) {
      console.error("Error refreshing cart after order:", error);
    } finally {
      onClose();
    }
  };

  const handleRecommendedAddToCartPress = useCallback(
    async (product: any) => {
      if (!(await requireAuth())) {
        return;
      }

      const cartItemsForProduct =
        cartItems?.filter((item: any) => item.productId === product.id) || [];
      setSelectedProductForCart(product);
      setExistingCartItem(cartItemsForProduct);
      setShowAddToCartModal(true);
    },
    [cartItems, requireAuth],
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

  const isItemAvailable = (item: any): boolean => {
    return item.stockInfo !== "Нет в наличии";
  };
  const selectedCartItems = cartItems?.filter((item) => selectedItems.has(item.id));
  const totalWeight = selectedCartItems.reduce(
    (sum, item) => sum + item.quantity,
    0,
  );

  // Проверяем, есть ли недоступные товары среди выбранных
  const orderBlockers = useMemo(() => {
    const mainRecipient = recipients[0];
    return getCheckoutOrderBlockers({
      selectedCartItems,
      deliveryMethod:
        selectedMethod === DeliveryMethod.Pickup ? "pickup" : "delivery",
      hasAddress: Boolean(selectedAddress?.id),
      hasPickupStorage: Boolean(selectedPickupAddress),
      hasDateTime: Boolean(selectedDateTime.date && selectedDateTime.time),
      hasMainRecipient: isRecipientContactComplete(mainRecipient || {}),
    });
  }, [
    selectedCartItems,
    selectedMethod,
    selectedAddress?.id,
    selectedPickupAddress,
    selectedDateTime.date,
    selectedDateTime.time,
    recipients,
  ]);

  const isCheckoutBlocked = orderBlockers.length > 0;
  useEffect(() => {
    if (me?.storageId) {
      setSelectedPickupAddress(me.storageId);
    }
  }, [me?.storageId]);
  const openAddressPicker = () => {
    if (companyDeliveryAddresses.length === 0) {
      if (currentCompany?.id) {
        setShowAddAddressModal(true);
      }
      return;
    }
    setShowAddressModal(true);
  };

  const renderCompanyAddressBlock = () => (
    <View>
      <ThemedText
        darkColor="#FBFCFF"
        lightColor="#1B1B1C"
        style={styles.blockTitle}
      >
        Компания и адрес
      </ThemedText>
      <ThemedView
        darkColor="#202022"
        lightColor="#F2F4F7"
        style={styles.compAndAdressCont}
      >
        <TouchableOpacity
          style={styles.compAndAdressContRow}
          onPress={openAddressPicker}
        >
          <View style={styles.compAndAdressContRowDoble}>
            <ThemedView
              lightColor="#FFFFFF"
              darkColor="#151516"
              style={styles.iconCont}
            >
              <IconCompanyNew color={isDarkMode ? "#FBFCFF" : "#1B1B1C"} />
            </ThemedView>
            <View style={styles.compAndAdressColumn}>
              <ThemedText
                darkColor="#FBFCFF"
                lightColor="#1B1B1C"
                style={styles.compText}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {me?.companies?.length === 0
                  ? `${me?.individualProfile?.firstName || ""} ${me?.individualProfile?.lastName || ""} ${me?.individualProfile?.patronymic || ""}`.trim()
                  : currentCompany?.name || "-"}
              </ThemedText>
              <ThemedText
                lightColor="#80818B"
                darkColor="#FBFCFF80"
                style={styles.addressTextText}
                numberOfLines={2}
                ellipsizeMode="tail"
              >
                {formatAddressSummary(displayAddress)}
              </ThemedText>
            </View>
          </View>
          <ArrowIconRight />
        </TouchableOpacity>

        <PrimaryButton
          title={
            companyDeliveryAddresses.length === 0
              ? "Добавить адрес"
              : "Изменить адрес"
          }
          onPress={openAddressPicker}
          variant="black"
          size="md"
          fullWidth
        />
      </ThemedView>
    </View>
  );

  // Рендер содержимого для самовывоза с городами из Redux
  const renderPickupContent = () => {
    if (!towns || towns.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <ThemedText style={styles.emptyText}>
            Нет доступных городов для самовывоза
          </ThemedText>
        </View>
      );
    }

    return (
      <View style={styles.pickupContent}>
        {towns.map((town) => (
          <TouchableOpacity
            key={town.id}
            style={[
              styles.addressItem,
              isDarkMode && styles.listRowBorderDark,
            ]}
            onPress={() => handlePickTown(town.id)}
          >
            <View
              style={[
                styles.radioOuter,
                selectedPickupAddress === town.id && styles.radioOuterSelected,
              ]}
            >
              {selectedPickupAddress === town.id && (
                <View style={styles.radioInner} />
              )}
            </View>
            <View style={styles.addressInfo}>
              <ThemedText style={styles.addressText}>{town.value}</ThemedText>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  // Рендер табов доставки на основе данных с бекенда
  const renderDeliveryTabs = () => {
    const availableMethods = [
      { method: DeliveryMethod.Delivery, label: "Доставка" },
      { method: DeliveryMethod.Pickup, label: "Самовывоз" },
    ]?.filter((item) => isMethodAvailable(item.method));

    if (availableMethods.length === 0) {
      return null;
    }

    return (
      <ThemedView
        style={styles.tabsContainer}
        lightColor="#F2F4F7"
        darkColor="#202022"
        onLayout={(e) =>
          setTabContainerWidth(
            e.nativeEvent.layout.width / availableMethods.length,
          )
        }
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

        {availableMethods.map((item) => (
          <TouchableOpacity
            key={item.method}
            style={styles.tabButton}
            onPress={() => handleMethodChange(item.method)}
            activeOpacity={0.7}
          >
            <ThemedText
              style={styles.tabText}
              lightColor={
                selectedMethod === item.method ? "#1B1B1C" : "#80818B"
              }
              darkColor={selectedMethod === item.method ? "#FBFCFF" : "#80818B"}
            >
              {item.label}
            </ThemedText>
          </TouchableOpacity>
        ))}
      </ThemedView>
    );
  };

  const router = useRouter();
  return (
    <>
      <AppModal
        visible={visible}
        animationType="slide"
        transparent={true}
        statusBarTranslucent={true}
        onRequestClose={() => {
          if (showSuccessContent) {
            void closeSuccessAndRefreshCart();
          } else {
            onClose();
          }
        }}
      >
        <ThemedView
          style={styles.container}
          lightColor="#EBEDF0"
          darkColor="#040508"
        >
          <ModalHeader
            title="Оформление"
            showBackButton={false}
            showCloseButton={true}
            onBackPress={() => {
              if (showSuccessContent) {
                void closeSuccessAndRefreshCart();
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
                <ThemedText style={styles.successTitle}>
                  Спасибо за заказ!
                </ThemedText>
                <ThemedText style={styles.successText}>
                  В ближайшее время с вами свяжется{"\n"}Ваш менеджер для
                  уточнения деталей.
                </ThemedText>

                <View style={styles.successButtons}>
                  <View style={styles.successButtonDetails}>
                    <PrimaryButton
                      title="Детали заказа"
                      onPress={() => {
                        if (createdOrderId) {
                          setShowOrderDetailsModal(true);
                        }
                      }}
                      variant="third"
                      size="md"
                      fullWidth
                      style={styles.successActionButton}
                    />
                  </View>
                  <View style={styles.successButtonHome}>
                    <PrimaryButton
                      title="В каталог"
                      onPress={async () => {
                        await closeSuccessAndRefreshCart();
                        router.navigate("/dashboard");
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
                onProductPress={() => {
                  void closeSuccessAndRefreshCart();
                }}
                returnTo="catalog"
              />
            </ScrollView>
          ) : isCheckoutDataLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#203686" />
              <ThemedText style={styles.loadingText}>Загрузка...</ThemedText>
            </View>
          ) : (
            <>
              {isLoadingRecipients ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color="#203686" />
                  <ThemedText style={styles.loadingText}>
                    Загрузка получателей...
                  </ThemedText>
                </View>
              ) : (
                <ScrollView
                  style={styles.scrollView}
                  contentContainerStyle={[
                    styles.scrollContent,
                    { paddingBottom: Math.max(insets.bottom, 24) + 24 },
                  ]}
                  showsVerticalScrollIndicator={false}
                >
                  {/* Блок с табами доставки */}
                  <ThemedView
                    style={styles.block}
                    darkColor="#151516"
                    lightColor="#FFFFFF"
                  >
                    <ThemedText
                      darkColor="#FBFCFF"
                      lightColor="#1B1B1C"
                      style={styles.blockTitle}
                    >
                      Способ получения
                    </ThemedText>

                    {renderDeliveryTabs()}

                    {/* Контент для самовывоза с городами из Redux */}
                    {selectedMethod === DeliveryMethod.Pickup &&
                      renderPickupContent()}

                    {selectedMethod === DeliveryMethod.Delivery &&
                      renderCompanyAddressBlock()}
                  </ThemedView>

                  {/* Блок даты и времени */}
                  <ThemedView
                    style={styles.block}
                    darkColor="#151516"
                    lightColor="#FFFFFF"
                  >
                    <ThemedText
                      darkColor="#FBFCFF"
                      lightColor="#1B1B1C"
                      style={styles.blockTitle}
                    >
                      Дата и время получения
                    </ThemedText>

                    <TouchableOpacity
                      style={[
                        styles.dateTimeDisplay,
                        isDarkMode && {
                          backgroundColor: "#ECEFFA0D",
                        },
                      ]}
                      onPress={() => setShowCalendarModal(true)}
                    >
                      <View style={styles.dateTimeRow}>
                        <ThemedText
                          darkColor="#FBFCFF"
                          lightColor="#1B1B1C"
                          style={styles.dateTimeLabel}
                        ></ThemedText>
                        <ThemedText
                          style={styles.dateTimeValue}
                          numberOfLines={1}
                          darkColor="#FBFCFF"
                          lightColor="#1B1B1C"
                        >
                          {formatDateTimeDisplay()}
                        </ThemedText>
                      </View>
                      <ArrowIconRight style={styles.chevronRight} />
                    </TouchableOpacity>
                  </ThemedView>

                  {/* Блок контактов получателя */}
                  <ThemedView style={styles.block} lightColor="#FFFFFF">
                    <ThemedText style={styles.blockTitle}>
                      Контакты получателя
                    </ThemedText>
                    <ThemedText lightColor="#80818B" style={styles.mainPicker}>
                      Основной получатель *
                    </ThemedText>
                    {recipients.map((recipient, index) => (
                      <View key={recipient.id} style={styles.recipientBlock}>
                        {index > 0 && (
                          <View style={styles.recipientHeader}>
                            <ThemedText
                              lightColor="#80818B"
                              style={styles.recipientTitle}
                            >
                              Дополнительный получатель
                            </ThemedText>
                            <TouchableOpacity
                              onPress={() => removeRecipient(recipient.id)}
                            >
                              <TrashIcon fill="#F10B34" stroke="#F10B34" />
                            </TouchableOpacity>
                          </View>
                        )}

                        <AnimatedTextInput
                          placeholder="ФИО *"
                          value={recipient.fullname}
                          onChangeText={(text) =>
                            updateRecipient(recipient.id, "fullname", text)
                          }
                        />
                        <View style={styles.inputSpacer} />
                        <AnimatedTextInput
                          placeholder="Телефон *"
                          keyboardType="phone-pad"
                          maxLength={18}
                          value={recipient.phoneNumber}
                          onChangeText={(text) =>
                            updateRecipient(recipient.id, "phoneNumber", text)
                          }
                        />
                        <View style={styles.inputSpacer} />
                        <AnimatedTextInput
                          placeholder="Email *"
                          keyboardType="email-address"
                          autoCapitalize="none"
                          autoCorrect={false}
                          maxLength={254}
                          value={recipient.email}
                          onChangeText={(text) =>
                            updateRecipient(recipient.id, "email", text)
                          }
                        />
                      </View>
                    ))}

                    {recipients.length - 1 < MAX_ADDITIONAL_RECIPIENTS ? (
                      <PrimaryButton
                        title="+ Добавить получателя"
                        onPress={addRecipient}
                        variant="third"
                        size="md"
                        fullWidth
                        style={styles.addButton}
                      />
                    ) : null}
                  </ThemedView>

                  {/* Блок товаров */}
                  <ThemedView style={styles.block} lightColor="#FFFFFF">
                    <ThemedText style={styles.blockTitle}>
                      Информация о заказе
                    </ThemedText>

                    <View style={styles.totalWeight}>
                      <ThemedText style={styles.totalWeightName}>
                        Товаров в корзине
                      </ThemedText>
                      <ThemedText style={styles.totalWeightValue}>
                        {selectedCartItems.length}
                      </ThemedText>
                    </View>
                    <View style={styles.totalWeight}>
                      <ThemedText style={styles.totalWeightName}>
                        Общий вес
                      </ThemedText>
                      <ThemedText style={styles.totalWeightValue}>
                        {totalWeight.toFixed(2)} кг
                      </ThemedText>
                    </View>
                    <View style={styles.totalWeight}>
                      <ThemedText style={styles.totalWeightName}>
                        Сумма заказа
                      </ThemedText>
                      <ThemedText style={styles.totalWeightValue}>
                        {totals.totalPrice.toLocaleString("ru-RU")} ₽
                      </ThemedText>
                    </View>
                  </ThemedView>

                  {/* Блок способа оплаты */}
                  <ThemedView style={styles.block} lightColor="#FFFFFF">
                    <ThemedText style={styles.blockTitle}>
                      Способ оплаты
                    </ThemedText>

                    {getAvailablePaymentTypes(selectedMethod).map((type) => (
                      <TouchableOpacity
                        key={type}
                        style={[
                          styles.paymentMethod,
                          isDarkMode && styles.listRowBorderDark,
                        ]}
                        onPress={() => setSelectedPaymentType(type)}
                      >
                        <View
                          style={[
                            styles.radioOuter,
                            selectedPaymentType === type &&
                              styles.radioOuterSelected,
                          ]}
                        >
                          {selectedPaymentType === type && (
                            <View style={styles.radioInner} />
                          )}
                        </View>
                        <ThemedText style={styles.paymentMethodText}>
                          {getPaymentTypeDisplayName(type)}
                        </ThemedText>
                      </TouchableOpacity>
                    ))}
                  </ThemedView>

                  {/* Блок дополнительной информации */}
                  <ThemedView
                    style={[styles.block, styles.lastBlock]}
                    lightColor="#FFFFFF"
                  >
                    <ThemedText style={styles.blockTitle}>
                      Дополнительная информация
                    </ThemedText>
                    <TouchableOpacity
                      style={styles.notificationRow}
                      onPress={() =>
                        setNotificationsEnabled(!notificationsEnabled)
                      }
                    >
                      <CustomCheckbox
                        value={notificationsEnabled}
                        onValueChange={setNotificationsEnabled}
                        lightColor="#F2F4F7"
                      />
                      <ThemedText style={styles.notificationText}>
                        Получать уведомления об оформлении и статусе доставки
                        заказа
                      </ThemedText>
                    </TouchableOpacity>
                    <ThemedText style={styles.underNotificationText}>
                      После подтверждения заказа с вами свяжется наш менеджер
                      для уточнения деталей.
                    </ThemedText>
                    <PrimaryButton
                      title="Оформить заказ"
                      onPress={handleCreateOrder}
                      variant="primary"
                      size="md"
                      loading={isCreatingOrder}
                      disabled={isCreatingOrder || isCheckoutBlocked}
                      activeOpacity={0.8}
                      fullWidth
                    />
                    {!isCreatingOrder && isCheckoutBlocked ? (
                      <CheckoutBlockerHint messages={orderBlockers} />
                    ) : null}
                  </ThemedView>
                </ScrollView>
              )}
            </>
          )}
          {/* Модалка выбора даты и времени */}
          <DateTimeModal
            visible={showCalendarModal}
            onClose={() => setShowCalendarModal(false)}
            onConfirm={handleDateTimeConfirm}
            initialDateTime={selectedDateTime}
            deliverySchedule={checkoutDeliverySchedule}
          />
        </ThemedView>

        <AddressSelectionModal
          visible={showAddressModal}
          onClose={() => setShowAddressModal(false)}
          currentCompany={currentCompany}
          companies={me?.companies || []}
          selectedCompanyId={currentCompany?.id}
          onSelectCompany={handleSelectCompany}
          onAddCompany={handleAddCompany}
          onSelectAddress={handleSelectAddress}
          selectedAddressId={selectedAddress?.id}
          onAddressAdded={async (address) => {
            if (address && currentCompany) {
              const updated = mergeAddressIntoCompany(currentCompany, address);
              dispatch(setCompany(updated));
              setSelectedAddress(address);
              await saveAddress(address);
            }
          }}
        />

        {currentCompany?.id ? (
          <AddAddressModal
            visible={showAddAddressModal}
            onClose={() => setShowAddAddressModal(false)}
            onSuccess={handleAddressAdded}
            companyId={currentCompany.id}
          />
        ) : null}

        {showNeedAddressSheet ? (
          <AnimatedStackedSheet
            visible={showNeedAddressSheet}
            showBackdrop
            onClose={() => setShowNeedAddressSheet(false)}
          >
            <ThemedText
              style={styles.needAddressTitle}
              lightColor="#1B1B1C"
              darkColor="#FBFCFF"
            >
              Нужен адрес доставки
            </ThemedText>
            <ThemedText
              style={styles.needAddressText}
              lightColor="#80818B"
              darkColor="#FBFCFF80"
            >
              Для оформления заказа добавьте адрес компании.
            </ThemedText>
          </AnimatedStackedSheet>
        ) : null}

        <CompanySelectionModal
          visible={showCompanyModal}
          onClose={() => setShowCompanyModal(false)}
          companies={me?.companies || []}
          selectedCompanyId={currentCompany?.id}
          onSelectCompany={handleSelectCompany}
          onAddCompany={handleAddCompany}
        />
        <OrderDetailsModal
          visible={showOrderDetailsModal}
          onClose={() => {
            setShowOrderDetailsModal(false);
          }}
          orderId={createdOrderId}
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
          onAuthRequired={openLogin}
        />
        {authGateModal}

      <AppModal
        visible={showChangePickupModal}
        animationType="none"
        transparent={true}
        onRequestClose={cancelChangePickup}
        statusBarTranslucent={true}

      >
        <TouchableWithoutFeedback onPress={cancelChangePickup}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <ThemedView 
                style={[
                  styles.confirmModalContent,
                  { paddingBottom: Math.max(insets.bottom, 24) + 24 },
                ]}
                lightColor="#FFFFFF"
                darkColor="#202022"
              >
                <View style={styles.confirmModalHeader}>
                  <ThemedText style={styles.confirmModalTitle}>
                    Вы меняете склад самовывоза
                  </ThemedText>
                </View>

                <View style={styles.confirmModalBody}>
                  <ThemedText  style={styles.confirmModalText}>
                    Наличие товаров на складах разное. Состав корзины может измениться.
                  </ThemedText>
                </View>

                <View style={styles.confirmModalButtons}>
                  <PrimaryButton
                    title="Сменить склад"
                    onPress={confirmChangePickup}
                    variant="primary"
                    size="md"
                    style={styles.confirmButton}
                  />
                  <PrimaryButton
                    title="Отменить"
                    onPress={cancelChangePickup}
                    variant="third"
                    size="md"
                    style={styles.cancelButton}
                  />
                </View>
              </ThemedView>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </AppModal>
      </AppModal>

      {/* Модалка успешного заказа */}
      {/* <SuccessModal
        visible={showSuccessModal}
        onClose={() => {
          setShowSuccessModal(false);
          onClose();
        }}
      /> */}
    </>
  );
}

// Вспомогательные функции для работы с датами и временем
const formatTimeForDisplay = (timeSlot: any) => {
  if (!timeSlot) return "";
  const start = timeSlot.startTime.slice(0, 5);
  const end = timeSlot.endTime.slice(0, 5);
  return `${start} – ${end}`;
};

const DATE_PICKER_SCREEN_HEIGHT = Dimensions.get("window").height;

// Модалка выбора даты и времени (inline внутри RNModal оформления — без вложенного Modal на iOS)
function DateTimeModal({
  visible,
  onClose,
  onConfirm,
  initialDateTime,
  deliverySchedule,
}: any) {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === "dark";
  const [selectedDate, setSelectedDate] = useState<string>(
    initialDateTime.date || "",
  );
  const [selectedTime, setSelectedTime] = useState<string>(
    initialDateTime.time || "",
  );
  const [availableTimeSlots, setAvailableTimeSlots] = useState<any[]>([]);
  const [months, setMonths] = useState<Date[]>([]);
  const [showTimeModal, setShowTimeModal] = useState(false);
  const closeTimePickerRef = useRef<(() => void) | null>(null);
  const [modalTranslateY] = useState(
    () => new Animated.Value(DATE_PICKER_SCREEN_HEIGHT),
  );
  const [isClosing, setIsClosing] = useState(false);

  const daysOfWeek = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];

  const closeTimePicker = useCallback(() => {
    setShowTimeModal(false);
  }, []);

  const openTimePicker = useCallback(() => {
    if (!selectedDate || availableTimeSlots.length === 0) return;
    setShowTimeModal(true);
  }, [selectedDate, availableTimeSlots.length]);

  // Автоматически выбираем ближайшую дату и время при загрузке
  useEffect(() => {
    if (
      visible &&
      deliverySchedule?.nearestDeliveryDate &&
      !initialDateTime.date
    ) {
      const nearestDate = new Date(deliverySchedule.nearestDeliveryDate);
      const dateString = nearestDate.toDateString();
      setSelectedDate(dateString);

      const timeSlots = getTimeSlotsForDate(nearestDate, deliverySchedule);
      if (timeSlots.length > 0) {
        const nearestTime = formatTimeForDisplay(timeSlots[0]);
        setSelectedTime(nearestTime);
      }

      loadTimeSlotsForDate(dateString);
    } else if (visible && initialDateTime.date) {
      // Если есть сохраненная дата, используем её
      setSelectedDate(initialDateTime.date);
      setSelectedTime(initialDateTime.time);
      loadTimeSlotsForDate(initialDateTime.date);
    }
  }, [visible, deliverySchedule]);

  useEffect(() => {
    if (!visible) {
      setShowTimeModal(false);
      modalTranslateY.setValue(DATE_PICKER_SCREEN_HEIGHT);
    }
  }, [visible, modalTranslateY]);

  useEffect(() => {
    if (!visible) return;

    modalTranslateY.setValue(DATE_PICKER_SCREEN_HEIGHT);
    Animated.spring(modalTranslateY, {
      toValue: 0,
      useNativeDriver: true,
      damping: 20,
      stiffness: 90,
      mass: 0.8,
    }).start();
  }, [visible, modalTranslateY]);

  const closeDatePickerAnimated = useCallback(() => {
    if (isClosing) return;

    setIsClosing(true);
    Animated.timing(modalTranslateY, {
      toValue: DATE_PICKER_SCREEN_HEIGHT,
      duration: 250,
      useNativeDriver: true,
    }).start(() => {
      setIsClosing(false);
      onClose();
    });
  }, [isClosing, modalTranslateY, onClose]);

  useEffect(() => {
    const today = new Date();
    const monthsArray = [];
    for (let i = 0; i < 3; i++) {
      const date = new Date(today.getFullYear(), today.getMonth() + i, 1);
      monthsArray.push(date);
    }
    setMonths(monthsArray);
  }, []);

  useEffect(() => {
    if (selectedDate && deliverySchedule) {
      loadTimeSlotsForDate(selectedDate);
    }
  }, [selectedDate, deliverySchedule]);

  const handleSheetClose = () => {
    if (showTimeModal && closeTimePickerRef.current) {
      closeTimePickerRef.current();
      return;
    }
    closeDatePickerAnimated();
  };

  const loadTimeSlotsForDate = (dateString: string) => {
    if (!deliverySchedule?.weekSchedule) return;
    const date = new Date(dateString);
    const slots = getTimeSlotsForDate(date, deliverySchedule);
    setAvailableTimeSlots(slots);
  };

  const generateDaysForMonth = (month: Date) => {
    const year = month.getFullYear();
    const month_index = month.getMonth();
    const firstDay = new Date(year, month_index, 1);
    const lastDay = new Date(year, month_index + 1, 0);

    const days = [];
    const startOffset = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1;

    for (let i = 0; i < startOffset; i++) {
      days.push(null);
    }

    for (let d = 1; d <= lastDay.getDate(); d++) {
      days.push(new Date(year, month_index, d));
    }

    return days;
  };

  const isDateAvailable = (date: Date): boolean =>
    isWorkingDeliveryDay(date, deliverySchedule);

  const isDateDisabled = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (date < today || !isDateAvailable(date)) {
      return true;
    }

    if (deliverySchedule?.nearestDeliveryDate) {
      const nearestDate = new Date(deliverySchedule.nearestDeliveryDate);
      nearestDate.setHours(0, 0, 0, 0);
      if (date < nearestDate) {
        return true;
      }
    }

    return false;
  };

  const formatDateForDisplay = (dateString: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    const months = [
      "января",
      "февраля",
      "марта",
      "апреля",
      "мая",
      "июня",
      "июля",
      "августа",
      "сентября",
      "октября",
      "ноября",
      "декабря",
    ];
    const days = ["вс", "пн", "вт", "ср", "чт", "пт", "сб"];

    return `${date.getDate()} ${months[date.getMonth()]}, ${days[date.getDay()]}`;
  };

  const formatMonthYear = (date: Date) => {
    const months = [
      "Январь",
      "Февраль",
      "Март",
      "Апрель",
      "Май",
      "Июнь",
      "Июль",
      "Август",
      "Сентябрь",
      "Октябрь",
      "Ноябрь",
      "Декабрь",
    ];
    return `${months[date.getMonth()]} ${date.getFullYear()}`;
  };

  const handleDateSelect = (date: Date) => {
    if (!isDateDisabled(date)) {
      const dateString = date.toDateString();
      setSelectedDate(dateString);
      setSelectedTime("");
      // setShowTimeModal(true);
    }
  };

  const handleTimeSelect = (timeSlot: any) => {
    const timeString = formatTimeForDisplay(timeSlot);
    setSelectedTime(timeString);
    if (closeTimePickerRef.current) {
      closeTimePickerRef.current();
    } else {
      closeTimePicker();
    }
  };

  const handleConfirm = () => {
    if (selectedDate && selectedTime) {
      onConfirm({ date: selectedDate, time: selectedTime });
      closeDatePickerAnimated();
    }
  };

  const isNearestTime = (slot: any) => {
    if (!selectedDate || !deliverySchedule?.nearestDeliveryDate) return false;

    const nearestDate = new Date(deliverySchedule.nearestDeliveryDate);
    const currentDate = new Date(selectedDate);

    if (currentDate.toDateString() !== nearestDate.toDateString()) return false;

    const slots = getTimeSlotsForDate(currentDate, deliverySchedule);
    if (slots.length > 0) {
      return slots[0].startTime === slot.startTime;
    }

    return false;
  };

  const renderMonth = ({ item: month }: { item: Date }) => {
    const days = generateDaysForMonth(month);

    return (
      <View style={styles.monthContainer}>
        <ThemedText style={styles.monthTitle}>
          {formatMonthYear(month)}
        </ThemedText>

        <View style={styles.weekDays}>
          {daysOfWeek.map((day) => (
            <ThemedText key={day} style={styles.weekDay}>
              {day}
            </ThemedText>
          ))}
        </View>

        <View style={styles.daysGrid}>
          {days.map((date, index) => {
            const isSelected = date && selectedDate === date.toDateString();
            const disabled = !date || isDateDisabled(date);

            return (
              <TouchableOpacity
                key={index}
                style={[
                  styles.dayCell,
                  disabled && styles.dayDisabled,
                  isSelected && !disabled && styles.daySelected,
                  isDarkMode &&
                    isSelected &&
                    !disabled && {
                      backgroundColor: "#4C94FF",
                    },
                ]}
                onPress={() => date && handleDateSelect(date)}
                disabled={disabled}
                delayPressIn={140}
                pressRetentionOffset={{ top: 12, left: 12, right: 12, bottom: 12 }}
              >
                <ThemedText
                  style={[
                    styles.dayText,
                    disabled && styles.dayTextDisabled,
                    isSelected && !disabled && styles.dayTextSelected,
                  ]}
                >
                  {date?.getDate()}
                </ThemedText>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    );
  };

  const bottomPanel = (
    <ThemedView
      lightColor="#FFFFFF"
      style={[
        styles.dateTimeBottomPanel,
        { paddingBottom: (Platform.OS === "ios" ? 34 : 16) + insets.bottom },
        Platform.OS === "android" && {
          paddingBottom: Math.max(insets.bottom, 24) + 25,
        },
      ]}
    >
      <View style={styles.selectedDateTime}>
        <TouchableOpacity
          style={styles.dateTimeBlock}
          onPress={() => {
            if (showTimeModal && closeTimePickerRef.current) {
              closeTimePickerRef.current();
            }
          }}
        >
          <ThemedView
            lightColor="#F2F4F7"
            darkColor="#ECEFFA0D"
            style={styles.dateTimeBlockInner}
          >
            <ThemedText style={styles.dateTimeBlockValue}>
              {selectedDate ? formatDateForDisplay(selectedDate) : "Не выбрана"}
            </ThemedText>
          </ThemedView>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.dateTimeBlock}
          onPress={openTimePicker}
          disabled={!selectedDate || availableTimeSlots.length === 0}
        >
          <ThemedView
            lightColor={
              !selectedDate || availableTimeSlots.length === 0
                ? "#F5F5F5"
                : "#F2F4F7"
            }
            darkColor="#ECEFFA0D"
            style={[
              styles.dateTimeBlockInner,
              (!selectedDate || availableTimeSlots.length === 0) &&
                styles.dateTimeBlockDisabled,
            ]}
          >
            <ThemedText style={styles.dateTimeBlockValue}>
              {selectedTime || "Не выбрано"}
            </ThemedText>
          </ThemedView>
        </TouchableOpacity>
      </View>

      <PrimaryButton
        title="Применить"
        onPress={handleConfirm}
        variant="primary"
        size="md"
        fullWidth
        disabled={!selectedDate || !selectedTime}
      />
    </ThemedView>
  );

  const timePickerOverlay = (
    <AnimatedStackedSheet
      visible={showTimeModal}
      showBackdrop
      onClose={closeTimePicker}
      onBindCloseRequest={(fn) => {
        closeTimePickerRef.current = fn;
      }}
    >
      <ThemedText
        style={styles.timeOverlayTitle}
        lightColor="#1B1B1C"
        darkColor="#FBFCFF"
      >
        Выберите время
      </ThemedText>
      <ScrollView
        style={styles.timeList}
        contentContainerStyle={{ paddingBottom: insets.bottom + 12 }}
        showsVerticalScrollIndicator={false}
        nestedScrollEnabled
        keyboardShouldPersistTaps="handled"
      >
        {availableTimeSlots.map((slot: any, index: number) => {
          const timeString = formatTimeForDisplay(slot);
          const isSelected = selectedTime === timeString;
          const isNearest = !selectedTime && isNearestTime(slot);

          return (
            <TouchableOpacity
              key={index}
              style={[
                styles.timeSlot,
                isDarkMode && { borderBottomColor: "#323235" },
              ]}
              onPress={() => handleTimeSelect(slot)}
            >
              <View
                style={[
                  styles.radioOuter,
                  (isSelected || isNearest) && styles.radioOuterSelected,
                  isDarkMode &&
                    (isSelected || isNearest) && {
                      borderColor: "#4C94FF",
                    },
                ]}
              >
                {(isSelected || isNearest) && (
                  <View style={styles.radioInner} />
                )}
              </View>
              <ThemedText
                style={[
                  styles.timeSlotText,
                  (isSelected || isNearest) && styles.timeSlotTextSelected,
                  isDarkMode &&
                    (isSelected || isNearest) && {
                      color: "#4C94FF",
                    },
                ]}
              >
                {timeString}
              </ThemedText>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </AnimatedStackedSheet>
  );

  if (!visible) {
    return null;
  }

  return (
    <View style={styles.datePickerOverlay} pointerEvents="box-none">
      <TouchableOpacity
        style={StyleSheet.absoluteFill}
        activeOpacity={1}
        onPress={handleSheetClose}
      />
      <Animated.View
        style={[
          styles.datePickerSheet,
          isDarkMode && { backgroundColor: "#202022" },
          { transform: [{ translateY: modalTranslateY }] },
        ]}
      >
        <TouchableOpacity
          style={styles.swipeHandleContainer}
          activeOpacity={0.7}
          onPress={handleSheetClose}
        >
          <View style={styles.swipeHandle} />
        </TouchableOpacity>

        <ThemedText style={styles.chooseDateTime}>
          Выберите дату доставки
        </ThemedText>

        <View style={styles.dateTimeModalInner}>
          <FlatList
            data={months}
            renderItem={renderMonth}
            keyExtractor={(item) => item.toISOString()}
            showsVerticalScrollIndicator={false}
            nestedScrollEnabled
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={[
              styles.monthsList,
              { paddingBottom: 180 + insets.bottom },
            ]}
          />
          {bottomPanel}
        </View>
      </Animated.View>

      {timePickerOverlay}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 8,
  },
  block: {
    borderRadius: 24,
    padding: 16,
    marginBottom: 8,
  },
  lastBlock: {
    marginBottom: 16,
  },
  blockTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 16,
  },
  mainPicker: {
    fontSize: 14,
    fontWeight: "500",
  },
  tabsContainer: {
    borderRadius: 12,
    padding: 3,
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
  tabText: {
    fontSize: 14,
    fontWeight: "500",
    textAlign: "center",
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
  pickupContent: {
    marginTop: 8,
  },
  companyName: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 12,
  },
  addressItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F3F7",
  },
  addressInfo: {
    flex: 1,
    marginLeft: 12,
  },
  addressText: {
    fontSize: 14,
    fontWeight: "500",
  },
  addressHours: {
    fontSize: 12,
    color: "#80818B",
  },
  radioOuter: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#D8DADE",
    justifyContent: "center",
    alignItems: "center",
  },
  radioOuterSelected: {
    borderColor: "#203686",
    borderWidth: 5,
  },
  radioInner: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: "#FFFFFF",
  },
  dateTimeDisplay: {
    position: "relative",
    padding: 12,
    backgroundColor: "#F5F5F5",
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  dateTimeRow: {
    flexDirection: "row",
    flex: 1,
  },
  dateTimeLabel: {
    fontSize: 14,
    color: "#80818B",
    marginRight: 8,
  },
  dateTimeValue: {
    fontSize: 14,
    fontWeight: "500",
    flex: 1,
  },
  chevronRight: {
    width: 20,
    height: 20,
  },
  recipientBlock: {
    marginBottom: 16,
  },
  recipientHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  recipientTitle: {
    fontSize: 14,
    fontWeight: "500",
  },
  inputSpacer: {
    height: 8,
  },
  addButton: {
    marginTop: 8,
  },
  cartItem: {
    flexDirection: "row",
    marginBottom: 12,
  },
  cartItemImage: {
    width: 60,
    height: 60,
    borderRadius: 12,
    overflow: "hidden",
    marginRight: 12,
  },
  image: {
    width: "100%",
    height: "100%",
  },
  cartItemInfo: {
    flex: 1,
  },
  cartItemName: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 4,
  },
  cartItemQuantity: {
    fontSize: 12,
    color: "#80818B",
  },
  cartItemPrice: {
    fontSize: 14,
    fontWeight: "600",
    marginLeft: 8,
  },
  totalWeight: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingBottom: 5,
  },
  totalWeightValue: {
    fontWeight: "500",
    fontSize: 14,
  },
  totalWeightName: {
    fontWeight: "500",
    fontSize: 14,
  },
  listRowBorderDark: {
    borderBottomColor: "#252527",
  },
  paymentMethod: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F3F7",
  },
  paymentMethodText: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 12,
  },
  notificationRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  notificationText: {
    fontSize: 16,
    marginLeft: 12,
    lineHeight: 20,
    flex: 1,
    fontWeight: "500",
  },
  underNotificationText: {
    marginTop: 16,
    fontSize: 16,
    lineHeight: 20,
    flex: 1,
    fontWeight: "500",
    marginBottom: 27,
  },
  infoBlock: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 8,
    marginTop: 16,
    overflow: "hidden",
    position: "relative",
  },
  infoTextContainer: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: "600",
    lineHeight: 20,
  },
  infoText: {
    marginTop: 8,
    fontFamily: "Montserrat-Medium",
    fontWeight: "500",
    fontSize: 14,
    lineHeight: 18.2,
    width: "80%",
  },
  infoImage: {
    opacity: 0.1,
    position: "absolute",
    width: 267,
    height: 110,
    transform: [{ scaleX: -1 }],
    right: -80,
    bottom: 1,
  },
  bottomSpacer: {
    height: 100,
  },
  bottomPanel: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: Platform.OS === "ios" ? 8 : 8,
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
    color: "#80818B",
    marginBottom: 4,
  },
  bottomTotalPrice: {
    fontSize: 16,
    fontWeight: "600",
  },
  bottomCheckoutButton: {
    backgroundColor: "#203686",
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 12,
    minWidth: 180,
    alignItems: "center",
  },
  bottomCheckoutButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "500",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  datePickerOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 40,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0, 0, 0, 0.45)",
  },
  /** Высота sheet «Выберите дату доставки» (~60–70% экрана) */
  datePickerSheet: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    width: "100%",
    minHeight: "60%",
    height: "65%",
    maxHeight: "70%",
  },
  modalContent: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    minHeight: "50%",
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
  chooseDateTime: {
    fontWeight: "600",
    fontSize: 20,
    padding: 16,
  },
  monthsList: {
    padding: 16,
    paddingBottom: 120,
  },
  monthContainer: {
    marginBottom: 24,
  },
  monthTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 12,
  },
  weekDays: {
    flexDirection: "row",
    marginBottom: 8,
  },
  weekDay: {
    flex: 1,
    textAlign: "center",
    fontSize: 12,
    color: "#80818B",
  },
  daysGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  dayCell: {
    width: "14.28%",
    height: "14.28%",
    aspectRatio: 1,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 8,
  },
  daySelected: {
    backgroundColor: "#203686",
  },
  dayDisabled: {
    opacity: 0.3,
  },
  dayText: {
    fontSize: 14,
    fontWeight: "500",
  },
  dayTextDisabled: {
    color: "#80818B",
  },
  dayTextSelected: {
    color: "#FFFFFF",
  },
  dateTimeBottomPanel: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 16,
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
  selectedDateTimeBlock: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
    width: "100%",
  },
  selectedDateTimeInner: {
    flex: 1,
    padding: 12,
    borderRadius: 12,
    marginRight: 8,
  },
  selectedDateTimeText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#1B1B1C",
  },
  selectedDateTime: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 16,
  },
  dateTimeInput: {
    flex: 1,
  },
  dateTimeBlock: {
    flex: 1,
  },
  dateTimeBlockInner: {
    padding: 12,
    borderRadius: 12,
    gap: 4,
  },
  dateTimeBlockDisabled: {
    opacity: 0.5,
  },
  dateTimeBlockLabel: {
    fontSize: 12,
    color: "#80818B",
  },
  dateTimeBlockValue: {
    fontSize: 14,
    fontWeight: "500",
  },
  dateTimeModalInner: {
    flex: 1,
    position: "relative",
    minHeight: 360,
  },
  timeOverlayTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 12,
    textAlign: "left",
  },
  timeModalContent: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "80%",
  },
  selectedDateHeader: {
    marginHorizontal: 16,
    marginBottom: 8,
    padding: 12,
    borderRadius: 12,
    alignItems: "center",
  },
  selectedDateHeaderText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#203686",
  },
  timeList: {
    padding: 16,
  },
  timeSlot: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F3F7",
  },
  timeSlotText: {
    fontSize: 14,
    marginLeft: 12,
  },
  timeSlotTextSelected: {
    color: "#203686",
    fontWeight: "500",
  },
  compAndAdressCont: {
    padding: 8,
    display: "flex",
    flexDirection: "column",
    borderRadius: 16,
  },
  compAndAdressContRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  compAndAdressContRowDoble: {
    flexDirection: "row",
    gap: 12,
    flex: 1,
    flexShrink: 1,
    alignItems: "flex-start",
  },
  iconCont: {
    padding: 8,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "flex-start",
  },
  compAndAdressColumn: {
    flexDirection: "column",
    flex: 1,
    flexShrink: 1,
  },
  compText: {
    fontWeight: "600",
    fontSize: 16,
    overflow: "hidden",
    textOverflow: "ellipsis",
    flexShrink: 1,
  },
  addressTextText: {
    fontWeight: "500",
    fontSize: 14,
  },
  loadingContainer: {
    padding: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 14,
    color: "#80818B",
  },
  emptyContainer: {
    padding: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyText: {
    fontSize: 14,
    color: "#80818B",
    textAlign: "center",
  },
  successScrollView: {
    flex: 1,
  },
  successScrollContent: {
    paddingTop: 8,
  },
  successContainer: {
    padding: 16,
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
    color: "#80818B",
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
  confirmModalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    // width: '90%',
    maxWidth: 400,
    alignSelf: 'center',
  },
  confirmModalHeader: {
    marginBottom: 16,
  },
  confirmModalTitle: {
    fontSize: 20,
    fontWeight: '600',
  },
  confirmModalBody: {
    marginBottom: 24,
  },
  needAddressTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 12,
    textAlign: "left",
  },
  needAddressText: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 8,
    lineHeight: 20,
  },
  confirmModalText: {
    fontSize: 16,
    fontWeight: '500',
    lineHeight: 22,
  },
  confirmModalButtons: {
    flexDirection: 'column',
    gap: 12,
  },
  confirmButton: {
    width: '100%',
  },
  cancelButton: {
    width: '100%',
  },
});
