import { ArrowIconRight } from "@/assets/icons/icons";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import {
  getPushSettings,
  updatePushPreference,
} from "@/features/auth/authSlice";
import { ModalHeader } from "@/features/auth/ui/Header";
import { useAppTheme } from "@/hooks/use-theme-color";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  Modal,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { CustomCheckbox } from "./components/CustomCheckBox";

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
}

const AppSwitch: React.FC<AppSwitchProps> = ({ value, onValueChange, isDark }) => {
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
      onPress={() => onValueChange(!value)}
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

// Компонент уведомлений
const NotificationsScreen: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const { isDark } = useAppTheme();
  const dispatch = useAppDispatch();
  const { pushSettings, isLoadingPushSettings, isUpdatingPushPreference } =
    useAppSelector((state) => state.auth);
  const [quietMode, setQuietMode] = useState(false);
  const [quietStartTime, setQuietStartTime] = useState("22:00");
  const [quietEndTime, setQuietEndTime] = useState("08:00");
  const [deliveryMethod, setDeliveryMethod] = useState("push");

  useEffect(() => {
    dispatch(getPushSettings());
  }, [dispatch]);

  const toggleNotification = (pushNotificationType: number, isEnabled: boolean) => {
    dispatch(
      updatePushPreference({
        pushNotificationType,
        isEnabled: !isEnabled,
      }),
    );
  };

  return (
    <View style={styles.fullScreenContent}>
      <ModalHeader
        title="Уведомления"
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
          lightColor="#1B1B1C"
          darkColor="#FBFCFF"
        >
          Типы уведомлений
        </ThemedText>

        <View style={styles.formGroup}>
          {isLoadingPushSettings ? (
            <View style={styles.loaderContainer}>
              <ActivityIndicator size="small" color={isDark ? "#FBFCFF" : "#203686"} />
              <ThemedText lightColor="#1B1B1C" darkColor="#FBFCFF">
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
                <ThemedText lightColor="#1B1B1C" darkColor="#FBFCFF">
                  {item.name}
                </ThemedText>
              </View>
            ))
          )}
        </View>
      </ThemedView>

      {/* <ThemedView
        lightColor="#FFFFFF"
        darkColor="#151516"
        style={styles.paymentsMainContainer}
      >
        <View style={styles.documentRow}>
          <ThemedText lightColor="#1B1B1C" darkColor="#FBFCFF">
            Включить тихий период
          </ThemedText>
          <AppSwitch
            value={quietMode}
            onValueChange={setQuietMode}
            isDark={isDark}
          />
        </View>
        <ThemedText
          style={styles.infoText}
          lightColor="#80818B"
          darkColor="#FBFCFF80"
        >
          В это время уведомления будут приходить без звука и вибрации
        </ThemedText>
        {quietMode && (
          <View style={styles.quietTimeRow}>
            <AnimatedTextInput
              placeholder="Не беспокоить с:"
              value={quietStartTime}
              onChangeText={(text) => setQuietStartTime(formatTimeValue(text))}
              keyboardType="number-pad"
              maxLength={5}
              style={styles.quietTimeInput}
            />
            <AnimatedTextInput
              placeholder="До:"
              value={quietEndTime}
              onChangeText={(text) => setQuietEndTime(formatTimeValue(text))}
              keyboardType="number-pad"
              maxLength={5}
              style={styles.quietTimeInput}
            />
          </View>
        )}
      </ThemedView>

      <ThemedView
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
    </View>
  );
};

export const MySettingsModal: React.FC<MySettingsProps> = ({
  visible,
  onClose,
}) => {
  const { themeMode, setThemeMode, isDark } = useAppTheme();
  const [showNotifications, setShowNotifications] = useState<boolean>(false);

  const handleCloseAll = () => {
    setShowNotifications(false);
    onClose();
  };

  if (showNotifications) {
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
          <NotificationsScreen onBack={() => setShowNotifications(false)} />
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
            Внешний вид
          </ThemedText>

          <View style={styles.documentRow}>
            <ThemedText lightColor="#1B1B1C" darkColor="#FBFCFF">
              Темная тема
            </ThemedText>
            <AppSwitch
              value={isDark}
              onValueChange={(value) => setThemeMode(value ? "dark" : "light")}
              isDark={isDark}
            />
          </View>

          <View style={styles.documentRow}>
            <ThemedText lightColor="#1B1B1C" darkColor="#FBFCFF">
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
              <ThemedText lightColor="#1B1B1C" darkColor="#FBFCFF">
                Уведомления
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
  loaderContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
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
    marginVertical: 12,
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
