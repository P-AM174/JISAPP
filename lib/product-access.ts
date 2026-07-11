import type { Product } from "@prisma/client";

/** ソースコードをレスポンスに含めてよいか */
export function canAccessProductCode(
  product: Pick<Product, "price" | "creatorId">,
  userId: string | null,
  isPurchased: boolean
): boolean {
  if (userId && product.creatorId === userId) return true;
  if (isPurchased) return true;
  if (product.price > 0) return false;
  return true;
}

export function stripProductCode<T extends Record<string, unknown>>(product: T): T {
  const {
    htmlCode,
    cssCode,
    jsCode,
    previewFiles,
    productFiles,
    html_code,
    css_code,
    js_code,
    previewFiles: _pf,
    productFiles: _prf,
    ...rest
  } = product as T & {
    htmlCode?: unknown;
    cssCode?: unknown;
    jsCode?: unknown;
    previewFiles?: unknown;
    productFiles?: unknown;
    html_code?: unknown;
    css_code?: unknown;
    js_code?: unknown;
  };
  return rest as T;
}

export function toPublicProduct(product: Product, includeCode: boolean) {
  const base = {
    id: product.id,
    title: product.title,
    description: product.description,
    price: product.price,
    sourceUrl: product.sourceUrl,
    productType: product.productType,
    listingType: product.listingType,
    category: product.category,
    status: product.status,
    isPlaygroundApp: product.isPlaygroundApp,
    isDemo: product.isDemo,
    gradient: product.gradient,
    tagColor: product.tagColor,
    iconName: product.iconName,
    creatorId: product.creatorId,
    createdAt: product.createdAt.toISOString(),
    updatedAt: product.updatedAt.toISOString(),
    creator: undefined as { name: string | null; image: string | null } | undefined,
  };

  if (!includeCode) return base;

  return {
    ...base,
    htmlCode: product.htmlCode,
    cssCode: product.cssCode,
    jsCode: product.jsCode,
    previewFiles: product.previewFiles,
    productFiles: product.productFiles,
  };
}
