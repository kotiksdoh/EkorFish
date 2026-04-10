import { ArrowIconRight, FilterXsIcon, SortIcon } from "@/assets/icons/icons";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { ModalHeader } from "@/features/auth/ui/Header";
import {
  clearReturnRequests,
  getMyReturns,
  getMyReturnsParams,
} from "@/features/catalog/catalogSlice";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { Image } from "expo-image";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  Modal,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
  useColorScheme,
} from "react-native";
import AnimatedTextInput from "./components/CustomInput";
import { PrimaryButton } from "./components/PrimartyButton";

const { width: screenWidth, height: screenHeight } = Dimensions.get("window");

interface MyFinanceProps {
  visible: boolean;
  onClose: () => void;
}

interface FilterState {
  dateRange: {
    startDate: string;
    endDate: string;
  };
  amountRange: {
    min: string;
    max: string;
  };
  status: string[];
  paymentMethod: string[];
}

const PAYMENT_STATUSES = [
  { id: "completed", label: "Оплачено" },
  { id: "pending", label: "Ожидает оплаты" },
  { id: "failed", label: "Ошибка" },
  { id: "refunded", label: "Возврат" },
];

const PAYMENT_METHODS = [
  { id: "card", label: "Банковская карта" },
  { id: "transfer", label: "Банковский перевод" },
  { id: "cash", label: "Наличные" },
  { id: "sbp", label: "СБП" },
];

const CreditProgressBar: React.FC<{
  usedCredit: number;
  creditLimit: number;
}> = ({ usedCredit, creditLimit }) => {
  const percentage = creditLimit > 0 ? (usedCredit / creditLimit) * 100 : 0;
  const progressColor = percentage < 50 ? "#6FBD15" : "#FF8605";
  const displayPercentage = Math.min(percentage, 100);

  return (
    <View style={styles.progressBarContainer}>
      <View
        style={[
          styles.progressBarFill,
          {
            width: `${displayPercentage}%`,
            backgroundColor: progressColor,
          },
        ]}
      />
    </View>
  );
};

