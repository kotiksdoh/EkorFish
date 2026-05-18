export function formatAddressField(value: unknown): string {
  const text = value != null ? String(value).trim() : "";
  return text || "-";
}

export function formatAddressSummary(address: {
  address?: string;
  floor?: string | null;
  apartment?: string | null;
  entrance?: string | null;
  intercom?: string | null;
} | null | undefined): string {
  if (!address?.address?.trim()) return "-";
  return [
    address.address.trim(),
    `этаж ${formatAddressField(address.floor)}`,
    `кв ${formatAddressField(address.apartment)}`,
  ].join(", ");
}

export function getCompanyDeliveryAddresses(company: {
  deliveryAddresses?: unknown[];
} | null | undefined): any[] {
  return Array.isArray(company?.deliveryAddresses)
    ? company.deliveryAddresses
    : [];
}

export function getFirstCompanyDeliveryAddress(
  company: { deliveryAddresses?: unknown[] } | null | undefined,
): any | null {
  const list = getCompanyDeliveryAddresses(company);
  return list.length > 0 ? list[0] : null;
}

export function mergeAddressIntoCompany<T extends { deliveryAddresses?: any[] }>(
  company: T,
  newAddress: any,
): T {
  const existing = company.deliveryAddresses ?? [];
  const already = existing.some((a) => a?.id === newAddress?.id);
  return {
    ...company,
    deliveryAddresses: already ? existing : [...existing, newAddress],
  };
}
