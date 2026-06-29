import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";

import {
  ArrowIconRight,
  BoxIcon,
  ExitIcon,
  FinanceAndDocksIcon,
  IconGeo,
  ICricleIcon,
  MenuRefreshIcon,
  OrderReminderIcon,
  PencilIcon,
  PushNotificationIcon,
  SettingsIcon
} from "@/assets/icons/icons";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Fonts } from "@/constants/theme";
import {
  clearAuthState,
  getCategoryItems,
  getOrderReminderSettings,
  getPushesThunk,
  getSliderItems,
  getUncheckedPushesCountThunk,
  setCompany,
} from "@/features/auth/authSlice";
import { LoginModal } from "@/features/auth/ui/components/LoginModal";
import { clearCatalogState } from "@/features/catalog/catalogSlice";
import { axdef } from "@/features/shared/services/axios";
import { CompanySelectModal } from "@/features/shared/ui/CompanySelectModal";
import { HelpModal } from "@/features/shared/ui/HelpModal";
import ManagerSection from "@/features/shared/ui/ManagerSection";
import { MyFinanceModal } from "@/features/shared/ui/MyFInance";
import { MyOrdersModal } from "@/features/shared/ui/MyOrders";
import { MyReturnsModal } from "@/features/shared/ui/MyReturns";
import { MySettingsModal } from "@/features/shared/ui/MySettings";
import { OrderReminderModal } from "@/features/shared/ui/OrderReminderModal";
import { ProfileEditModal } from "@/features/shared/ui/ProfileEditModal";
import { PushNotificationsModal } from "@/features/shared/ui/PushNotificationsModal";
import {
  formatPhoneProfile,
  isEmailLogin,
} from "@/features/shared/utils/phoneLinking";
import { MyTemplatesModal } from "@/features/templates/MyTemplatesModal";
import { useTemplatePicker } from "@/features/templates/TemplatePickerContext";
import { useAppTheme } from "@/hooks/use-theme-color";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import AsyncStorage from "@react-native-async-storage/async-storage";

type StoredCompany = {
  id?: string;
  name?: string;
  type?: string;
};

