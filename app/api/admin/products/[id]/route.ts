import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { updateProductStatus, deleteProduct } from "@/lib/services/store";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  const admin = await requireAdmin();
  if (!admin.ok) {
    return NextResponse.json({ error: "管理者権限が必要です" }, { status: 403 });
  }

  const { id } = await context.params;
  let body: { status?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "不正なリクエストです" }, { status: 400 });
  }

  const status = body.status;
  if (!status || !["pending", "active", "rejected"].includes(status)) {
    return NextResponse.json({ error: "無効なステータスです" }, { status: 400 });
  }

  const product = await updateProductStatus(id, status);
  return NextResponse.json({ product: { id: product.id, title: product.title, status: product.status } });
}

export async function DELETE(_request: Request, context: RouteContext) {
  const admin = await requireAdmin();
  if (!admin.ok) {
    return NextResponse.json({ error: "管理者権限が必要です" }, { status: 403 });
  }
  const { id } = await context.params;
  await deleteProduct(id);
  return NextResponse.json({ ok: true });
}
