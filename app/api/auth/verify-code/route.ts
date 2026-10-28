import { NextRequest, NextResponse } from "next/server";
import { clientIp, countHit, isLimited, TOO_MANY_ATTEMPTS } from "@/lib/security/rate-limit";
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

    // 6けたのコードの当てずっぽう対策：同じメールアドレスで5回、同じ送り元で20回まちがえたら止める
    const emailKey = `verify:email:${String(email).trim().toLowerCase()}`;
    const ipKey = `verify:ip:${clientIp(req.headers)}`;
    if ((await isLimited(emailKey, 5)).limited || (await isLimited(ipKey, 20)).limited) {
      return NextResponse.json({ error: TOO_MANY_ATTEMPTS }, { status: 429 });
    }

    const entry = await consumeVerificationCode(email, String(code).trim());
    if (!entry) {
      await countHit(emailKey, 10 * 60);
      await countHit(ipKey, 10 * 60);
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
