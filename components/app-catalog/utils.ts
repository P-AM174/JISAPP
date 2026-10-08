import { CATEGORY_MAP, categoryName } from "@/lib/categories";
import { OFFICIAL_CREATOR_NAME } from "@/lib/agent/official-creator";
import type { CatalogCardApp, ModalApp } from "./types";
import { GUEST_MARK } from "@/lib/guest-name";
import { pick, toLocale } from "@/lib/i18n/config";

/** 作者名の表示。「匿名」「ジサップ公式」はデータ上の名前なので、英語・ベトナム語表示のときだけ訳す */
export function displayCreatorName(name: string | null | undefined, locale: string): string {
  const value = name?.trim() || "匿名";
  const l = toLocale(locale);
  if (l === "ja") return value;
  if (value === "匿名") return pick(l, "匿名", "Anonymous");
  if (value === "ゲスト") return pick(l, "ゲスト", "Guest");
  if (value === OFFICIAL_CREATOR_NAME) return pick(l, "ジサップ公式", "Jisapp Official");
  // ゲストのニックネーム「たろう（ゲスト）」は、後ろの印だけ訳す
  if (value.endsWith(GUEST_MARK)) return `${value.slice(0, -GUEST_MARK.length)} ${l === "vi" ? "(Khách)" : "(Guest)"}`;
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
    groupSharing: !!app.group_sharing,
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
