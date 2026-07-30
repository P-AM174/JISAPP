import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { removeAppFromCatalog } from "@/lib/apps/catalog-removal";
import { revalidateCatalogPages } from "@/lib/revalidate-catalog";
import { updateProductStatus, deleteProduct } from "@/lib/services/store";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { ADMIN_FLAG_OPTIONS } from "@/lib/support/admin-flags";

type RouteContext = { params: Promise<{ id: string }> };

function isUUID(id: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
}

const VALID_FLAGS = new Set<string>(ADMIN_FLAG_OPTIONS.map((f) => f.id));

export async function PATCH(request: Request, context: RouteContext) {
  const admin = await requireAdmin();
  if (!admin.ok) {
    return NextResponse.json({ error: "管理者権限が必要です" }, { status: 403 });
  }

  const { id } = await context.params;
  let body: {
    status?: string;
    isFeatured?: boolean;
    adminFlags?: string[];
    toggleFlag?: string;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "不正なリクエストです" }, { status: 400 });
  }

  if (isUUID(id)) {
    const supabase = createServerSupabaseClient();
    const updates: Record<string, unknown> = {};

    const status = body.status;
    if (status !== undefined) {
      if (!["pending", "active", "rejected"].includes(status)) {
        return NextResponse.json({ error: "無効なステータスです" }, { status: 400 });
      }
      updates.status = status === "active" ? "active" : status;
      if (status === "active") updates.is_listed = true;
      if (status === "rejected" || status === "pending") updates.is_listed = false;
    }

    if (typeof body.isFeatured === "boolean") {
      updates.is_featured = body.isFeatured;
    }

    if (Array.isArray(body.adminFlags)) {
      updates.admin_flags = body.adminFlags.filter((f) => VALID_FLAGS.has(f));
    } else if (body.toggleFlag && VALID_FLAGS.has(body.toggleFlag)) {
      const { data: current } = await supabase
        .from("apps")
        .select("admin_flags")
        .eq("id", id)
        .maybeSingle();
      const flags = ((current?.admin_flags as string[] | null) ?? []).slice();
      const idx = flags.indexOf(body.toggleFlag);
      if (idx >= 0) flags.splice(idx, 1);
      else flags.push(body.toggleFlag);
      updates.admin_flags = flags;
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "更新内容がありません" }, { status: 400 });
    }

    const { error } = await supabase.from("apps").update(updates).eq("id", id);
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    revalidateCatalogPages();
    return NextResponse.json({ product: { id, ...updates } });
  }

  const status = body.status;
  if (!status || !["pending", "active", "rejected"].includes(status)) {
    return NextResponse.json({ error: "無効なステータスです" }, { status: 400 });
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
    const removed = await removeAppFromCatalog(id, { admin: true });
    if (!removed.ok) {
      return NextResponse.json({ error: removed.error ?? "削除に失敗しました" }, { status: 500 });
    }
    revalidateCatalogPages();
    return NextResponse.json({ ok: true });
  }

  await deleteProduct(id);
  revalidateCatalogPages();
  return NextResponse.json({ ok: true });
}
