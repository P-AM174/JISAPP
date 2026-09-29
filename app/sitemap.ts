import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/seo/site";
import { CATEGORIES } from "@/lib/categories";
import { listPublicAppIdsForSitemap } from "@/lib/seo/public-apps";
import { LOCALES, localizePath } from "@/lib/i18n/config";

type Entry = MetadataRoute.Sitemap[number];

/**
 * 日本語（言語なしの URL）と英語（/en）の両方を載せ、
 * それぞれに hreflang の対応（alternates.languages）をつける。
 */
function localized(path: string, rest: Omit<Entry, "url" | "alternates">): Entry[] {
  const languages: Record<string, string> = {};
  for (const l of LOCALES) languages[l] = absoluteUrl(localizePath(path, l));
  return LOCALES.map((l) => ({
    ...rest,
    url: absoluteUrl(localizePath(path, l)),
    alternates: { languages },
  }));
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const staticPages: MetadataRoute.Sitemap = [
    ...localized("/", { lastModified: now, changeFrequency: "daily", priority: 1 }),
    ...localized("/faq", { lastModified: now, changeFrequency: "monthly", priority: 0.8 }),
    ...localized("/playground", { lastModified: now, changeFrequency: "weekly", priority: 0.9 }),
    ...localized("/terms", { lastModified: now, changeFrequency: "monthly", priority: 0.3 }),
    ...localized("/search", { lastModified: now, changeFrequency: "weekly", priority: 0.5 }),
  ];

  const categoryPages: MetadataRoute.Sitemap = CATEGORIES.flatMap((category) =>
    localized(`/category/${category.id}`, {
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.7,
    })
  );

  const apps = await listPublicAppIdsForSitemap();
  const appPages: MetadataRoute.Sitemap = apps.flatMap((app) =>
    localized(`/apps/${app.id}`, {
      lastModified: app.updatedAt ?? now,
      changeFrequency: "weekly",
      priority: 0.8,
    })
  );

  return [...staticPages, ...categoryPages, ...appPages];
}
