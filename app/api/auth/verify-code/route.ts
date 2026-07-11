import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import {
  consumeVerificationCode,
  createCredentialUser,
  findUserByEmail,
} from "@/lib/services/store";

export async function POST(req: NextRequest) {
  try {
    const { email, code } = await req.json();

    if (!email || !code) {
      return NextResponse.json({ error: "必須項目が不足しています" }, { status: 400 });
    }

    const entry = await consumeVerificationCode(email, String(code).trim());
    if (!entry) {
      return NextResponse.json(
        { error: "認証コードが正しくないか、有効期限が切れています。" },
        { status: 410 }
      );
    }

    if (await findUserByEmail(email)) {
      return NextResponse.json({ ok: true });
    }

    await createCredentialUser({
      name: entry.name,
      email: entry.email,
      passwordHash: entry.passwordHash,
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[verify-code]", err);
    return NextResponse.json({ error: "サーバーエラーが発生しました" }, { status: 500 });
  }
}
