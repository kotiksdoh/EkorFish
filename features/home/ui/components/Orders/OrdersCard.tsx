import { ArrowIconRight, Copy } from "@/assets/icons/icons";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { OrderDetailsModal } from "@/features/shared/ui/OrderDetailModal";
import * as Clipboard from "expo-clipboard";
import React, { useState } from "react";
import { Alert, StyleSheet, TouchableOpacity, View } from "react-native";

export interface Order {
  id: number;
  orderStatus: string;
  productsCount: number;
  totalAmount: number;
  deliveryDate: string;
}

interface OrdersCardProps {
  order: Order;
}

const formatDeliveryDate = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const optionsDate: Intl.DateTimeFormatOptions = {
    day: "numeric",
    month: "long",
  };
  const optionsTime: Intl.DateTimeFormatOptions = {
    hour: "2-digit",
    minute: "2-digit",
  };

  if (
    date.getDate() === tomorrow.getDate() &&
    date.getMonth() === tomorrow.getMonth() &&
    date.getFullYear() === tomorrow.getFullYear()
  ) {
    return `Доставка завтра, ${date.toLocaleTimeString("ru-RU", optionsTime)}`;
  } else {
    const formattedDate = date.toLocaleDateString("ru-RU", optionsDate);
    const formattedTime = date.toLocaleTimeString("ru-RU", optionsTime);
    return `${formattedDate}, ${formattedTime}`;
  }
};

export default function OrdersCard({ order }: OrdersCardProps) {
  const [modalVisible, setModalVisible] = useState(false);

  const handleCopyId = async () => {
    await Clipboard.setStringAsync(order.id.toString());
    Alert.alert(
      "Скопировано",
      `ID заказа ${order.id} скопирован в буфер обмена.`,
    );
  };

  return (
    <>
      <ThemedView lightColor="#F2F4F7" darkColor="#2A2F3A" style={styles.card}>
        {/* Верхняя часть: ID и кол-во/сумма */}
        <View style={styles.topRow}>
          <TouchableOpacity onPress={handleCopyId}>
            <ThemedView
              lightColor="#DADFE3"
              darkColor="#3D4350"
              style={styles.idContainer}
            >
              <ThemedText
                lightColor="#1B1B1C"
                darkColor="#FBFCFF"
                style={styles.idText}
              >
                {order.id}
              </ThemedText>
              <Copy />
            </ThemedView>
          </TouchableOpacity>
          <ThemedText
            lightColor="#80818B"
            darkColor="#A0A5B3"
            style={styles.countTotalText}
          >
            {order.productsCount} шт • {order.totalAmount.toFixed(2)} ₽
          </ThemedText>
        </View>

        {/* Статус заказа - кликабельный */}
        <TouchableOpacity
          style={styles.statCont}
          onPress={() => setModalVisible(true)}
        >
          <ThemedText
            lightColor="#1B1B1C"
            darkColor="#FBFCFF"
            style={styles.status}
          >
            {order.orderStatus}
          </ThemedText>
          <ArrowIconRight />
        </TouchableOpacity>

        {/* Дата доставки */}
        <ThemedText
          lightColor="#80818B"
          darkColor="#A0A5B3"
          style={styles.date}
        >
          {formatDeliveryDate(order.deliveryDate)}
        </ThemedText>
      </ThemedView>

      {/* Модальное окно с деталями заказа */}
      <OrderDetailsModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        orderId={order.id}
      />
    </>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    padding: 12,
    marginRight: 12,
    width: 280,
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  idContainer: {
    paddingHorizontal: 5,
    paddingVertical: 5,
    borderRadius: 6,
    alignSelf: "flex-start",
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  idText: {
    fontSize: 12,
    fontWeight: "500",
  },
  countTotalText: {
    fontSize: 14,
    fontWeight: "500",
  },
  statCont: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  status: {
    fontSize: 16,
    fontWeight: "600",
  },
  date: {
    fontSize: 14,
    fontWeight: "400",
  },
});
