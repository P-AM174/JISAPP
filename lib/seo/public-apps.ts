import { getProductById } from "@/lib/services/store";
import { supabase } from "@/lib/supabase";

export type PublicAppSeo = {
  id: string;
  title: string;
  description: string;
  category?: string | null;
  creatorName?: string | null;
  updatedAt?: Date;
};

function isUUID(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
    value
  );
}

export async function getPublicAppSeo(id: string): Promise<PublicAppSeo | null> {
  const app = await getShareableAppSeo(id);
  if (!app || app.isListed === false) return null;
  return app;
}

/** 共有・OGP用（URLのみ発行のアプリも含む active アプリ） */
export async function getShareableAppSeo(
  id: string
): Promise<(PublicAppSeo & { isListed?: boolean }) | null> {
  if (isUUID(id)) {
    try {
      const { data, error } = await supabase
        .from("apps")
        .select("id, title, description, category, creator_name, status, is_listed, created_at")
        .eq("id", id)
        .maybeSingle();

      if (error || !data || data.status !== "active") return null;

      return {
        id: data.id,
        title: data.title,
        description: data.description?.trim() || `${data.title} - ジサップで公開中のWebアプリ`,
        category: data.category,
        creatorName: data.creator_name,
        updatedAt: data.created_at ? new Date(data.created_at) : undefined,
        isListed: data.is_listed ?? true,
      };
    } catch {
      return null;
    }
  }

  if (!process.env.DATABASE_URL) return null;

  try {
    const product = await getProductById(id);
    if (!product || product.status !== "active" || product.isDemo) return null;

    return {
      id: product.id,
      title: product.title,
      description:
        product.description?.trim() || `${product.title} - ジサップで公開中のWebアプリ`,
      category: product.category,
      creatorName: product.creator?.name ?? null,
      updatedAt: product.updatedAt,
      isListed: true,
    };
  } catch {
    return null;
  }
}

export async function listPublicAppIdsForSitemap(): Promise<
  { id: string; updatedAt?: Date }[]
> {
  const entries: { id: string; updatedAt?: Date }[] = [];

  if (process.env.DATABASE_URL) {
    try {
      const { listActiveProducts } = await import("@/lib/services/store");
      const products = await listActiveProducts();
      for (const product of products) {
        entries.push({ id: product.id, updatedAt: product.updatedAt });
      }
    } catch {
      /* noop */
    }
  }

  try {
    let query = supabase
      .from("apps")
      .select("id, created_at")
      .eq("status", "active");

    try {
      query = query.eq("is_listed", true);
    } catch {
      /* is_listed 未作成時はスキップ */
    }

    const { data, error } = await query.limit(500);
    if (!error && data) {
      for (const app of data) {
        entries.push({
          id: app.id,
          updatedAt: app.created_at ? new Date(app.created_at) : undefined,
        });
      }
    }
  } catch {
    /* noop */
  }

  const seen = new Set<string>();
  return entries.filter((entry) => {
    if (seen.has(entry.id)) return false;
    seen.add(entry.id);
    return true;
  });
}
