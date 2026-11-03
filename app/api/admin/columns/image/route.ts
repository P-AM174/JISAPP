import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { MAX_IMAGE_BYTES, saveColumnImage } from "@/lib/columns/service";

/** 記事に入れる写真。ブラウザで縮めて（長い辺 1200px・WebP）から送り、Supabase Storage に置く */
export async function POST(req: Request) {
  if (!(await requireAdmin()).ok) return NextResponse.json({ error: "管理者権限が必要です" }, { status: 401 });
  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  const columnId = String(form?.get("columnId") ?? "");
  if (!(file instanceof Blob) || !/^[0-9a-f-]{36}$/.test(columnId)) return NextResponse.json({ error: "画像がありません" }, { status: 400 });
  if (file.size > MAX_IMAGE_BYTES) return NextResponse.json({ error: "画像が大きすぎます（1MB まで）" }, { status: 400 });
  const r = await saveColumnImage(columnId, file.type, new Uint8Array(await file.arrayBuffer()));
  if (!r.ok) return NextResponse.json({ error: r.error }, { status: 400 });
  return NextResponse.json({ url: r.url });
}
