import { ArrowIconRight } from "@/assets/icons/icons";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import {
  getPushSettings,
  getQuietPeriodSettings,
  getTowns,
  updatePushPreference,
  updateQuietPeriodSettings,
} from "@/features/auth/authSlice";
import {
  selectEffectiveStorageId,
  selectTownNameByStorageId,
} from "@/features/auth/selectors";
import { ModalHeader } from "@/features/auth/ui/Header";
import { useKeyboardAwareScroll } from "@/features/shared/hooks/useKeyboardAwareScroll";
import {
  clearRecentlyViewedCache,
  clearSearchHistory,
  loadPrivacySettings,
  savePrivacySettings,
  type PrivacySettings,
} from "@/features/shared/services/privacyStorage";
import {
  buildQuietPeriodPayload,
  formatQuietTimeForDisplay,
  isValidQuietTime,
} from "@/features/shared/types/quietPeriodSettings";
import { AppModal } from "@/features/shared/ui/AppModal";
import { TownSelectionModal } from "@/features/shared/ui/TownSelectionModal";
import { useAppTheme } from "@/hooks/use-theme-color";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";

import { useSafeAreaInsets } from "react-native-safe-area-context";
import { CustomCheckbox } from "./components/CustomCheckBox";
import AnimatedTextInput from "./components/CustomInput";

interface MySettingsProps {
  visible: boolean;
  onClose: () => void;
}

const { width: screenWidth } = Dimensions.get("window");
const switchScale = Math.min(Math.max(screenWidth / 390, 0.85), 1);
const SWITCH_TRACK_WIDTH = 64 * switchScale;
const SWITCH_TRACK_HEIGHT = 28 * switchScale;
const SWITCH_THUMB_WIDTH = 36 * switchScale;
const SWITCH_THUMB_HEIGHT = 24 * switchScale;
const SWITCH_THUMB_OFFSET = 2 * switchScale;
const SWITCH_THUMB_TRANSLATE =
  SWITCH_TRACK_WIDTH - SWITCH_THUMB_WIDTH - SWITCH_THUMB_OFFSET * 2;

interface AppSwitchProps {
  value: boolean;
  onValueChange: (value: boolean) => void;
  isDark: boolean;
  disabled?: boolean;
}

const AppSwitch: React.FC<AppSwitchProps> = ({
  value,
  onValueChange,
  isDark,
  disabled = false,
}) => {
  const thumbTranslate = useRef(
    new Animated.Value(value ? SWITCH_THUMB_TRANSLATE : 0)
  ).current;

  useEffect(() => {
    Animated.timing(thumbTranslate, {
      toValue: value ? SWITCH_THUMB_TRANSLATE : 0,
      duration: 170,
      useNativeDriver: true,
    }).start();
  }, [thumbTranslate, value]);

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={() => !disabled && onValueChange(!value)}
      disabled={disabled}
      style={[
        styles.appSwitchTrack,
        {
          backgroundColor: value
            ? isDark
              ? "#4C94FF"
              : "#203686"
            : isDark
              ? "#ECEFFA26"
              : "#03051E1F",
        },
      ]}
    >
      <Animated.View
        style={[
          styles.appSwitchThumb,
          {
            transform: [{ translateX: thumbTranslate }],
          },
        ]}
      />
    </TouchableOpacity>
  );
};

const formatTimeValue = (rawValue: string) => {
  const digitsOnly = rawValue.replace(/\D/g, "").slice(0, 4);
  if (digitsOnly.length <= 2) {
    return digitsOnly;
  }
  return `${digitsOnly.slice(0, 2)}:${digitsOnly.slice(2)}`;
};

const QUIET_PERIOD_DEBOUNCE_MS = 600;

