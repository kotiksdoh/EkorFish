import { ArrowIconRight, Copy, RepeatOrderIcon } from "@/assets/icons/icons";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import {
  checkForReorder,
  getCart,
  reorderOrder,
} from "@/features/catalog/catalogSlice";
import { OrderDetailsModal } from "@/features/shared/ui/OrderDetailModal";
import { OrderReorderSheet } from "@/features/shared/ui/OrderReorderSheet";
import { canShowOrderRepeatButton } from "@/features/shared/utils/orderRepeat";
import { formatProductCount } from "@/features/shared/utils/pluralize";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useAppDispatch } from "@/store/hooks";
import * as Clipboard from "expo-clipboard";
import { useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  Alert,
  InteractionManager,
  Platform,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";

export interface Order {
  id: number;
  orderStatuses: any[];
  productsCount: number;
  totalAmount: number;
  deliveryDate: string;
  canCancel?: boolean;
}

interface OrdersCardProps {
  order: Order;
  fullWidth: boolean;
  showRepeatButton?: boolean;
  onReorderSuccess?: () => void;
  onOrderUpdated?: () => void;
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

export default function OrdersCard({
  order,
  fullWidth,
  showRepeatButton = false,
  onReorderSuccess,
  onOrderUpdated,
}: OrdersCardProps) {
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === "dark";
  const dispatch = useAppDispatch();
  const router = useRouter();
  const [modalVisible, setModalVisible] = useState(false);
  const [reorderSheetVisible, setReorderSheetVisible] = useState(false);
  const [canReorderFully, setCanReorderFully] = useState(true);
  const [isCheckingReorder, setIsCheckingReorder] = useState(false);
  const [isReordering, setIsReordering] = useState(false);

  const shouldShowRepeatButton =
    showRepeatButton && canShowOrderRepeatButton(order);

  const handleCopyId = async () => {
    await Clipboard.setStringAsync(order.id.toString());
    Alert.alert(
      "Скопировано",
      `ID заказа ${order.id} скопирован в буфер обмена.`,
    );
  };

  const finishReorderNavigation = useCallback(() => {
    const finish = () => {
      onReorderSuccess?.();
      router.replace("/(tabs)/shop");
    };

    if (Platform.OS === "ios") {
      InteractionManager.runAfterInteractions(() => {
        setTimeout(finish, 320);
      });
      return;
    }

    finish();
  }, [onReorderSuccess, router]);

  const openReorderSheet = async () => {
    if (isCheckingReorder) return;

    setIsCheckingReorder(true);
    try {
      const result = await dispatch(checkForReorder(order.id)).unwrap();
      setCanReorderFully(Boolean(result));
      setReorderSheetVisible(true);
    } catch (error) {
      Alert.alert("Ошибка", "Не удалось проверить возможность повторного заказа");
    } finally {
      setIsCheckingReorder(false);
    }
  };

  const handleReorder = async () => {
    if (isReordering) return;

    setIsReordering(true);
    try {
      await dispatch(reorderOrder(order.id)).unwrap();
      await dispatch(getCart()).unwrap();
      setReorderSheetVisible(false);

      const proceed = () => {
        setIsReordering(false);
        finishReorderNavigation();
      };

      if (Platform.OS === "ios") {
        setTimeout(proceed, 280);
      } else {
        proceed();
      }
    } catch (error) {
      setIsReordering(false);
      Alert.alert("Ошибка", "Не удалось повторить заказ. Попробуйте позже.");
    }
  };

  return (
    <>
      <ThemedView lightColor="#F2F4F7" darkColor="#2A2F3A" style={[styles.card, fullWidth && {
        width: '100%'
      }]}>
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
              <Copy fill={isDarkMode ? "#FBFCFF" : "#1B1B1C"} />
            </ThemedView>
          </TouchableOpacity>
          <ThemedText
            lightColor="#80818B"
            darkColor="#A0A5B3"
            style={styles.countTotalText}
          >
            {formatProductCount(order.productsCount)} • {order.totalAmount.toFixed(2)} ₽
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
            {order.orderStatuses.at(-1)?.name ?? ""}
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

        {shouldShowRepeatButton ? (
          <TouchableOpacity
            style={[
              styles.repeatButton,
              isDarkMode ? styles.repeatButtonDark : styles.repeatButtonLight,
            ]}
            onPress={openReorderSheet}
            activeOpacity={0.85}
            disabled={isCheckingReorder}
          >
            <RepeatOrderIcon fill={isDarkMode ? "#1B1B1C" : "#FFFFFF"} />
            <ThemedText
              style={[
                styles.repeatButtonText,
                isDarkMode
                  ? styles.repeatButtonTextDark
                  : styles.repeatButtonTextLight,
              ]}
            >
              {isCheckingReorder ? "Проверяем..." : "Повторить заказ"}
            </ThemedText>
          </TouchableOpacity>
        ) : null}
      </ThemedView>

      {/* Модальное окно с деталями заказа */}
      <OrderDetailsModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        orderId={order.id}
        onReorderSuccess={onReorderSuccess}
        onOrderUpdated={onOrderUpdated}
      />

      <OrderReorderSheet
        visible={reorderSheetVisible}
        orderId={order.id}
        canReorderFully={canReorderFully}
        isReordering={isReordering}
        productsCount={order.productsCount}
        totalAmount={order.totalAmount}
        onClose={() => setReorderSheetVisible(false)}
        onConfirm={handleReorder}
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
  repeatButton: {
    marginTop: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: 12,
    alignSelf: "flex-start",
  },
  repeatButtonLight: {
    backgroundColor: "#1B1B1C",
  },
  repeatButtonDark: {
    backgroundColor: "#FFFFFF",
  },
  repeatButtonText: {
    fontSize: 14,
    fontWeight: "600",
  },
  repeatButtonTextLight: {
    color: "#FFFFFF",
  },
  repeatButtonTextDark: {
    color: "#1B1B1C",
  },
});
