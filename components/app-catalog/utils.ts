import { CATEGORY_MAP, categoryName } from "@/lib/categories";
import { OFFICIAL_CREATOR_NAME } from "@/lib/agent/official-creator";
import type { CatalogCardApp, ModalApp } from "./types";

/** 作者名の表示。「匿名」「ジサップ公式」はデータ上の名前なので、英語表示のときだけ訳す */
export function displayCreatorName(name: string | null | undefined, locale: string): string {
  const value = name?.trim() || "匿名";
  if (locale !== "en") return value;
  if (value === "匿名") return "Anonymous";
  if (value === OFFICIAL_CREATOR_NAME) return "Jisapp Official";
  return value;
}

export function catalogToModalApp(app: CatalogCardApp, locale = "ja"): ModalApp {
  const cat = app.category ? CATEGORY_MAP[app.category] : null;
  return {
    id: app.id,
    name: app.title,
    description: app.description ?? "",
    creator: app.creator_name ?? "匿名",
    rating: 5.0,
    reviews: app.stamp_count ?? 0,
    category: cat ? categoryName(cat, locale) : app.category ?? "",
    gradient: cat?.gradient ?? "from-emerald-500 to-teal-600",
    categoryId: app.category ?? null,
  };
}

export function normalizeCreatorSlug(slug: string): string {
  let value = slug.trim();
  try {
    value = decodeURIComponent(value);
  } catch {
    /* noop */
  }
  return value.trim();
}

export function getCreatorProfilePath(creatorName: string): string {
  const name = normalizeCreatorSlug(creatorName);
  if (!name || name === "匿名") return "/search";
  return `/creators/${encodeURIComponent(name)}`;
}

export function getCreatorApiPath(slugOrName: string): string {
  return `/api/creators/${encodeURIComponent(normalizeCreatorSlug(slugOrName))}`;
}
