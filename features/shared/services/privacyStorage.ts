import AsyncStorage from "@react-native-async-storage/async-storage";

export const PRIVACY_SETTINGS_KEY = "@ekor_privacy_settings_v1";
export const SEARCH_HISTORY_STORAGE_KEY = "@search_history";
export const RECENTLY_VIEWED_STORAGE_KEY = "@ekor_recently_viewed_products_v1";

export type PrivacySettings = {
  anonymousStatistics: boolean;
  showInCompanyContactSearch: boolean;
};

const DEFAULT_PRIVACY_SETTINGS: PrivacySettings = {
  anonymousStatistics: true,
  showInCompanyContactSearch: true,
};

export async function loadPrivacySettings(): Promise<PrivacySettings> {
  try {
    const raw = await AsyncStorage.getItem(PRIVACY_SETTINGS_KEY);
    if (!raw) return { ...DEFAULT_PRIVACY_SETTINGS };

    const parsed = JSON.parse(raw) as Partial<PrivacySettings>;
    return {
      anonymousStatistics:
        parsed.anonymousStatistics ?? DEFAULT_PRIVACY_SETTINGS.anonymousStatistics,
      showInCompanyContactSearch:
        parsed.showInCompanyContactSearch ??
        DEFAULT_PRIVACY_SETTINGS.showInCompanyContactSearch,
    };
  } catch {
    return { ...DEFAULT_PRIVACY_SETTINGS };
  }
}

export async function savePrivacySettings(
  settings: PrivacySettings,
): Promise<void> {
  await AsyncStorage.setItem(PRIVACY_SETTINGS_KEY, JSON.stringify(settings));
}

export async function clearSearchHistory(): Promise<void> {
  await AsyncStorage.removeItem(SEARCH_HISTORY_STORAGE_KEY);
}

export async function clearRecentlyViewedCache(): Promise<void> {
  await AsyncStorage.removeItem(RECENTLY_VIEWED_STORAGE_KEY);
}
