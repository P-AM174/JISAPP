import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { createColumnDraft, listColumnsAdmin } from "@/lib/columns/service";

const DENIED = () => NextResponse.json({ error: "管理者権限が必要です" }, { status: 401 });

/** コラムの一覧（下書きも含む） */
export async function GET() {
  if (!(await requireAdmin()).ok) return DENIED();
  return NextResponse.json({ columns: await listColumnsAdmin() });
}

/** 新しい下書きを作る */
export async function POST(req: Request) {
  if (!(await requireAdmin()).ok) return DENIED();
  const body = (await req.json().catch(() => ({}))) as { locale?: string };
  const r = await createColumnDraft(body.locale === "en" ? "en" : "ja");
  if (!r.ok) return NextResponse.json({ error: r.error }, { status: 500 });
  return NextResponse.json({ id: r.id });
}
