import { Alert, Linking, Platform } from "react-native";

const PHONE_FIELD_KEYS = [
  "phoneNumber",
  "phone",
  "mobilePhone",
  "contactPhone",
  "telephone",
  "mobile",
] as const;

export type PhoneSource = {
  phoneNumber?: string | null;
  phone?: string | null;
  mobilePhone?: string | null;
  contactPhone?: string | null;
  telephone?: string | null;
  mobile?: string | null;
  id?: string;
} | null | undefined;

export function extractPhoneRaw(source: PhoneSource): string {
  if (!source) {
    return "";
  }

  for (const key of PHONE_FIELD_KEYS) {
    const value = source[key];
    if (value != null && String(value).trim()) {
      return String(value).trim();
    }
  }

  return "";
}

/** Цифры в международном формате без «+», например 79991234567 */
export function normalizePhoneDigits(raw: string): string {
  let digits = raw.replace(/[^\d+]/g, "");
  if (digits.startsWith("+")) {
    digits = digits.slice(1);
  }
  digits = digits.replace(/\D/g, "");

  if (digits.length === 10 && digits.startsWith("9")) {
    digits = `7${digits}`;
  }

  if (digits.length === 11 && digits.startsWith("8")) {
    digits = `7${digits.slice(1)}`;
  }

  return digits;
}

export function normalizePhoneForTel(raw: string): string {
  const digits = normalizePhoneDigits(raw);
  if (!digits) {
    return "";
  }

  return `+${digits}`;
}

/** Отображение российского номера: +7 (967) 667-35-51 */
export function formatPhoneDisplay(raw: string): string {
  const digits = normalizePhoneDigits(raw);
  if (!digits) {
    return raw;
  }

  const match = digits.match(/^(\d{1})(\d{0,3})(\d{0,3})(\d{0,2})(\d{0,2})$/);
  if (!match) {
    return `+${digits}`;
  }

  const [, , area, part1, part2, part3] = match;
  let formatted = "+7";

  if (area) formatted += ` (${area}`;
  if (part1) formatted += `) ${part1}`;
  if (part2) formatted += `-${part2}`;
  if (part3) formatted += `-${part3}`;

  return formatted;
}

export function resolveManagerContact<T extends { id?: string }>(
  manager: T | null | undefined,
  managersList?: T[] | null,
): T | null {
  if (!manager) {
    return null;
  }

  if (extractPhoneRaw(manager as PhoneSource)) {
    return manager;
  }

  if (!managersList?.length || !manager.id) {
    return manager;
  }

  const fromList = managersList.find((item) => item.id === manager.id);
  if (!fromList) {
    return manager;
  }

  return { ...manager, ...fromList };
}

async function tryOpenUrls(urls: string[]): Promise<boolean> {
  for (const url of urls) {
    try {
      if (Platform.OS === "ios") {
        const canOpen = await Linking.canOpenURL(url);
        if (!canOpen) {
          continue;
        }
      }

      await Linking.openURL(url);
      return true;
    } catch (error) {
      console.warn("Не удалось открыть URL:", url, error);
    }
  }

  return false;
}

export async function openPhoneDialer(source: PhoneSource): Promise<void> {
  const raw = extractPhoneRaw(source);
  const normalized = normalizePhoneForTel(raw);
  const digits = normalizePhoneDigits(raw);

  if (!normalized || !digits) {
    Alert.alert("Ошибка", "Номер телефона не указан");
    return;
  }

  const opened = await tryOpenUrls([
    `tel:${normalized}`,
    `tel:${digits}`,
    `tel:+${digits}`,
  ]);

  if (!opened) {
    Alert.alert("Ошибка", "Не удалось совершить звонок");
  }
}

export async function openTelegramByPhone(source: PhoneSource): Promise<void> {
  const raw = extractPhoneRaw(source);
  const digits = normalizePhoneDigits(raw);

  if (!digits) {
    Alert.alert("Ошибка", "Номер телефона не указан");
    return;
  }

  const urls =
    Platform.OS === "android"
      ? [
          `tg://resolve?phone=${digits}`,
          `https://t.me/+${digits}`,
          `https://telegram.me/+${digits}`,
        ]
      : [
          `tg://resolve?phone=${digits}`,
          `https://t.me/+${digits}`,
        ];

  const opened = await tryOpenUrls(urls);

  if (!opened) {
    Alert.alert(
      "Ошибка",
      "Не удалось открыть Telegram. Установите приложение или проверьте номер менеджера.",
    );
  }
}
