const CANCELABLE_STATUS_CODES = new Set([
  "new",
  "manager_accepted",
  "reserved",
]);

type OrderStatusSource = {
  canCancel?: boolean;
  statuses?: { code?: string }[];
  orderStatuses?: { code?: string }[];
};

export function getLatestOrderStatusCode(
  order: OrderStatusSource,
): string | undefined {
  const statuses = order.statuses ?? order.orderStatuses;
  return statuses?.at(-1)?.code?.toLowerCase();
}

export function canCancelOrder(order: OrderStatusSource): boolean {
  if (typeof order.canCancel === "boolean") {
    return order.canCancel;
  }

  const statusCode = getLatestOrderStatusCode(order);
  return statusCode ? CANCELABLE_STATUS_CODES.has(statusCode) : false;
}
