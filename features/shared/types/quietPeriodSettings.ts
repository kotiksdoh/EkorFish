export interface QuietPeriodSettings {
  isEnabled: boolean;
  startTime: string;
  endTime: string;
}

export function isValidQuietTime(value: string): boolean {
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
}

export function formatQuietTimeForDisplay(value: string): string {
  if (!value) return "22:00";

  const timeMatch = value.match(/^(\d{1,2}):(\d{2})(?::\d{2})?/);
  if (timeMatch && !value.includes("T")) {
    const hours = timeMatch[1].padStart(2, "0");
    const minutes = timeMatch[2].padStart(2, "0");
    return `${hours}:${minutes}`;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "22:00";

  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${hours}:${minutes}`;
}

export function timeLabelToApiTime(value: string): string {
  const [hours = "0", minutes = "0"] = value.split(":");
  return `${hours.padStart(2, "0")}:${minutes.padStart(2, "0")}:00`;
}

export function buildQuietPeriodPayload(
  settings: QuietPeriodSettings,
): QuietPeriodSettings {
  return {
    isEnabled: settings.isEnabled,
    startTime: timeLabelToApiTime(formatQuietTimeForDisplay(settings.startTime)),
    endTime: timeLabelToApiTime(formatQuietTimeForDisplay(settings.endTime)),
  };
}
