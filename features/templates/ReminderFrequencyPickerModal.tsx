import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { CustomCheckbox } from "@/features/shared/ui/components/CustomCheckBox";
import React from "react";
import {
  Modal,
  Pressable,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";

import type { ReminderFrequency } from "./types";
import { REMINDER_LABELS } from "./types";

const OPTIONS: ReminderFrequency[] = ["daily", "weekly", "monthly", "off"];

type Props = {
  visible: boolean;
  value: ReminderFrequency;
  onClose: () => void;
  onSelect: (v: ReminderFrequency) => void;
};

export function ReminderFrequencyPickerModal({
  visible,
  value,
  onClose,
  onSelect,
}: Props) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.backdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <ThemedView
          style={styles.sheet}
          lightColor="#FFFFFF"
          darkColor="#151516"
        >
          <ThemedText
            style={styles.title}
            lightColor="#1B1B1C"
            darkColor="#FBFCFF"
          >
            Частота напоминаний
          </ThemedText>
          <View style={styles.list}>
            {OPTIONS.map((opt) => {
              const selected = value === opt;
              return (
                <TouchableOpacity
                  key={opt}
                  style={styles.row}
                  onPress={() => {
                    onSelect(opt);
                    onClose();
                  }}
                  activeOpacity={0.75}
                >
                  <CustomCheckbox
                    value={selected}
                    onValueChange={() => {
                      onSelect(opt);
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
                    {REMINDER_LABELS[opt]}
                  </ThemedText>
                </TouchableOpacity>
              );
            })}
          </View>
        </ThemedView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  sheet: {
    borderRadius: 16,
    padding: 20,
    maxWidth: 400,
    width: "100%",
    alignSelf: "center",
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 16,
  },
  list: { gap: 4 },
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

