import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { revalidateCatalogPages } from "@/lib/revalidate-catalog";
import { updateProductStatus, deleteProduct } from "@/lib/services/store";
import { createServerSupabaseClient } from "@/lib/supabase-server";

type RouteContext = { params: Promise<{ id: string }> };

function isUUID(id: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
}

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

  // Supabase プレイグラウンド出品（UUID）
  if (isUUID(id)) {
    const supabase = createServerSupabaseClient();
    const updates: Record<string, unknown> = { status: status === "active" ? "active" : status };
    if (status === "active") updates.is_listed = true;
    if (status === "rejected" || status === "pending") updates.is_listed = false;

    const { error } = await supabase.from("apps").update(updates).eq("id", id);
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    revalidateCatalogPages();
    return NextResponse.json({ product: { id, status } });
  }

  const product = await updateProductStatus(id, status);
  revalidateCatalogPages();
  return NextResponse.json({ product: { id: product.id, title: product.title, status: product.status } });
}

export async function DELETE(_request: Request, context: RouteContext) {
  const admin = await requireAdmin();
  if (!admin.ok) {
    return NextResponse.json({ error: "管理者権限が必要です" }, { status: 403 });
  }
  const { id } = await context.params;

  if (isUUID(id)) {
    const supabase = createServerSupabaseClient();
    const { error } = await supabase.from("apps").delete().eq("id", id);
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    revalidateCatalogPages();
    return NextResponse.json({ ok: true });
  }

  await deleteProduct(id);
  revalidateCatalogPages();
  return NextResponse.json({ ok: true });
}
