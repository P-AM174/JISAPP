import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { updateReportStatus } from "@/lib/services/store";
import { isSupabaseReportId, updateSupabaseReportStatus } from "@/lib/reports/supabase-reports";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  const admin = await requireAdmin();
  if (!admin.ok) {
    return NextResponse.json({ error: "管理者権限が必要です" }, { status: 403 });
  }
  const { id } = await context.params;
  const { status } = await request.json();
  if (!["pending", "resolved", "dismissed"].includes(status)) {
    return NextResponse.json({ error: "無効なステータスです" }, { status: 400 });
  }

  if (isSupabaseReportId(id)) {
    try {
      await updateSupabaseReportStatus(id, status);
      return NextResponse.json({ report: { id, status } });
    } catch {
      return NextResponse.json({ error: "更新に失敗しました" }, { status: 500 });
    }
  }

  const report = await updateReportStatus(id, status);
  return NextResponse.json({ report });
}
