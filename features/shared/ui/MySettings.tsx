import { ArrowIconRight } from "@/assets/icons/icons";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { ModalHeader } from "@/features/auth/ui/Header";
import { useAppTheme } from "@/hooks/use-theme-color";
import React, { useState } from "react";
import {
  Modal,
  StyleSheet,
  Switch,
  TouchableOpacity,
  View,
} from "react-native";
import { CustomCheckbox } from "./components/CustomCheckBox";

interface MySettingsProps {
  visible: boolean;
  onClose: () => void;
}

// Компонент уведомлений
const NotificationsScreen: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const { isDark } = useAppTheme();
  const [quietMode, setQuietMode] = useState(false);
  const [deliveryMethod, setDeliveryMethod] = useState("push");
  const [notifications, setNotifications] = useState({
    orderStatus: true,
    promotions: false,
    system: true,
  });

  const toggleNotification = (key: keyof typeof notifications) => {
    setNotifications((prev) => ({ ...prev, [key]: !prev[key] }));
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
          <View style={styles.checkboxRow}>
            <CustomCheckbox
              value={notifications.orderStatus}
              onValueChange={() => toggleNotification("orderStatus")}
              style={undefined}
              lightColor={undefined}
              darkColor={undefined}
              disabled={undefined}
            />
            <ThemedText lightColor="#1B1B1C" darkColor="#FBFCFF">
              Статусы заказов
            </ThemedText>
          </View>
        </View>

        <View style={styles.formGroup}>
          <View style={styles.checkboxRow}>
            <CustomCheckbox
              value={notifications.promotions}
              onValueChange={() => toggleNotification("promotions")}
              style={undefined}
              lightColor={undefined}
              darkColor={undefined}
              disabled={undefined}
            />
            <ThemedText lightColor="#1B1B1C" darkColor="#FBFCFF">
              Акции и скидки
            </ThemedText>
          </View>
        </View>

        <View style={styles.formGroup}>
          <View style={styles.checkboxRow}>
            <CustomCheckbox
              value={notifications.system}
              onValueChange={() => toggleNotification("system")}
              style={undefined}
              lightColor={undefined}
              darkColor={undefined}
              disabled={undefined}
            />
            <ThemedText lightColor="#1B1B1C" darkColor="#FBFCFF">
              Системные уведомления
            </ThemedText>
          </View>
        </View>
      </ThemedView>

      <ThemedView
        lightColor="#FFFFFF"
        darkColor="#151516"
        style={styles.paymentsMainContainer}
      >
        <View style={styles.documentRow}>
          <ThemedText lightColor="#1B1B1C" darkColor="#FBFCFF">
            Включить тихий период
          </ThemedText>
          <Switch
            value={quietMode}
            onValueChange={setQuietMode}
            trackColor={{
              false: isDark ? "#767577" : "#03051E1F",
              true: isDark ? "#3881EE" : "#203686",
            }}
          />
        </View>
        <ThemedText
          style={styles.infoText}
          lightColor="#80818B"
          darkColor="#FBFCFF80"
        >
          В это время уведомления будут приходить без звука и вибрации
        </ThemedText>
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
      </ThemedView>
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
          <ThemedText type="subtitle" lightColor="#1B1B1C" darkColor="#FBFCFF">
            Внешний вид
          </ThemedText>

          <View style={styles.documentRow}>
            <ThemedText lightColor="#1B1B1C" darkColor="#FBFCFF">
              Темная тема
            </ThemedText>
            <Switch
              value={isDark}
              onValueChange={(value) => setThemeMode(value ? "dark" : "light")}
              trackColor={{
                false: isDark ? "#767577" : "#03051E1F",
                true: isDark ? "#3881EE" : "#203686",
              }}
            />
          </View>

          <View style={styles.documentRow}>
            <ThemedText lightColor="#1B1B1C" darkColor="#FBFCFF">
              Системная тема
            </ThemedText>
            <Switch
              value={themeMode === "system"}
              onValueChange={(value) =>
                setThemeMode(value ? "system" : "light")
              }
              trackColor={{
                false: isDark ? "#767577" : "#03051E1F",
                true: isDark ? "#3881EE" : "#203686",
              }}
            />
          </View>

          <View style={styles.divider} />

          <ThemedText type="subtitle" lightColor="#1B1B1C" darkColor="#FBFCFF">
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

          <TouchableOpacity
            onPress={() => setShowNotifications(true)}
            activeOpacity={0.7}
          >
            <View style={styles.documentRow}>
              <ThemedText lightColor="#1B1B1C" darkColor="#FBFCFF">
                Корзина и заказы
              </ThemedText>
              <ArrowIconRight />
            </View>
          </TouchableOpacity>
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
  divider: {
    height: 1,
    backgroundColor: "#E5E5E5",
    marginVertical: 16,
  },
  formSubtitle: {
    marginTop: 16,
    marginBottom: 16,
  },
  formGroup: {
    marginBottom: 20,
  },
  checkboxRow: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
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
    fontSize: 12,
    marginVertical: 12,
  },
});
