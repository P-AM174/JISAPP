import { HomePageClient } from "@/components/home/home-page-client";
import { HomeLlmoIntro } from "@/components/home/home-llmo-intro";
import { JsonLd } from "@/components/seo/json-ld";
import { getHomeCatalogData } from "@/lib/home/catalog";
import { getPublicHeroSlides } from "@/lib/hero/service";
import { createHowToJsonLd } from "@/lib/seo/llmo";
import { getI18n } from "@/lib/i18n/server";

export const dynamic = "force-dynamic";

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await getI18n(params);
  const [initialData, heroSlides] = await Promise.all([
    getHomeCatalogData(),
    getPublicHeroSlides(locale),
  ]);

  return (
    <>
      <JsonLd data={createHowToJsonLd(locale)} />
      <HomePageClient
        initialData={initialData}
        heroSlides={heroSlides}
        aboutIntro={<HomeLlmoIntro locale={locale} />}
      />
    </>
  );
}
