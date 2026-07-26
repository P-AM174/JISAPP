import { HomePageClient } from "@/components/home/home-page-client";
import { getHomeCatalogData } from "@/lib/home/catalog";
import { getPublicHeroSlides } from "@/lib/hero/service";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [initialData, heroSlides] = await Promise.all([
    getHomeCatalogData(),
    getPublicHeroSlides(),
  ]);

  return <HomePageClient initialData={initialData} heroSlides={heroSlides} />;
}
