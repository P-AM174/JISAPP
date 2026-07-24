import { HomePageClient } from "@/components/home/home-page-client";
import { getHomeCatalogData } from "@/lib/home/catalog";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const initialData = await getHomeCatalogData();

  return <HomePageClient initialData={initialData} />;
}
