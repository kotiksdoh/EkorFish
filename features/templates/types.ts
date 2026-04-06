export type ReminderFrequency = "daily" | "weekly" | "monthly" | "off";

export interface TemplateLineItem {
  productId: string;
  productPurchaseOptionId: string;
  quantity: number;
  productName: string;
  productImage?: string;
  measureType?: string;
  optionName?: string;
  pricePerUnit?: number;
  step?: number;
  minQuantity?: number;
  /** Снимок избранного с момента добавления в шаблон */
  isFavorite?: boolean;
}

export interface OrderTemplate {
  id: string;
  name: string;
  description: string;
  companyId: string | null;
  companyName: string | null;
  reminderFrequency: ReminderFrequency;
  items: TemplateLineItem[];
  /** Метка времени создания (для отображения «Создан:») */
  createdAt: number;
  updatedAt: number;
}

export const REMINDER_LABELS: Record<ReminderFrequency, string> = {
  daily: "Каждый день",
  weekly: "Раз в неделю",
  monthly: "Раз в месяц",
  off: "Не напоминать",
};
