import { ArrowIconRight, FilterXsIcon } from "@/assets/icons/icons";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import {
  getUserPaymentsFilterThunk,
  getUserPaymentsThunk,
  postPriceListThunk,
  postReconciliationActThunk,
} from "@/features/auth/authSlice";
import { ModalHeader } from "@/features/auth/ui/Header";
import {
  getMyReturns,
  getMyReturnsParams,
} from "@/features/catalog/catalogSlice";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { useFocusEffect, useRouter } from "expo-router";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  Modal,
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
  useColorScheme,
} from "react-native";
import DateTimePickerModal from "react-native-modal-datetime-picker";
import { formatDate } from "../services/utils";
import { CompanySelectionModal } from "./CompanySelectionModalSmall";
import { CompanySelectModal } from "./CompanySelectModal";
import AnimatedTextInput from "./components/CustomInput";
import { PrimaryButton } from "./components/PrimartyButton";

const { width: screenWidth, height: screenHeight } = Dimensions.get("window");

interface MyFinanceProps {
  visible: boolean;
  onClose: () => void;
}

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

const PaymentFiltersModal: React.FC<{
  visible: boolean;
  onClose: () => void;
  onApplyFilters: (filters: Record<string, string>) => void;
  filters: Record<string, string>;
  paymentFilters: {
    id: string;
    name: string;
    paramName: string;
    filterOptions: {
      code: string;
      id: string;
      value: string;
    }[];
  }[];
}> = ({ visible, onClose, onApplyFilters, filters, paymentFilters }) => {
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === "dark";
  const [localFilters, setLocalFilters] =
    useState<Record<string, string>>(filters);

  const [isClosing, setIsClosing] = useState(false);
  const modalTranslateY = useRef(new Animated.Value(screenHeight)).current;

  useEffect(() => {
    if (visible) {
      setLocalFilters(filters);
    }
  }, [visible, filters]);

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

  const updateFilter = (paramName: string, code: string) => {
    setLocalFilters((prev) => ({
      ...prev,
      [paramName]: prev[paramName] === code ? "" : code,
    }));
  };

  const resetFilters = () => {
    const resetFiltersObj: Record<string, string> = {};
    paymentFilters.forEach((filter) => {
      resetFiltersObj[filter.paramName] = "";
    });
    setLocalFilters(resetFiltersObj);
  };

  const applyFilters = () => {
    onApplyFilters(localFilters);
    closeModalWithAnimation();
  };

  const appliedFiltersCount = Object.values(localFilters).filter(
    (value) => value !== "",
  ).length;

  // Группируем фильтры по первому слову в name
  const uniqueFilters = paymentFilters.filter((filter, index, self) => {
    const firstWord = filter.name.split(" ")[0];
    const firstIndex = self.findIndex(
      (f) => f.name.split(" ")[0] === firstWord,
    );
    return index === firstIndex;
  });

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
                {uniqueFilters.map((filterGroup) => {
                  // Пропускаем PaymentDateYear и PaymentDateMonth
                  if (filterGroup.paramName === "PaymentDateYear") return null;
                  if (filterGroup.paramName === "PaymentDateMonth") return null;

                  return (
                    <View key={filterGroup.id} style={styles.filterSection}>
                      <ThemedText style={styles.filterSectionTitle}>
                        {filterGroup.name.split(" (")[0]}
                      </ThemedText>
                      <View style={styles.filterChipsContainer}>
                        {filterGroup.filterOptions.map((option) => (
                          <TouchableOpacity
                            key={option.id}
                            style={[
                              styles.filterChip,
                              isDarkMode && {
                                backgroundColor: "#202022",
                                borderColor: "#323235",
                              },
                              localFilters[filterGroup.paramName] ===
                                option.code && styles.filterChipSelected,
                            ]}
                            onPress={() =>
                              updateFilter(filterGroup.paramName, option.code)
                            }
                          >
                            <ThemedText
                              style={[
                                styles.filterChipText,
                                localFilters[filterGroup.paramName] ===
                                  option.code && styles.filterChipTextSelected,
                              ]}
                            >
                              {option.value}{" "}
                              {/* Отображаем value для пользователя */}
                            </ThemedText>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </View>
                  );
                })}

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
  const dispatch = useAppDispatch();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const [showFiltersModal, setShowFiltersModal] = useState(false);
  const paymentFilters = useAppSelector((state) => state.auth.paymentsFillter);
  const currentCompany = useAppSelector((state) => state.auth.currentCompany);
  const paymentsList = useAppSelector((state) => state.auth.payments);
  const isLoading = useAppSelector((state) => state.auth.isLoadingPayments);
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [count, setCount] = useState(10);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const scrollEndRef = useRef(false);

  useEffect(() => {
    if (currentCompany) {
      dispatch(getUserPaymentsFilterThunk({ companyId: currentCompany.id }));
    }
  }, [currentCompany]);

  useEffect(() => {
    if (paymentFilters && paymentFilters.length > 0) {
      const initialFilters: Record<string, string> = {};
      paymentFilters.forEach((filter) => {
        initialFilters[filter.paramName] = "";
      });
      setFilters(initialFilters);
    }
  }, [paymentFilters]);

  // Функция для получения value (для отображения) по code
  const getDisplayValue = useCallback(
    (paramName: string, code: string) => {
      if (!code) return "";
      const filter = paymentFilters.find((f) => f.paramName === paramName);
      const option = filter?.filterOptions.find((opt) => opt.code === code);
      return option?.value || code;
    },
    [paymentFilters],
  );

  // Функция для получения сгруппированных фильтров (мемоизированная)
  const groupedFilters = useMemo(() => {
    if (!paymentFilters || paymentFilters.length === 0) return [];

    const groupedFilters = new Map();

    paymentFilters.forEach((filter) => {
      const firstWord = filter.name.split(" ")[0];
      if (!groupedFilters.has(firstWord)) {
        groupedFilters.set(firstWord, []);
      }
      groupedFilters.get(firstWord).push(filter);
    });

    const uniqueGroups = Array.from(groupedFilters.entries()).map(
      ([groupName, filtersInGroup]) => {
        const hasYearFilter = filtersInGroup.some(
          (f: any) => f.paramName === "PaymentDateYear",
        );
        const hasMonthFilter = filtersInGroup.some(
          (f: any) => f.paramName === "PaymentDateMonth",
        );

        if (hasYearFilter && hasMonthFilter) {
          const yearFilter = filtersInGroup.find(
            (f: any) => f.paramName === "PaymentDateYear",
          );
          const monthFilter = filtersInGroup.find(
            (f: any) => f.paramName === "PaymentDateMonth",
          );

          const selectedYearCode = filters[yearFilter?.paramName || ""];
          const selectedMonthCode = filters[monthFilter?.paramName || ""];

          const yearValue = getDisplayValue(
            yearFilter?.paramName,
            selectedYearCode,
          );
          const monthValue = getDisplayValue(
            monthFilter?.paramName,
            selectedMonthCode,
          );

          let displayValue = "";
          if (selectedYearCode && selectedMonthCode) {
            displayValue = `${monthValue} ${yearValue}`;
          } else if (selectedYearCode) {
            displayValue = yearValue;
          } else if (selectedMonthCode) {
            displayValue = monthValue;
          }

          return {
            id: "year-month-group",
            name: groupName,
            paramName: "year-month-group",
            displayValue,
            isActive: !!(selectedYearCode || selectedMonthCode),
          };
        }

        const mainFilter = filtersInGroup[0];
        const selectedCode = filters[mainFilter.paramName] || "";
        const displayValue = getDisplayValue(
          mainFilter.paramName,
          selectedCode,
        );

        return {
          id: mainFilter.id,
          name: groupName,
          paramName: mainFilter.paramName,
          displayValue,
          isActive: !!selectedCode,
        };
      },
    );

    return uniqueGroups;
  }, [paymentFilters, filters, getDisplayValue]);

  // Мемоизированные и сгруппированные платежи
  const groupedPayments = useMemo(() => {
    if (paymentsList.length === 0) return [];

    // Сортируем платежи от новых к старым
    const sortedPayments = [...paymentsList].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    );

    // Группируем по датам
    const grouped: { [key: string]: any[] } = {};
    sortedPayments.forEach((payment) => {
      if (!grouped[payment.date]) grouped[payment.date] = [];
      grouped[payment.date].push(payment);
    });

    let remaining = count;
    const result = [];

    for (const date of Object.keys(grouped)) {
      if (remaining <= 0) break;
      const take = Math.min(grouped[date].length, remaining);
      result.push({ date, payments: grouped[date].slice(0, take) });
      remaining -= take;
    }

    return result;
  }, [paymentsList, count]);

  const handleScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const { layoutMeasurement, contentOffset, contentSize } =
        event.nativeEvent;
      const isEnd =
        layoutMeasurement.height + contentOffset.y >= contentSize.height - 50;

      // Добавляем флаг, чтобы не вызывать много раз
      if (isEnd && !isLoading && !isLoadingMore && !scrollEndRef.current) {
        scrollEndRef.current = true;
        setIsLoadingMore(true);

        const newCount = count + 10;
        setCount(newCount);

        dispatch(
          getUserPaymentsThunk({
            ...filters,
            count: newCount,
            companyId: currentCompany?.id,
          }),
        ).finally(() => {
          setIsLoadingMore(false);
          setTimeout(() => {
            scrollEndRef.current = false;
          }, 500);
        });
      } else if (!isEnd) {
        scrollEndRef.current = false;
      }
    },
    [isLoading, isLoadingMore, count, filters, currentCompany, dispatch],
  );

  const handleApplyFilters = useCallback(
    (newFilters: Record<string, string>) => {
      setFilters(newFilters);
      setCount(10); // Сбрасываем count при применении фильтров
      dispatch(
        getUserPaymentsThunk({
          ...newFilters,
          count: 10,
          companyId: currentCompany?.id,
        }),
      );
    },
    [currentCompany, dispatch],
  );

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
            style={styles.filterButton}
            onPress={() => setShowFiltersModal(true)}
          >
            <View>
              {Object.values(filters).some((v) => v !== "") && (
                <View style={styles.filterBadge} />
              )}
              <FilterXsIcon
                stroke={isDark ? "#FBFCFF" : "#1B1B1C"}
                fill={isDark ? "#FBFCFF" : "#1B1B1C"}
              />
            </View>
            <ThemedText style={styles.filterButtonText}>Фильтры</ThemedText>
          </TouchableOpacity>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.subcategoriesContainer}
          contentContainerStyle={styles.subcategoriesContent}
        >
          {groupedFilters.map((group) => {
            if (group.paramName === "PaymentDateYear") return null;
            if (group.paramName === "PaymentDateMonth") return null;

            return (
              <TouchableOpacity
                key={group.id}
                style={[
                  styles.subcategoryButton,
                  group.isActive && styles.subcategoryButtonActive,
                  isDark &&
                    !group.isActive && {
                      backgroundColor: "#202022",
                    },
                  isDark &&
                    group.isActive && {
                      backgroundColor: "#3881EE",
                    },
                ]}
                onPress={() => setShowFiltersModal(true)}
              >
                <ThemedText
                  style={[
                    styles.subcategoryText,
                    group.isActive && styles.subcategoryTextActive,
                    isDark && {
                      color: "#FBFCFF",
                    },
                  ]}
                >
                  {group.displayValue || group.name}
                </ThemedText>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        <ScrollView
          style={styles.paymentsScrollViewFull}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.paymentsContentContainer}
          onScroll={handleScroll}
          scrollEventThrottle={16}
        >
          {isLoading && groupedPayments.length === 0 && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator
                size="large"
                color={isDark ? "#FBFCFF" : "#203686"}
              />
              <ThemedText
                style={styles.loadingText}
                lightColor="#80818B"
                darkColor="#FBFCFF80"
              >
                Загрузка платежей...
              </ThemedText>
            </View>
          )}

          {groupedPayments.length > 0 && (
            <>
              {groupedPayments.map((group) => (
                <View key={group.date}>
                  <ThemedText
                    style={{
                      fontSize: 12,
                      textTransform: "uppercase",
                      marginVertical: 24,
                    }}
                    darkColor="#FBFCFF80"
                  >
                    {formatDate(group.date)}
                  </ThemedText>
                  <View style={{ gap: 16 }}>
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
                            {payment.paymentType || "Оплата"}
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
                            marginTop: 4,
                          }}
                        >
                          <ThemedText
                            style={{ fontSize: 12 }}
                            darkColor="#FBFCFF80"
                          >
                            Счет №{payment.invoiceNumber} от{" "}
                            {formatDate(payment.invoiceDate)}
                          </ThemedText>
                          <ThemedText
                            style={{ fontSize: 12 }}
                            darkColor="#FBFCFF80"
                          >
                            {formatDate(payment.date)}
                          </ThemedText>
                        </View>
                      </View>
                    ))}
                  </View>
                </View>
              ))}

              {(isLoadingMore || isLoading) && (
                <View style={{ paddingVertical: 20 }}>
                  <ActivityIndicator
                    size="small"
                    color={isDark ? "#FBFCFF" : "#203686"}
                  />
                </View>
              )}
            </>
          )}
        </ScrollView>
      </ThemedView>

      <PaymentFiltersModal
        visible={showFiltersModal}
        onClose={() => setShowFiltersModal(false)}
        onApplyFilters={handleApplyFilters}
        filters={filters}
        paymentFilters={paymentFilters}
      />
    </View>
  );
};

