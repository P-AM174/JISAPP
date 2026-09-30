import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { listStorageLimitExemptions, setStorageLimitExempt, type ExemptionKind } from "@/lib/app-data-exemptions";

/** 保存容量の上限をかけないアプリ・ユーザーの一覧: GET /api/admin/storage-exemptions */
export async function GET() {
  const admin = await requireAdmin();
  if (!admin.ok) return NextResponse.json({ error: "管理者権限が必要です" }, { status: 403 });

  const list = await listStorageLimitExemptions();
  // 表がまだない（scripts/add-storage-limit-exemptions.sql 未実行）ときは available: false
  if (!list) return NextResponse.json({ available: false, users: [], apps: [] });
  return NextResponse.json({
    available: true,
    users: list.filter((e) => e.kind === "user").map((e) => e.targetId),
    apps: list.filter((e) => e.kind === "app").map((e) => e.targetId),
  });
}

/** 上限なしにする・戻す: POST /api/admin/storage-exemptions  body: { kind: "user" | "app", targetId, exempt } */
export async function POST(req: Request) {
  const admin = await requireAdmin();
  if (!admin.ok) return NextResponse.json({ error: "管理者権限が必要です" }, { status: 403 });

  const body = (await req.json().catch(() => null)) as { kind?: ExemptionKind; targetId?: string; exempt?: boolean } | null;
  if (!body || (body.kind !== "user" && body.kind !== "app") || !body.targetId || typeof body.exempt !== "boolean") {
    return NextResponse.json({ error: "不正なリクエストです" }, { status: 400 });
  }

  const ok = await setStorageLimitExempt(body.kind, body.targetId, body.exempt);
  if (!ok) return NextResponse.json({ error: "設定を保存できませんでした" }, { status: 500 });
  console.info("[admin] storage limit exemption", { kind: body.kind, targetId: body.targetId, exempt: body.exempt, by: admin.userId ?? admin.via });
  return NextResponse.json({ ok: true });
}
