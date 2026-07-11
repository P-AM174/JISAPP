import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/api-auth";
import { getProductById, updateProductStatus } from "@/lib/services/store";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: Request, context: RouteContext) {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "ログインが必要です" }, { status: 401 });
  }

  const { id } = await context.params;
  const product = await getProductById(id);
  if (!product) {
    return NextResponse.json({ error: "商品が見つかりません" }, { status: 404 });
  }
  if (product.creatorId !== userId) {
    return NextResponse.json({ error: "権限がありません" }, { status: 403 });
  }

  let body: { approved?: boolean; appeal?: boolean };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "不正なリクエストです" }, { status: 400 });
  }

  if (body.appeal) {
    await updateProductStatus(id, "pending");
    return NextResponse.json({ ok: true, status: "pending", appealed: true });
  }

  const status = body.approved ? "active" : "pending";
  await updateProductStatus(id, status);
  return NextResponse.json({ ok: true, status });
}
