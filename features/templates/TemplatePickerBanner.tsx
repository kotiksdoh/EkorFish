import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import React from "react";
import { StyleSheet, TouchableOpacity } from "react-native";

import { useTemplatePicker } from "./TemplatePickerContext";

export function TemplatePickerBanner() {
  const { pickingForTemplateId, returnToTemplateEditor } = useTemplatePicker();
  if (!pickingForTemplateId) return null;
  return (
    <ThemedView lightColor="#E7F0FD" darkColor="#202022" style={styles.bar}>
      <ThemedText style={styles.text} numberOfLines={2}>
        Режим шаблона: добавляйте товары, затем вернитесь к шаблону
      </ThemedText>
      <TouchableOpacity onPress={returnToTemplateEditor} style={styles.btn}>
        <ThemedText style={styles.btnText}>К шаблону</ThemedText>
      </TouchableOpacity>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderColor: "#F0F3F7",
  },
  text: { flex: 1, fontSize: 13, fontWeight: "500" },
  btn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: "#203686",
  },
  btnText: { color: "#FFFFFF", fontSize: 13, fontWeight: "600" },
});