// Компонент формы запроса акта-сверки
const ReconciliationActScreen: React.FC<{ onBack: () => void }> = ({
  onBack,
}) => {
  const dispatch = useAppDispatch();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const companies = useAppSelector((state) => state.auth.me.companies) || [];

  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [selectedCompany, setSelectedCompany] = useState<any>(null);
  const [email, setEmail] = useState("");
  const [comment, setComment] = useState("");
  const [companyModalVisible, setCompanyModalVisible] = useState(false);
  const [registerModalVisible, setRegisterModalVisible] = useState(false);

  // Состояния для дата-пикеров
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);

  // Состояния для ошибок валидации
  const [errors, setErrors] = useState<{
    startDate?: string;
    endDate?: string;
    company?: string;
    email?: string;
  }>({});

  const formatDateForDisplay = (date: Date | null): string => {
    if (!date) return "";
    return date.toLocaleDateString("ru-RU", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const formatDateForBackend = (date: Date | null): string => {
    if (!date) return "";
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const validateForm = (): boolean => {
    const newErrors: {
      startDate?: string;
      endDate?: string;
      company?: string;
      email?: string;
    } = {};

    if (!startDate) {
      newErrors.startDate = "Укажите начало периода";
    }
    if (!endDate) {
      newErrors.endDate = "Укажите конец периода";
    }
    if (startDate && endDate && startDate > endDate) {
      newErrors.endDate = "Дата окончания не может быть раньше даты начала";
    }
    if (!selectedCompany) {
      newErrors.company = "Выберите компанию";
    }
    const emailRegex = /^[^\s@]+@([^\s@.,]+\.)+[^\s@.,]{2,}$/;
    if (!email) {
      newErrors.email = "Введите email";
    } else if (!emailRegex.test(email)) {
      newErrors.email = "Введите корректный email";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSelectCompany = (company: any) => {
    setSelectedCompany(company);
    setCompanyModalVisible(false);
    if (errors.company) {
      setErrors((prev) => ({ ...prev, company: undefined }));
    }
  };

  const handleOpenRegisterModal = () => {
    setRegisterModalVisible(true);
  };

  // Функции для дата-пикеров
  const showStartPicker = () => {
    setShowStartDatePicker(true);
  };

  const hideStartPicker = () => {
    setShowStartDatePicker(false);
  };

  const handleStartDateConfirm = (date: Date) => {
    setStartDate(date);
    hideStartPicker();
    if (errors.startDate) {
      setErrors((prev) => ({ ...prev, startDate: undefined }));
    }
  };

  const showEndPicker = () => {
    setShowEndDatePicker(true);
  };

  const hideEndPicker = () => {
    setShowEndDatePicker(false);
  };

  const handleEndDateConfirm = (date: Date) => {
    setEndDate(date);
    hideEndPicker();
    if (errors.endDate) {
      setErrors((prev) => ({ ...prev, endDate: undefined }));
    }
  };

  const handleSendReconciliationAct = () => {
    if (validateForm()) {
      dispatch(
        postReconciliationActThunk({
          dateFrom: formatDateForBackend(startDate),
          dateTo: formatDateForBackend(endDate),
          companyId: selectedCompany.id,
          comment,
          email,
        }),
      );
    }
  };

  return (
    <>
      <View style={styles.fullScreenContent}>
        <ModalHeader
          title="Запросить акт-сверки"
          showBackButton={true}
          onBackPress={onBack}
        />

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <ThemedView
            lightColor="#FFFFFF"
            darkColor="#151516"
            style={styles.formContainer}
          >
            <ThemedText
              style={styles.formSubtitle}
              type="subtitle"
              darkColor="#FBFCFF"
            >
              Заполните форму
            </ThemedText>

            {/* Даты в одной строке */}
            <View style={styles.dateRow}>
              <View style={styles.dateWrapper}>
                <TouchableOpacity
                  onPress={showStartPicker}
                  style={[
                    styles.datePickerButton,
                    isDark && styles.datePickerButtonDark,
                    errors.startDate && styles.datePickerButtonError,
                  ]}
                >
                  <ThemedText
                    style={[
                      styles.datePickerText,
                      !startDate && styles.datePickerPlaceholder,
                    ]}
                    darkColor="#FBFCFF"
                    lightColor="#1B1B1C"
                  >
                    {startDate
                      ? formatDateForDisplay(startDate)
                      : "Начало периода"}
                  </ThemedText>
                </TouchableOpacity>
                {errors.startDate && (
                  <ThemedText style={styles.errorText} darkColor="#FF6B6B">
                    {errors.startDate}
                  </ThemedText>
                )}
              </View>

              <View style={styles.dateWrapper}>
                <TouchableOpacity
                  onPress={showEndPicker}
                  style={[
                    styles.datePickerButton,
                    isDark && styles.datePickerButtonDark,
                    errors.endDate && styles.datePickerButtonError,
                  ]}
                >
                  <ThemedText
                    style={[
                      styles.datePickerText,
                      !endDate && styles.datePickerPlaceholder,
                    ]}
                    darkColor="#FBFCFF"
                    lightColor="#1B1B1C"
                  >
                    {endDate ? formatDateForDisplay(endDate) : "Конец периода"}
                  </ThemedText>
                </TouchableOpacity>
                {errors.endDate && (
                  <ThemedText style={styles.errorText} darkColor="#FF6B6B">
                    {errors.endDate}
                  </ThemedText>
                )}
              </View>
            </View>

            {/* Выбор компании */}
            <View style={styles.fieldWrapper}>
              <TouchableOpacity
                onPress={() => setCompanyModalVisible(true)}
                style={[
                  styles.companySelector,
                  isDark && styles.companySelectorDark,
                  errors.company && styles.companySelectorError,
                ]}
              >
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 8,
                    flex: 1,
                  }}
                >
                  <ThemedText
                    darkColor="#FBFCFF"
                    lightColor="#1B1B1C"
                    numberOfLines={1}
                    style={[
                      styles.companySelectorText,
                      !selectedCompany && styles.companySelectorPlaceholder,
                    ]}
                  >
                    {selectedCompany?.name || "Выберите компанию"}
                  </ThemedText>
                </View>
                <ArrowIconRight stroke={isDark ? "#FBFCFF" : "#1B1B1C"} />
              </TouchableOpacity>
              {errors.company && (
                <ThemedText style={styles.errorText} darkColor="#FF6B6B">
                  {errors.company}
                </ThemedText>
              )}
            </View>

            {/* Email */}
            <View style={styles.fieldWrapper}>
              <AnimatedTextInput
                placeholder="Email"
                placeholderTextColor="#80818B"
                keyboardType="email-address"
                value={email}
                onChangeText={(text) => {
                  setEmail(text);
                  if (errors.email) {
                    setErrors((prev) => ({ ...prev, email: undefined }));
                  }
                }}
                style={errors.email && styles.inputError}
              />
              {errors.email && (
                <ThemedText style={styles.errorText} darkColor="#FF6B6B">
                  {errors.email}
                </ThemedText>
              )}
            </View>

            {/* Комментарий */}
            <View style={styles.fieldWrapper}>
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
          </ThemedView>
        </ScrollView>

        {/* Нижняя панель с кнопкой */}
        <View style={styles.bottomPanel}>
          <ThemedText style={styles.infoText} darkColor="#FBFCFF80">
            Акт будет сформирован в 1С и отправлен в течение 24 часов
          </ThemedText>

          <PrimaryButton
            title="Отправить запрос"
            onPress={handleSendReconciliationAct}
            variant="primary"
            size="lg"
            fullWidth
          />
        </View>
      </View>

      {/* Дата-пикеры - размещаем за пределами ScrollView */}
      <DateTimePickerModal
        isVisible={showStartDatePicker}
        mode="date"
        onConfirm={handleStartDateConfirm}
        onCancel={hideStartPicker}
        date={startDate || new Date()}
        maximumDate={endDate || undefined}
        locale="ru"
      />

      <DateTimePickerModal
        isVisible={showEndDatePicker}
        mode="date"
        onConfirm={handleEndDateConfirm}
        onCancel={hideEndPicker}
        date={endDate || new Date()}
        minimumDate={startDate || undefined}
        locale="ru"
      />

      <CompanySelectionModal
        visible={companyModalVisible}
        onClose={() => setCompanyModalVisible(false)}
        companies={companies}
        selectedCompanyId={selectedCompany?.id}
        onSelectCompany={handleSelectCompany}
        onAddCompany={handleOpenRegisterModal}
      />

      <CompanySelectModal
        visible={registerModalVisible}
        onClose={() => setRegisterModalVisible(false)}
        companies={companies}
        selectedCompanyId={selectedCompany?.id}
        onSelectCompany={handleSelectCompany}
        screenScene={"register"}
        onAddCompany={() => {}}
      />
    </>
  );
};

// Компонент формы запроса прайс-листа
const PriceListScreen: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const dispatch = useAppDispatch();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const companies = useAppSelector((state) => state.auth.me.companies) || [];

  const [selectedCompany, setSelectedCompany] = useState<any>(null);
  const [email, setEmail] = useState("");
  const [companyModalVisible, setCompanyModalVisible] = useState(false);
  const [registerModalVisible, setRegisterModalVisible] = useState(false);

  // Состояния для ошибок валидации
  const [errors, setErrors] = useState<{
    company?: string;
    email?: string;
  }>({});

  const validateForm = (): boolean => {
    const newErrors: {
      email?: string;
    } = {};

    // Валидация email
    const emailRegex = /^[^\s@]+@([^\s@.,]+\.)+[^\s@.,]{2,}$/;
    if (!email) {
      newErrors.email = "Введите email";
    } else if (!emailRegex.test(email)) {
      newErrors.email = "Введите корректный email";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSelectCompany = (company: any) => {
    setSelectedCompany(company);
    setCompanyModalVisible(false);
    if (errors.company) {
      setErrors((prev) => ({ ...prev, company: undefined }));
    }
  };

  const handleOpenRegisterModal = () => {
    setRegisterModalVisible(true);
  };

  const handleSendPriceList = () => {
    if (validateForm()) {
      dispatch(
        postPriceListThunk({
          companyId: selectedCompany.id,
          email,
        }),
      );
    }
  };

  return (
    <>
      <View style={styles.fullScreenContent}>
        <ModalHeader
          title="Запросить прайс-лист"
          showBackButton={true}
          onBackPress={onBack}
        />

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <ThemedView
            lightColor="#FFFFFF"
            darkColor="#151516"
            style={styles.formContainer}
          >
            <ThemedText
              style={styles.formSubtitle}
              type="subtitle"
              darkColor="#FBFCFF"
            >
              Заполните форму
            </ThemedText>

            {/* Выбор компании */}
            <View style={styles.fieldWrapper}>
              <TouchableOpacity
                onPress={() => setCompanyModalVisible(true)}
                style={[
                  styles.companySelector,
                  isDark && styles.companySelectorDark,
                  errors.company && styles.companySelectorError,
                ]}
              >
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 8,
                    flex: 1,
                  }}
                >
                  <ThemedText
                    darkColor="#FBFCFF"
                    lightColor="#1B1B1C"
                    numberOfLines={1}
                    style={[
                      styles.companySelectorText,
                      !selectedCompany && styles.companySelectorPlaceholder,
                    ]}
                  >
                    {selectedCompany?.name || "Выберите компанию"}
                  </ThemedText>
                </View>
                <ArrowIconRight stroke={isDark ? "#FBFCFF" : "#1B1B1C"} />
              </TouchableOpacity>
              {errors.company && (
                <ThemedText style={styles.errorText} darkColor="#FF6B6B">
                  {errors.company}
                </ThemedText>
              )}
            </View>

            {/* Email */}
            <View style={styles.fieldWrapper}>
              <AnimatedTextInput
                placeholder="Email"
                placeholderTextColor="#80818B"
                keyboardType="email-address"
                value={email}
                onChangeText={(text) => {
                  setEmail(text);
                  if (errors.email) {
                    setErrors((prev) => ({ ...prev, email: undefined }));
                  }
                }}
                style={errors.email && styles.inputError}
              />
              {errors.email && (
                <ThemedText style={styles.errorText} darkColor="#FF6B6B">
                  {errors.email}
                </ThemedText>
              )}
            </View>
          </ThemedView>
        </ScrollView>

        {/* Нижняя панель с кнопкой */}
        <View style={styles.bottomPanel}>
          <ThemedText style={styles.infoText} darkColor="#FBFCFF80">
            Прайс-лист будет отправлен в течение 2 часов
          </ThemedText>

          <PrimaryButton
            title="Отправить запрос"
            onPress={handleSendPriceList}
            variant="primary"
            size="lg"
            fullWidth
          />
        </View>
      </View>

      <CompanySelectionModal
        visible={companyModalVisible}
        onClose={() => setCompanyModalVisible(false)}
        companies={companies}
        selectedCompanyId={selectedCompany?.id}
        onSelectCompany={handleSelectCompany}
        onAddCompany={handleOpenRegisterModal}
      />

      <CompanySelectModal
        visible={registerModalVisible}
        onClose={() => setRegisterModalVisible(false)}
        companies={companies}
        selectedCompanyId={selectedCompany?.id}
        onSelectCompany={handleSelectCompany}
        screenScene={"register"}
        onAddCompany={() => {}}
      />
    </>
  );
};

export const MyFinanceModal: React.FC<MyFinanceProps> = ({
  visible,
  onClose,
}) => {
  const systemTheme = useColorScheme();
  const currentTheme = systemTheme || "light";
  const isDark = currentTheme === "dark";

  const loading = useAppSelector((state) => state.auth.isLoadingPayments);
  const currentCompany = useAppSelector((state) => state.auth.currentCompany);
  const payments = useAppSelector((state) => state.auth.payments);

  const [showPaymentsHistory, setShowPaymentsHistory] =
    useState<boolean>(false);
  const [showReconciliationAct, setShowReconciliationAct] =
    useState<boolean>(false);
  const [showPriceList, setShowPriceList] = useState<boolean>(false);

  const dispatch = useAppDispatch();
  const router = useRouter();

  useEffect(() => {
    if (currentCompany) {
      dispatch(
        getUserPaymentsThunk({
          companyId: currentCompany.id,
        }),
      );
    }
  }, [currentCompany]);

  const handleCloseAll = () => {
    setShowPaymentsHistory(false);
    setShowReconciliationAct(false);
    setShowPriceList(false);
    onClose();
  };

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

  if (loading) {
    {
      renderLoadingState();
    }
  }

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
          contentContainerStyle={styles.scrollViewContent}
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
            {payments.length > 0 &&
              (() => {
                // Сортируем платежи от новых к старым
                const sortedPayments = [...payments].sort(
                  (a, b) =>
                    new Date(b.date).getTime() - new Date(a.date).getTime(),
                );

                // Группируем по датам
                const grouped: { [key: string]: any[] } = {};
                sortedPayments.forEach((payment) => {
                  if (!grouped[payment.date]) grouped[payment.date] = [];
                  grouped[payment.date].push(payment);
                });

                // Берем первые 4 платежа с учетом группировки
                let remaining = 4;
                const result = [];

                for (const date of Object.keys(grouped)) {
                  if (remaining <= 0) break;
                  const take = Math.min(grouped[date].length, remaining);
                  result.push({ date, payments: grouped[date].slice(0, take) });
                  remaining -= take;
                }

                return result.map((group) => (
                  <View key={group.date}>
                    <ThemedText
                      style={{
                        fontSize: 12,
                        textTransform: "uppercase",
                        marginVertical: 24,
                      }}
                      darkColor="#FBFCFF80"
                    >
                      {formatDate(group.date)}
                    </ThemedText>
                    <View style={{ gap: 16 }}>
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
                              {payment.paymentType || "Оплата"}
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
                              marginTop: 4,
                            }}
                          >
                            <ThemedText
                              style={{ fontSize: 12 }}
                              darkColor="#FBFCFF80"
                            >
                              Счет №{payment.invoiceNumber} от{" "}
                              {formatDate(payment.invoiceDate)}
                            </ThemedText>
                            <ThemedText
                              style={{ fontSize: 12 }}
                              darkColor="#FBFCFF80"
                            >
                              {formatDate(payment.date)}
                            </ThemedText>
                          </View>
                        </View>
                      ))}
                    </View>
                  </View>
                ));
              })()}
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
  // Основные контейнеры
  modalContainer: {
    flex: 1,
  },
  fullScreenContent: {
    flex: 1,
  },
  mainScrollView: {
    flex: 1,
  },
  scrollViewContent: {
    flexGrow: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },

  // Модалка фильтров
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

  // Фильтры
  filterSection: {
    marginTop: 24,
  },
  filterSectionTitle: {
    fontFamily: "Montserrat",
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 12,
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
    backgroundColor: "#FFFFFF",
    borderRadius: 6,
    marginRight: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#D8DADE",
  },
  filterChipSelected: {
    backgroundColor: "#FFFFFF",
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

  // Основные контейнеры страниц
  paymentsMainContainer: {
    flex: 1,
    paddingHorizontal: 16,
    borderRadius: 16,
    marginBlock: 8,
    position: "relative",
  },
  paymentsPreviewContainer: {
    borderRadius: 16,
    padding: 16,
    marginTop: 8,
  },
  paymentsScrollViewFull: {
    flex: 1,
  },
  paymentsContentContainer: {
    paddingBottom: 30,
  },

  // Шапки и строки
  previewHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  sortFilterRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
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

  // Компания и документы
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
  documentsContainer: {
    borderStartStartRadius: 16,
    padding: 16,
    marginTop: 8,
    flex: 1,
  },
  documentRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 18,
  },

  // Пустые и загрузочные состояния
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

  // Сортировка модалка
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

  // Формы
  formContainer: {
    flex: 1,
    padding: 16,
    paddingBottom: 120,
    marginBlockStart: 8,
    borderTopStartRadius: 12,
    borderTopEndRadius: 12,
  },
  formSubtitle: {
    marginBottom: 24,
    fontSize: 18,
    fontWeight: "600",
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
  fieldWrapper: {
    marginBottom: 20,
  },
  inputError: {
    borderColor: "#FF6B6B",
    borderWidth: 1,
  },
  errorText: {
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
    color: "#FF6B6B",
  },
  infoText: {
    fontSize: 12,
    textAlign: "center",
    marginBottom: 12,
  },

  // Даты
  dateRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 20,
  },
  dateWrapper: {
    flex: 1,
  },
  datePickerButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 14,
    backgroundColor: "#F5F5F5",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "transparent",
  },
  datePickerButtonDark: {
    backgroundColor: "#202022",
  },
  datePickerButtonError: {
    borderColor: "#FF6B6B",
  },
  datePickerText: {
    fontSize: 16,
  },
  datePickerPlaceholder: {
    color: "#80818B",
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
  dateInputWrapper: {
    width: "46%",
    position: "relative",
  },

  // Выбор компании
  companySelector: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 14,
    backgroundColor: "#F5F5F5",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "transparent",
  },
  companySelectorDark: {
    backgroundColor: "#202022",
  },
  companySelectorError: {
    borderColor: "#FF6B6B",
  },
  companySelectorText: {
    fontSize: 16,
  },
  companySelectorPlaceholder: {
    color: "#80818B",
  },

  // Нижняя панель
  bottomPanel: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    paddingBottom: 30,
    backgroundColor: "transparent",
  },
  submitButton: {
    marginTop: 24,
    marginBottom: 30,
  },

  // Категории
  subcategoryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: "#F5F5F5",
    borderRadius: 6,
    marginRight: 8,
  },
  subcategoryButtonActive: {
    backgroundColor: "#203686",
  },
  subcategoryText: {
    fontFamily: "Montserrat",
    fontSize: 14,
    color: "#1B1B1C",
  },
  subcategoryTextActive: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
  subcategoriesContainer: {
    flexGrow: 0,
  },
  subcategoriesContent: {
    flexDirection: "row",
    paddingRight: 16,
  },

  // Дополнительные элементы форм
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
  returnsContent: {
    flex: 1,
  },
});
