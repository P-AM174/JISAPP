import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { listProductsForAdmin, countUsers, countPendingReports } from "@/lib/services/store";
import { createServerSupabaseClient } from "@/lib/supabase-server";

function isUUID(id: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
}

export async function GET() {
  const admin = await requireAdmin();
  if (!admin.ok) {
    return NextResponse.json({ error: "管理者権限が必要です" }, { status: 403 });
  }

  const [prismaProducts, userCount, pendingReportCount] = await Promise.all([
    listProductsForAdmin(),
    countUsers(),
    countPendingReports(),
  ]);

  const realProducts = prismaProducts.filter(p => !p.isDemo);

  // Supabase プレイグラウンド出品も取得
  const supabase = createServerSupabaseClient();
  const { data: playgroundApps } = await supabase
    .from("apps")
    .select("id, title, description, category, status, is_listed, is_playground_app, creator_name, creator_id, created_at")
    .eq("is_playground_app", true)
    .order("created_at", { ascending: false });

  const maxAppNumber = realProducts.reduce((max, p) => Math.max(max, p.appNumber), 0);

  const playgroundAsProducts = (playgroundApps ?? []).map((app, i) => ({
    id: app.id,
    appNumber: maxAppNumber + i + 1,
    title: app.title,
    description: app.description,
    price: 0,
    category: app.category,
    status: app.status === "active" && app.is_listed ? "active" : app.status === "rejected" ? "rejected" : "pending",
    isPlaygroundApp: true,
    isDemo: false,
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
    id:             p.id,
    appNumber:      p.appNumber,
    title:          p.title,
    description:    p.description,
    price:          p.price,
    category:       p.category,
    status:         p.status,
    isPlaygroundApp: p.isPlaygroundApp,
    isDemo:         p.isDemo,
    listingType:    p.listingType,
    productType:    p.productType,
    sourceUrl:      p.sourceUrl,
    creator:        p.creator,
    createdAt:      p.createdAt.toISOString().slice(0, 10),
    source:         "prisma" as const,
  }));

  // 重複除外（Prisma側に同IDがあればスキップ）
  const prismaIds = new Set(prismaMapped.map(p => p.id));
  const mergedPlayground = playgroundAsProducts.filter(p => !prismaIds.has(p.id));

  const allProducts = [...prismaMapped, ...mergedPlayground].sort(
    (a, b) => b.appNumber - a.appNumber
  );

  return NextResponse.json({
    userCount,
    pendingReportCount,
    products: allProducts,
  });
}
