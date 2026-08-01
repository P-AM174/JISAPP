import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/seo/site";

/** OGP・SNSクローラー（Twitterbot 等）がメタデータを取得できるよう全パスを許可 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
    },
    sitemap: `${getSiteUrl()}/sitemap.xml`,
  };
}