const PrivacyScreen: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const { isDark } = useAppTheme();
  const [privacySettings, setPrivacySettings] = useState<PrivacySettings>({
    anonymousStatistics: true,
    showInCompanyContactSearch: true,
  });
  const [isLoadingPrivacySettings, setIsLoadingPrivacySettings] = useState(true);
  const [isClearingSearchHistory, setIsClearingSearchHistory] = useState(false);
  const [isClearingCachedData, setIsClearingCachedData] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const hydratePrivacySettings = async () => {
      try {
        const settings = await loadPrivacySettings();
        if (isMounted) {
          setPrivacySettings(settings);
        }
      } finally {
        if (isMounted) {
          setIsLoadingPrivacySettings(false);
        }
      }
    };

    void hydratePrivacySettings();

    return () => {
      isMounted = false;
    };
  }, []);

  const updatePrivacySetting = useCallback(
    async (key: keyof PrivacySettings, value: boolean) => {
      const nextSettings = { ...privacySettings, [key]: value };
      setPrivacySettings(nextSettings);

      try {
        await savePrivacySettings(nextSettings);
      } catch (error) {
        console.error("Ошибка сохранения настроек конфиденциальности:", error);
        setPrivacySettings(privacySettings);
      }
    },
    [privacySettings],
  );

  const handleClearSearchHistory = useCallback(async () => {
    if (isClearingSearchHistory) return;

    setIsClearingSearchHistory(true);
    try {
      await clearSearchHistory();
    } catch (error) {
      console.error("Ошибка очистки истории поиска:", error);
    } finally {
      setIsClearingSearchHistory(false);
    }
  }, [isClearingSearchHistory]);

  const handleClearCachedData = useCallback(async () => {
    if (isClearingCachedData) return;

    setIsClearingCachedData(true);
    try {
      await clearRecentlyViewedCache();
    } catch (error) {
      console.error("Ошибка очистки кэшированных данных:", error);
    } finally {
      setIsClearingCachedData(false);
    }
  }, [isClearingCachedData]);

  return (
    <View style={styles.fullScreenContent}>
      <ModalHeader
        title="Конфиденциальность"
        showBackButton={true}
        onBackPress={onBack}
      />

      <ScrollView
        style={styles.notificationsScrollView}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.privacyScrollContent}
      >
        <ThemedView
          lightColor="#FFFFFF"
          darkColor="#151516"
          style={styles.privacyCard}
        >
          {isLoadingPrivacySettings ? (
            <View style={styles.loaderContainer}>
              <ActivityIndicator
                size="large"
                color={isDark ? "#FBFCFF" : "#203686"}
              />
            </View>
          ) : (
            <>
              <View style={styles.privacyOptionRow}>
                <CustomCheckbox
                  value={privacySettings.anonymousStatistics}
                  onValueChange={(value: boolean) =>
                    void updatePrivacySetting("anonymousStatistics", value)
                  }
                  style={undefined}
                  lightColor={"#F2F4F7"}
                  darkColor={"#202022"}
                  disabled={isLoadingPrivacySettings}
                />
                <ThemedText
                  lightColor="#1B1B1C"
                  darkColor="#FBFCFF"
                  style={styles.privacyCheckboxLabel}
                >
                  Сбор анонимной статистики для улучшения сервиса
                </ThemedText>
              </View>

              <View
                style={[
                  styles.privacyDivider,
                  { backgroundColor: isDark ? "#252527" : "#F0F3F7" },
                ]}
              />

              <View style={styles.privacyOptionRow}>
                <CustomCheckbox
                  value={privacySettings.showInCompanyContactSearch}
                  onValueChange={(value: boolean) =>
                    void updatePrivacySetting("showInCompanyContactSearch", value)
                  }
                  style={undefined}
                  lightColor={"#F2F4F7"}
                  darkColor={"#202022"}
                  disabled={isLoadingPrivacySettings}
                />
                <ThemedText
                  lightColor="#1B1B1C"
                  darkColor="#FBFCFF"
                  style={styles.privacyCheckboxLabel}
                >
                  Показывать меня в поиске контактов компании
                </ThemedText>
              </View>
            </>
          )}
        </ThemedView>

        <ThemedView
          lightColor="#FFFFFF"
          darkColor="#151516"
          style={styles.privacyCard}
        >
          <View style={styles.privacyActionsGroup}>
            <TouchableOpacity
              style={[
                styles.privacyActionButton,
                isDark && styles.privacyActionButtonDark,
              ]}
              activeOpacity={0.7}
              onPress={() => void handleClearSearchHistory()}
              disabled={isClearingSearchHistory}
            >
              {isClearingSearchHistory ? (
                <ActivityIndicator
                  size="small"
                  color={isDark ? "#FBFCFF" : "#203686"}
                />
              ) : (
                <ThemedText style={{fontWeight: '500', fontSize: 16}} lightColor="#1B1B1C" darkColor="#FBFCFF">
                  Очистить историю поиска
                </ThemedText>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.privacyActionButton,
                isDark && styles.privacyActionButtonDark,
              ]}
              activeOpacity={0.7}
              onPress={() => void handleClearCachedData()}
              disabled={isClearingCachedData}
            >
              {isClearingCachedData ? (
                <ActivityIndicator
                  size="small"
                  color={isDark ? "#FBFCFF" : "#203686"}
                />
              ) : (
                <ThemedText style={{fontWeight: '500', fontSize: 16}} lightColor="#1B1B1C" darkColor="#FBFCFF">
                  Удалить все кэшированные данные
                </ThemedText>
              )}
            </TouchableOpacity>
          </View>
        </ThemedView>
      </ScrollView>
    </View>
  );
};

