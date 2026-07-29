import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { listReportsForAdmin } from "@/lib/services/store";
import { listSupabaseReportsForAdmin } from "@/lib/reports/supabase-reports";

export async function GET() {
  const admin = await requireAdmin();
  if (!admin.ok) {
    return NextResponse.json({ error: "管理者権限が必要です" }, { status: 403 });
  }

  const [prismaReports, supabaseReports] = await Promise.all([
    listReportsForAdmin(),
    listSupabaseReportsForAdmin(),
  ]);

  const prismaMapped = prismaReports.map((r) => ({
    id: r.id,
    productId: r.productId,
    reporterId: r.reporterId,
    reason: r.reason,
    detail: r.detail,
    status: r.status,
    createdAt: r.createdAt.toISOString().slice(0, 10),
    source: "prisma" as const,
    product: r.product,
  }));

  const merged = [...prismaMapped, ...supabaseReports].sort(
    (a, b) => b.createdAt.localeCompare(a.createdAt)
  );

  return NextResponse.json({ reports: merged });
}
