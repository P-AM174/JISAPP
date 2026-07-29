import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { listProductsForAdmin, countUsers, countPendingReports } from "@/lib/services/store";
import { countPendingSupabaseReports } from "@/lib/reports/supabase-reports";
import { createServerSupabaseClient } from "@/lib/supabase-server";

function isUUID(id: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
}

function prismaIsListed(p: { listingType: string; isPlaygroundApp: boolean }) {
  if (p.isPlaygroundApp) return p.listingType !== "external";
  return p.listingType === "playground";
}

export async function GET() {
  const admin = await requireAdmin();
  if (!admin.ok) {
    return NextResponse.json({ error: "管理者権限が必要です" }, { status: 403 });
  }

  const [prismaProducts, userCount, pendingPrismaReports, pendingSupabaseReports] = await Promise.all([
    listProductsForAdmin(),
    countUsers(),
    countPendingReports(),
    countPendingSupabaseReports(),
  ]);
  const pendingReportCount = pendingPrismaReports + pendingSupabaseReports;

  const realProducts = prismaProducts.filter((p) => !p.isDemo);

  const supabase = createServerSupabaseClient();
  const { data: playgroundApps } = await supabase
    .from("apps")
    .select(
      "id, title, description, category, status, is_listed, is_playground_app, creator_name, creator_id, created_at, app_number, admin_flags, is_featured"
    )
    .eq("is_playground_app", true)
    .neq("status", "deleted")
    .order("created_at", { ascending: false });

  const playgroundAsProducts = (playgroundApps ?? []).map((app) => ({
    id: app.id,
    appNumber: (app.app_number as number | null) ?? 0,
    title: app.title,
    description: app.description,
    price: 0,
    category: app.category,
    status: app.status === "active" && app.is_listed ? "active" : app.status === "rejected" ? "rejected" : "pending",
    isPlaygroundApp: true,
    isDemo: false,
    isListed: !!app.is_listed,
    isFeatured: !!app.is_featured,
    adminFlags: (app.admin_flags as string[] | null) ?? [],
    listingType: app.is_listed ? "playground" : "external",
    productType: "playground",
    sourceUrl: null,
    creator: {
      id: app.creator_id ?? "",
      name: app.creator_name,
      email: app.creator_name ?? "不明",
    },
    createdAt: (app.created_at as string).slice(0, 10),
    source: "supabase" as const,
  }));

  const prismaMapped = realProducts.map((p) => ({
    id: p.id,
    appNumber: p.appNumber,
    title: p.title,
    description: p.description,
    price: p.price,
    category: p.category,
    status: p.status,
    isPlaygroundApp: p.isPlaygroundApp,
    isDemo: p.isDemo,
    isListed: prismaIsListed(p),
    isFeatured: false,
    adminFlags: [] as string[],
    listingType: p.listingType,
    productType: p.productType,
    sourceUrl: p.sourceUrl,
    creator: p.creator,
    createdAt: p.createdAt.toISOString().slice(0, 10),
    source: "prisma" as const,
  }));

  const prismaIds = new Set(prismaMapped.map((p) => p.id));
  const mergedPlayground = playgroundAsProducts.filter((p) => !prismaIds.has(p.id));

  const allProducts = [...prismaMapped, ...mergedPlayground].sort(
    (a, b) => b.appNumber - a.appNumber
  );

  return NextResponse.json({
    userCount,
    pendingReportCount,
    products: allProducts,
  });
}