// Компонент уведомлений
const NotificationsScreen: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const { isDark } = useAppTheme();
  const dispatch = useAppDispatch();
  const {
    pushSettings,
    isLoadingPushSettings,
    isUpdatingPushPreference,
    quietPeriodSettings,
    isLoadingQuietPeriodSettings,
    isUpdatingQuietPeriodSettings,
  } = useAppSelector((state) => state.auth);
  const [quietStartTime, setQuietStartTime] = useState("22:00");
  const [quietEndTime, setQuietEndTime] = useState("08:00");
  const isHydratingQuietPeriodRef = useRef(true);

  useEffect(() => {
    dispatch(getPushSettings());
    dispatch(getQuietPeriodSettings());
  }, [dispatch]);

  useEffect(() => {
    if (!quietPeriodSettings) return;

    isHydratingQuietPeriodRef.current = true;
    setQuietStartTime(formatQuietTimeForDisplay(quietPeriodSettings.startTime));
    setQuietEndTime(formatQuietTimeForDisplay(quietPeriodSettings.endTime));

    const timeoutId = setTimeout(() => {
      isHydratingQuietPeriodRef.current = false;
    }, 0);

    return () => clearTimeout(timeoutId);
  }, [
    quietPeriodSettings?.startTime,
    quietPeriodSettings?.endTime,
    quietPeriodSettings?.isEnabled,
  ]);

  const toggleNotification = (pushNotificationType: number, isEnabled: boolean) => {
    dispatch(
      updatePushPreference({
        pushNotificationType,
        isEnabled: !isEnabled,
      }),
    );
  };

  const persistQuietPeriod = useCallback(
    (nextSettings: {
      isEnabled: boolean;
      startTime: string;
      endTime: string;
    }) => {
      dispatch(
        updateQuietPeriodSettings(
          buildQuietPeriodPayload({
            isEnabled: nextSettings.isEnabled,
            startTime: nextSettings.startTime,
            endTime: nextSettings.endTime,
          }),
        ),
      );
    },
    [dispatch],
  );

  const handleQuietModeToggle = (isEnabled: boolean) => {
    if (!quietPeriodSettings || isUpdatingQuietPeriodSettings) return;

    persistQuietPeriod({
      isEnabled,
      startTime: quietStartTime,
      endTime: quietEndTime,
    });
  };

  useEffect(() => {
    if (
      isHydratingQuietPeriodRef.current ||
      !quietPeriodSettings?.isEnabled ||
      isLoadingQuietPeriodSettings
    ) {
      return;
    }

    if (!isValidQuietTime(quietStartTime) || !isValidQuietTime(quietEndTime)) {
      return;
    }

    const serverStart = formatQuietTimeForDisplay(quietPeriodSettings.startTime);
    const serverEnd = formatQuietTimeForDisplay(quietPeriodSettings.endTime);

    if (quietStartTime === serverStart && quietEndTime === serverEnd) {
      return;
    }

    const timeoutId = setTimeout(() => {
      if (isUpdatingQuietPeriodSettings) return;

      persistQuietPeriod({
        isEnabled: quietPeriodSettings.isEnabled,
        startTime: quietStartTime,
        endTime: quietEndTime,
      });
    }, QUIET_PERIOD_DEBOUNCE_MS);

    return () => clearTimeout(timeoutId);
  }, [
    quietStartTime,
    quietEndTime,
    quietPeriodSettings,
    isLoadingQuietPeriodSettings,
    isUpdatingQuietPeriodSettings,
    persistQuietPeriod,
  ]);

  const isQuietModeEnabled = quietPeriodSettings?.isEnabled ?? false;
  const insets = useSafeAreaInsets();
  const bottomInset = Math.max(insets.bottom, 16);
  const {
    scrollRef: quietPeriodScrollRef,
    keyboardHeight: quietPeriodKeyboardHeight,
    handleScroll: handleQuietPeriodScroll,
    onInputFocus: handleQuietInputFocus,
  } = useKeyboardAwareScroll({ enabled: true });

  const quietPeriodKeyboardPadding =
    quietPeriodKeyboardHeight > 0
      ? Platform.OS === "android"
        ? Math.round(quietPeriodKeyboardHeight * 0.99)
        : 24
      : 0;

  return (
    <View style={styles.fullScreenContent}>
      <ModalHeader
        title="Уведомления"
        showBackButton={true}
        onBackPress={onBack}
      />

      <KeyboardAvoidingView
        style={styles.notificationsKeyboardAvoiding}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 12 : 0}
      >
        <ScrollView
          ref={quietPeriodScrollRef}
          style={styles.notificationsScrollView}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          onScroll={handleQuietPeriodScroll}
          scrollEventThrottle={16}
          contentContainerStyle={{
            flexGrow: 1,
            paddingBottom: bottomInset + quietPeriodKeyboardPadding,
          }}
        >
      <ThemedView
        lightColor="#FFFFFF"
        darkColor="#151516"
        style={styles.paymentsMainContainer}
      >
        <ThemedText
          style={styles.formSubtitle}
          type="subtitle"
          lightColor="#1B1B1C"
          darkColor="#FBFCFF"
        >
          Типы уведомлений
        </ThemedText>

        <View style={styles.formGroup}>
          {isLoadingPushSettings ? (
            <View style={styles.loaderContainer}>
              <ActivityIndicator
                size="large"
                color={isDark ? "#FBFCFF" : "#203686"}
              />
              <ThemedText
                lightColor="#80818B"
                darkColor="#FBFCFF80"
                style={styles.loaderText}
              >
                Загрузка настроек...
              </ThemedText>
            </View>
          ) : (
            pushSettings.map((item) => (
              <View style={styles.checkboxRow} key={item.pushNotificationType}>
                <CustomCheckbox
                  value={item.isEnabled}
                  onValueChange={() =>
                    toggleNotification(item.pushNotificationType, item.isEnabled)
                  }
                  style={undefined}
                  lightColor={"#F2F4F7"}
                  darkColor={"#202022"}
                  disabled={isUpdatingPushPreference}
                />
                <ThemedText style={styles.defText} lightColor="#1B1B1C" darkColor="#FBFCFF">
                  {item.name}
                </ThemedText>
              </View>
            ))
          )}
        </View>
      </ThemedView>

      <ThemedView
        lightColor="#FFFFFF"
        darkColor="#151516"
        style={styles.paymentsMainContainer}
      >
        {isLoadingQuietPeriodSettings || !quietPeriodSettings ? (
          <View style={styles.loaderContainer}>
            <ActivityIndicator
              size="large"
              color={isDark ? "#FBFCFF" : "#203686"}
            />
            <ThemedText
              lightColor="#80818B"
              darkColor="#FBFCFF80"
              style={styles.loaderText}
            >
              Загрузка тихого периода...
            </ThemedText>
          </View>
        ) : (
          <>
            <View style={styles.documentRow}>
              <ThemedText style={{fontWeight: '500', fontSize: 16}} lightColor="#1B1B1C" darkColor="#FBFCFF">
                Включить тихий период
              </ThemedText>
              <AppSwitch
                value={isQuietModeEnabled}
                onValueChange={handleQuietModeToggle}
                isDark={isDark}
                disabled={isUpdatingQuietPeriodSettings}
              />
            </View>
            <ThemedText
              style={styles.infoText}
              lightColor="#80818B"
              darkColor="#FBFCFF80"
            >
              В это время уведомления будут приходить без звука и вибрации
            </ThemedText>
            {isQuietModeEnabled ? (
              <View style={styles.quietTimeRow}>
                <AnimatedTextInput
                  placeholder="Не беспокоить с:"
                  value={quietStartTime}
                  onChangeText={(text) => setQuietStartTime(formatTimeValue(text))}
                  keyboardType="number-pad"
                  maxLength={5}
                  style={styles.quietTimeInput}
                  disabled={isUpdatingQuietPeriodSettings}
                  onFocus={handleQuietInputFocus}
                />
                <AnimatedTextInput
                  placeholder="До"
                  value={quietEndTime}
                  onChangeText={(text) => setQuietEndTime(formatTimeValue(text))}
                  keyboardType="number-pad"
                  maxLength={5}
                  style={styles.quietTimeInput}
                  disabled={isUpdatingQuietPeriodSettings}
                  onFocus={handleQuietInputFocus}
                />
              </View>
            ) : null}
            {isUpdatingQuietPeriodSettings ? (
              <View style={styles.updatingRow}>
                <ActivityIndicator
                  size="small"
                  color={isDark ? "#4C94FF" : "#203686"}
                />
              </View>
            ) : null}
          </>
        )}
      </ThemedView>

      {/* <ThemedView
        lightColor="#FFFFFF"
        darkColor="#151516"
        style={[styles.paymentsMainContainer, { flex: 1 }]}
      >
        <ThemedText
          style={styles.formSubtitle}
          type="subtitle"
          lightColor="#1B1B1C"
          darkColor="#FBFCFF"
        >
          Способ доставки
        </ThemedText>

        <TouchableOpacity
          style={styles.radioOption}
          onPress={() => setDeliveryMethod("push")}
          activeOpacity={0.7}
        >
          <View style={styles.radioCircle}>
            {deliveryMethod === "push" && <View style={styles.radioSelected} />}
          </View>
          <ThemedText
            lightColor="#1B1B1C"
            darkColor="#FBFCFF"
            style={styles.radioLabel}
          >
            Только push-уведомления
          </ThemedText>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.radioOption}
          onPress={() => setDeliveryMethod("email")}
          activeOpacity={0.7}
        >
          <View style={styles.radioCircle}>
            {deliveryMethod === "email" && (
              <View style={styles.radioSelected} />
            )}
          </View>
          <ThemedText
            lightColor="#1B1B1C"
            darkColor="#FBFCFF"
            style={styles.radioLabel}
          >
            Push + email
          </ThemedText>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.radioOption}
          onPress={() => setDeliveryMethod("sms")}
          activeOpacity={0.7}
        >
          <View style={styles.radioCircle}>
            {deliveryMethod === "sms" && <View style={styles.radioSelected} />}
          </View>
          <ThemedText
            lightColor="#1B1B1C"
            darkColor="#FBFCFF"
            style={styles.radioLabel}
          >
            Push + SMS
          </ThemedText>
        </TouchableOpacity>
      </ThemedView> */}
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

