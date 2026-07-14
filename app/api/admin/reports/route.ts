import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { listReportsForAdmin } from "@/lib/services/store";

export async function GET() {
  const admin = await requireAdmin();
  if (!admin.ok) {
    return NextResponse.json({ error: "管理者権限が必要です" }, { status: 403 });
  }
  const reports = await listReportsForAdmin();
  return NextResponse.json({ reports });
}
