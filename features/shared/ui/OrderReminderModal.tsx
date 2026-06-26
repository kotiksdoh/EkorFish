import { ArrowIconRight } from "@/assets/icons/icons";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { updateOrderReminderSettings } from "@/features/auth/authSlice";
import { ModalHeader } from "@/features/auth/ui/Header";
import { PrimaryButton } from "@/features/shared/ui/components/PrimartyButton";
import { CustomCheckbox } from "@/features/shared/ui/components/CustomCheckBox";
import { SnapBottomSheet } from "@/features/shared/ui/SnapBottomSheet";
import {
  FREQUENCY_OPTIONS,
  MONTHLY_DAY_OPTIONS,
  OrderReminderAbout,
  OrderReminderSettings,
  REMIND_ABOUT_OPTIONS,
  REMIND_TIME_OPTIONS,
  REMIND_WHEN_OPTIONS,
  WEEKLY_DAY_OPTIONS,
  buildOrderReminderPayload,
  formatRemindTime,
  getMonthlyDayLabel,
  getRemindWhenLabel,
  getWeeklyDayLabel,
  parseRemindAbout,
  serializeRemindAbout,
  timeLabelToIso,
} from "@/features/shared/types/orderReminderSettings";
import { useAppTheme } from "@/hooks/use-theme-color";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  Modal,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface OrderReminderModalProps {
  visible: boolean;
  onClose: () => void;
}

type PickerType = "remindWhen" | "time" | "weeklyDay" | "monthlyDay" | null;

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
    new Animated.Value(value ? SWITCH_THUMB_TRANSLATE : 0),
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
      activeOpacity={disabled ? 1 : 0.8}
      disabled={disabled}
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
          { transform: [{ translateX: thumbTranslate }] },
        ]}
      />
    </TouchableOpacity>
  );
};

