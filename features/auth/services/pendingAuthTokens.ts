import AsyncStorage from "@react-native-async-storage/async-storage";

let pendingAccessToken: string | null = null;
let pendingRefreshToken: string | null = null;

export function setPendingAuthTokens(accessToken: string, refreshToken: string) {
  pendingAccessToken = accessToken;
  pendingRefreshToken = refreshToken;
}

export function getPendingAccessToken(): string | null {
  return pendingAccessToken;
}

export function getPendingRefreshToken(): string | null {
  return pendingRefreshToken;
}

export function clearPendingAuthTokens() {
  pendingAccessToken = null;
  pendingRefreshToken = null;
}

export async function persistAuthTokens(
  accessToken: string,
  refreshToken: string,
): Promise<void> {
  await AsyncStorage.setItem("token", accessToken);
  await AsyncStorage.setItem("token_refresh", refreshToken);
  clearPendingAuthTokens();
}

export function needsRegistrationCompletion(userData: {
  needUserType?: boolean;
  needInformationForType?: string | null;
} | null | undefined): boolean {
  if (!userData) {
    return false;
  }

  if (userData.needUserType === true) {
    return true;
  }

  return (
    userData.needInformationForType === "Individual" ||
    userData.needInformationForType === "Legal"
  );
}