export default function TabTwoScreen() {
  const { currentTheme, isDark: isDarkMode } = useAppTheme();
  console.log("colorScheme", currentTheme);
  const me = useAppSelector((state) => state.auth.me);
  const dispatch = useAppDispatch();
  const router = useRouter();
  const [authChecked, setAuthChecked] = useState(false);
  const [loginModalVisible, setLoginModalVisible] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [myOrderModalVisible, setMyOrderModalVisible] = useState(false);
  const [returnsModalVisible, setReturnsModalVisible] = useState(false);
  const [templatesModalVisible, setTemplatesModalVisible] = useState(false);
  const [financeModalVisible, setFinanceModalVisible] = useState(false);
  const [orderReminderModalVisible, setOrderReminderModalVisible] =
    useState(false);
  const [settingsModalVisible, setSettingsModalVisible] = useState(false);
  const [helpModalVisible, setHelpModalVisible] = useState(false);
  const [pushesModalVisible, setPushesModalVisible] = useState(false);
  const [hasAuthToken, setHasAuthToken] = useState(false);
  const pageSize = 10;

  const { resumeDetailTemplateId } = useTemplatePicker();
  const [profileData, setProfileData] = useState({
    name: "",
    surname: "",
    email: "",
    phone: "",
    avatar: null as string | null,
    coverColor: "#ACCBEE",
  });
  const currentCompany = useAppSelector((state) => state.auth.currentCompany);
  const { pushes, isLoadingPushes, hasMorePushes, uncheckedPushesCount } = useAppSelector(
    (state) => state.auth,
  );
  const {
    orderReminderSettings,
    isLoadingOrderReminderSettings,
  } = useAppSelector((state) => state.auth);
  const [storedCompany, setStoredCompany] = useState<StoredCompany | null>(null);

  useEffect(() => {
    if (!hasAuthToken) {
      setStoredCompany(null);
      return;
    }

    const loadStoredCompany = async () => {
      try {
        const rawCompany = await AsyncStorage.getItem("company");
        if (!rawCompany) {
          setStoredCompany(null);
          return;
        }

        const parsedCompany = JSON.parse(rawCompany);
        setStoredCompany(parsedCompany);
      } catch (error) {
        console.error("Error loading company from storage:", error);
      }
    };

    loadStoredCompany();
  }, [currentCompany, hasAuthToken]);

  // Загружаем сохраненные данные профиля
  useEffect(() => {
    const loadProfileData = async () => {
      try {
        const savedColorId = await AsyncStorage.getItem("profileCoverColorId");
        const savedAvatar = await AsyncStorage.getItem("profileAvatar");

        // Маппинг ID цветов в первый цвет градиента для фона
        const colorToGradientFirst = {
          light1: "#ACCBEE",
          light2: "#EEACCF",
          light3: "#ACEECC",
          light4: "#EEE2AC",
          light5: "#CED0D4",
          dark1: "#697D93",
          dark2: "#865F74",
          dark3: "#5A7165",
          dark4: "#8B8670",
          dark5: "#515257",
        };

        const coverColor = savedColorId
          ? colorToGradientFirst[
              savedColorId as keyof typeof colorToGradientFirst
            ] || "#ACCBEE"
          : "#ACCBEE";

        setProfileData((prev) => ({
          ...prev,
          coverColor: coverColor,
          avatar: savedAvatar || null,
        }));
      } catch (error) {
        console.error("Error loading profile data:", error);
      }
    };

    loadProfileData();
  }, []);

  const handleSaveProfile = async (data: any) => {
    try {
      // Сохраняем в AsyncStorage
      if (data.avatar) {
        await AsyncStorage.setItem("profileAvatar", data.avatar);
      }
      await AsyncStorage.setItem("profileCoverColorId", data.coverColor);

      // Маппинг ID цветов в первый цвет градиента для фона
      const colorToGradientFirst = {
        light1: "#ACCBEE",
        light2: "#EEACCF",
        light3: "#ACEECC",
        light4: "#EEE2AC",
        light5: "#CED0D4",
        dark1: "#697D93",
        dark2: "#865F74",
        dark3: "#5A7165",
        dark4: "#8B8670",
        dark5: "#515257",
      };

      const coverColor =
        colorToGradientFirst[
          data.coverColor as keyof typeof colorToGradientFirst
        ] || "#ACCBEE";

      // Обновляем локальное состояние
      setProfileData((prev) => ({
        ...prev,
        name: data.name,
        surname: data.surname,
        avatar: data.avatar,
        coverColor: coverColor,
      }));

      setEditModalVisible(false);
    } catch (error) {
      console.error("Error saving profile:", error);
    }
  };

  // Обновляем данные когда меняется me
  useEffect(() => {
    if (me && hasAuthToken) {
      const isIndividualCompany = storedCompany?.type === "individual";
      const individualProfile = me.individualProfile;
      const nameParts = getDisplayName().split(" ");

      setProfileData((prev) => ({
        ...prev,
        name: isIndividualCompany
          ? individualProfile?.firstName || ""
          : storedCompany?.name || currentCompany?.name || nameParts[0] || "",
        surname: isIndividualCompany ? individualProfile?.lastName || "" : "",
        email: me?.email || "",
        phone: me?.login || me?.phoneNumber || "",
      }));
    }
  }, [me, storedCompany, currentCompany, hasAuthToken]);

  const handleClosePress = async () => {
    const token = await AsyncStorage.getItem("token");
    if (token) {
      setHasAuthToken(true);
      setAuthChecked(true);
      setLoginModalVisible(false);
      return;
    }
    router.replace("/");
    setLoginModalVisible(false);
  };

  const handleLogin = async (phoneNumber: string) => {
    console.log("Login with:", phoneNumber);
    const token = await AsyncStorage.getItem("token");
    setHasAuthToken(Boolean(token));
    setAuthChecked(true);
    setLoginModalVisible(!token);
  };

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;

      const checkTokenAndLoad = async () => {
        const token = await AsyncStorage.getItem("token");
        if (cancelled) return;

        const authenticated = Boolean(token);
        setHasAuthToken(authenticated);
        setLoginModalVisible(!authenticated);
        setAuthChecked(true);
      };

      if (!hasAuthToken) {
        setAuthChecked(false);
      }

      void checkTokenAndLoad();

      return () => {
        cancelled = true;
      };
    }, [hasAuthToken]),
  );

  useFocusEffect(
    useCallback(() => {
      if (resumeDetailTemplateId && hasAuthToken && authChecked) {
        setTemplatesModalVisible(true);
      }
    }, [resumeDetailTemplateId, hasAuthToken, authChecked]),
  );

  useFocusEffect(
    useCallback(() => {
      if (!hasAuthToken) return;
      dispatch(getUncheckedPushesCountThunk());
    }, [dispatch, hasAuthToken]),
  );

  useFocusEffect(
    useCallback(() => {
      if (!hasAuthToken) return;
      dispatch(getOrderReminderSettings());
    }, [dispatch, hasAuthToken]),
  );

  const handleLoadMorePushes = useCallback(() => {
    if (isLoadingPushes || !hasMorePushes) return;

    dispatch(
      getPushesThunk({
        offset: pushes.length,
        count: pageSize,
        isLoadMore: true,
        check: true,

      }),
    );
  }, [dispatch, hasMorePushes, isLoadingPushes, pushes.length]);

  const handleOpenPushes = useCallback(async () => {
    if (!hasAuthToken) return;

    setPushesModalVisible(true);
    await dispatch(
      getPushesThunk({
        offset: 0,
        count: pageSize,
        check: true,
      }),
    );
    dispatch(getUncheckedPushesCountThunk());
  }, [dispatch, hasAuthToken]);

  const handleLogout = async () => {
    try {
      try {
        const deviceId = await AsyncStorage.getItem("device_id");
        await axdef.post("/api/Account/logout", {
          deviceId: deviceId || "",
        });
      } catch (logoutError) {
        console.error("Ошибка при вызове logout API:", logoutError);
      }

      dispatch(clearAuthState());
      dispatch(clearCatalogState());
      await AsyncStorage.clear();
      setHasAuthToken(false);
      await Promise.all([
        dispatch(getCategoryItems("")).unwrap(),
        dispatch(getSliderItems("")).unwrap(),
      ]);
      setEditModalVisible(false);
      router.replace("/");
    } catch (error) {
      console.error("Ошибка при очистке AsyncStorage:", error);
    }
  };

  const handleSelectCompany = async (company: any) => {
    console.log("Selected company:", company);
    dispatch(setCompany(company));
    setModalVisible(false);
  };

  const getDisplayName = () => {
    if (!authChecked || !hasAuthToken) {
      return "";
    }

    if (storedCompany?.name) {
      return storedCompany.name;
    }

    if (!me) return "";

    if (currentCompany?.name) {
      return currentCompany.name;
    }

    if (me.companies?.length > 0) {
      return me.companies[0]?.name || "";
    }

    const profile = me.individualProfile;
    if (!profile) return "";

    return `${profile.lastName || ""} ${profile.firstName || ""} ${profile.patronymic || ""}`.trim();
  };

  const isIndividualSelected =
    hasAuthToken && storedCompany?.type === "individual";
  const profileTitle = getDisplayName();
  const profileSubtitle = useMemo(() => {
    if (!hasAuthToken) return "";
    const login = me?.login || "";
    if (!login) return "";
    return isEmailLogin(login) ? login : formatPhoneProfile(login);
  }, [hasAuthToken, me?.login]);
  const showProfileContent = authChecked && hasAuthToken;

  return (
    <>
      {showProfileContent ? (
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Используем View с градиентом и дополнительными настройками для Android */}
        <View style={styles.gradientWrapper}>
          <LinearGradient
            colors={[profileData.coverColor, "#E7F0FD"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.gradientContainer}
            // Добавляем locations для лучшего рендеринга на Android
            locations={[0, 1]}
          >
            {/* Иконка карандаша */}
            <View style={styles.topActions}>
              <TouchableOpacity
                style={styles.notificationIconContainer}
                onPress={handleOpenPushes}
                activeOpacity={0.8}
              >
                <PushNotificationIcon width={24} height={24} color="#1B1B1C" />
                {uncheckedPushesCount > 0 ? (
                  <View style={styles.pushesBadge}>
                    <ThemedText style={styles.pushesBadgeText}>
                      {uncheckedPushesCount > 10 ? "10+" : uncheckedPushesCount}
                    </ThemedText>
                  </View>
                ) : null}
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.pencilIconContainer}
                onPress={() => setEditModalVisible(true)}
              >
                <PencilIcon width={24} height={24} fill="#1B1B1C" />
              </TouchableOpacity>
            </View>

            {/* Белый блок с фото профиля */}
            <ThemedView style={styles.whiteProfileCard}>
              <View style={styles.profileImageContainer}>
                {profileData.avatar ? (
                  <Image
                    source={{ uri: profileData.avatar }}
                    style={styles.profileImage}
                  />
                ) : (
                  <View
                    style={[
                      styles.profileImagePlaceholder,
                      { backgroundColor: profileData.coverColor },
                    ]}
                  >
                    <ThemedText
                      weight="bold"
                      style={styles.profileImagePlaceholderText}
                    >
                      {profileData.name?.charAt(0) || ""}
                      {profileData.surname?.charAt(0) || ""}
                    </ThemedText>
                  </View>
                )}
              </View>
              <ThemedView style={styles.profileInfo}>
                <ThemedText style={styles.profileName}>{profileTitle}</ThemedText>
                <ThemedText style={styles.profileEmail}>{profileSubtitle}</ThemedText>
              </ThemedView>
            </ThemedView>
          </LinearGradient>
        </View>
        {hasAuthToken ? (
          <ThemedView style={styles.managerCard}>
            <ManagerSection />
          </ThemedView>
        ) : null}

        {/* Информационные блоки */}
        <ThemedView style={styles.infoCard}>
          <View style={styles.infoContainer}>
            {!isIndividualSelected ? (
              <TouchableOpacity
                style={styles.infoRow}
                onPress={() => setModalVisible(true)}
              >
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
                  <ThemedText lightColor="#1B1B1C" style={styles.infoLabel}>
                    Мои компании
                  </ThemedText>
                  <View style={styles.infoValueContainer}>
                    <ArrowIconRight />
                  </View>
                </View>
              </TouchableOpacity>
            ) : null}

            <TouchableOpacity
              style={styles.infoRow}
              onPress={() => setMyOrderModalVisible(true)}
            >
              <ThemedView
                lightColor="#F2F4F7"
                darkColor="#202022"
                style={styles.iconPlaceholder}
              >
                <BoxIcon />
              </ThemedView>
              <View
                style={[
                  styles.infoContent,
                  isDarkMode && {
                    borderColor: "#252527",
                  },
                ]}
              >
                <ThemedText lightColor="#1B1B1C" style={styles.infoLabel}>
                  Мои заказы
                </ThemedText>
                <View style={styles.infoValueContainer}>
                  <ArrowIconRight />
                </View>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.infoRow}
              onPress={() => setReturnsModalVisible(true)}
            >
              <ThemedView
                lightColor="#F2F4F7"
                darkColor="#202022"
                style={styles.iconPlaceholder}
              >
                <MenuRefreshIcon />
              </ThemedView>
              <View
                style={[
                  styles.infoContent,
                  isDarkMode && {
                    borderColor: "#252527",
                  },
                ]}
              >
                <ThemedText lightColor="#1B1B1C" style={styles.infoLabel}>
                  Возвраты
                </ThemedText>
                <View style={styles.infoValueContainer}>
                  <ArrowIconRight />
                </View>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.infoRow}
              onPress={() => setTemplatesModalVisible(true)}
            >
              <ThemedView
                lightColor="#F2F4F7"
                darkColor="#202022"
                style={styles.iconPlaceholder}
              >
                {/*  */}
                <BoxIcon />
              </ThemedView>
              <View
                style={[
                  styles.infoContent,
                  isDarkMode && {
                    borderColor: "#252527",
                  },
                ]}
              >
                <ThemedText lightColor="#1B1B1C" style={styles.infoLabel}>
                  Шаблоны
                </ThemedText>
                <View style={styles.infoValueContainer}>
                  <ArrowIconRight />
                </View>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.infoRow}
              onPress={() => setOrderReminderModalVisible(true)}
              disabled={isLoadingOrderReminderSettings}
              activeOpacity={isLoadingOrderReminderSettings ? 1 : 0.7}
            >
              <ThemedView
                lightColor="#F2F4F7"
                darkColor="#202022"
                style={styles.iconPlaceholder}
              >
                <OrderReminderIcon width={22} height={22} />
              </ThemedView>
              <View
                style={[
                  styles.infoContent,
                  isDarkMode && {
                    borderColor: "#252527",
                  },
                ]}
              >
                <ThemedText lightColor="#1B1B1C" style={styles.infoLabel}>
                  Напоминать о заказе
                </ThemedText>
                <View style={styles.infoValueContainer}>
                  {isLoadingOrderReminderSettings ? (
                    <ActivityIndicator
                      size="small"
                      color={isDarkMode ? "#4C94FF" : "#203686"}
                    />
                  ) : (
                    <ThemedText
                      lightColor="#80818B"
                      darkColor="#FBFCFF80"
                      style={styles.infoStatus}
                    >
                      {orderReminderSettings?.isEnabled ? "Вкл" : "Выкл"}
                    </ThemedText>
                  )}
                  <ArrowIconRight />
                </View>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.infoRow}
              onPress={() => setFinanceModalVisible(true)}
            >
              <ThemedView
                lightColor="#F2F4F7"
                darkColor="#202022"
                style={styles.iconPlaceholder}
              >
                <FinanceAndDocksIcon
                  width={22}
                  height={22}
                />
              </ThemedView>
              <View
                style={[
                  styles.infoContent,
                  isDarkMode && {
                    borderColor: "#252527",
                  },
                ]}
              >
                <ThemedText lightColor="#1B1B1C" style={styles.infoLabel}>
                  Финансы и документы
                </ThemedText>
                <View style={styles.infoValueContainer}>
                  <ArrowIconRight />
                </View>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.infoRow}
              onPress={() => setSettingsModalVisible(true)}
            >
              <ThemedView
                lightColor="#F2F4F7"
                darkColor="#202022"
                style={styles.iconPlaceholder}
              >
                <SettingsIcon
                  width={22}
                  height={22}
                />
              </ThemedView>
              <View
                style={[
                  styles.infoContent,
                  isDarkMode && {
                    borderColor: "#252527",
                  },
                ]}
              >
                <ThemedText lightColor="#1B1B1C" style={styles.infoLabel}>
                  Настройки
                </ThemedText>
                <View style={styles.infoValueContainer}>
                  <ArrowIconRight />
                </View>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.infoRow}
              onPress={() => setHelpModalVisible(true)}
            >
              <ThemedView
                lightColor="#F2F4F7"
                darkColor="#202022"
                style={styles.iconPlaceholder}
              >
                <ICricleIcon
                  width={22}
                  height={22}
                />
              </ThemedView>
              <View
                style={[
                  styles.infoContent,
                  isDarkMode && {
                    borderColor: "#252527",
                  },
                ]}
              >
                <ThemedText lightColor="#1B1B1C" style={styles.infoLabel}>
                  Помощь и приложение
                </ThemedText>
                <View style={styles.infoValueContainer}>
                  <ArrowIconRight />
                </View>
              </View>
            </TouchableOpacity>

            <TouchableOpacity style={styles.infoRow} onPress={handleLogout}>
              <ThemedView
                lightColor="#F2F4F7"
                darkColor="#202022"
                style={styles.iconPlaceholder}
              >
                <ExitIcon />
              </ThemedView>
              <View
                style={[
                  styles.infoContent,
                  styles.infoContentLast,
                  isDarkMode && {
                    borderColor: "#252527",
                  },
                ]}
              >
                <ThemedText lightColor="#1B1B1C" style={styles.infoLabel}>
                  Выйти из аккаунта
                </ThemedText>
                <View style={styles.infoValueContainer}>
                  <ArrowIconRight />
                </View>
              </View>
            </TouchableOpacity>
          </View>
        </ThemedView>
      </ScrollView>
      ) : (
        <ThemedView
          lightColor="#EBEDF0"
          darkColor="#040508"
          style={styles.authGate}
        >
          {!authChecked ? (
            <ActivityIndicator
              size="large"
              color={isDarkMode ? "#4C94FF" : "#203686"}
            />
          ) : null}
        </ThemedView>
      )}

      <LoginModal
        visible={loginModalVisible}
        onClose={handleClosePress}
        onLogin={handleLogin}
        enumFlag={"login"}
      />

      <CompanySelectModal
        visible={modalVisible && showProfileContent}
        onClose={() => setModalVisible(false)}
        companies={me?.companies || []}
        selectedCompanyId={me?.companies[0]?.id}
        onSelectCompany={handleSelectCompany}
        onAddCompany={() => console.log("Add company pressed")}
      />

      <ProfileEditModal
        visible={editModalVisible && showProfileContent}
        onClose={() => setEditModalVisible(false)}
        onSave={handleSaveProfile}
        initialData={profileData}
        handleLogout={handleLogout}
      />

      <MyOrdersModal
        visible={myOrderModalVisible && showProfileContent}
        onClose={() => setMyOrderModalVisible(false)}
      />

      <MyReturnsModal
        visible={returnsModalVisible && showProfileContent}
        onClose={() => setReturnsModalVisible(false)}
      />

      <MyTemplatesModal
        visible={templatesModalVisible && showProfileContent}
        onClose={() => setTemplatesModalVisible(false)}
      />

      <MyFinanceModal
        visible={financeModalVisible && showProfileContent}
        onClose={() => setFinanceModalVisible(false)}
      />

      <OrderReminderModal
        visible={orderReminderModalVisible && showProfileContent}
        onClose={() => setOrderReminderModalVisible(false)}
      />

      <MySettingsModal
        visible={settingsModalVisible && showProfileContent}
        onClose={() => setSettingsModalVisible(false)}
      />

      <HelpModal
        visible={helpModalVisible && showProfileContent}
        onClose={() => setHelpModalVisible(false)}
      />

      <PushNotificationsModal
        visible={pushesModalVisible && hasAuthToken}
        onClose={() => setPushesModalVisible(false)}
        pushes={pushes}
        isLoading={isLoadingPushes}
        hasMore={hasMorePushes}
        onLoadMore={handleLoadMorePushes}
      />
    </>
  );
}

