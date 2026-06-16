import { baseUrl } from "./axios";

export function isValidProductImageUrl(url: string | undefined | null): boolean {
  if (!url || typeof url !== "string") return false;
  const trimmed = url.trim();
  if (
    !trimmed ||
    trimmed === "undefined" ||
    trimmed.endsWith("/undefined") ||
    trimmed.endsWith("/")
  ) {
    return false;
  }
  return trimmed.length > 10 && trimmed.startsWith("http");
}

function extractImagePath(path: unknown): string {
  if (path == null || path === "") return "";

  if (typeof path === "string") {
    return path.trim();
  }

  if (typeof path === "object" && path !== null) {
    const record = path as { imageUrl?: unknown; url?: unknown };
    const value = record.imageUrl ?? record.url;
    return value == null ? "" : String(value).trim();
  }

  return "";
}

export function buildProductImageUrl(path: unknown): string {
  const normalizedPath = extractImagePath(path);
  if (
    !normalizedPath ||
    normalizedPath === "undefined" ||
    normalizedPath === "[object Object]"
  ) {
    return "";
  }

  if (/^https?:\/\//i.test(normalizedPath)) {
    return normalizedPath;
  }

  return `${baseUrl}/${normalizedPath.replace(/^\//, "")}`;
}

export function normalizeProductImages(images: unknown): { imageUrl: string }[] {
  if (!Array.isArray(images)) return [];

  const normalized: { imageUrl: string }[] = [];
  const seen = new Set<string>();

  for (let index = 0; index < images.length; index += 1) {
    const imageUrl = buildProductImageUrl(images[index]);
    if (!imageUrl || seen.has(imageUrl)) continue;
    seen.add(imageUrl);
    normalized.push({ imageUrl });
  }

  return normalized;
}
