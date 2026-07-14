import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { consumePasswordResetToken, updateUserPassword } from "@/lib/services/store";

export async function POST(req: NextRequest) {
  try {
    const { token, password } = await req.json();

    if (!token || !password) {
      return NextResponse.json({ error: "必須項目が不足しています" }, { status: 400 });
    }
    if (password.length < 6) {
      return NextResponse.json({ error: "パスワードは6文字以上にしてください" }, { status: 400 });
    }

    const row = await consumePasswordResetToken(token);
    if (!row) {
      return NextResponse.json(
        { error: "リンクが無効または期限切れです。再度パスワードリセットを行ってください。" },
        { status: 410 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 10);
    await updateUserPassword(row.email, passwordHash);

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[reset-password]", err);
    return NextResponse.json({ error: "サーバーエラーが発生しました" }, { status: 500 });
  }
}