const styles = StyleSheet.create({
  authGate: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  scrollContent: {
    paddingBottom: 8,
  },
  headerImage: {
    color: "#808080",
    bottom: -90,
    left: -35,
    position: "absolute",
  },
  gradientWrapper: {
    width: "100%",
    height: 250,
    marginBottom: 8,
    // Добавляем обработку для Android
    ...Platform.select({
      android: {
        overflow: "hidden",
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
        // Добавляем аппаратное ускорение для Android
        transform: [{ perspective: 1000 }],
      },
    }),
  },
  gradientContainer: {
    width: "100%",
    height: 250,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    position: "relative",
    justifyContent: "flex-end",
    alignItems: "center",
    // Добавляем для Android
    ...Platform.select({
      android: {
        // Улучшаем рендеринг градиента на Android
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
      },
    }),
  },
  topActions: {
    position: "absolute",
    top: 60,
    right: 16,
    zIndex: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  notificationIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  pushesBadge: {
    position: "absolute",
    top: -2,
    right: -2,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: "#F10B34",
    justifyContent: "center",
    alignItems: "center",
    // paddingHorizontal: 2,
    // paddingVertical: 2,

  },
  pushesBadgeText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "700",
    lineHeight: 12,
    textAlignVertical: "center",
    includeFontPadding: false,
  },
  pencilIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  whiteProfileCard: {
    width: "100%",
    height: 119,
    borderRadius: 24,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 0,
    position: "relative",
  },
  profileImageContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    overflow: "hidden",
    backgroundColor: "#F0F0F0",
    position: "absolute",
    top: -70,
    left: 16,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  profileImage: {
    width: "100%",
    height: "100%",
  },
  profileInfo: {
    flex: 1,
    justifyContent: "center",
  },
  profileName: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 4,
    fontFamily: Fonts.rounded,
  },
  profileEmail: {
    fontSize: 14,
    color: "#666",
    fontFamily: Fonts.rounded,
  },
  managerCard: {
    borderRadius: 24,
    marginBottom: 8,
  },
  infoCard: {
    borderRadius: 24,
    padding: 16,
  },
  infoContainer: {
    gap: 16,
  },
  infoRow: {
    flexDirection: "row",
    gap: 12,
    alignItems: "center",
    width: "100%",
  },
  iconPlaceholder: {
    padding: 8,
    borderRadius: 8,
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  infoContent: {
    flex: 1,
    borderBottomWidth: 1,
    borderColor: "#F0F3F7",
    marginTop: 12,
    paddingBottom: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  infoContentLast: {
    borderBottomWidth: 0,
    paddingBottom: 0,
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: "500",
    flex: 1,
  },
  infoValueContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    maxWidth: "60%",
  },
  infoValue: {
    fontSize: 16,
    fontWeight: "500",
    color: "#1B1B1C",
    textAlign: "right",
  },
  infoStatus: {
    fontSize: 14,
    fontWeight: "500",
  },
  emptyWhiteBlock: {
    width: "90%",
    alignSelf: "center",
    height: 100,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    marginTop: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  contentContainer: {
    marginTop: 20,
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  logoutButton: {
    backgroundColor: "#ff4444",
    borderRadius: 8,
    padding: 12,
    alignItems: "center",
  },
  profileImagePlaceholder: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  profileImagePlaceholderText: {
    fontSize: 32,
    lineHeight: 40,
    color: "#FFFFFF",
    textAlign: "center",
  },
});
