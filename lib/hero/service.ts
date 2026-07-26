import { createServerSupabaseClient } from "@/lib/supabase-server";
import { getPopularApps } from "@/lib/home/catalog";
import { DEFAULT_HERO_SLIDES } from "./defaults";
import type {
  HeroFeaturedApp,
  HeroSlide,
  HeroSlideInput,
  HeroSlidePublic,
  HeroSlideRow,
} from "./types";

function rowToSlide(row: HeroSlideRow): HeroSlide {
  return {
    id: row.id,
    sortOrder: row.sort_order,
    enabled: row.enabled,
    badge: row.badge,
    title: row.title,
    subtitle: row.subtitle,
    ctaEnabled: row.cta_enabled,
    ctaLabel: row.cta_label,
    ctaHref: row.cta_href,
    layout: row.layout,
    theme: row.theme,
    visualType: row.visual_type,
    bgPattern: row.bg_pattern,
    featuredAppIds: row.featured_app_ids ?? [],
    updatedAt: row.updated_at,
  };
}

function slideToRow(slide: HeroSlideInput, sortOrder: number): Omit<HeroSlideRow, "id" | "updated_at"> & { id?: string } {
  return {
    id: slide.id,
    sort_order: sortOrder,
    enabled: slide.enabled,
    badge: slide.badge?.trim() || null,
    title: slide.title.trim(),
    subtitle: slide.subtitle.trim(),
    cta_enabled: slide.ctaEnabled,
    cta_label: slide.ctaEnabled ? slide.ctaLabel?.trim() || null : null,
    cta_href: slide.ctaEnabled ? slide.ctaHref?.trim() || null : null,
    layout: slide.layout,
    theme: slide.theme,
    visual_type: slide.visualType,
    bg_pattern: slide.bgPattern,
    featured_app_ids: slide.layout === "card" ? slide.featuredAppIds.filter(Boolean).slice(0, 3) : [],
  };
}

async function fetchAppsByIds(ids: string[]): Promise<HeroFeaturedApp[]> {
  if (ids.length === 0) return [];
  const supabase = createServerSupabaseClient();
  const { data } = await supabase
    .from("apps")
    .select("id, title, description, category, creator_name")
    .in("id", ids)
    .eq("status", "active");

  const map = new Map((data ?? []).map((a) => [a.id, a]));
  return ids.map((id) => map.get(id)).filter(Boolean) as HeroFeaturedApp[];
}

async function enrichSlides(slides: HeroSlide[]): Promise<HeroSlidePublic[]> {
  const cardSlides = slides.filter((s) => s.layout === "card");
  const allIds = [...new Set(cardSlides.flatMap((s) => s.featuredAppIds))];
  let appsById = new Map<string, HeroFeaturedApp>();

  if (allIds.length > 0) {
    const apps = await fetchAppsByIds(allIds);
    appsById = new Map(apps.map((a) => [a.id, a]));
  }

  let popularFallback: HeroFeaturedApp[] | null = null;

  return Promise.all(
    slides.map(async (slide) => {
      if (slide.layout !== "card") return slide;

      let featuredApps = slide.featuredAppIds
        .map((id) => appsById.get(id))
        .filter(Boolean) as HeroFeaturedApp[];

      if (featuredApps.length === 0) {
        if (!popularFallback) {
          const popular = await getPopularApps(3);
          popularFallback = popular.map((a) => ({
            id: a.id,
            title: a.title,
            description: a.description,
            category: a.category,
            creator_name: a.creator_name,
          }));
        }
        featuredApps = popularFallback;
      }

      return { ...slide, featuredApps };
    })
  );
}

export async function getHeroSlidesFromDb(includeDisabled = false): Promise<HeroSlide[]> {
  const supabase = createServerSupabaseClient();
  let query = supabase.from("hero_slides").select("*").order("sort_order", { ascending: true });
  if (!includeDisabled) query = query.eq("enabled", true);

  const { data, error } = await query;
  if (error || !data?.length) return [];

  return (data as HeroSlideRow[]).map(rowToSlide);
}

export async function getPublicHeroSlides(): Promise<HeroSlidePublic[]> {
  try {
    const slides = await getHeroSlidesFromDb(false);
    if (slides.length === 0) {
      return DEFAULT_HERO_SLIDES.filter((s) => s.enabled);
    }
    return enrichSlides(slides);
  } catch {
    return DEFAULT_HERO_SLIDES.filter((s) => s.enabled);
  }
}

export async function getAllHeroSlidesAdmin(): Promise<HeroSlide[]> {
  try {
    const slides = await getHeroSlidesFromDb(true);
    if (slides.length === 0) return DEFAULT_HERO_SLIDES;
    return slides;
  } catch {
    return DEFAULT_HERO_SLIDES;
  }
}

export async function saveAllHeroSlides(slides: HeroSlideInput[]): Promise<{ ok: true } | { ok: false; error: string }> {
  const supabase = createServerSupabaseClient();

  const rows = slides.map((slide, i) => slideToRow(slide, i));
  const keepIds = rows.map((r) => r.id).filter(Boolean) as string[];

  const { data: existing } = await supabase.from("hero_slides").select("id");
  const toDelete = (existing ?? [])
    .map((r) => r.id as string)
    .filter((id) => !keepIds.includes(id));

  if (toDelete.length > 0) {
    const { error } = await supabase.from("hero_slides").delete().in("id", toDelete);
    if (error) return { ok: false, error: error.message };
  }

  for (const row of rows) {
    const payload = {
      sort_order: row.sort_order,
      enabled: row.enabled,
      badge: row.badge,
      title: row.title,
      subtitle: row.subtitle,
      cta_enabled: row.cta_enabled,
      cta_label: row.cta_label,
      cta_href: row.cta_href,
      layout: row.layout,
      theme: row.theme,
      visual_type: row.visual_type,
      bg_pattern: row.bg_pattern,
      featured_app_ids: row.featured_app_ids,
      updated_at: new Date().toISOString(),
    };

    if (row.id) {
      const { error } = await supabase.from("hero_slides").update(payload).eq("id", row.id);
      if (error) return { ok: false, error: error.message };
    } else {
      const { error } = await supabase.from("hero_slides").insert(payload);
      if (error) return { ok: false, error: error.message };
    }
  }

  return { ok: true };
}

export async function createHeroSlide(slide: HeroSlideInput): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  const supabase = createServerSupabaseClient();
  const row = slideToRow(slide, slide.sortOrder);
  const { data, error } = await supabase
    .from("hero_slides")
    .insert({ ...row, updated_at: new Date().toISOString() })
    .select("id")
    .single();

  if (error || !data) return { ok: false, error: error?.message ?? "作成に失敗しました" };
  return { ok: true, id: data.id as string };
}

export async function deleteHeroSlide(id: string): Promise<{ ok: true } | { ok: false; error: string }> {
  const supabase = createServerSupabaseClient();
  const { error } = await supabase.from("hero_slides").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export { rowToSlide };
