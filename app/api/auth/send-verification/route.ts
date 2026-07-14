import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import bcrypt from "bcryptjs";
import { findUserByEmail, storeVerificationCode } from "@/lib/services/store";
import { randomBytes } from "crypto";

const resend = new Resend(process.env.RESEND_API_KEY);

function generateCode(): string {
  return String(100000 + (randomBytes(3).readUIntBE(0, 3) % 900000));
}

/** HTMLメールテンプレート */
function buildEmailHtml(name: string, code: string): string {
  return `<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>【ジサップ】メール認証コード</title>
</head>
<body style="margin:0;padding:0;background:#f3f6f4;font-family:'Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr>
      <td align="center" style="padding:40px 16px;">
        <table width="100%" style="max-width:520px;background:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,.08);">

          <!-- ヘッダー -->
          <tr>
            <td style="background:linear-gradient(135deg,#059669,#10b981);padding:32px 40px;text-align:center;">
              <div style="display:inline-flex;align-items:center;gap:10px;">
                <div style="width:36px;height:36px;background:rgba(255,255,255,.25);border-radius:10px;display:flex;align-items:center;justify-content:center;">
                  <span style="font-size:18px;">✦</span>
                </div>
                <span style="font-size:22px;font-weight:900;color:#ffffff;letter-spacing:-.5px;">ジサップ</span>
              </div>
              <p style="color:rgba(255,255,255,.8);font-size:13px;margin:8px 0 0;">個人間アプリ売買プラットフォーム</p>
            </td>
          </tr>

          <!-- 本文 -->
          <tr>
            <td style="padding:36px 40px;">
              <p style="font-size:15px;color:#374151;margin:0 0 8px;">こんにちは、<strong>${name}</strong> さん！</p>
              <p style="font-size:14px;color:#6b7280;margin:0 0 28px;line-height:1.6;">
                ジサップへのアカウント登録ありがとうございます。<br />
                以下の認証コードを画面に入力して、登録を完了してください。
              </p>

              <!-- コードボックス -->
              <div style="background:linear-gradient(135deg,#ecfdf5,#d1fae5);border:2px solid #a7f3d0;border-radius:16px;padding:28px;text-align:center;margin:0 0 28px;">
                <p style="font-size:12px;color:#065f46;font-weight:700;letter-spacing:.08em;margin:0 0 12px;text-transform:uppercase;">認証コード</p>
                <p style="font-size:48px;font-weight:900;letter-spacing:12px;color:#065f46;margin:0;font-family:'Courier New',monospace;">${code}</p>
                <p style="font-size:12px;color:#6ee7b7;margin:12px 0 0;">このコードは10分間有効です</p>
              </div>

              <p style="font-size:13px;color:#9ca3af;line-height:1.6;margin:0;">
                このメールに心当たりがない場合は無視してください。<br />
                アカウントは自動的に作成されません。
              </p>
            </td>
          </tr>

          <!-- フッター -->
          <tr>
            <td style="background:#f9fafb;border-top:1px solid #f0fdf4;padding:20px 40px;text-align:center;">
              <p style="font-size:11px;color:#9ca3af;margin:0;">
                © 2026 ジサップ — 個人間アプリ売買プラットフォーム
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export async function POST(req: NextRequest) {
  try {
    const { name, email, password } = await req.json();

    if (!name || !email || !password) {
      return NextResponse.json({ error: "必須項目が不足しています" }, { status: 400 });
    }
    if (password.length < 6) {
      return NextResponse.json({ error: "パスワードは6文字以上にしてください" }, { status: 400 });
    }
    if (await findUserByEmail(email)) {
      return NextResponse.json({ error: "このメールアドレスはすでに登録されています" }, { status: 409 });
    }

    const code = generateCode();
    const passwordHash = await bcrypt.hash(password, 10);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await storeVerificationCode({
      email,
      name,
      passwordHash,
      code,
      expiresAt,
    });

    const fromEmail =
      process.env.RESEND_FROM_EMAIL ?? "ジサップ <onboarding@resend.dev>";

    const { error: sendError } = await resend.emails.send({
      from: fromEmail,
      to:      [email],
      subject: "【ジサップ】アカウント登録の確認コード",
      html:    buildEmailHtml(name, code),
    });

    if (sendError) {
      console.error("[Resend]", sendError);
      const errObj = sendError as { name?: string; message?: string; statusCode?: number };
      return NextResponse.json({
        error: `[Resend ${errObj.statusCode}] ${errObj.name}: ${errObj.message}`,
      }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[send-verification]", err);
    return NextResponse.json({ error: "サーバーエラーが発生しました" }, { status: 500 });
  }
}
