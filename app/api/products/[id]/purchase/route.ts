import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/api-auth";
import { getProductById, recordPurchase } from "@/lib/services/store";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(_request: Request, context: RouteContext) {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "ログインが必要です" }, { status: 401 });
  }

  const { id } = await context.params;
  const product = await getProductById(id);
  if (!product) {
    return NextResponse.json({ error: "商品が見つかりません" }, { status: 404 });
  }

  if (product.status !== "active") {
    return NextResponse.json({ error: "この商品は現在取得できません" }, { status: 403 });
  }

  // 支払いの仕組みはまだないので、有料の商品は「購入」にできない（支払わずに買ったことにさせない）
  if (product.price > 0) {
    return NextResponse.json({ error: "この商品は現在取得できません" }, { status: 403 });
  }

  await recordPurchase(userId, id);
  return NextResponse.json({ ok: true, productId: id });
}
