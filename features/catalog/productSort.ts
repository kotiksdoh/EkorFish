export type ProductSortId = "nameAsc" | "nameDesc" | "priceAsc" | "priceDesc";

export const DEFAULT_PRODUCT_SORT: ProductSortId = "nameAsc";

export const PRODUCT_SORT_OPTIONS: { id: ProductSortId; label: string }[] = [
  { id: "nameAsc", label: "По алфавиту (От А до Я)" },
  { id: "nameDesc", label: "По алфавиту (От Я до А)" },
  { id: "priceAsc", label: "Низкая цена" },
  { id: "priceDesc", label: "Высокая цена" },
];

export function getProductSortQueryParams(
  sortId: ProductSortId,
): { name?: "asc" | "desc"; price?: "asc" | "desc" } {
  switch (sortId) {
    case "nameAsc":
      return { name: "asc" };
    case "nameDesc":
      return { name: "desc" };
    case "priceAsc":
      return { price: "asc" };
    case "priceDesc":
      return { price: "desc" };
    default:
      return { name: "asc" };
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
