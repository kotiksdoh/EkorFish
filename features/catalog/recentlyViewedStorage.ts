import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_KEY = "@ekor_recently_viewed_products_v1";
const MAX_RECENTLY_VIEWED = 4;

export type RecentlyViewedProduct = {
  id: string | number;
  name: string;
  price: number;
  pricePerKg: number;
  image: string;
  isFrozen: boolean;
  purchaseOptions?: any[];
  measureType?: string;
  dateFrom?: string;
  dateTo?: string;
  isFavorite?: boolean;
  stocks?: any[];
};

export async function loadRecentlyViewedProducts(): Promise<
  RecentlyViewedProduct[]
> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return [];

    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];

    return parsed
      .filter((item): item is RecentlyViewedProduct => {
        return (
          item !== null &&
          typeof item === "object" &&
          "id" in item &&
          "name" in item
        );
      })
      .slice(0, MAX_RECENTLY_VIEWED);
  } catch {
    return [];
  }
}

export async function addRecentlyViewedProduct(
  product: RecentlyViewedProduct,
): Promise<void> {
  const items = await loadRecentlyViewedProducts();
  const productId = String(product.id);
  const withoutDuplicate = items.filter((item) => String(item.id) !== productId);
  const next = [product, ...withoutDuplicate].slice(0, MAX_RECENTLY_VIEWED);
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
}

export function buildRecentlyViewedFromDetail(
  product: any,
): RecentlyViewedProduct | null {
  if (!product?.id) return null;

  let packageOption = product.purchaseOptions?.find(
    (option: any) => option.code === "package",
  );
  if (!packageOption && product.purchaseOptions?.length > 0) {
    packageOption = product.purchaseOptions[0];
  }

  const pricePerKg = packageOption?.price || 0;
  const price = pricePerKg * (packageOption?.step || 1);
  const image =
    typeof product.image === "string" && product.image
      ? product.image
      : (product.images?.[0]?.imageUrl ?? "");

  return {
    id: product.id,
    name: product.name ?? "",
    price,
    pricePerKg,
    image,
    isFrozen: true,
    purchaseOptions: Array.isArray(product.purchaseOptions)
      ? product.purchaseOptions
      : [],
    measureType: product.measureType,
    dateFrom: product.dateFrom,
    dateTo: product.dateTo,
    isFavorite: product.isFavorite,
    stocks: Array.isArray(product.stocks) ? product.stocks : [],
  };
}
