export type OrderReminderRemindWhen =
  | "dayBeforeExpectedDate"
  | "onExpectedDateDay";

export type OrderReminderFrequency =
  | "weekly"
  | "everyTwoWeeks"
  | "monthly"
  | "automatically";

export type OrderReminderWeeklyDay =
  | "monday"
  | "tuesday"
  | "wednesday"
  | "thursday"
  | "friday"
  | "saturday"
  | "sunday";

export type OrderReminderAbout =
  | "frequentlyBoughtProducts"
  | "seasonalProductsAndPromotions"
  | "productsRunningOut";

export interface OrderReminderSettings {
  isEnabled: boolean;
  remindWhen: OrderReminderRemindWhen | string;
  remindAtTime: string;
  remindAbout: string;
  frequency: OrderReminderFrequency | string;
  weeklyDay?: OrderReminderWeeklyDay | null;
  monthlyDay?: number | null;
}

export const DEFAULT_ORDER_REMINDER_SETTINGS: OrderReminderSettings = {
  isEnabled: false,
  remindWhen: "dayBeforeExpectedDate",
  remindAtTime: "2024-01-01T10:00:00.000Z",
  remindAbout: "frequentlyBoughtProducts",
  frequency: "weekly",
  weeklyDay: "monday",
  monthlyDay: 1,
};

export const REMIND_WHEN_OPTIONS: {
  value: OrderReminderRemindWhen;
  label: string;
}[] = [
  {
    value: "dayBeforeExpectedDate",
    label: "За день до предполагаемой даты заказа",
  },
  {
    value: "onExpectedDateDay",
    label: "В день предполагаемой даты заказа",
  },
];

export const REMIND_ABOUT_OPTIONS: {
  value: OrderReminderAbout;
  label: string;
}[] = [
  {
    value: "frequentlyBoughtProducts",
    label: "Часто покупаемые товары (на основе истории)",
  },
  {
    value: "seasonalProductsAndPromotions",
    label: "Сезонные товары и акции",
  },
  {
    value: "productsRunningOut",
    label: "Товары, которые заканчиваются (по расходу)",
  },
];

export const FREQUENCY_OPTIONS: {
  value: OrderReminderFrequency;
  label: string;
}[] = [
  { value: "weekly", label: "Еженедельно" },
  { value: "everyTwoWeeks", label: "Раз в 2 недели" },
  { value: "monthly", label: "Ежемесячно" },
  { value: "automatically", label: "Автоматически" },
];

export const WEEKLY_DAY_OPTIONS: {
  value: OrderReminderWeeklyDay;
  label: string;
}[] = [
  { value: "monday", label: "По понедельникам" },
  { value: "tuesday", label: "По вторникам" },
  { value: "wednesday", label: "По средам" },
  { value: "thursday", label: "По четвергам" },
  { value: "friday", label: "По пятницам" },
  { value: "saturday", label: "По субботам" },
  { value: "sunday", label: "По воскресеньям" },
];

export const REMIND_TIME_OPTIONS = Array.from({ length: 25 }, (_, index) => {
  const totalMinutes = 8 * 60 + index * 30;
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  const label = `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
  return { value: label, label };
});

export function normalizeRemindWhen(value: string): OrderReminderRemindWhen {
  if (value === "onExpectedDateDay" || value === "dayBeforeExpectedDate") {
    return value;
  }
  if (value === "onExpectedDate") {
    return "onExpectedDateDay";
  }
  return "dayBeforeExpectedDate";
}

export function normalizeFrequency(value: string): OrderReminderFrequency {
  if (value === "biweekly") {
    return "everyTwoWeeks";
  }
  const match = FREQUENCY_OPTIONS.find((option) => option.value === value);
  return match?.value ?? "weekly";
}

export function parseRemindAbout(value: string): OrderReminderAbout[] {
  if (!value) return [];

  return value
    .split(",")
    .map((item) => item.trim())
    .filter((item): item is OrderReminderAbout =>
      REMIND_ABOUT_OPTIONS.some((option) => option.value === item),
    );
}

export function serializeRemindAbout(values: OrderReminderAbout[]): string {
  return values.join(",");
}

export function formatRemindTime(isoValue: string): string {
  if (!isoValue) return "10:00";

  const date = new Date(isoValue);
  if (Number.isNaN(date.getTime())) return "10:00";

  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${hours}:${minutes}`;
}

export function timeLabelToIso(timeLabel: string): string {
  const [hours, minutes] = timeLabel.split(":").map(Number);
  const date = new Date();
  date.setHours(hours || 0, minutes || 0, 0, 0);
  return date.toISOString();
}

export function getRemindWhenLabel(value: string): string {
  const normalized = normalizeRemindWhen(value);
  return (
    REMIND_WHEN_OPTIONS.find((option) => option.value === normalized)?.label ??
    REMIND_WHEN_OPTIONS[0].label
  );
}

export function getWeeklyDayLabel(value?: string | null): string {
  return (
    WEEKLY_DAY_OPTIONS.find((option) => option.value === value)?.label ??
    WEEKLY_DAY_OPTIONS[0].label
  );
}

export function getMonthlyDayLabel(value?: number | string | null): string {
  const day = Number(value);
  if (!Number.isFinite(day) || day < 1 || day > 31) {
    return "1 числа";
  }
  return `${day} числа`;
}

export function buildOrderReminderPayload(
  settings: OrderReminderSettings,
): OrderReminderSettings {
  const frequency = normalizeFrequency(settings.frequency);
  const payload: OrderReminderSettings = {
    isEnabled: settings.isEnabled,
    remindWhen: normalizeRemindWhen(settings.remindWhen),
    remindAtTime: settings.remindAtTime,
    remindAbout: settings.remindAbout,
    frequency,
  };

  if (frequency === "weekly") {
    payload.weeklyDay = settings.weeklyDay ?? "monday";
  }

  if (frequency === "monthly") {
    const day = Number(settings.monthlyDay);
    payload.monthlyDay =
      Number.isFinite(day) && day >= 1 && day <= 31 ? day : 1;
  }

  return payload;
}
