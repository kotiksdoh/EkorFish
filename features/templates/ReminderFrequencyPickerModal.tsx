import { ThemedText } from "@/components/themed-text";
import { CustomCheckbox } from "@/features/shared/ui/components/CustomCheckBox";
import { SnapBottomSheet } from "@/features/shared/ui/SnapBottomSheet";
import { useColorScheme } from "@/hooks/use-color-scheme";
import React, { useCallback, useEffect, useRef } from "react";
import {
  Animated,
  Dimensions,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export type ReminderFrequencyOption = { frequency: number; name: string };

const { height: screenHeight } = Dimensions.get("window");

type PickerProps = {
  options: ReminderFrequencyOption[];
  value: number | null;
  onClose: () => void;
  onSelect: (v: number) => void;
};

export function ReminderFrequencyPickerContent({
  value,
  options,
  onClose,
  onSelect,
}: PickerProps) {
  return (
    <View style={styles.list}>
      {options.map((opt) => {
        const selected = value === opt.frequency;
        return (
          <TouchableOpacity
            key={opt.frequency}
            style={styles.row}
            onPress={() => {
              onSelect(opt.frequency);
              onClose();
            }}
            activeOpacity={0.75}
          >
            <CustomCheckbox
              value={selected}
              onValueChange={() => {
                onSelect(opt.frequency);
                onClose();
              }}
              lightColor="#F2F4F7"
              darkColor="#202022"
            />
            <ThemedText
              style={styles.rowLabel}
              lightColor="#1B1B1C"
              darkColor="#FBFCFF"
            >
              {opt.name}
            </ThemedText>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

/** Inline-панель поверх родительской модалки (без вложенного Modal). */
export function ReminderFrequencyPickerOverlay({
  visible,
  value,
  options,
  onClose,
  onSelect,
  /** false — только лист снизу, без второго затемнения (внутри уже открытого bottom sheet) */
  showBackdrop = true,
}: PickerProps & { visible: boolean; showBackdrop?: boolean }) {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const translateY = useRef(new Animated.Value(screenHeight)).current;
  const isClosingRef = useRef(false);

  useEffect(() => {
    if (visible) {
      isClosingRef.current = false;
      translateY.setValue(screenHeight);
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
        damping: 20,
        stiffness: 90,
        mass: 0.8,
      }).start();
    } else {
      translateY.setValue(screenHeight);
    }
  }, [visible, translateY]);

  const closeWithAnimation = useCallback(() => {
    if (isClosingRef.current) return;
    isClosingRef.current = true;
    Animated.timing(translateY, {
      toValue: screenHeight,
      duration: 250,
      useNativeDriver: true,
    }).start(() => {
      isClosingRef.current = false;
      onClose();
    });
  }, [onClose, translateY]);

  const handleSelect = useCallback(
    (frequency: number) => {
      onSelect(frequency);
      closeWithAnimation();
    },
    [closeWithAnimation, onSelect],
  );

  if (!visible) return null;

  const sheet = (
    <Animated.View
      style={[
        styles.overlaySheet,
        isDark && styles.overlaySheetDark,
        {
          paddingBottom: 16 + Math.max(insets.bottom, 16),
          transform: [{ translateY }],
        },
      ]}
    >
      <TouchableOpacity
        style={styles.swipeHandleContainer}
        activeOpacity={0.7}
        onPress={closeWithAnimation}
      >
        <View style={[styles.handle, isDark && styles.handleDark]} />
      </TouchableOpacity>
      <View style={styles.overlayHeader}>
        <ThemedText
          style={styles.overlayTitle}
          lightColor="#1B1B1C"
          darkColor="#FBFCFF"
        >
          Частота напоминаний
        </ThemedText>
      </View>
      <ReminderFrequencyPickerContent
        value={value}
        options={options}
        onClose={closeWithAnimation}
        onSelect={handleSelect}
      />
    </Animated.View>
  );

  if (!showBackdrop) {
    return (
      <View style={styles.stackedRoot} pointerEvents="box-none">
        <TouchableWithoutFeedback onPress={closeWithAnimation}>
          <View style={styles.stackedDismissArea} />
        </TouchableWithoutFeedback>
        <TouchableWithoutFeedback>{sheet}</TouchableWithoutFeedback>
      </View>
    );
  }

  return (
    <TouchableWithoutFeedback onPress={closeWithAnimation}>
      <View style={styles.innerOverlay}>
        <TouchableWithoutFeedback>{sheet}</TouchableWithoutFeedback>
      </View>
    </TouchableWithoutFeedback>
  );
}

type ModalProps = PickerProps & {
  visible: boolean;
};

export function ReminderFrequencyPickerModal({
  visible,
  value,
  options,
  onClose,
  onSelect,
}: ModalProps) {
  return (
    <SnapBottomSheet
      visible={visible}
      title="Частота напоминаний"
      titleAlign="left"
      onClose={onClose}
    >
      <ReminderFrequencyPickerContent
        value={value}
        options={options}
        onClose={onClose}
        onSelect={onSelect}
      />
    </SnapBottomSheet>
  );
}

const styles = StyleSheet.create({
  list: { gap: 4, paddingBottom: 12 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 12,
  },
  rowLabel: {
    fontSize: 16,
    fontWeight: "500",
    flex: 1,
  },
  innerOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
    zIndex: 50,
  },
  stackedRoot: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "flex-end",
    zIndex: 55,
  },
  stackedDismissArea: {
    ...StyleSheet.absoluteFillObject,
  },
  overlaySheet: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 16,
    paddingTop: 8,
    maxHeight: "92%",
    overflow: "hidden",
  },
  overlaySheetDark: {
    backgroundColor: "#202022",
    borderColor: "#323235",
  },
  swipeHandleContainer: {
    alignItems: "center",
    paddingTop: 12,
    paddingBottom: 8,
    width: "100%",
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: "#E0E0E0",
    borderRadius: 2,
  },
  handleDark: {
    backgroundColor: "#404040",
  },
  overlayHeader: {
    paddingHorizontal: 4,
    paddingBottom: 8,
    alignItems: "flex-start",
  },
  overlayTitle: {
    fontSize: 18,
    fontWeight: "600",
    textAlign: "left",
  },
});
