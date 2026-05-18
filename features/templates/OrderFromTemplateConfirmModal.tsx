import { ThemedText } from "@/components/themed-text";
import { PrimaryButton } from "@/features/shared/ui/components/PrimartyButton";
import { getCart } from "@/features/catalog/catalogSlice";
import { fillCartFromPreset } from "@/features/templates/orderPresetsSlice";
import { SnapBottomSheet } from "@/features/shared/ui/SnapBottomSheet";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  StyleSheet,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type TemplateSummary = {
  id: string;
  productsCount?: number;
  totalProductsPrice?: number;
};

type ContentProps = {
  template: TemplateSummary | null;
  onClose: () => void;
  onCloseTemplates?: () => void;
};

function formatMoney(n: number) {
  return n.toLocaleString("ru-RU", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 2,
  });
}

function goodsWord(n: number) {
  const abs = Math.abs(n) % 100;
  const d = abs % 10;
  if (abs > 10 && abs < 20) return "товаров";
  if (d === 1) return "товар";
  if (d >= 2 && d <= 4) return "товара";
  return "товаров";
}

export function OrderFromTemplateConfirmContent({
  template,
  onClose,
  onCloseTemplates,
}: ContentProps) {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const isFillingCart = useAppSelector((s) => s.orderPresets.isFillingCart);
  const [localError, setLocalError] = useState<string | null>(null);

  const productsCount = template?.productsCount ?? 0;
  const totalProductsPrice = template?.totalProductsPrice ?? 0;

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
    <>
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
          title={isFillingCart ? "Загрузка..." : "В корзину"}
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
    </>
  );
}

/** Inline-панель поверх модалки шаблонов (без вложенного Modal). */
export function OrderFromTemplateConfirmOverlay({
  visible,
  template,
  onClose,
  onCloseTemplates,
}: ContentProps & { visible: boolean }) {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  if (!visible || !template) return null;

  return (
    <View style={styles.overlayRoot} pointerEvents="box-none">
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlayBackdrop} />
      </TouchableWithoutFeedback>
      <View
        style={[
          styles.overlaySheet,
          isDark && styles.overlaySheetDark,
          { paddingBottom: 16 + Math.max(insets.bottom, 16) },
        ]}
      >
        <View style={styles.handleWrap}>
          <View style={[styles.handle, isDark && styles.handleDark]} />
        </View>
        <ThemedText
          style={styles.overlayTitle}
          lightColor="#1B1B1C"
          darkColor="#FBFCFF"
        >
          Добавить товары в корзину?
        </ThemedText>
        <OrderFromTemplateConfirmContent
          template={template}
          onClose={onClose}
          onCloseTemplates={onCloseTemplates}
        />
      </View>
    </View>
  );
}

type ModalProps = ContentProps & {
  visible: boolean;
};

export function OrderFromTemplateConfirmModal({
  visible,
  template,
  onClose,
  onCloseTemplates,
}: ModalProps) {
  return (
    <SnapBottomSheet
      visible={visible}
      title="Добавить товары в корзину?"
      titleAlign="left"
      onClose={onClose}
    >
      <OrderFromTemplateConfirmContent
        template={template}
        onClose={onClose}
        onCloseTemplates={onCloseTemplates}
      />
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
  overlayRoot: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 60,
    justifyContent: "flex-end",
  },
  overlayBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.45)",
  },
  overlaySheet: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 16,
    paddingTop: 8,
    borderWidth: 1,
    borderColor: "#F0F3F7",
    maxHeight: "92%",
  },
  overlaySheetDark: {
    backgroundColor: "#202022",
    borderColor: "#323235",
  },
  handleWrap: {
    alignItems: "center",
    paddingBottom: 8,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#C0C0C5",
  },
  handleDark: {
    backgroundColor: "#404040",
  },
  overlayTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 16,
    textAlign: "left",
  },
});
