import * as Application from "expo-application";
import Constants from "expo-constants";
import * as FileSystem from "expo-file-system";
import { NativeModules } from "react-native";

export type AppVersionInfo = {
  version: string;
  build: string;
};

export type AppAboutDynamicInfo = {
  lastUpdate: string;
  cacheSize: string;
};

export function getAppVersionInfo(): AppVersionInfo {
  const version =
    Application.nativeApplicationVersion ||
    Constants.expoConfig?.version ||
    "—";

  const build =
    Application.nativeBuildVersion ||
    String(Constants.expoConfig?.ios?.buildNumber ?? "") ||
    String(Constants.expoConfig?.android?.versionCode ?? "") ||
    "—";

  return { version, build };
}

function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) {
    return "0 Б";
  }

  const units = ["Б", "КБ", "МБ", "ГБ"];
  const unitIndex = Math.min(
    Math.floor(Math.log(bytes) / Math.log(1024)),
    units.length - 1,
  );
  const value = bytes / 1024 ** unitIndex;

  return `${value.toFixed(unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`;
}

async function getDirectorySize(uri: string): Promise<number> {
  const info = await FileSystem.getInfoAsync(uri);
  if (!info.exists) {
    return 0;
  }

  if (!info.isDirectory) {
    return info.size ?? 0;
  }

  const entries = await FileSystem.readDirectoryAsync(uri);
  let total = 0;

  for (const entry of entries) {
    const entryUri = uri.endsWith("/") ? `${uri}${entry}` : `${uri}/${entry}`;
    total += await getDirectorySize(entryUri);
  }

  return total;
}

async function getCacheSizeBytes(): Promise<number> {
  if (!FileSystem.cacheDirectory) {
    return 0;
  }

  return getDirectorySize(FileSystem.cacheDirectory);
}

function formatRuDate(date: Date): string {
  return date.toLocaleDateString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

async function getOtaUpdateLabel(): Promise<string | null> {
  if (!NativeModules.ExpoUpdates) {
    return null;
  }

  try {
    const Updates = require("expo-updates") as typeof import("expo-updates");

    if (!Updates.isEnabled) {
      return null;
    }

    const updateDate =
      Updates.createdAt ??
      (Updates.manifest as { createdAt?: string } | null)?.createdAt;

    if (updateDate) {
      const parsedDate =
        updateDate instanceof Date ? updateDate : new Date(updateDate);

      if (!Number.isNaN(parsedDate.getTime())) {
        return formatRuDate(parsedDate);
      }
    }

    if (Updates.updateId) {
      return "Установлено OTA-обновление";
    }
  } catch (error) {
    console.warn("Не удалось получить дату OTA-обновления:", error);
  }

  return null;
}

export async function getLastUpdateLabel(): Promise<string> {
  const otaLabel = await getOtaUpdateLabel();
  if (otaLabel) {
    return otaLabel;
  }

  try {
    const installTime = await Application.getInstallationTimeAsync();
    if (installTime && !Number.isNaN(installTime.getTime())) {
      return formatRuDate(installTime);
    }
  } catch (error) {
    console.warn("Не удалось получить дату установки:", error);
  }

  return "—";
}

export async function loadAppAboutDynamicInfo(): Promise<AppAboutDynamicInfo> {
  const [lastUpdate, cacheBytes] = await Promise.all([
    getLastUpdateLabel(),
    getCacheSizeBytes().catch((error) => {
      console.warn("Не удалось посчитать размер кэша:", error);
      return 0;
    }),
  ]);

  return {
    lastUpdate,
    cacheSize: formatBytes(cacheBytes),
  };
}
