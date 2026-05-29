import crashlytics from "@react-native-firebase/crashlytics";
import { Platform } from "react-native";

export const isCrashlyticsSupported =
  Platform.OS === "ios" || Platform.OS === "android";

export async function initCrashlytics(): Promise<void> {
  if (!isCrashlyticsSupported) return;

  try {
    await crashlytics().setCrashlyticsCollectionEnabled(true);
    crashlytics().log("App initialized");
  } catch (error) {
    console.log("[Crashlytics] init failed:", error);
  }
}

export async function setCrashlyticsUserId(userId: string | null): Promise<void> {
  if (!isCrashlyticsSupported) return;

  try {
    await crashlytics().setUserId(userId ? String(userId) : "");
  } catch (error) {
    console.log("[Crashlytics] setUserId failed:", error);
  }
}

export function recordAppError(
  error: unknown,
  context?: Record<string, string>,
): void {
  if (!isCrashlyticsSupported) return;

  const normalized =
    error instanceof Error ? error : new Error(String(error ?? "Unknown error"));

  try {
    if (context) {
      crashlytics().setAttributes(context);
    }
    crashlytics().recordError(normalized);
  } catch (recordError) {
    console.log("[Crashlytics] recordError failed:", recordError);
  }
}
