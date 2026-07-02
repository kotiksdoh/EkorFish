import { ThemedText } from "@/components/themed-text";
import { AnimatedStackedSheet } from "@/features/shared/ui/AnimatedStackedSheet";
import { PrimaryButton } from "@/features/shared/ui/components/PrimartyButton";
import { getCart } from "@/features/catalog/catalogSlice";
import { fillCartFromPreset } from "@/features/templates/orderPresetsSlice";
import { SnapBottomSheet } from "@/features/shared/ui/SnapBottomSheet";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { useRouter } from "expo-router";
import React, { useMemo, useRef, useState } from "react";
import { StyleSheet, View } from "react-native";

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
            onCloseTemplates?.();
            onClose();
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
  onBindCloseRequest,
}: ContentProps & {
  visible: boolean;
  onBindCloseRequest?: (close: (() => void) | null) => void;
}) {
  const closeAnimatedRef = useRef<(() => void) | null>(null);

  if (!template) return null;

  const requestClose = () => {
    if (closeAnimatedRef.current) {
      closeAnimatedRef.current();
    } else {
      onClose();
    }
  };

  return (
    <AnimatedStackedSheet
      visible={visible}
      showBackdrop
      onClose={onClose}
      onBindCloseRequest={(fn) => {
        closeAnimatedRef.current = fn;
        onBindCloseRequest?.(fn);
      }}
    >
      <ThemedText
        style={styles.overlayTitle}
        lightColor="#1B1B1C"
        darkColor="#FBFCFF"
      >
        Добавить товары в корзину?
      </ThemedText>
      <OrderFromTemplateConfirmContent
        template={template}
        onClose={requestClose}
        onCloseTemplates={onCloseTemplates}
      />
    </AnimatedStackedSheet>
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
  overlayTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 16,
    textAlign: "left",
  },
});
