const PURCHASE_OPTION_LABELS: Record<string, string> = {
  retail: "На развес",
  wholesale: "Оптом",
  wholesale_small: "Малый опт",
  wholesale_large: "Крупный опт",
  package: "Упаковками",
  promo: "Акция",
};

export function getPurchaseOptionLabel(
  code: string,
  fallback?: string,
): string {
  return PURCHASE_OPTION_LABELS[code] ?? fallback ?? code;
}
