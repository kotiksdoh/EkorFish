import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { PrimaryButton } from "@/features/shared/ui/components/PrimartyButton";
import { fillCartFromPreset } from "@/features/templates/orderPresetsSlice";
import { getCart } from "@/features/catalog/catalogSlice";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { SnapBottomSheet } from "@/features/shared/ui/SnapBottomSheet";
import { useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import { StyleSheet, View } from "react-native";

type Props = {
  visible: boolean;
  template: { id: string; productsCount?: number; totalProductsPrice?: number } | null;
  onClose: () => void;
  /** Закрыть все модалки шаблонов перед переходом в корзину */
  onCloseTemplates?: () => void;
};

export function OrderFromTemplateConfirmModal({
  visible,
  template,
  onClose,
  onCloseTemplates,
}: Props) {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const isFillingCart = useAppSelector((s) => s.orderPresets.isFillingCart);
  const [localError, setLocalError] = useState<string | null>(null);

  const productsCount = template?.productsCount ?? 0;
  const totalProductsPrice = template?.totalProductsPrice ?? 0;

  const formatMoney = (n: number) =>
    n.toLocaleString("ru-RU", {
      minimumFractionDigits: 1,
      maximumFractionDigits: 2,
    });

  const goodsWord = (n: number) => {
    const abs = Math.abs(n) % 100;
    const d = abs % 10;
    if (abs > 10 && abs < 20) return "товаров";
    if (d === 1) return "товар";
    if (d >= 2 && d <= 4) return "товара";
    return "товаров";
  };

  const summaryLine = useMemo(() => {
    return `${productsCount} ${goodsWord(productsCount)} • ${formatMoney(totalProductsPrice)} ₽`;
  }, [productsCount, totalProductsPrice]);

  const doFillCart = async () => {
    if (!template?.id || isFillingCart) return;
    setLocalError(null);
    try {
      await dispatch(fillCartFromPreset(template.id)).unwrap();
      await dispatch(getCart()).unwrap();
      return true;
    } catch {
      setLocalError("Не удалось сформировать корзину по шаблону");
      return false;
    }
  };

  return (
    <SnapBottomSheet
      visible={visible}
      title="Добавить товары в корзину?"
      titleAlign="left"
      onClose={onClose}
    >
      <ThemedText style={styles.summary} lightColor="#80818B" darkColor="#FBFCFF80">
        {summaryLine}
      </ThemedText>

      <ThemedText style={styles.warning} lightColor="#C12B2B" darkColor="#FF6B6B">
        Текущая корзина будет очищена
      </ThemedText>

      {localError ? (
        <ThemedText style={styles.error} lightColor="#C12B2B" darkColor="#FF6B6B">
          {localError}
        </ThemedText>
      ) : null}

      <View style={styles.buttons}>
        <PrimaryButton
          title={isFillingCart ? "Загрузка..." : "Добавить в корзину"}
          onPress={async () => {
            const ok = await doFillCart();
            if (ok) onClose();
          }}
          variant="primary"
          fullWidth
          disabled={isFillingCart || !template?.id}
        />
        <View style={{ height: 10 }} />
        <PrimaryButton
          title={isFillingCart ? "Загрузка..." : "Перейти сразу к оформлению"}
          onPress={async () => {
            const ok = await doFillCart();
            if (!ok) return;
            onClose();
            onCloseTemplates?.();
            router.navigate("/shop");
          }}
          variant="third"
          fullWidth
          disabled={isFillingCart || !template?.id}
        />
      </View>
    </SnapBottomSheet>
  );
}

const styles = StyleSheet.create({
  summary: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 12,
  },
  warning: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 12,
  },
  error: {
    fontSize: 13,
    fontWeight: "500",
    marginBottom: 12,
  },
  buttons: {
    paddingBottom: 8,
  },
});
