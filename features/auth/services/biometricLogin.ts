import AsyncStorage from "@react-native-async-storage/async-storage";
import * as LocalAuthentication from "expo-local-authentication";
import { Platform } from "react-native";

export const BIOMETRIC_LOGIN_ENABLED_KEY = "biometric_login_enabled";

export type BiometricType = "face" | "fingerprint" | "iris" | null;

export async function isBiometricLoginEnabled(): Promise<boolean> {
  const value = await AsyncStorage.getItem(BIOMETRIC_LOGIN_ENABLED_KEY);
  return value === "true";
}

export async function setBiometricLoginEnabled(enabled: boolean): Promise<void> {
  if (enabled) {
    await AsyncStorage.setItem(BIOMETRIC_LOGIN_ENABLED_KEY, "true");
  } else {
    await AsyncStorage.removeItem(BIOMETRIC_LOGIN_ENABLED_KEY);
  }
}

export async function getBiometricAvailability(): Promise<{
  available: boolean;
  enrolled: boolean;
  type: BiometricType;
}> {
  const hasHardware = await LocalAuthentication.hasHardwareAsync();
  const isEnrolled = await LocalAuthentication.isEnrolledAsync();
  const supportedTypes =
    await LocalAuthentication.supportedAuthenticationTypesAsync();

  let type: BiometricType = null;
  if (
    supportedTypes.includes(
      LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION,
    )
  ) {
    type = "face";
  } else if (
    supportedTypes.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)
  ) {
    type = "fingerprint";
  } else if (
    supportedTypes.includes(LocalAuthentication.AuthenticationType.IRIS)
  ) {
    type = "iris";
  }

  return {
    available: hasHardware && isEnrolled,
    enrolled: isEnrolled,
    type,
  };
}

export function getBiometricLoginLabel(type: BiometricType): string {
  if (type === "face") {
    return "Входить по Face ID";
  }
  if (type === "fingerprint") {
    return Platform.OS === "ios"
      ? "Входить по Touch ID"
      : "Входить по отпечатку";
  }
  return "Входить по биометрии";
}

export async function authenticateWithBiometrics(
  promptMessage?: string,
): Promise<boolean> {
  const { available } = await getBiometricAvailability();
  if (!available) {
    return false;
  }

  const result = await LocalAuthentication.authenticateAsync({
    promptMessage: promptMessage ?? "Подтвердите вход",
    cancelLabel: "Отмена",
    disableDeviceFallback: true,
  });

  return result.success;
}
