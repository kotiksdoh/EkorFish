import { ThemedText } from "@/components/themed-text";
import { CustomCheckbox } from "@/features/shared/ui/components/CustomCheckBox";
import { SnapBottomSheet } from "@/features/shared/ui/SnapBottomSheet";
import React from "react";
import {
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";

export type ReminderFrequencyOption = { frequency: number; name: string };

type Props = {
  visible: boolean;
  options: ReminderFrequencyOption[];
  value: number | null;
  onClose: () => void;
  onSelect: (v: number) => void;
};

export function ReminderFrequencyPickerModal({
  visible,
  value,
  options,
  onClose,
  onSelect,
}: Props) {
  return (
    <SnapBottomSheet
      visible={visible}
      title="Частота напоминаний"
      titleAlign="left"
      onClose={onClose}
    >
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
});

