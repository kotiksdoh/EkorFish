export type AppParam = {
  name: string;
  value: string;
};

export type SupportContacts = {
  phone: string;
  email: string;
  telegram: string;
};

export function getParamValue(
  params: AppParam[] | undefined,
  name: string,
): string {
  if (!Array.isArray(params)) {
    return "";
  }

  return String(params.find((param) => param.name === name)?.value ?? "").trim();
}

export function getSupportContactsFromParams(
  params: AppParam[] | undefined,
): SupportContacts {
  return {
    phone: getParamValue(params, "SUPPORT_PHONE"),
    email: getParamValue(params, "SUPPORT_EMAIL"),
    telegram: getParamValue(params, "SUPPORT_TELEGRAM"),
  };
}

export function normalizeTelegramUrl(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) {
    return "";
  }

  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }

  if (/^tg:\/\//i.test(trimmed)) {
    return trimmed;
  }

  if (/^t\.me\//i.test(trimmed)) {
    return `https://${trimmed}`;
  }

  const username = trimmed.replace(/^@/, "");
  return `https://t.me/${username}`;
}
