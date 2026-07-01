const HIDDEN_REPEAT_STATUS_CODES = new Set([
  "manager_accepted",
  "reserved",
  "new",
]);

export function canShowOrderRepeatButton(order: {
  orderStatuses?: Array<{ code?: string }>;
}): boolean {
  const currentStatus = order.orderStatuses?.at(-1);
  const code = currentStatus?.code;
  if (!code) {
    return true;
  }
  return !HIDDEN_REPEAT_STATUS_CODES.has(code);
}

export function formatOrderMoneyNoFraction(price: number): string {
  return price.toLocaleString("ru-RU");
}

export function getOrderRepeatQuantityLabel(order: {
  productsCount?: number;
  totalWeight?: number;
}): string {
  if (typeof order.totalWeight === "number" && order.totalWeight > 0) {
    return `${order.totalWeight} кг`;
  }
  return `${order.productsCount || 0} шт`;
}
