import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/api-auth";
import { listPurchasesForUser } from "@/lib/services/store";

export async function GET() {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "ログインが必要です" }, { status: 401 });
  }

  const purchases = await listPurchasesForUser(userId);
  return NextResponse.json({
    purchases: purchases.map((p) => ({
      id: p.product.id,
      title: p.product.title,
      category: p.product.category,
      is_playground_app: p.product.isPlaygroundApp,
      price: p.product.price,
      purchasedAt: p.createdAt.toISOString(),
    })),
  });
}
