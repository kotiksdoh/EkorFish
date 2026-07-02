type CartLikeItem = {
  id: string;
  productName?: string;
  stockInfo?: string;
};

export function isCheckoutItemAvailable(item: CartLikeItem): boolean {
  return item.stockInfo !== "Нет в наличии";
}

function formatStockLabel(stockInfo?: string): string {
  if (!stockInfo || stockInfo === "Нет в наличии") {
    return "нет в наличии на складе";
  }
  return stockInfo.charAt(0).toLowerCase() + stockInfo.slice(1);
}

function formatUnavailableItemsMessage(
  items: CartLikeItem[],
  pickupContext: boolean,
): string {
  if (items.length === 0) {
    return "";
  }

  if (items.length === 1) {
    const item = items[0];
    const stockLabel = formatStockLabel(item.stockInfo);
    const prefix = pickupContext
      ? "Для самовывоза товар недоступен:"
      : "Товар недоступен для заказа:";
    return `${prefix} «${item.productName || "Товар"}» — ${stockLabel}.`;
  }

  const names = items
    .slice(0, 2)
    .map((item) => `«${item.productName || "Товар"}»`)
    .join(", ");
  const suffix = items.length > 2 ? ` и ещё ${items.length - 2}` : "";

  if (pickupContext) {
    return `${items.length} товара недоступны для самовывоза: ${names}${suffix}. Снимите выбор или удалите их из корзины.`;
  }

  return `${items.length} товара недоступны для заказа: ${names}${suffix}. Снимите выбор или удалите их из корзины.`;
}

export type CheckoutOrderBlockerParams = {
  selectedCartItems: CartLikeItem[];
  deliveryMethod: "delivery" | "pickup";
  hasAddress: boolean;
  hasPickupStorage: boolean;
  hasDateTime: boolean;
  hasMainRecipient: boolean;
};

export function getCheckoutOrderBlockers({
  selectedCartItems,
  deliveryMethod,
  hasAddress,
  hasPickupStorage,
  hasDateTime,
  hasMainRecipient,
}: CheckoutOrderBlockerParams): string[] {
  const messages: string[] = [];
  const unavailableSelected = selectedCartItems.filter(
    (item) => !isCheckoutItemAvailable(item),
  );

  if (unavailableSelected.length > 0) {
    messages.push(
      formatUnavailableItemsMessage(
        unavailableSelected,
        deliveryMethod === "pickup",
      ),
    );
  }

  if (deliveryMethod === "delivery" && !hasAddress) {
    messages.push("Укажите адрес доставки в блоке «Компания и адрес».");
  }

  if (deliveryMethod === "pickup" && !hasPickupStorage) {
    messages.push("Выберите склад для самовывоза.");
  }

  if (!hasDateTime) {
    messages.push("Выберите дату и время получения заказа.");
  }

  if (!hasMainRecipient) {
    messages.push("Заполните корректно телефон, e-mail и ФИО основного получателя.");
  }

  return messages;
}
