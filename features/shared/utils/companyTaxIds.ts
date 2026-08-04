/** ИНН: 10 цифр (юрлицо) или 12 (ИП / физлицо). */
export const INN_PATTERN = /^\d{10}$|^\d{12}$/;

/**
 * КПП: 9 символов — NNNNPPXXX (Приказ ФНС).
 * P — цифра или заглавная латинская буква A–Z.
 * Обязателен только при ИНН из 10 цифр.
 */
export const KPP_PATTERN = /^\d{4}[0-9A-Z]{2}\d{3}$/;

export function sanitizeInn(value: string): string {
  return value.replace(/\D/g, "").slice(0, 12);
}

export function sanitizeKpp(value: string): string {
  return value
    .toUpperCase()
    .replace(/[^0-9A-Z]/g, "")
    .slice(0, 9);
}

export function isValidInn(value: string): boolean {
  return INN_PATTERN.test(value.trim());
}

export function isValidKpp(value: string): boolean {
  return KPP_PATTERN.test(value.trim().toUpperCase());
}

/** КПП нужен только для ИНН юрлица (10 цифр). При ИНН 12 — не требуется. */
export function isKppRequired(inn: string): boolean {
  return sanitizeInn(inn).length === 10;
}

export function isCompanyTaxIdsValid(inn: string, kpp: string): boolean {
  const nextInn = sanitizeInn(inn);
  if (!isValidInn(nextInn)) return false;
  if (!isKppRequired(nextInn)) return true;
  return isValidKpp(kpp);
}
