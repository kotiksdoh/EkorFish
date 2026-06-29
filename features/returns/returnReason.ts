export type ReturnReasonId = string | number;

export function isReturnReasonSelected(
  reason: ReturnReasonId | null | undefined,
): reason is ReturnReasonId {
  if (reason === null || reason === undefined) return false;
  if (typeof reason === "string") return reason.trim().length > 0;
  return Number.isFinite(reason);
}

export function isSameReturnReason(
  a: ReturnReasonId | null | undefined,
  b: ReturnReasonId | null | undefined,
): boolean {
  if (!isReturnReasonSelected(a) || !isReturnReasonSelected(b)) return false;
  return String(a) === String(b);
}
