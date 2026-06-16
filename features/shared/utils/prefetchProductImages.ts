import { Image } from "expo-image";

export function prefetchProductImageUrls(
  products: Array<{ image?: string | null }>,
  maxCount = 30,
) {
  let prefetched = 0;

  for (const product of products) {
    if (prefetched >= maxCount) break;

    const url = product.image;
    if (typeof url !== "string" || !url.startsWith("http") || url.length <= 10) {
      continue;
    }

    void Image.prefetch(url, "disk");
    prefetched += 1;
  }
}
