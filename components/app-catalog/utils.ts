import { CATEGORY_MAP } from "@/lib/categories";
import type { CatalogCardApp, ModalApp } from "./types";

export function catalogToModalApp(app: CatalogCardApp): ModalApp {
  const cat = app.category ? CATEGORY_MAP[app.category] : null;
  return {
    id: app.id,
    name: app.title,
    description: app.description ?? "",
    creator: app.creator_name ?? "匿名",
    rating: 5.0,
    reviews: app.stamp_count ?? 0,
    category: cat?.name ?? app.category ?? "",
    gradient: cat?.gradient ?? "from-emerald-500 to-teal-600",
    emoji: cat?.emoji ?? "✨",
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
