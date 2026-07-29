import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { createServerSupabaseClient } from "@/lib/supabase-server";

export async function GET() {
  const admin = await requireAdmin();
  if (!admin.ok) {
    return NextResponse.json({ error: "管理者権限が必要です" }, { status: 403 });
  }

  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from("support_inquiries")
    .select("id, user_id, email, name, subject, body, status, admin_reply, replied_at, created_at")
    .order("created_at", { ascending: false })
    .limit(200);

  if (error) {
    console.error("[admin/inquiries GET]", error);
    return NextResponse.json({ inquiries: [], openCount: 0 });
  }

  const inquiries = data ?? [];
  const openCount = inquiries.filter((i) => i.status === "open").length;
  return NextResponse.json({ inquiries, openCount });
}
