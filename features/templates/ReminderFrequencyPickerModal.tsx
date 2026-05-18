import { ThemedText } from "@/components/themed-text";
import { CustomCheckbox } from "@/features/shared/ui/components/CustomCheckBox";
import { AnimatedStackedSheet } from "@/features/shared/ui/AnimatedStackedSheet";
import { SnapBottomSheet } from "@/features/shared/ui/SnapBottomSheet";
import React, { useCallback } from "react";
import {
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";

export type ReminderFrequencyOption = { frequency: number; name: string };

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
  showBackdrop = true,
  onBindCloseRequest,
}: PickerProps & {
  visible: boolean;
  showBackdrop?: boolean;
  onBindCloseRequest?: (close: (() => void) | null) => void;
}) {
  const handleSelect = useCallback(
    (frequency: number) => {
      onSelect(frequency);
    },
    [onSelect],
  );

  if (!visible) return null;

  return (
    <AnimatedStackedSheet
      visible
      showBackdrop={showBackdrop}
      onClose={onClose}
      onBindCloseRequest={onBindCloseRequest}
    >
      <ThemedText
        style={styles.overlayTitle}
        lightColor="#1B1B1C"
        darkColor="#FBFCFF"
      >
        Частота напоминаний
      </ThemedText>
      <ReminderFrequencyPickerContent
        value={value}
        options={options}
        onClose={onClose}
        onSelect={handleSelect}
      />
    </AnimatedStackedSheet>
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
  overlayTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 12,
    textAlign: "left",
  },
});
