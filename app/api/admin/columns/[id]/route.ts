import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin-auth";
import { cleanupColumnImages, deleteColumn, getColumnAdmin, updateColumn, validateColumnInput } from "@/lib/columns/service";
import type { ColumnInput } from "@/lib/columns/types";

const DENIED = () => NextResponse.json({ error: "管理者権限が必要です" }, { status: 401 });
type Ctx = { params: Promise<{ id: string }> };

function revalidate(slug?: string) {
  revalidatePath("/[locale]/column", "page");
  if (slug) revalidatePath(`/[locale]/column/${slug}`, "page");
  revalidatePath("/sitemap.xml");
}

export async function GET(_req: Request, { params }: Ctx) {
  if (!(await requireAdmin()).ok) return DENIED();
  const { id } = await params;
  const column = await getColumnAdmin(id);
  if (!column) return NextResponse.json({ error: "記事が見つかりません" }, { status: 404 });
  return NextResponse.json({ column });
}

export async function PUT(req: Request, { params }: Ctx) {
  if (!(await requireAdmin()).ok) return DENIED();
  const { id } = await params;
  const raw = (await req.json().catch(() => null)) as ColumnInput | null;
  if (!raw || typeof raw !== "object") return NextResponse.json({ error: "不正なリクエストです" }, { status: 400 });
  const input: ColumnInput = {};
  if (raw.tags !== undefined) {
    if (!Array.isArray(raw.tags) || raw.tags.some((t) => typeof t !== "string")) return NextResponse.json({ error: "タグが正しくありません" }, { status: 400 });
    input.tags = raw.tags;
  }
  for (const k of ["slug", "locale", "title", "description", "body", "coverImage", "xText", "status"] as const) {
    const v = raw[k];
    if (v === undefined) continue;
    if (v !== null && typeof v !== "string") return NextResponse.json({ error: "不正なリクエストです" }, { status: 400 });
    (input as Record<string, string | null>)[k] = v;
  }
  const errors = validateColumnInput(input);
  if (errors.length) return NextResponse.json({ error: errors.join("\n") }, { status: 400 });
  const before = await getColumnAdmin(id);
  const r = await updateColumn(id, input);
  if (!r.ok) return NextResponse.json({ error: r.error }, { status: 400 });
  // 公開設定を保存したとき（status つき）に、使われなくなった写真を消す。書いている途中の自動保存では消さない
  if (input.status !== undefined) await cleanupColumnImages(id, r.column);
  if (r.column.status === "published" || before?.status === "published") {
    revalidate(r.column.slug);
    if (before && before.slug !== r.column.slug) revalidate(before.slug);
  }
  return NextResponse.json({ column: r.column });
}

export async function DELETE(_req: Request, { params }: Ctx) {
  if (!(await requireAdmin()).ok) return DENIED();
  const { id } = await params;
  const before = await getColumnAdmin(id);
  if (!(await deleteColumn(id))) return NextResponse.json({ error: "消せませんでした" }, { status: 500 });
  await cleanupColumnImages(id, null);
  if (before) revalidate(before.slug);
  return NextResponse.json({ ok: true });
}