export const MySettingsModal: React.FC<MySettingsProps> = ({
  visible,
  onClose,
}) => {
  const { themeMode, setThemeMode, isDark } = useAppTheme();
  const [showNotifications, setShowNotifications] = useState<boolean>(false);
  const [showPrivacy, setShowPrivacy] = useState<boolean>(false);
  const [showTownModal, setShowTownModal] = useState(false);
  const [hasAuthToken, setHasAuthToken] = useState(false);
  const dispatch = useAppDispatch();
  const effectiveStorageId = useAppSelector(selectEffectiveStorageId);
  const selectedTownName = useAppSelector((state) =>
    selectTownNameByStorageId(state, effectiveStorageId),
  );

  useEffect(() => {
    if (!visible) return;
    void AsyncStorage.getItem("token").then((token) => {
      setHasAuthToken(Boolean(token));
    });
    dispatch(getTowns());
  }, [visible, dispatch]);

  const handleCloseAll = () => {
    setShowNotifications(false);
    setShowPrivacy(false);
    setShowTownModal(false);
    onClose();
  };

  if (showPrivacy) {
    return (
      <AppModal
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
          <PrivacyScreen onBack={() => setShowPrivacy(false)} />
        </ThemedView>
      </AppModal>
    );
  }

  if (showNotifications) {
    return (
      <AppModal
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
          <NotificationsScreen onBack={() => setShowNotifications(false)} />
        </ThemedView>
      </AppModal>
    );
  }

  return (
    <AppModal
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
          title="Настройки"
          showBackButton={true}
          onBackPress={handleCloseAll}
        />

        <ThemedView
          lightColor="#FFFFFF"
          darkColor="#151516"
          style={[styles.paymentsPreviewContainer, { flex: 1 }]}
        >
          <ThemedText style={styles.titleBlock} lightColor="#1B1B1C" darkColor="#FBFCFF">
            Город
          </ThemedText>

          <TouchableOpacity
            onPress={() => setShowTownModal(true)}
            activeOpacity={0.7}
          >
            <View style={styles.documentRow}>
              <View style={{ flex: 1, paddingRight: 12 }}>
                <ThemedText style={styles.menuText} lightColor="#1B1B1C" darkColor="#FBFCFF">
                  {selectedTownName || "Выберите город"}
                </ThemedText>
                {!effectiveStorageId ? (
                  <ThemedText
                    style={styles.cityHint}
                    lightColor="#80818B"
                    darkColor="#FBFCFF80"
                  >
                    Нужен для отображения наличия товаров
                  </ThemedText>
                ) : null}
              </View>
              <ArrowIconRight />
            </View>
          </TouchableOpacity>

          <View
            style={[
              styles.divider,
              { backgroundColor: isDark ? "#252527" : "#F0F3F7" },
            ]}
          />

          <ThemedText style={styles.titleBlock} lightColor="#1B1B1C" darkColor="#FBFCFF">
            Внешний вид
          </ThemedText>

          <View style={styles.documentRow}>
            <ThemedText  style={styles.menuText} lightColor="#1B1B1C" darkColor="#FBFCFF">
              Темная тема
            </ThemedText>
            <AppSwitch
              value={isDark}
              onValueChange={(value) => setThemeMode(value ? "dark" : "light")}
              isDark={isDark}
            />
          </View>

          <View style={styles.documentRow}>
            <ThemedText  style={styles.menuText} lightColor="#1B1B1C" darkColor="#FBFCFF">
              Системная тема
            </ThemedText>
            <AppSwitch
              value={themeMode === "system"}
              onValueChange={(value) =>
                setThemeMode(value ? "system" : "light")
              }
              isDark={isDark}
            />
          </View>

          <View
            style={[
              styles.divider,
              { backgroundColor: isDark ? "#252527" : "#F0F3F7" },
            ]}
          />

          <ThemedText style={styles.titleBlock} lightColor="#1B1B1C" darkColor="#FBFCFF">
            Типы уведомлений
          </ThemedText>

          <TouchableOpacity
            onPress={() => setShowNotifications(true)}
            activeOpacity={0.7}
          >
            <View style={styles.documentRow}>
              <ThemedText  style={styles.menuText} lightColor="#1B1B1C" darkColor="#FBFCFF">
                Уведомления
              </ThemedText>
              <ArrowIconRight />
            </View>
          </TouchableOpacity>

          <View
            style={[
              styles.divider,
              { backgroundColor: isDark ? "#252527" : "#F0F3F7" },
            ]}
          />

          <ThemedText style={styles.titleBlock} lightColor="#1B1B1C" darkColor="#FBFCFF">
            Конфиденциальность
          </ThemedText>

          <TouchableOpacity
            onPress={() => setShowPrivacy(true)}
            activeOpacity={0.7}
          >
            <View style={styles.documentRow}>
              <ThemedText  style={styles.menuText} lightColor="#1B1B1C" darkColor="#FBFCFF">
                Конфиденциальность
              </ThemedText>
              <ArrowIconRight />
            </View>
          </TouchableOpacity>

          {/* <TouchableOpacity
            onPress={() => setShowNotifications(true)}
            activeOpacity={0.7}
          >
            <View style={styles.documentRow}>
              <ThemedText lightColor="#1B1B1C" darkColor="#FBFCFF">
                Корзина и заказы
              </ThemedText>
              <ArrowIconRight />
            </View>
          </TouchableOpacity> */}
        </ThemedView>
      </ThemedView>

      <TownSelectionModal
        stacked
        visible={showTownModal}
        onClose={() => setShowTownModal(false)}
        storageId={effectiveStorageId || ""}
        localOnly={!hasAuthToken}
        onTownSelected={() => {
          setShowTownModal(false);
        }}
      />
    </AppModal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
  },
  fullScreenContent: {
    flex: 1,
  },
  notificationsKeyboardAvoiding: {
    flex: 1,
  },
  notificationsScrollView: {
    flex: 1,
  },
  privacyScrollContent: {
    flexGrow: 1,
    // paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 24,
    gap: 8,
  },
  privacyCard: {
    borderRadius: 16,
    overflow: "hidden",
  },
  privacyOptionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 18,
  },
  privacyDivider: {
    height: 1,
    marginLeft: 44,
  },
  privacyActionsGroup: {
    padding: 16,
    gap: 8,
  },
  privacyCheckboxLabel: {
    flex: 1,
    fontSize: 16,
    fontWeight: "500",
    lineHeight: 22,
  },
  privacyActionButton: {
    backgroundColor: "#F0F3F7",
    borderRadius: 12,
    paddingVertical: 18,
    paddingHorizontal: 16,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 56,
  },
  privacyActionButtonDark: {
    backgroundColor: "#252527",
  },
  paymentsMainContainer: {
    paddingHorizontal: 16,
    borderRadius: 16,
    marginVertical: 8,
    position: "relative",
  },
  paymentsPreviewContainer: {
    borderRadius: 16,
    padding: 16,
    marginTop: 8,
  },
  documentRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 18,
  },
  menuText:{
    fontWeight: '500',
    fontSize: 16
  },
  cityHint: {
    marginTop: 2,
    fontSize: 13,
    lineHeight: 18,
  },
  titleBlock:{
    fontWeight: "600",
    fontSize:20,
  },
  divider: {
    height: 1,
    marginVertical: 16,
  },
  formSubtitle: {
    marginTop: 16,
    marginBottom: 16,
  },
  formGroup: {
    marginBottom: 20,
    gap: 20,
  },
  checkboxRow: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
  },
  defText:{
    fontWeight: '500',
    fontSize: 16
  },
  loaderContainer: {
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    paddingVertical: 32,
    paddingHorizontal: 16,
    minHeight: 120,
    width: "100%",
  },
  loaderText: {
    fontSize: 14,
    fontWeight: "500",
    textAlign: "center",
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
  infoText: {
    fontSize: 14,
    fontWeight: "500",
    marginTop: 6,
    marginBottom: 12
  },
  quietTimeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 14,
  },
  quietTimeInput: {
    flex: 1,
    height: 48,
  },
  updatingRow: {
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  appSwitchTrack: {
    width: SWITCH_TRACK_WIDTH,
    height: SWITCH_TRACK_HEIGHT,
    borderRadius: SWITCH_TRACK_HEIGHT / 2,
    overflow: "hidden",
    position: "relative",
  },
  appSwitchThumb: {
    position: "absolute",
    top: SWITCH_THUMB_OFFSET,
    left: SWITCH_THUMB_OFFSET,
    width: SWITCH_THUMB_WIDTH,
    height: SWITCH_THUMB_HEIGHT,
    borderRadius: 100,
    backgroundColor: "#FBFCFF",
  },
});
