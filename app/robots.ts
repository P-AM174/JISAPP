import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/seo/site";

export default function robots(): MetadataRoute.Robots {
  const siteUrl = getSiteUrl();

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/login",
        "/mypage",
        "/library",
        "/playground",
        "/create",
        "/projects",
        "/admin/",
        "/dashboard/",
        "/chat/",
        "/requests/",
        "/forgot-password",
        "/reset-password",
        "/apps/*/run",
        "/apps/*/success",
        "/api/",
      ],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
