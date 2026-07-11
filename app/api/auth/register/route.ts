import { NextRequest, NextResponse } from "next/server";

/** 非推奨: メール認証フローを使用してください */
export async function POST(_req: NextRequest) {
  return NextResponse.json(
    { error: "このエンドポイントは無効化されています。メール認証をご利用ください。" },
    { status: 410 }
  );
}
