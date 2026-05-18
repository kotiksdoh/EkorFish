export type ProductSortId = "nameAsc" | "nameDesc" | "priceAsc" | "priceDesc";

export const DEFAULT_PRODUCT_SORT: ProductSortId = "nameAsc";

export const PRODUCT_SORT_OPTIONS: { id: ProductSortId; label: string }[] = [
  { id: "nameAsc", label: "По алфавиту (От А до Я)" },
  { id: "nameDesc", label: "По алфавиту (От Я до А)" },
  { id: "priceAsc", label: "Низкая цена" },
  { id: "priceDesc", label: "Высокая цена" },
];

/** SortBy: 0 — алфавит, 1 — цена. IsDesc: false — asc, true — desc */
export function getProductSortQueryParams(sortId: ProductSortId): {
  SortBy: 0 | 1;
  IsDesc: boolean;
} {
  switch (sortId) {
    case "nameAsc":
      return { SortBy: 0, IsDesc: false };
    case "nameDesc":
      return { SortBy: 0, IsDesc: true };
    case "priceAsc":
      return { SortBy: 1, IsDesc: false };
    case "priceDesc":
      return { SortBy: 1, IsDesc: true };
    default:
      return { SortBy: 0, IsDesc: false };
  }
}

export function applyProductSortToParams(
  params: Record<string, unknown>,
  sortId: ProductSortId,
): void {
  Object.assign(params, getProductSortQueryParams(sortId));
}

export function getProductSortLabel(sortId: ProductSortId): string {
  return (
    PRODUCT_SORT_OPTIONS.find((opt) => opt.id === sortId)?.label ?? "От А до Я"
  );
}
