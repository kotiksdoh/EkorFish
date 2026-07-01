import { ThemedText } from "@/components/themed-text";
import { PrimaryButton } from "@/features/shared/ui/components/PrimartyButton";
import { SnapBottomSheet } from "@/features/shared/ui/SnapBottomSheet";
import {
  formatOrderMoneyNoFraction,
  getOrderRepeatQuantityLabel,
} from "@/features/shared/utils/orderRepeat";
import { Platform, StyleSheet, View } from "react-native";

type OrderReorderSheetProps = {
  visible: boolean;
  orderId: number;
  canReorderFully: boolean;
  isReordering: boolean;
  productsCount: number;
  totalAmount: number;
  totalWeight?: number;
  onClose: () => void;
  onConfirm: () => void;
};

export function OrderReorderSheet({
  visible,
  orderId,
  canReorderFully,
  isReordering,
  productsCount,
  totalAmount,
  totalWeight,
  onClose,
  onConfirm,
}: OrderReorderSheetProps) {
  const quantityLabel = getOrderRepeatQuantityLabel({
    productsCount,
    totalWeight,
  });

  return (
    <SnapBottomSheet
      visible={visible}
      title={
        canReorderFully
          ? `Повторить заказ №${orderId}`
          : `Повторить заказ №${orderId}?`
      }
      titleAlign="left"
      onClose={onClose}
    >
      {canReorderFully ? (
        <>
          <ThemedText
            style={styles.reorderSubTitle}
            lightColor="#80818B"
            darkColor="#FBFCFF80"
          >
            В корзину будет добавлено:
          </ThemedText>
          <View style={styles.reorderList}>
            <ThemedText
              style={styles.reorderListItem}
              lightColor="#1B1B1C"
              darkColor="#FBFCFF"
            >
              • {productsCount} товара
            </ThemedText>
            <ThemedText
              style={styles.reorderListItem}
              lightColor="#1B1B1C"
              darkColor="#FBFCFF"
            >
              • {quantityLabel}
            </ThemedText>
            <ThemedText
              style={styles.reorderListItem}
              lightColor="#1B1B1C"
              darkColor="#FBFCFF"
            >
              • На сумму {formatOrderMoneyNoFraction(totalAmount)} ₽
            </ThemedText>
          </View>
          <ThemedText
            style={styles.reorderWarning}
            lightColor="#C12B2B"
            darkColor="#FF6B6B"
          >
            Текущая корзина будет очищена
          </ThemedText>
          <View
            style={[
              styles.reorderButtonsRow,
              Platform.OS === "android" && { paddingBottom: 2 },
            ]}
          >
            <PrimaryButton
              title="Отмена"
              onPress={onClose}
              variant="third"
              fullWidth
              style={styles.reorderButton}
            />
            <PrimaryButton
              title={isReordering ? "Загрузка..." : "Повторить"}
              onPress={onConfirm}
              variant="primary"
              fullWidth
              style={styles.reorderButton}
              disabled={isReordering}
            />
          </View>
        </>
      ) : (
        <>
          <ThemedText
            style={styles.reorderMissingTitle}
            lightColor="#1B1B1C"
            darkColor="#FBFCFF"
          >
            Некоторые товары сейчас отсутствуют.
          </ThemedText>
          <ThemedText
            style={styles.reorderMissingText}
            lightColor="#80818B"
            darkColor="#80818B"
          >
            При повторении заказа система автоматически подберет аналоги из той
            же ценовой группы. Если подходящей замены не найдется, будут
            предложены товары из той же категории.
          </ThemedText>
          <ThemedText
            style={styles.reorderWarning}
            lightColor="#C12B2B"
            darkColor="#FF6B6B"
          >
            Текущая корзина будет очищена
          </ThemedText>
          <View
            style={[
              styles.reorderButtonsColumn,
              Platform.OS === "android" && { paddingBottom: 28 },
            ]}
          >
            <PrimaryButton
              title={isReordering ? "Загрузка..." : "Повторить с заменой"}
              onPress={onConfirm}
              variant="primary"
              fullWidth
              disabled={isReordering}
            />
            <View style={{ height: 10 }} />
            <PrimaryButton
              title="Отмена"
              onPress={onClose}
              variant="third"
              fullWidth
            />
          </View>
        </>
      )}
    </SnapBottomSheet>
  );
}

const styles = StyleSheet.create({
  reorderSubTitle: {
    fontSize: 14,
    marginBottom: 12,
  },
  reorderList: {
    gap: 8,
    marginBottom: 16,
  },
  reorderListItem: {
    fontSize: 16,
    fontWeight: "500",
  },
  reorderWarning: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 20,
  },
  reorderButtonsRow: {
    flexDirection: "row",
    gap: 10,
  },
  reorderButton: {
    flex: 1,
    minWidth: 0,
  },
  reorderMissingTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 12,
    lineHeight: 22,
  },
  reorderMissingText: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 12,
    lineHeight: 22,
  },
  reorderButtonsColumn: {
    paddingBottom: 8,
  },
});
