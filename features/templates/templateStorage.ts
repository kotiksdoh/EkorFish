import AsyncStorage from "@react-native-async-storage/async-storage";

import type { OrderTemplate, TemplateLineItem } from "./types";

const STORAGE_KEY = "@ekor_order_templates_v1";

function mergeLine(
  items: TemplateLineItem[],
  line: TemplateLineItem,
): TemplateLineItem[] {
  const idx = items.findIndex(
    (i) =>
      i.productId === line.productId &&
      i.productPurchaseOptionId === line.productPurchaseOptionId,
  );
  if (idx >= 0) {
    const next = [...items];
    next[idx] = {
      ...next[idx],
      quantity: next[idx].quantity + line.quantity,
    };
    return next;
  }
  return [...items, line];
}

export async function loadTemplates(): Promise<OrderTemplate[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown[];
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((x): x is Record<string, unknown> => x !== null && typeof x === "object")
      .map((t) => {
        const { onlyMe: _om, allEmployees: _ae, ...rest } = t as Record<string, unknown> &
          Partial<OrderTemplate>;
        const r = rest as OrderTemplate;
        const createdAt =
          typeof r.createdAt === "number"
            ? r.createdAt
            : typeof r.updatedAt === "number"
              ? r.updatedAt
              : Date.now();
        return { ...r, createdAt };
      });
  } catch {
    return [];
  }
}

async function saveAll(templates: OrderTemplate[]): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(templates));
}

export async function getTemplateById(
  id: string,
): Promise<OrderTemplate | null> {
  const all = await loadTemplates();
  return all.find((t) => t.id === id) ?? null;
}

export async function upsertTemplate(
  template: OrderTemplate,
): Promise<void> {
  const all = await loadTemplates();
  const idx = all.findIndex((t) => t.id === template.id);
  const { onlyMe: _om, allEmployees: _ae, ...rest } =
    template as OrderTemplate & { onlyMe?: boolean; allEmployees?: boolean };
  const next = { ...rest, updatedAt: Date.now() } as OrderTemplate;
  if (idx >= 0) {
    all[idx] = next;
  } else {
    all.push(next);
  }
  await saveAll(all);
}

export async function deleteTemplate(id: string): Promise<void> {
  const all = await loadTemplates();
  await saveAll(all.filter((t) => t.id !== id));
}

export async function addOrMergeTemplateLine(
  templateId: string,
  line: TemplateLineItem,
): Promise<OrderTemplate | null> {
  const t = await getTemplateById(templateId);
  if (!t) return null;
  const items = mergeLine(t.items, line);
  const updated: OrderTemplate = { ...t, items, updatedAt: Date.now() };
  await upsertTemplate(updated);
  return updated;
}

export async function setTemplateItems(
  templateId: string,
  items: TemplateLineItem[],
): Promise<OrderTemplate | null> {
  const t = await getTemplateById(templateId);
  if (!t) return null;
  const updated: OrderTemplate = { ...t, items, updatedAt: Date.now() };
  await upsertTemplate(updated);
  return updated;
}

export function createTemplateId(): string {
  return `tpl_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 9)}`;
}
