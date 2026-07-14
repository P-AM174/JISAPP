import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { listProductsForAdmin, countUsers } from "@/lib/services/store";

export async function GET() {
  const admin = await requireAdmin();
  if (!admin.ok) {
    return NextResponse.json({ error: "管理者権限が必要です" }, { status: 403 });
  }

  const [products, userCount] = await Promise.all([
    listProductsForAdmin(),
    countUsers(),
  ]);

  return NextResponse.json({
    userCount,
    products: products.map((p) => ({
      id: p.id,
      title: p.title,
      description: p.description,
      price: p.price,
      category: p.category,
      status: p.status,
      isPlaygroundApp: p.isPlaygroundApp,
      isDemo: p.isDemo,
      listingType: p.listingType,
      productType: p.productType,
      sourceUrl: p.sourceUrl,
      creator: p.creator,
      createdAt: p.createdAt.toISOString().slice(0, 10),
    })),
  });
}