// Компонент фильтров
const PaymentFiltersModal: React.FC<{
  visible: boolean;
  onClose: () => void;
  onApplyFilters: (filters: FilterState) => void;
}> = ({ visible, onClose, onApplyFilters }) => {
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === "dark";

  const [filters, setFilters] = useState<FilterState>({
    dateRange: { startDate: "", endDate: "" },
    amountRange: { min: "", max: "" },
    status: [],
    paymentMethod: [],
  });

  const [isClosing, setIsClosing] = useState(false);
  const modalTranslateY = useRef(new Animated.Value(screenHeight)).current;

  const appliedFiltersCount =
    (filters.dateRange.startDate ? 1 : 0) +
    (filters.dateRange.endDate ? 1 : 0) +
    (filters.amountRange.min ? 1 : 0) +
    (filters.amountRange.max ? 1 : 0) +
    filters.status.length +
    filters.paymentMethod.length;

  const closeModalWithAnimation = useCallback(() => {
    if (isClosing) return;
    setIsClosing(true);
    Animated.timing(modalTranslateY, {
      toValue: screenHeight,
      duration: 250,
      useNativeDriver: true,
    }).start(() => {
      onClose();
      setIsClosing(false);
    });
  }, [isClosing, onClose]);

  useEffect(() => {
    if (visible) {
      modalTranslateY.setValue(screenHeight);
      Animated.spring(modalTranslateY, {
        toValue: 0,
        useNativeDriver: true,
        damping: 20,
        stiffness: 90,
        mass: 0.8,
      }).start();
    }
  }, [visible]);

  const handleOverlayPress = useCallback(() => {
    if (!isClosing) closeModalWithAnimation();
  }, [isClosing, closeModalWithAnimation]);

  const toggleStatus = (statusId: string) => {
    setFilters((prev) => ({
      ...prev,
      status: prev.status.includes(statusId)
        ? prev.status.filter((s) => s !== statusId)
        : [...prev.status, statusId],
    }));
  };

  const togglePaymentMethod = (methodId: string) => {
    setFilters((prev) => ({
      ...prev,
      paymentMethod: prev.paymentMethod.includes(methodId)
        ? prev.paymentMethod.filter((m) => m !== methodId)
        : [...prev.paymentMethod, methodId],
    }));
  };

  const resetFilters = () => {
    setFilters({
      dateRange: { startDate: "", endDate: "" },
      amountRange: { min: "", max: "" },
      status: [],
      paymentMethod: [],
    });
  };

  const applyFilters = () => {
    onApplyFilters(filters);
    closeModalWithAnimation();
  };

  return (
    <Modal
      visible={visible}
      animationType="none"
      transparent={true}
      onRequestClose={closeModalWithAnimation}
      statusBarTranslucent={true}
    >
      <TouchableWithoutFeedback onPress={handleOverlayPress}>
        <View style={styles.modalOverlay}>
          <TouchableWithoutFeedback>
            <Animated.View
              style={[
                styles.modalContainerFilter,
                isDarkMode && { backgroundColor: "#202022" },
                { transform: [{ translateY: modalTranslateY }] },
              ]}
            >
              <TouchableOpacity
                style={styles.swipeHandleContainer}
                activeOpacity={0.7}
                onPress={closeModalWithAnimation}
              >
                <View style={styles.swipeHandle} />
              </TouchableOpacity>

              <View style={styles.modalHeader}>
                <ThemedText style={styles.modalTitle}>Фильтры</ThemedText>
                <TouchableOpacity onPress={resetFilters}>
                  <ThemedText
                    lightColor="#203686"
                    darkColor="#4C94FF"
                    style={styles.modalResetText}
                  >
                    Сбросить
                  </ThemedText>
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.modalContent}>
                <View style={styles.filterSection}>
                  <ThemedText style={styles.filterSectionTitle}>
                    Период
                  </ThemedText>
                  <View style={styles.dateInputs}>
                    <View style={styles.dateInputContainer}>
                      <ThemedText
                        style={styles.dateInputPlaceholder}
                        lightColor="#80818B"
                      >
                        Дата от
                      </ThemedText>
                    </View>
                    <View style={styles.dateSeparator} />
                    <View style={styles.dateInputContainer}>
                      <ThemedText
                        style={styles.dateInputPlaceholder}
                        lightColor="#80818B"
                      >
                        Дата до
                      </ThemedText>
                    </View>
                  </View>
                </View>

                <View style={styles.filterSection}>
                  <ThemedText style={styles.filterSectionTitle}>
                    Сумма
                  </ThemedText>
                  <View style={styles.priceInputs}>
                    <View style={styles.priceInputContainer}>
                      <ThemedText
                        style={styles.priceInputPlaceholder}
                        lightColor="#80818B"
                      >
                        От
                      </ThemedText>
                    </View>
                    <View style={styles.priceSeparator} />
                    <View style={styles.priceInputContainer}>
                      <ThemedText
                        style={styles.priceInputPlaceholder}
                        lightColor="#80818B"
                      >
                        До
                      </ThemedText>
                    </View>
                  </View>
                </View>

                <View style={styles.filterSection}>
                  <ThemedText style={styles.filterSectionTitle}>
                    Статус оплаты
                  </ThemedText>
                  <View style={styles.filterChipsContainer}>
                    {PAYMENT_STATUSES.map((status) => (
                      <TouchableOpacity
                        key={status.id}
                        style={[
                          styles.filterChip,
                          isDarkMode && {
                            backgroundColor: "#202022",
                            borderColor: "#323235",
                          },
                          filters.status.includes(status.id) &&
                            styles.filterChipSelected,
                        ]}
                        onPress={() => toggleStatus(status.id)}
                      >
                        <ThemedText
                          style={[
                            styles.filterChipText,
                            filters.status.includes(status.id) &&
                              styles.filterChipTextSelected,
                          ]}
                        >
                          {status.label}
                        </ThemedText>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                <View style={styles.filterSection}>
                  <ThemedText style={styles.filterSectionTitle}>
                    Способ оплаты
                  </ThemedText>
                  <View style={styles.filterChipsContainer}>
                    {PAYMENT_METHODS.map((method) => (
                      <TouchableOpacity
                        key={method.id}
                        style={[
                          styles.filterChip,
                          isDarkMode && {
                            backgroundColor: "#202022",
                            borderColor: "#323235",
                          },
                          filters.paymentMethod.includes(method.id) &&
                            styles.filterChipSelected,
                        ]}
                        onPress={() => togglePaymentMethod(method.id)}
                      >
                        <ThemedText
                          style={[
                            styles.filterChipText,
                            filters.paymentMethod.includes(method.id) &&
                              styles.filterChipTextSelected,
                          ]}
                        >
                          {method.label}
                        </ThemedText>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                <View style={styles.modalBottomSpacer} />
              </ScrollView>

              <TouchableOpacity
                style={[
                  styles.applyButton,
                  isDarkMode && { backgroundColor: "#3881EE" },
                ]}
                onPress={applyFilters}
              >
                <ThemedText style={styles.applyButtonText}>
                  Применить{" "}
                  {appliedFiltersCount > 0 && `(${appliedFiltersCount})`}
                </ThemedText>
              </TouchableOpacity>
            </Animated.View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

// Компонент страницы истории оплат
const PaymentsHistoryScreen: React.FC<{ onBack: () => void }> = ({
  onBack,
}) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const [showFiltersModal, setShowFiltersModal] = useState(false);
  const [sortBy, setSortBy] = useState("dateDesc");
  const [showSortModal, setShowSortModal] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    dateRange: { startDate: "", endDate: "" },
    amountRange: { min: "", max: "" },
    status: [],
    paymentMethod: [],
  });

  const sortOptions = [
    { id: "dateDesc", label: "Сначала новые" },
    { id: "dateAsc", label: "Сначала старые" },
    { id: "amountDesc", label: "Сначала дороже" },
    { id: "amountAsc", label: "Сначала дешевле" },
  ];

  const getCurrentSortLabel = () => {
    const option = sortOptions.find((opt) => opt.id === sortBy);
    return option ? option.label : "Сначала новые";
  };

  const appliedFiltersCount =
    (filters.dateRange.startDate ? 1 : 0) +
    (filters.dateRange.endDate ? 1 : 0) +
    (filters.amountRange.min ? 1 : 0) +
    (filters.amountRange.max ? 1 : 0) +
    filters.status.length +
    filters.paymentMethod.length;

  const paymentsData = [
    {
      date: "23 ноября, воскресенье",
      payments: [
        {
          id: 1,
          method: "Банковский перевод",
          amount: 21606,
          invoiceNumber: "12456",
          invoiceDate: "28.11.2024",
          date: "23.11.2025",
          time: "14:45",
          status: "completed",
        },
        {
          id: 2,
          method: "Банковский перевод",
          amount: 21606,
          invoiceNumber: "12456",
          invoiceDate: "28.11.2024",
          date: "23.11.2025",
          time: "14:45",
          status: "completed",
        },
      ],
    },
    {
      date: "22 ноября, суббота",
      payments: [
        {
          id: 3,
          method: "Банковская карта",
          amount: 15600,
          invoiceNumber: "12457",
          invoiceDate: "27.11.2024",
          date: "22.11.2025",
          time: "10:30",
          status: "pending",
        },
        {
          id: 4,
          method: "СБП",
          amount: 32100,
          invoiceNumber: "12458",
          invoiceDate: "27.11.2024",
          date: "22.11.2025",
          time: "09:15",
          status: "completed",
        },
      ],
    },
    {
      date: "21 ноября, пятница",
      payments: [
        {
          id: 5,
          method: "Банковский перевод",
          amount: 8900,
          invoiceNumber: "12459",
          invoiceDate: "26.11.2024",
          date: "21.11.2025",
          time: "16:20",
          status: "failed",
        },
      ],
    },
  ];

  return (
    <View style={styles.fullScreenContent}>
      <ModalHeader
        title="История оплат"
        showBackButton={true}
        onBackPress={onBack}
      />

      <ThemedView
        lightColor="#FFFFFF"
        darkColor="#151516"
        style={styles.paymentsMainContainer}
      >
        <View style={styles.sortFilterRow}>
          <TouchableOpacity
            style={styles.sortButton}
            onPress={() => setShowSortModal(true)}
          >
            <SortIcon
              stroke={isDark ? "#FBFCFF" : "#1B1B1C"}
              fill={isDark ? "#FBFCFF" : "#1B1B1C"}
            />
            <ThemedText style={styles.sortButtonText}>
              {getCurrentSortLabel()}
            </ThemedText>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.filterButton}
            onPress={() => setShowFiltersModal(true)}
          >
            <View>
              {appliedFiltersCount > 0 && <View style={styles.filterBadge} />}
              <FilterXsIcon
                stroke={isDark ? "#FBFCFF" : "#1B1B1C"}
                fill={isDark ? "#FBFCFF" : "#1B1B1C"}
              />
            </View>
            <ThemedText style={styles.filterButtonText}>Фильтры</ThemedText>
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.paymentsScrollViewFull}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.paymentsContentContainer}
        >
          {paymentsData.map((group, groupIndex) => (
            <View key={groupIndex}>
              <ThemedText
                style={{
                  fontSize: 12,
                  textTransform: "uppercase",
                  marginVertical: 24,
                }}
                darkColor="#FBFCFF80"
              >
                {group.date}
              </ThemedText>

              <View style={{ gap: 8 }}>
                {group.payments.map((payment) => (
                  <View key={payment.id}>
                    <View
                      style={{
                        flexDirection: "row",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <ThemedText darkColor="#4C94FF" weight="medium">
                        {payment.method}
                      </ThemedText>
                      <ThemedText darkColor="#FBFCFF" weight="semiBold">
                        {payment.amount.toLocaleString()} ₽
                      </ThemedText>
                    </View>
                    <View
                      style={{
                        flexDirection: "row",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <ThemedText
                        style={{ fontSize: 12 }}
                        darkColor="#FBFCFF80"
                      >
                        Счет №{payment.invoiceNumber} от {payment.invoiceDate}
                      </ThemedText>
                      <ThemedText
                        style={{ fontSize: 12 }}
                        darkColor="#FBFCFF80"
                      >
                        {payment.date} {payment.time}
                      </ThemedText>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          ))}
        </ScrollView>
      </ThemedView>

      <PaymentFiltersModal
        visible={showFiltersModal}
        onClose={() => setShowFiltersModal(false)}
        onApplyFilters={(newFilters) => {
          setFilters(newFilters);
          console.log("Применены фильтры:", newFilters);
        }}
      />

      <Modal
        visible={showSortModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowSortModal(false)}
      >
        <TouchableWithoutFeedback onPress={() => setShowSortModal(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View
                style={[
                  styles.sortModalContainer,
                  isDark && { backgroundColor: "#202022" },
                ]}
              >
                <View style={styles.sortModalHeader}>
                  <ThemedText style={styles.sortModalTitle}>
                    Сортировка
                  </ThemedText>
                </View>
                {sortOptions.map((option) => (
                  <TouchableOpacity
                    key={option.id}
                    style={styles.sortOption}
                    onPress={() => {
                      setSortBy(option.id);
                      setShowSortModal(false);
                    }}
                  >
                    <View style={styles.sortOptionRadio}>
                      {sortBy === option.id && (
                        <View style={styles.sortOptionRadioInner} />
                      )}
                    </View>
                    <ThemedText style={styles.sortOptionText}>
                      {option.label}
                    </ThemedText>
                  </TouchableOpacity>
                ))}
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
};

// Компонент формы запроса акта-сверки
const ReconciliationActScreen: React.FC<{ onBack: () => void }> = ({
  onBack,
}) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [company, setCompany] = useState("");
  const [email, setEmail] = useState("");
  const [comment, setComment] = useState("");
  const [selectedFormat, setSelectedFormat] = useState("PDF");

  return (
    <View style={styles.fullScreenContent}>
      <ModalHeader
        title="Запросить акт-сверки"
        showBackButton={true}
        onBackPress={onBack}
      />

      <ThemedView
        lightColor="#FFFFFF"
        darkColor="#151516"
        style={styles.paymentsMainContainer}
      >
        <ThemedText
          style={styles.formSubtitle}
          type="subtitle"
          darkColor="#FBFCFF"
        >
          Заполните форму
        </ThemedText>

        <View style={styles.formGroup}>
          <View style={styles.dateInputWrapper}>
            <AnimatedTextInput
              placeholder="Начало периода"
              placeholderTextColor="#80818B"
              value={startDate}
              onChangeText={setStartDate}
            />
          </View>
          <View style={styles.dateInputWrapper}>
            <AnimatedTextInput
              placeholder="Конец периода"
              placeholderTextColor="#80818B"
              value={endDate}
              onChangeText={setEndDate}
            />
          </View>
        </View>

        <View style={styles.formGroup}>
          <AnimatedTextInput
            placeholder="Компания"
            placeholderTextColor="#80818B"
            value={company}
            onChangeText={setCompany}
          />
        </View>

        <View style={styles.formGroup}>
          <AnimatedTextInput
            placeholder="Email"
            placeholderTextColor="#80818B"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
          />
        </View>

        <View style={styles.formGroup}>
          <AnimatedTextInput
            placeholder="Комментарий"
            placeholderTextColor="#80818B"
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            value={comment}
            onChangeText={setComment}
          />
        </View>

        <ThemedText
          style={styles.formSubtitle}
          type="subtitle"
          darkColor="#FBFCFF"
        >
          Выберите формат
        </ThemedText>

        <TouchableOpacity
          style={styles.radioOption}
          onPress={() => setSelectedFormat("PDF")}
        >
          <View style={styles.radioCircle}>
            {selectedFormat === "PDF" && <View style={styles.radioSelected} />}
          </View>
          <ThemedText style={styles.radioLabel}>PDF</ThemedText>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.radioOption}
          onPress={() => setSelectedFormat("Excel")}
        >
          <View style={styles.radioCircle}>
            {selectedFormat === "Excel" && (
              <View style={styles.radioSelected} />
            )}
          </View>
          <ThemedText style={styles.radioLabel}>Excel</ThemedText>
        </TouchableOpacity>
        <View
          style={{
            position: "absolute",
            bottom: 30,
            right: 16,
            left: 16,
            width: "100%",
          }}
        >
          <ThemedText style={styles.infoText} darkColor="#FBFCFF">
            Акт будет сформирован в 1С и отправлен в течение 24 часов
          </ThemedText>

          <PrimaryButton
            title="Отправить запрос"
            onPress={() => console.log("Отправка запроса акта-сверки")}
            variant="primary"
            size="lg"
            fullWidth
          />
        </View>
      </ThemedView>
    </View>
  );
};

// Компонент формы запроса прайс-листа
const PriceListScreen: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const [company, setCompany] = useState("");
  const [email, setEmail] = useState("");
  const [selectedFormat, setSelectedFormat] = useState("app");
  const [onlyMyPrices, setOnlyMyPrices] = useState(false);

  return (
    <View style={styles.fullScreenContent}>
      <ModalHeader
        title="Запросить прайс-лист"
        showBackButton={true}
        onBackPress={onBack}
      />

      <ThemedView
        lightColor="#FFFFFF"
        darkColor="#151516"
        style={styles.paymentsMainContainer}
      >
        <ThemedText
          style={styles.formSubtitle}
          type="subtitle"
          darkColor="#FBFCFF"
        >
          Заполните форму
        </ThemedText>

        <View style={styles.formGroup}>
          <AnimatedTextInput
            placeholder="Компания"
            placeholderTextColor="#80818B"
            value={company}
            onChangeText={setCompany}
          />
        </View>

        <View style={styles.formGroup}>
          <AnimatedTextInput
            placeholder="Email"
            placeholderTextColor="#80818B"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
          />
        </View>

        <ThemedText
          style={styles.formSubtitle}
          type="subtitle"
          darkColor="#FBFCFF"
        >
          Выберите формат
        </ThemedText>

        <TouchableOpacity
          style={styles.radioOption}
          onPress={() => setSelectedFormat("app")}
        >
          <View style={styles.radioCircle}>
            {selectedFormat === "app" && <View style={styles.radioSelected} />}
          </View>
          <ThemedText style={styles.radioLabel}>
            Обновить в приложении
          </ThemedText>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.radioOption}
          onPress={() => setSelectedFormat("PDF")}
        >
          <View style={styles.radioCircle}>
            {selectedFormat === "PDF" && <View style={styles.radioSelected} />}
          </View>
          <ThemedText style={styles.radioLabel}>PDF</ThemedText>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.radioOption}
          onPress={() => setSelectedFormat("Excel")}
        >
          <View style={styles.radioCircle}>
            {selectedFormat === "Excel" && (
              <View style={styles.radioSelected} />
            )}
          </View>
          <ThemedText style={styles.radioLabel}>Excel</ThemedText>
        </TouchableOpacity>
        <View
          style={{
            position: "absolute",
            bottom: 30,
            right: 16,
            left: 16,
            width: "100%",
          }}
        >
          <ThemedText style={styles.infoText} darkColor="#FBFCFF">
            Прайс будет отправлен в течение 2 часов
          </ThemedText>

          <TouchableOpacity
            style={styles.checkboxOption}
            onPress={() => setOnlyMyPrices(!onlyMyPrices)}
          >
            <View style={styles.checkbox}>
              {onlyMyPrices && <View style={styles.checkboxSelected} />}
            </View>
            <ThemedText style={styles.checkboxLabel}>
              Только мои цены (с моими скидками)
            </ThemedText>
          </TouchableOpacity>

          <PrimaryButton
            title="Отправить запрос"
            onPress={() => console.log("Отправка запроса прайс-листа")}
            variant="primary"
            size="lg"
            fullWidth
          />
        </View>
      </ThemedView>
    </View>
  );
};

export const MyFinanceModal: React.FC<MyFinanceProps> = ({
  visible,
  onClose,
}) => {
  const systemTheme = useColorScheme();
  const currentTheme = systemTheme || "light";
  const isDark = currentTheme === "dark";

  const loading = useAppSelector((state) => state.auth.isLoading);
  const currentCompany = useAppSelector((state) => state.auth.currentCompany);
  const [visibleFirstStep, setVisibleFirstStep] = useState<boolean>(false);
  const [visibleSecondStep, setVisibleSecondStep] = useState<boolean>(false);
  const [visibleThirdStep, setVisibleThirdStep] = useState<boolean>(false);
  const [showPaymentsHistory, setShowPaymentsHistory] =
    useState<boolean>(false);
  const [showReconciliationAct, setShowReconciliationAct] =
    useState<boolean>(false);
  const [showPriceList, setShowPriceList] = useState<boolean>(false);

  const dispatch = useAppDispatch();
  const router = useRouter();

  const onCreateReturn = () => {
    setVisibleFirstStep(true);
  };

  const handleCloseAll = () => {
    setVisibleFirstStep(false);
    setVisibleSecondStep(false);
    setVisibleThirdStep(false);
    setShowPaymentsHistory(false);
    setShowReconciliationAct(false);
    setShowPriceList(false);
    dispatch(clearReturnRequests());
    onClose();
  };

  const handleNavigateHomeFromReturn = useCallback(() => {
    handleCloseAll();
    dispatch(getMyReturns());
    router.navigate("/dashboard");
  }, [dispatch, onClose]);

  const handleViewReturnDetails = useCallback(() => {
    setVisibleThirdStep(false);
    setVisibleSecondStep(false);
    setVisibleFirstStep(false);
    dispatch(clearReturnRequests());
    dispatch(getMyReturns());
  }, [dispatch]);

  useFocusEffect(
    useCallback(() => {
      const checkToken = async () => {
        if (visible) {
          dispatch(getMyReturns());
          dispatch(getMyReturnsParams());
        }
      };
      checkToken();
    }, [visible]),
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Image
        source={require("@/assets/icons/png/noReturns.png")}
        style={styles.emptyImage}
        contentFit="cover"
      />
      <View>
        <ThemedText style={styles.emptyTextMain} lightColor="#1B1B1C">
          У вас еще нет заявок{"\n"}на возврат.
        </ThemedText>
        <ThemedText
          style={styles.emptyText}
          lightColor="#80818B"
          darkColor="#FBFCFF80"
        >
          Возврат возможен в течение 24 часов{"\n"}с момента получения заказа.
        </ThemedText>
      </View>
      {onCreateReturn && (
        <PrimaryButton
          title="+ Создать заявку на возврат"
          onPress={onCreateReturn}
          variant="primary"
          size="md"
          activeOpacity={0.8}
          fullWidth
        />
      )}
    </View>
  );

  const renderLoadingState = () => (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color={isDark ? "#FBFCFF" : "#203686"} />
      <ThemedText
        style={styles.loadingText}
        lightColor="#80818B"
        darkColor="#FBFCFF80"
      >
        Загрузка финансов...
      </ThemedText>
    </View>
  );

  if (showPaymentsHistory) {
    return (
      <Modal
        animationType="slide"
        transparent={true}
        visible={visible}
        onRequestClose={handleCloseAll}
        statusBarTranslucent={true}
      >
        <ThemedView
          lightColor="#EBEDF0"
          darkColor="#040508"
          style={styles.modalContainer}
        >
          <PaymentsHistoryScreen onBack={() => setShowPaymentsHistory(false)} />
        </ThemedView>
      </Modal>
    );
  }

  if (showReconciliationAct) {
    return (
      <Modal
        animationType="slide"
        transparent={true}
        visible={visible}
        onRequestClose={handleCloseAll}
        statusBarTranslucent={true}
      >
        <ThemedView
          lightColor="#EBEDF0"
          darkColor="#040508"
          style={styles.modalContainer}
        >
          <ReconciliationActScreen
            onBack={() => setShowReconciliationAct(false)}
          />
        </ThemedView>
      </Modal>
    );
  }

  if (showPriceList) {
    return (
      <Modal
        animationType="slide"
        transparent={true}
        visible={visible}
        onRequestClose={handleCloseAll}
        statusBarTranslucent={true}
      >
        <ThemedView
          lightColor="#EBEDF0"
          darkColor="#040508"
          style={styles.modalContainer}
        >
          <PriceListScreen onBack={() => setShowPriceList(false)} />
        </ThemedView>
      </Modal>
    );
  }

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={handleCloseAll}
      statusBarTranslucent={true}
    >
      <ThemedView
        lightColor="#EBEDF0"
        darkColor="#040508"
        style={styles.modalContainer}
      >
        <ModalHeader
          title="Финансы и документы"
          showBackButton={true}
          onBackPress={handleCloseAll}
        />

        <ScrollView
          style={styles.mainScrollView}
          showsVerticalScrollIndicator={false}
        >
          {currentCompany && (
            <ThemedView
              lightColor="#FFFFFF"
              darkColor="#151516"
              style={styles.companyCardInner}
            >
              <View style={styles.companyInfo}>
                <View style={styles.companyInnRow}>
                  <ThemedText
                    style={styles.companyName}
                    lightColor="#1B1B1C"
                    darkColor="#FBFCFF"
                    numberOfLines={1}
                  >
                    {currentCompany.name}
                  </ThemedText>
                </View>

                <View style={styles.companyInnRow}>
                  <ThemedText
                    style={styles.companyInn}
                    lightColor="#80818B"
                    darkColor="#FBFCFF80"
                  >
                    ИНН {currentCompany.inn || "-"}
                  </ThemedText>
                </View>

                <View style={styles.companyLimit}>
                  <ThemedText style={styles.companyLimitTitle}>
                    Лимит организации
                  </ThemedText>

                  <CreditProgressBar
                    usedCredit={currentCompany?.usedCredit || 0}
                    creditLimit={currentCompany?.creditLimit || 0}
                  />
                  <View style={styles.companyInnRow}>
                    <View style={styles.companyLimitRow}>
                      <ThemedText style={styles.companyInn}>
                        Использовано {currentCompany?.usedCredit || 0} ₽ /{" "}
                      </ThemedText>
                      <ThemedText
                        style={styles.companyInn}
                        lightColor="#80818B"
                        darkColor="#FBFCFF80"
                      >
                        {currentCompany?.creditLimit || 0} ₽
                      </ThemedText>
                    </View>
                    <ThemedText
                      style={styles.companyPersent}
                      lightColor="#80818B"
                      darkColor="#FBFCFF80"
                    >
                      {currentCompany?.creditLimit > 0
                        ? Math.round(
                            (currentCompany?.usedCredit /
                              currentCompany?.creditLimit) *
                              100,
                          )
                        : 0}
                      %
                    </ThemedText>
                  </View>
                </View>
              </View>
            </ThemedView>
          )}

          <ThemedView
            lightColor="#FFFFFF"
            darkColor="#151516"
            style={styles.paymentsPreviewContainer}
          >
            <View style={styles.previewHeader}>
              <ThemedText
                type="subtitle"
                lightColor="#1B1B1C"
                darkColor="#FBFCFF"
              >
                История оплат
              </ThemedText>
              <TouchableOpacity onPress={() => setShowPaymentsHistory(true)}>
                <ThemedText type="caption" darkColor="#4C94FF">
                  Подробнее
                </ThemedText>
              </TouchableOpacity>
            </View>

            <ThemedText
              style={{
                fontSize: 12,
                textTransform: "uppercase",
                marginVertical: 24,
              }}
              darkColor="#FBFCFF80"
            >
              23 ноября, воскресенье
            </ThemedText>

            <View style={{ gap: 8 }}>
              <View>
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <ThemedText darkColor="#4C94FF" weight="medium">
                    Банковский перевод
                  </ThemedText>
                  <ThemedText darkColor="#FBFCFF" weight="semiBold">
                    21 606 ₽
                  </ThemedText>
                </View>
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <ThemedText style={{ fontSize: 12 }} darkColor="#FBFCFF80">
                    Счет №12456 от 28.11.2024
                  </ThemedText>
                  <ThemedText style={{ fontSize: 12 }} darkColor="#FBFCFF80">
                    23.11.2025 14:45
                  </ThemedText>
                </View>
              </View>
            </View>

            <ThemedText
              style={{
                fontSize: 12,
                textTransform: "uppercase",
                marginVertical: 24,
              }}
              darkColor="#FBFCFF80"
            >
              22 ноября, суббота
            </ThemedText>

            <View style={{ gap: 8 }}>
              <View>
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <ThemedText darkColor="#4C94FF" weight="medium">
                    Банковская карта
                  </ThemedText>
                  <ThemedText darkColor="#FBFCFF" weight="semiBold">
                    15 600 ₽
                  </ThemedText>
                </View>
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <ThemedText style={{ fontSize: 12 }} darkColor="#FBFCFF80">
                    Счет №12457 от 27.11.2024
                  </ThemedText>
                  <ThemedText style={{ fontSize: 12 }} darkColor="#FBFCFF80">
                    22.11.2025 10:30
                  </ThemedText>
                </View>
              </View>
            </View>
          </ThemedView>

          <ThemedView
            lightColor="#FFFFFF"
            darkColor="#151516"
            style={styles.documentsContainer}
          >
            <View>
              <ThemedText
                type="subtitle"
                lightColor="#1B1B1C"
                darkColor="#FBFCFF"
              >
                Документы
              </ThemedText>
              <TouchableOpacity
                onPress={() => setShowReconciliationAct(true)}
                activeOpacity={0.7}
              >
                <View style={styles.documentRow}>
                  <ThemedText>Запросить акт-сверки</ThemedText>
                  <ArrowIconRight />
                </View>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setShowPriceList(true)}
                activeOpacity={0.7}
              >
                <View style={styles.documentRow}>
                  <ThemedText>Запросить прайс-лист</ThemedText>
                  <ArrowIconRight />
                </View>
              </TouchableOpacity>
            </View>
          </ThemedView>
        </ScrollView>
      </ThemedView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
  },
  fullScreenContent: {
    flex: 1,
  },
  mainScrollView: {
    flex: 1,
  },
  paymentsMainContainer: {
    flex: 1,
    paddingHorizontal: 16,
    borderRadius: 16,
    marginBlock: 8,
    position: "relative",
  },
  paymentsScrollViewFull: {
    flex: 1,
  },
  paymentsContentContainer: {
    paddingBottom: 30,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContainerFilter: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "85%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
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
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  modalTitle: {
    fontFamily: "Montserrat",
    fontSize: 18,
    fontWeight: "600",
  },
  modalResetText: {
    fontFamily: "Montserrat",
    fontSize: 16,
  },
  modalContent: {
    paddingHorizontal: 20,
    maxHeight: "70%",
  },
  modalBottomSpacer: {
    height: 100,
  },
  filterSection: {
    marginTop: 24,
  },
  filterSectionTitle: {
    fontFamily: "Montserrat",
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 12,
  },
  dateInputs: {
    flexDirection: "row",
    alignItems: "center",
  },
  dateInputContainer: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 8,
    padding: 12,
    overflow: "hidden",
  },
  dateInputPlaceholder: {
    fontFamily: "Montserrat",
    fontSize: 16,
  },
  dateSeparator: {
    width: 16,
  },
  priceInputs: {
    flexDirection: "row",
    alignItems: "center",
  },
  priceInputContainer: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 8,
    padding: 12,
    overflow: "hidden",
  },
  priceInputPlaceholder: {
    fontFamily: "Montserrat",
    fontSize: 16,
  },
  priceSeparator: {
    width: 16,
  },
  filterChipsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  filterChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: "#ffffff",
    borderRadius: 6,
    marginRight: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#D8DADE",
  },
  filterChipSelected: {
    backgroundColor: "#ffffff",
    borderColor: "#203686",
  },
  filterChipText: {
    fontFamily: "Montserrat",
    fontSize: 14,
  },
  filterChipTextSelected: {
    color: "#203686",
    fontWeight: "500",
  },
  applyButton: {
    backgroundColor: "#203686",
    marginHorizontal: 20,
    marginVertical: 20,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
  },
  applyButtonText: {
    color: "#FFFFFF",
    fontFamily: "Montserrat",
    fontSize: 16,
    fontWeight: "600",
  },
  paymentsPreviewContainer: {
    borderRadius: 16,
    padding: 16,
    marginTop: 8,
  },
  previewHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  sortFilterRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 16,
    marginBottom: 8,
  },
  sortButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  sortButtonText: {
    marginLeft: 8,
    fontFamily: "Montserrat",
    fontSize: 14,
  },
  filterButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    position: "relative",
  },
  filterButtonText: {
    marginLeft: 8,
    fontFamily: "Montserrat",
    fontSize: 14,
  },
  filterBadge: {
    position: "absolute",
    top: 1,
    right: -1,
    backgroundColor: "#FF3B30",
    borderRadius: 10,
    width: 6,
    height: 6,
    zIndex: 1,
  },
  documentsContainer: {
    borderStartStartRadius: 16,
    padding: 16,
    marginTop: 8,
    marginBottom: 30,
  },
  documentRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 18,
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
    fontWeight: "600",
    textAlign: "center",
    marginBottom: 8,
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
  companyCardInner: {
    borderRadius: 16,
    padding: 16,
    marginTop: 8,
  },
  companyInfo: {
    flex: 1,
  },
  companyName: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 8,
  },
  companyInnRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  companyInn: {
    fontSize: 14,
    fontWeight: "500",
  },
  companyLimit: {
    flexDirection: "column",
    justifyContent: "space-between",
  },
  companyLimitRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  companyLimitTitle: {
    fontSize: 14,
    fontWeight: "500",
  },
  companyPersent: {
    fontSize: 12,
    fontWeight: "500",
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: "#E9EDF1",
    borderRadius: 2,
    marginVertical: 8,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    borderRadius: 2,
  },
  sortModalContainer: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
  },
  sortModalHeader: {
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
    marginBottom: 16,
  },
  sortModalTitle: {
    fontSize: 18,
    fontWeight: "600",
    textAlign: "center",
  },
  sortOption: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
  },
  sortOptionRadio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#D8DADE",
    marginRight: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  sortOptionRadioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#203686",
  },
  sortOptionText: {
    fontSize: 16,
  },
  // Form styles
  formContainer: {
    flex: 1,
  },
  formSubtitle: {
    marginTop: 24,
    marginBottom: 16,
  },
  formGroup: {
    display: "flex",
    justifyContent: "space-between",
    flexDirection: "row",
    marginBottom: 20,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 8,
  },
  formInput: {
    backgroundColor: "#F5F5F5",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: "#1B1B1C",
  },
  formInputDark: {
    backgroundColor: "#202022",
    color: "#FBFCFF",
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: "top",
  },
  dateInputWrapper: {
    width: "46%",
    position: "relative",
  },
  selectWrapper: {
    position: "relative",
  },
  radioOption: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#203686",
    marginRight: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  radioSelected: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#203686",
  },
  radioLabel: {
    fontSize: 16,
  },
  checkboxOption: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: "#203686",
    marginRight: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  checkboxSelected: {
    width: 12,
    height: 12,
    borderRadius: 2,
    backgroundColor: "#203686",
  },
  checkboxLabel: {
    fontSize: 14,
    flex: 1,
  },
  infoText: {
    fontSize: 12,
    marginVertical: 24,
  },
});
