import { HomePageClient } from "@/components/home/home-page-client";
import { HomeLlmoIntro } from "@/components/home/home-llmo-intro";
import { JsonLd } from "@/components/seo/json-ld";
import { getHomeCatalogData } from "@/lib/home/catalog";
import { getPublicHeroSlides } from "@/lib/hero/service";
import { createHowToJsonLd } from "@/lib/seo/llmo";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [initialData, heroSlides] = await Promise.all([
    getHomeCatalogData(),
    getPublicHeroSlides(),
  ]);

  return (
    <>
      <JsonLd data={createHowToJsonLd()} />
      <HomePageClient
        initialData={initialData}
        heroSlides={heroSlides}
        aboutIntro={<HomeLlmoIntro />}
      />
    </>
  );
}
