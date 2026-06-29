type DeliveryTimeSlot = {
  startTime: string;
  endTime: string;
};

type DeliveryDaySchedule = {
  isWorkingDay?: boolean;
  startTime?: string;
  endTime?: string;
  timeSlots?: DeliveryTimeSlot[];
};

type DeliverySchedule = {
  weekSchedule?: Record<string, DeliveryDaySchedule>;
  deliveryWindowHours?: number;
};

export type OrderPageData = {
  nearestDeliveryDate?: string;
  deliverySchedule?: DeliverySchedule;
};

const WEEK_DAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
] as const;

function getDaySchedule(
  weekSchedule: Record<string, DeliveryDaySchedule>,
  dayIndex: number,
): DeliveryDaySchedule | undefined {
  const pascalKey = WEEK_DAYS[dayIndex];
  const lowerKey = pascalKey.toLowerCase();
  return weekSchedule[lowerKey] ?? weekSchedule[pascalKey];
}

export function getTimeSlotsForDate(
  date: Date,
  schedule?: DeliverySchedule | null,
): DeliveryTimeSlot[] {
  if (!schedule?.weekSchedule) return [];

  const daySchedule = getDaySchedule(schedule.weekSchedule, date.getDay());

  if (!daySchedule?.isWorkingDay) {
    return [];
  }

  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  let slots = [...(daySchedule.timeSlots || [])];

  if (isToday) {
    const currentTimeInMinutes = now.getHours() * 60 + now.getMinutes();
    const deliveryWindowHours = schedule.deliveryWindowHours || 2;

    slots = slots.filter((slot) => {
      const [slotHour, slotMinute] = slot.startTime.split(":").map(Number);
      const slotStartInMinutes = slotHour * 60 + slotMinute;
      return (
        slotStartInMinutes > currentTimeInMinutes + deliveryWindowHours * 60
      );
    });
  }

  return slots;
}

export function formatTimeSlotRange(timeSlot?: DeliveryTimeSlot | null): string {
  if (!timeSlot) return "";
  const start = timeSlot.startTime.slice(0, 5);
  const end = timeSlot.endTime.slice(0, 5);
  return `${start} - ${end}`;
}

function getDayDeliveryTimeRange(
  date: Date,
  schedule?: DeliverySchedule | null,
): string {
  if (!schedule?.weekSchedule) return "";

  const daySchedule = getDaySchedule(schedule.weekSchedule, date.getDay());

  if (!daySchedule?.isWorkingDay || !daySchedule.startTime || !daySchedule.endTime) {
    return "";
  }

  return formatTimeSlotRange({
    startTime: daySchedule.startTime,
    endTime: daySchedule.endTime,
  });
}

function formatRelativeDeliveryDay(date: Date): string {
  const today = new Date();
  const todayStart = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate(),
  );
  const targetStart = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
  );
  const diffDays = Math.round(
    (targetStart.getTime() - todayStart.getTime()) / (24 * 60 * 60 * 1000),
  );

  if (diffDays === 0) return "Сегодня";
  if (diffDays === 1) return "Завтра";

  const months = [
    "января",
    "февраля",
    "марта",
    "апреля",
    "мая",
    "июня",
    "июля",
    "августа",
    "сентября",
    "октября",
    "ноября",
    "декабря",
  ];

  return `${date.getDate()} ${months[date.getMonth()]}`;
}

export function formatNearestDeliveryDisplay(
  orderData?: OrderPageData | null,
): string | null {
  if (!orderData?.nearestDeliveryDate) return null;

  const nearestDate = new Date(orderData.nearestDeliveryDate);
  if (Number.isNaN(nearestDate.getTime())) return null;

  const dayLabel = formatRelativeDeliveryDay(nearestDate);
  const timeRange = getDayDeliveryTimeRange(
    nearestDate,
    orderData.deliverySchedule,
  );

  return timeRange ? `${dayLabel}, ${timeRange}` : dayLabel;
}

export function isWorkingDeliveryDay(
  date: Date,
  schedule?: DeliverySchedule | null,
): boolean {
  if (!schedule?.weekSchedule) return false;
  return !!getDaySchedule(schedule.weekSchedule, date.getDay())?.isWorkingDay;
}
