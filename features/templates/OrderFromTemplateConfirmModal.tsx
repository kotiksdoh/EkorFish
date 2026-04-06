import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { PrimaryButton } from "@/features/shared/ui/components/PrimartyButton";
import React, { useEffect } from "react";
import { Modal, StyleSheet, View } from "react-native";

import { getTemplateById } from "./templateStorage";
import type { OrderTemplate } from "./types";

type Props = {
  visible: boolean;
  template: OrderTemplate | null;
  onClose: () => void;
};

export function OrderFromTemplateConfirmModal({
  visible,
  template,
  onClose,
}: Props) {
  useEffect(() => {
    if (!visible || !template?.id) return;
    (async () => {
      const fresh = await getTemplateById(template.id);
      console.log(
        "[Сделать заказ по шаблону — черновик для API]",
        JSON.stringify(fresh ?? template, null, 2),
      );
    })();
  }, [visible, template?.id]);

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <ThemedView
          lightColor="#FFFFFF"
          darkColor="#202022"
          style={styles.card}
        >
          <ThemedText style={styles.title}>Заказ по шаблону</ThemedText>
          <ThemedText
            style={styles.body}
            lightColor="#80818B"
            darkColor="#FBFCFF80"
          >
            Параметры шаблона и товары выведены в консоль (режим без бэкенда).
          </ThemedText>
          <PrimaryButton title="Понятно" onPress={onClose} variant="primary" />
        </ThemedView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  card: {
    borderRadius: 16,
    padding: 20,
    gap: 16,
  },
  title: { fontSize: 18, fontWeight: "600" },
  body: { fontSize: 14, lineHeight: 20 },
});
