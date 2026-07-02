import AsyncStorage from "@react-native-async-storage/async-storage";

export const AUTH_SESSION_STORAGE_KEYS = [
  "token",
  "token_refresh",
  "company",
  "user",
] as const;

type SessionClearedHandler = () => void;

let sessionClearedHandler: SessionClearedHandler | null = null;

export function registerSessionClearedHandler(
  handler: SessionClearedHandler,
): void {
  sessionClearedHandler = handler;
}

export async function hasAuthToken(): Promise<boolean> {
  const token = await AsyncStorage.getItem("token");
  return Boolean(token);
}

export async function clearAuthSessionStorage(): Promise<void> {
  try {
    await AsyncStorage.multiRemove([...AUTH_SESSION_STORAGE_KEYS]);
  } catch (error) {
    console.error("[clearAuthSession] failed to clear storage", error);
  }
}

export async function clearAuthSession(): Promise<void> {
  await clearAuthSessionStorage();

  try {
    sessionClearedHandler?.();
  } catch (error) {
    console.error("[clearAuthSession] handler failed", error);
  }
}
