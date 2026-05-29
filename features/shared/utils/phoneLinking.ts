import { Alert, Linking, Platform } from "react-native";

type PhoneSource = {
  phoneNumber?: string | null;
  phone?: string | null;
} | null | undefined;

export function getNormalizedPhone(source: PhoneSource): string {
  const raw = source?.phoneNumber || source?.phone || "";
  return String(raw).replace(/[^\d+]/g, "");
}

export async function openPhoneDialer(source: PhoneSource): Promise<void> {
  const normalized = getNormalizedPhone(source);
  if (!normalized) {
    Alert.alert("Ошибка", "Номер телефона не указан");
    return;
  }

  const url = `tel:${normalized}`;

  try {
    // canOpenURL для tel: на Android 11+ часто возвращает false без queries в манифесте.
    if (Platform.OS === "ios") {
      const canOpen = await Linking.canOpenURL(url);
      if (!canOpen) {
        Alert.alert("Ошибка", "Невозможно совершить звонок на этом устройстве");
        return;
      }
    }

    await Linking.openURL(url);
  } catch (error) {
    console.error("Ошибка при звонке:", error);
    Alert.alert("Ошибка", "Не удалось совершить звонок");
  }
}

export async function openTelegramByPhone(source: PhoneSource): Promise<void> {
  const phoneNumber = getNormalizedPhone(source);
  if (!phoneNumber) {
    Alert.alert("Ошибка", "Номер телефона не указан");
    return;
  }

  const telegramDeepLink = `tg://resolve?phone=${phoneNumber}`;
  const telegramWebLink = `https://t.me/+${phoneNumber.replace(/^\+/, "")}`;

  try {
    if (Platform.OS === "ios") {
      const canOpenTelegram = await Linking.canOpenURL(telegramDeepLink);
      if (canOpenTelegram) {
        await Linking.openURL(telegramDeepLink);
        return;
      }
    }

    await Linking.openURL(telegramWebLink);
  } catch (error) {
    console.error("Ошибка при открытии Telegram:", error);
    Alert.alert("Ошибка", "Не удалось открыть Telegram");
  }
}
