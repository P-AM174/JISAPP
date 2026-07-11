import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { listProductsForAdmin } from "@/lib/services/store";

export async function GET() {
  const admin = await requireAdmin();
  if (!admin.ok) {
    return NextResponse.json({ error: "管理者権限が必要です" }, { status: 403 });
  }

  const products = await listProductsForAdmin();
  return NextResponse.json({
    products: products.map((p) => ({
      id: p.id,
      title: p.title,
      description: p.description,
      price: p.price,
      category: p.category,
      status: p.status,
      isPlaygroundApp: p.isPlaygroundApp,
      listingType: p.listingType,
      productType: p.productType,
      creator: p.creator,
      createdAt: p.createdAt.toISOString(),
    })),
  });
}
