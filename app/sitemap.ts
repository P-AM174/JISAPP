import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/seo/site";
import { CATEGORIES } from "@/lib/categories";
import { listPublicAppIdsForSitemap } from "@/lib/seo/public-apps";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: absoluteUrl("/"),
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: absoluteUrl("/terms"),
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.3,
    },
    {
      url: absoluteUrl("/search"),
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.5,
    },
  ];

  const categoryPages: MetadataRoute.Sitemap = CATEGORIES.map((category) => ({
    url: absoluteUrl(`/category/${category.id}`),
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));

  const apps = await listPublicAppIdsForSitemap();
  const appPages: MetadataRoute.Sitemap = apps.map((app) => ({
    url: absoluteUrl(`/apps/${app.id}`),
    lastModified: app.updatedAt ?? new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));

  return [...staticPages, ...categoryPages, ...appPages];
}
