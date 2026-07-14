import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createReport, getProductById } from "@/lib/services/store";

const REASONS = [
  "不適切なコンテンツ",
  "スパム・詐欺",
  "悪意のあるコード",
  "著作権侵害",
  "その他",
] as const;

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const { reason, detail } = await req.json();

    if (!reason || !REASONS.includes(reason)) {
      return NextResponse.json({ error: "報告理由を選択してください" }, { status: 400 });
    }

    const product = await getProductById(id);
    if (!product) {
      return NextResponse.json({ error: "アプリが見つかりません" }, { status: 404 });
    }

    const session = await getServerSession(authOptions);
    const reporterId = (session?.user as { id?: string } | undefined)?.id ?? undefined;

    await createReport({ productId: id, reporterId, reason, detail });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[report]", err);
    return NextResponse.json({ error: "サーバーエラーが発生しました" }, { status: 500 });
  }
}
