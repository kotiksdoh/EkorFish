import AsyncStorage from "@react-native-async-storage/async-storage";

export const PENDING_TOWN_STORAGE_KEY = "pendingStorageId";

export async function getPendingTownId(): Promise<string | null> {
  try {
    const value = await AsyncStorage.getItem(PENDING_TOWN_STORAGE_KEY);
    if (!value || !value.trim()) return null;
    return value.trim();
  } catch {
    return null;
  }
}

export async function setPendingTownId(storageId: string): Promise<void> {
  await AsyncStorage.setItem(PENDING_TOWN_STORAGE_KEY, String(storageId));
}

export async function clearPendingTownId(): Promise<void> {
  await AsyncStorage.removeItem(PENDING_TOWN_STORAGE_KEY);
}
