import { detectProductType, transformGoogleCopyUrl } from "./source-url";
import type { Product, ProductType } from "./types";

/** localStorage の出品レコードを Product 型に正規化（後方互換） */
export function normalizeProduct(raw: Record<string, unknown>): Product {
  const title = String(raw.title ?? raw.name ?? "無題のアプリ");
  const listing_type = (raw.listing_type ?? raw.type ?? "file") as "file" | "url";
  const rawUrl = raw.source_url ?? raw.url;
  let source_url =
    typeof rawUrl === "string" && rawUrl.trim() ? rawUrl.trim() : null;

  let product_type = (raw.product_type as ProductType | undefined) ?? "generic";
  if (product_type === "generic" && source_url) {
    product_type = detectProductType(source_url);
  }
  if (product_type === "google" && source_url?.includes("/edit")) {
    source_url = transformGoogleCopyUrl(source_url);
  }

  const price =
    typeof raw.price === "number"
      ? raw.price
      : typeof raw.priceNum === "number"
        ? raw.priceNum
        : 0;

  return {
    ...raw,
    title,
    name: title,
    price,
    priceNum: price,
    source_url,
    url: source_url,
    product_type,
    listing_type,
    type: listing_type,
    html_code: typeof raw.html_code === "string" ? raw.html_code : null,
    css_code: typeof raw.css_code === "string" ? raw.css_code : null,
    js_code: typeof raw.js_code === "string" ? raw.js_code : null,
    is_playground_app: Boolean(raw.is_playground_app),
  } as Product;
}
