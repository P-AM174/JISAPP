import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createReport, getProductById } from "@/lib/services/store";
import { isValidReportReason } from "@/lib/reports/reasons";
import { createSupabaseAppReport } from "@/lib/reports/supabase-reports";
import { createServerSupabaseClient } from "@/lib/supabase-server";

type RouteContext = { params: Promise<{ id: string }> };

function isUUID(id: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
}

export async function POST(req: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const { reason, detail } = await req.json();

    if (!reason || !isValidReportReason(reason)) {
      return NextResponse.json({ error: "報告理由を選択してください" }, { status: 400 });
    }

    const detailText = (detail ?? "").trim();
    if (!detailText || detailText.length < 5) {
      return NextResponse.json({ error: "詳細は5文字以上で入力してください" }, { status: 400 });
    }
    if (detailText.length > 2000) {
      return NextResponse.json({ error: "詳細は2000文字以内で入力してください" }, { status: 400 });
    }

    const session = await getServerSession(authOptions);
    const reporterId = (session?.user as { id?: string } | undefined)?.id ?? undefined;

    if (isUUID(id)) {
      const supabase = createServerSupabaseClient();
      const { data: app } = await supabase
        .from("apps")
        .select("id, status")
        .eq("id", id)
        .maybeSingle();

      if (!app || app.status === "deleted") {
        return NextResponse.json({ error: "アプリが見つかりません" }, { status: 404 });
      }

      await createSupabaseAppReport({
        appId: id,
        reporterId,
        reason,
        detail: detailText,
      });
      return NextResponse.json({ ok: true });
    }

    const product = await getProductById(id);
    if (!product) {
      return NextResponse.json({ error: "アプリが見つかりません" }, { status: 404 });
    }

    await createReport({ productId: id, reporterId, reason, detail: detailText });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[report]", err);
    return NextResponse.json({ error: "サーバーエラーが発生しました" }, { status: 500 });
  }
}
