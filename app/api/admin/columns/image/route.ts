import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { saveColumnImage } from "@/lib/columns/service";

/** 記事に入れる画像。ブラウザで縮めてから base64 で送る */
export async function POST(req: Request) {
  if (!(await requireAdmin()).ok) return NextResponse.json({ error: "管理者権限が必要です" }, { status: 401 });
  const body = (await req.json().catch(() => null)) as { mime?: string; data?: string } | null;
  if (!body?.mime || !body.data) return NextResponse.json({ error: "画像がありません" }, { status: 400 });
  const r = await saveColumnImage(body.mime, body.data);
  if (!r.ok) return NextResponse.json({ error: r.error }, { status: 400 });
  return NextResponse.json({ url: r.url });
}