export const OrderReminderModal: React.FC<OrderReminderModalProps> = ({
  visible,
  onClose,
}) => {
  const insets = useSafeAreaInsets();
  const { isDark } = useAppTheme();
  const dispatch = useAppDispatch();
  const { orderReminderSettings, isUpdatingOrderReminderSettings } =
    useAppSelector((state) => state.auth);
  const isLoadingOrderReminderSettings = useAppSelector(
    (state) => state.auth.isLoadingOrderReminderSettings,
  );

  const [pickerType, setPickerType] = useState<PickerType>(null);
  const [monthlyDay, setMonthlyDay] = useState("1");
  const [selectedAbout, setSelectedAbout] = useState<OrderReminderAbout[]>([]);

  const persistSettings = useCallback(
    (nextSettings: OrderReminderSettings) => {
      dispatch(updateOrderReminderSettings(buildOrderReminderPayload(nextSettings)));
    },
    [dispatch],
  );

  useEffect(() => {
    if (!visible || !orderReminderSettings) return;
    setSelectedAbout(parseRemindAbout(orderReminderSettings.remindAbout));
    setMonthlyDay("1");
  }, [visible, orderReminderSettings]);

  const handleToggleEnabled = (isEnabled: boolean) => {
    if (!orderReminderSettings || isUpdatingOrderReminderSettings) return;
    persistSettings({ ...orderReminderSettings, isEnabled });
  };

  const handleRemindWhenSelect = (remindWhen: string) => {
    if (!orderReminderSettings) return;
    setPickerType(null);
    persistSettings({ ...orderReminderSettings, remindWhen });
  };

  const handleTimeSelect = (timeLabel: string) => {
    if (!orderReminderSettings) return;
    setPickerType(null);
    persistSettings({
      ...orderReminderSettings,
      remindAtTime: timeLabelToIso(timeLabel),
    });
  };

  const handleAboutToggle = (value: OrderReminderAbout) => {
    if (!orderReminderSettings || isUpdatingOrderReminderSettings) return;

    const nextSelected = selectedAbout.includes(value)
      ? selectedAbout.filter((item) => item !== value)
      : [...selectedAbout, value];

    if (nextSelected.length === 0) return;

    setSelectedAbout(nextSelected);
    persistSettings({
      ...orderReminderSettings,
      remindAbout: serializeRemindAbout(nextSelected),
    });
  };

  const handleFrequencySelect = (
    frequency: OrderReminderSettings["frequency"],
  ) => {
    if (!orderReminderSettings || isUpdatingOrderReminderSettings) return;

    const nextSettings: OrderReminderSettings = {
      ...orderReminderSettings,
      frequency,
    };

    if (frequency === "weekly" && !nextSettings.weeklyDay) {
      nextSettings.weeklyDay = "monday";
    }

    persistSettings(nextSettings);
  };

  const handleWeeklyDaySelect = (weeklyDay: OrderReminderSettings["weeklyDay"]) => {
    if (!orderReminderSettings) return;
    setPickerType(null);
    persistSettings({ ...orderReminderSettings, weeklyDay });
  };

  const handleMonthlyDaySelect = (day: string) => {
    setMonthlyDay(day);
    setPickerType(null);
  };

  const renderPickerOptions = () => {
    if (pickerType === "remindWhen") {
      return REMIND_WHEN_OPTIONS.map((option) => {
        const isSelected = orderReminderSettings?.remindWhen === option.value;
        return (
          <TouchableOpacity
            key={option.value}
            style={styles.pickerRow}
            onPress={() => handleRemindWhenSelect(option.value)}
            activeOpacity={0.7}
          >
            <ThemedText
              lightColor={isSelected ? "#203686" : "#1B1B1C"}
              darkColor={isSelected ? "#4C94FF" : "#FBFCFF"}
              style={styles.pickerRowText}
            >
              {option.label}
            </ThemedText>
          </TouchableOpacity>
        );
      });
    }

    if (pickerType === "time") {
      return REMIND_TIME_OPTIONS.map((option) => {
        const isSelected =
          orderReminderSettings &&
          formatRemindTime(orderReminderSettings.remindAtTime) === option.label;
        return (
          <TouchableOpacity
            key={option.value}
            style={styles.pickerRow}
            onPress={() => handleTimeSelect(option.label)}
            activeOpacity={0.7}
          >
            <ThemedText
              lightColor={isSelected ? "#203686" : "#1B1B1C"}
              darkColor={isSelected ? "#4C94FF" : "#FBFCFF"}
              style={styles.pickerRowText}
            >
              {option.label}
            </ThemedText>
          </TouchableOpacity>
        );
      });
    }

    if (pickerType === "weeklyDay") {
      return WEEKLY_DAY_OPTIONS.map((option) => {
        const isSelected = orderReminderSettings?.weeklyDay === option.value;
        return (
          <TouchableOpacity
            key={option.value}
            style={styles.pickerRow}
            onPress={() => handleWeeklyDaySelect(option.value)}
            activeOpacity={0.7}
          >
            <ThemedText
              lightColor={isSelected ? "#203686" : "#1B1B1C"}
              darkColor={isSelected ? "#4C94FF" : "#FBFCFF"}
              style={styles.pickerRowText}
            >
              {option.label}
            </ThemedText>
          </TouchableOpacity>
        );
      });
    }

    if (pickerType === "monthlyDay") {
      return MONTHLY_DAY_OPTIONS.map((option) => {
        const isSelected = monthlyDay === option.value;
        return (
          <TouchableOpacity
            key={option.value}
            style={styles.pickerRow}
            onPress={() => handleMonthlyDaySelect(option.value)}
            activeOpacity={0.7}
          >
            <ThemedText
              lightColor={isSelected ? "#203686" : "#1B1B1C"}
              darkColor={isSelected ? "#4C94FF" : "#FBFCFF"}
              style={styles.pickerRowText}
            >
              {option.label}
            </ThemedText>
          </TouchableOpacity>
        );
      });
    }

    return null;
  };

  const getPickerTitle = () => {
    switch (pickerType) {
      case "remindWhen":
        return "Когда напоминать";
      case "time":
        return "Время";
      case "weeklyDay":
        return "День недели";
      case "monthlyDay":
        return "Число месяца";
      default:
        return "";
    }
  };

  const isEnabled = orderReminderSettings?.isEnabled ?? false;

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
      statusBarTranslucent={true}
    >
      <ThemedView
        lightColor="#EBEDF0"
        darkColor="#040508"
        style={styles.modalContainer}
      >
        <ModalHeader
          title="Напоминать о заказе"
          showBackButton={true}
          onBackPress={onClose}
        />

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: Math.max(insets.bottom, 24) + 24 },
          ]}
        >
          {isLoadingOrderReminderSettings || !orderReminderSettings ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator
                size="small"
                color={isDark ? "#4C94FF" : "#203686"}
              />
              <ThemedText lightColor="#80818B" darkColor="#FBFCFF80">
                Загрузка настроек...
              </ThemedText>
            </View>
          ) : (
            <>
          <ThemedView
            lightColor="#FFFFFF"
            darkColor="#151516"
            style={styles.card}
          >
            <View style={styles.toggleRow}>
              <ThemedText lightColor="#1B1B1C" darkColor="#FBFCFF">
                Напоминать о заказе
              </ThemedText>
              <AppSwitch
                value={isEnabled}
                onValueChange={handleToggleEnabled}
                isDark={isDark}
                disabled={isUpdatingOrderReminderSettings || !orderReminderSettings}
              />
            </View>
            <ThemedText
              style={styles.description}
              lightColor="#80818B"
              darkColor="#FBFCFF80"
            >
              Автоматически рассчитывать, когда нужно сделать следующий заказ
            </ThemedText>
          </ThemedView>

          {isEnabled && orderReminderSettings ? (
            <>
              <ThemedView
                lightColor="#FFFFFF"
                darkColor="#151516"
                style={styles.card}
              >
                <ThemedText style={styles.sectionTitle} lightColor="#1B1B1C" darkColor="#FBFCFF">
                  Когда напоминать
                </ThemedText>

                <TouchableOpacity
                  style={styles.valueRow}
                  onPress={() => setPickerType("remindWhen")}
                  activeOpacity={0.7}
                  disabled={isUpdatingOrderReminderSettings}
                >
                  <ThemedText
                    style={styles.valueRowText}
                    lightColor="#1B1B1C"
                    darkColor="#FBFCFF"
                    numberOfLines={1}
                    ellipsizeMode="tail"
                  >
                    {getRemindWhenLabel(orderReminderSettings.remindWhen)}
                  </ThemedText>
                  <ArrowIconRight />
                </TouchableOpacity>

                <View style={styles.divider} />

                <View style={styles.timeRow}>
                  <ThemedText lightColor="#1B1B1C" darkColor="#FBFCFF">
                    Время
                  </ThemedText>
                  <TouchableOpacity
                    style={styles.timeRowRight}
                    onPress={() => setPickerType("time")}
                    activeOpacity={0.7}
                    disabled={isUpdatingOrderReminderSettings}
                  >
                    <ThemedText lightColor="#80818B" darkColor="#FBFCFF80">
                      {formatRemindTime(orderReminderSettings.remindAtTime)}
                    </ThemedText>
                    <ArrowIconRight />
                  </TouchableOpacity>
                </View>
              </ThemedView>

              <ThemedView
                lightColor="#FFFFFF"
                darkColor="#151516"
                style={styles.card}
              >
                <ThemedText style={styles.sectionTitle} lightColor="#1B1B1C" darkColor="#FBFCFF">
                  О чем напоминать
                </ThemedText>

                {REMIND_ABOUT_OPTIONS.map((option) => (
                  <View style={styles.checkboxRow} key={option.value}>
                    <CustomCheckbox
                      value={selectedAbout.includes(option.value)}
                      onValueChange={() => handleAboutToggle(option.value)}
                      style={undefined}
                      lightColor="#F2F4F7"
                      darkColor="#202022"
                      disabled={isUpdatingOrderReminderSettings}
                    />
                    <ThemedText
                      lightColor="#1B1B1C"
                      darkColor="#FBFCFF"
                      style={styles.checkboxLabel}
                    >
                      {option.label}
                    </ThemedText>
                  </View>
                ))}
              </ThemedView>

              <ThemedView
                lightColor="#FFFFFF"
                darkColor="#151516"
                style={styles.card}
              >
                <ThemedText style={styles.sectionTitle} lightColor="#1B1B1C" darkColor="#FBFCFF">
                  Как часто напоминать?
                </ThemedText>

                {FREQUENCY_OPTIONS.map((option) => {
                  const isSelected =
                    orderReminderSettings.frequency === option.value;

                  return (
                    <View key={option.value} style={styles.frequencyBlock}>
                      <View style={styles.radioRow}>
                        <TouchableOpacity
                          style={styles.radioMain}
                          onPress={() => handleFrequencySelect(option.value)}
                          activeOpacity={0.7}
                          disabled={isUpdatingOrderReminderSettings}
                        >
                          <View style={styles.radioCircle}>
                            {isSelected ? (
                              <View style={styles.radioSelected} />
                            ) : null}
                          </View>
                          <ThemedText
                            lightColor="#1B1B1C"
                            darkColor="#FBFCFF"
                            style={styles.radioLabel}
                          >
                            {option.label}
                          </ThemedText>
                        </TouchableOpacity>

                        {option.value === "weekly" && isSelected ? (
                          <TouchableOpacity
                            style={styles.frequencyExtra}
                            onPress={() => setPickerType("weeklyDay")}
                            activeOpacity={0.7}
                          >
                            <ThemedText
                              lightColor="#80818B"
                              darkColor="#FBFCFF80"
                              numberOfLines={1}
                            >
                              {getWeeklyDayLabel(orderReminderSettings.weeklyDay)}
                            </ThemedText>
                            <ArrowIconRight />
                          </TouchableOpacity>
                        ) : null}

                        {option.value === "monthly" && isSelected ? (
                          <TouchableOpacity
                            style={styles.frequencyExtra}
                            onPress={() => setPickerType("monthlyDay")}
                            activeOpacity={0.7}
                          >
                            <ThemedText
                              lightColor="#80818B"
                              darkColor="#FBFCFF80"
                              numberOfLines={1}
                            >
                              {getMonthlyDayLabel(monthlyDay)}
                            </ThemedText>
                            <ArrowIconRight />
                          </TouchableOpacity>
                        ) : null}
                      </View>
                    </View>
                  );
                })}
              </ThemedView>

              <PrimaryButton
                title="Готово"
                onPress={onClose}
                variant="primary"
                size="md"
                fullWidth
                loading={isUpdatingOrderReminderSettings}
              />
            </>
          ) : null}

          {isUpdatingOrderReminderSettings ? (
            <View style={styles.updatingRow}>
              <ActivityIndicator
                size="small"
                color={isDark ? "#4C94FF" : "#203686"}
              />
            </View>
          ) : null}
            </>
          )}
        </ScrollView>

        <SnapBottomSheet
          visible={pickerType !== null}
          title={getPickerTitle()}
          titleAlign="left"
          onClose={() => setPickerType(null)}
        >
          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={[
              styles.pickerContent,
              { paddingBottom: Math.max(insets.bottom, 16) + 16 },
            ]}
          >
            {renderPickerOptions()}
          </ScrollView>
        </SnapBottomSheet>
      </ThemedView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    gap: 16,
  },
  loadingContainer: {
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    paddingVertical: 48,
  },
  card: {
    borderRadius: 16,
    padding: 16,
    gap: 16,
  },
  toggleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
  },
  valueRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  valueRowText: {
    flex: 1,
    fontSize: 14,
    fontWeight: "500",
  },
  divider: {
    height: 1,
    backgroundColor: "#F0F3F7",
  },
  timeRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  timeRowRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  checkboxRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  checkboxLabel: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  frequencyBlock: {
    marginBottom: 4,
  },
  radioRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 4,
  },
  radioMain: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flexShrink: 1,
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#203686",
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
    fontSize: 14,
    fontWeight: "500",
  },
  frequencyExtra: {
    marginLeft: "auto",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    maxWidth: "45%",
  },
  pickerContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  pickerRow: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F3F7",
  },
  pickerRowText: {
    fontSize: 16,
    lineHeight: 22,
  },
  updatingRow: {
    alignItems: "center",
    paddingVertical: 8,
  },
  appSwitchTrack: {
    width: SWITCH_TRACK_WIDTH,
    height: SWITCH_TRACK_HEIGHT,
    borderRadius: SWITCH_TRACK_HEIGHT / 2,
    justifyContent: "center",
    paddingHorizontal: SWITCH_THUMB_OFFSET,
  },
  appSwitchThumb: {
    width: SWITCH_THUMB_WIDTH,
    height: SWITCH_THUMB_HEIGHT,
    borderRadius: SWITCH_THUMB_HEIGHT / 2,
    backgroundColor: "#FFFFFF",
  },
});
