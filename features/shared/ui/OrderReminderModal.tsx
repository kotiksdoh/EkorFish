import { ArrowIconRight } from "@/assets/icons/icons";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { updateOrderReminderSettings } from "@/features/auth/authSlice";
import { ModalHeader } from "@/features/auth/ui/Header";
import {
  FREQUENCY_OPTIONS,
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
  normalizeFrequency,
  normalizeRemindWhen,
  parseRemindAbout,
  serializeRemindAbout,
  timeLabelToIso,
} from "@/features/shared/types/orderReminderSettings";
import { AppModal } from "@/features/shared/ui/AppModal";
import { MonthlyDayCalendarPicker } from "@/features/shared/ui/components/MonthlyDayCalendarPicker";
import { SnapBottomSheet } from "@/features/shared/ui/SnapBottomSheet";
import { CustomCheckbox } from "@/features/shared/ui/components/CustomCheckBox";
import { PrimaryButton } from "@/features/shared/ui/components/PrimartyButton";
import { useAppTheme } from "@/hooks/use-theme-color";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { ActivityIndicator, Animated, Dimensions, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';

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
const PICKER_LIST_MAX_HEIGHT = 320;

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
  }, [visible, orderReminderSettings]);

  const handleToggleEnabled = (isEnabled: boolean) => {
    if (!orderReminderSettings || isUpdatingOrderReminderSettings) return;
    persistSettings({ ...orderReminderSettings, isEnabled });
  };

  const handleRemindWhenSelect = (remindWhen: string) => {
    if (!orderReminderSettings) return;
    setPickerType(null);
    persistSettings({
      ...orderReminderSettings,
      remindWhen: normalizeRemindWhen(remindWhen),
    });
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

    if (frequency === "monthly" && !nextSettings.monthlyDay) {
      nextSettings.monthlyDay = 1;
    }

    persistSettings(nextSettings);
  };

  const handleWeeklyDaySelect = (weeklyDay: OrderReminderSettings["weeklyDay"]) => {
    if (!orderReminderSettings) return;
    setPickerType(null);
    persistSettings({ ...orderReminderSettings, weeklyDay });
  };

  const handleMonthlyDaySelect = (day: number) => {
    if (!orderReminderSettings) return;
    setPickerType(null);
    persistSettings({ ...orderReminderSettings, monthlyDay: day });
  };

  const renderPickerOptions = () => {
    if (pickerType === "remindWhen") {
      return REMIND_WHEN_OPTIONS.map((option) => {
        const isSelected =
          normalizeRemindWhen(orderReminderSettings?.remindWhen ?? "") ===
          option.value;
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
      const selectedDay = Number(orderReminderSettings?.monthlyDay) || 1;

      return (
        <MonthlyDayCalendarPicker
          selectedDay={selectedDay}
          onSelectDay={handleMonthlyDaySelect}
        />
      );
    }

    return null;
  };

  const isPickerList = pickerType !== null && pickerType !== "monthlyDay";

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
    <AppModal
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
              <ThemedText style={styles.textDef} lightColor="#1B1B1C" darkColor="#FBFCFF">
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
                  <ThemedText style={styles.textDef} lightColor="#1B1B1C" darkColor="#FBFCFF">
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

                <View style={styles.frequencyList}>
                  {FREQUENCY_OPTIONS.map((option) => {
                    const isSelected =
                      normalizeFrequency(orderReminderSettings.frequency) ===
                      option.value;

                    return (
                      <View
                        key={option.value}
                        style={[
                          styles.frequencyRow,
                          isDark && { borderBottomColor: "#323235" },
                        ]}
                      >
                        <TouchableOpacity
                          style={styles.frequencyMain}
                          onPress={() => handleFrequencySelect(option.value)}
                          activeOpacity={0.7}
                          disabled={isUpdatingOrderReminderSettings}
                        >
                          <View
                            style={[
                              styles.radioOuter,
                              isSelected && styles.radioOuterSelected,
                              isDark &&
                                isSelected && { borderColor: "#4C94FF" },
                            ]}
                          >
                            {isSelected ? (
                              <View style={styles.radioInner} />
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
                              {getWeeklyDayLabel(
                                orderReminderSettings.weeklyDay,
                              )}
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
                              {getMonthlyDayLabel(orderReminderSettings.monthlyDay)}
                            </ThemedText>
                            <ArrowIconRight />
                          </TouchableOpacity>
                        ) : null}
                      </View>
                    );
                  })}
                </View>
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
          {isPickerList ? (
            <ScrollView
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              style={styles.pickerScroll}
              contentContainerStyle={[
                styles.pickerContent,
                { paddingBottom: Math.max(insets.bottom, 16) + 16 },
              ]}
            >
              {renderPickerOptions()}
            </ScrollView>
          ) : (
            <View
              style={[
                styles.pickerContent,
                styles.pickerCalendarContent,
                { paddingBottom: Math.max(insets.bottom, 16) + 16 },
              ]}
            >
              {renderPickerOptions()}
            </View>
          )}
        </SnapBottomSheet>
      </ThemedView>
    </AppModal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
  },
  scrollContent: {
    // paddingHorizontal: 16,
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
    fontSize: 20,
    fontWeight: "600",
  },
  textDef: {
    fontWeight: '500',
    fontSize: 16
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
    marginTop: 8
  },
  checkboxLabel: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    lineHeight: 20,
  },
  frequencyList: {
    marginTop: -8,
  },
  frequencyRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  frequencyMain: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
    flexShrink: 1,
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
  radioLabel: {
    fontSize: 16,
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
  pickerCalendarContent: {
    paddingHorizontal: 12,
  },
  pickerScroll: {
    maxHeight: PICKER_LIST_MAX_HEIGHT,
  },
  pickerRow: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F3F7",
  },
  pickerRowText: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: "500",
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
