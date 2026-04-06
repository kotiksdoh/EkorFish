import type { TemplateLineItem } from "./types";

export function buildTemplateLineFromProduct(
  product: any,
  optionId: string,
  quantity: number,
): TemplateLineItem {
  const opt = product?.purchaseOptions?.find((o: any) => String(o.id) === String(optionId));
  return {
    productId: String(product.id),
    productPurchaseOptionId: String(optionId),
    quantity,
    productName: product.name ?? "",
    productImage: typeof product.image === "string" ? product.image : undefined,
    measureType: product.measureType,
    optionName: opt?.name,
    pricePerUnit: opt?.price,
    step: opt?.step,
    minQuantity: opt?.minQuantity,
    isFavorite: !!product?.isFavorite,
  };
}
