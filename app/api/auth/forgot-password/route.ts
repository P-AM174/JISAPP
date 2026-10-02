import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { randomBytes } from "crypto";
import { findUserByEmail, storePasswordResetToken } from "@/lib/services/store";

const resend = new Resend(process.env.RESEND_API_KEY);

function buildResetEmailHtml(name: string, resetUrl: string): string {
  return `<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>【ジサップ】パスワードリセット</title>
</head>
<body style="margin:0;padding:0;background:#f3f6f4;font-family:'Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr>
      <td align="center" style="padding:40px 16px;">
        <table width="100%" style="max-width:520px;background:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,.08);">
          <tr>
            <td style="background:linear-gradient(135deg,#1a7358,#2b8a6c);padding:32px 40px;text-align:center;">
              <span style="font-size:22px;font-weight:900;color:#ffffff;letter-spacing:-.5px;">ジサップ</span>
              <p style="color:rgba(255,255,255,.8);font-size:13px;margin:8px 0 0;">個人間アプリ売買プラットフォーム</p>
            </td>
          </tr>
          <tr>
            <td style="padding:36px 40px;">
              <p style="font-size:15px;color:#374151;margin:0 0 8px;">こんにちは、<strong>${name}</strong> さん</p>
              <p style="font-size:14px;color:#6b7280;margin:0 0 28px;line-height:1.6;">
                パスワードリセットのリクエストを受け付けました。<br />
                以下のボタンから新しいパスワードを設定してください。
              </p>
              <div style="text-align:center;margin:0 0 28px;">
                <a href="${resetUrl}" style="display:inline-block;background:linear-gradient(135deg,#1a7358,#2b8a6c);color:#ffffff;font-size:15px;font-weight:700;text-decoration:none;padding:14px 32px;border-radius:12px;">
                  パスワードをリセット
                </a>
              </div>
              <p style="font-size:12px;color:#9ca3af;margin:0 0 8px;">
                ボタンが機能しない場合は以下のURLをコピーしてください：
              </p>
              <p style="font-size:11px;color:#6b7280;word-break:break-all;margin:0 0 20px;">${resetUrl}</p>
              <p style="font-size:13px;color:#9ca3af;line-height:1.6;margin:0;">
                このリンクは<strong>1時間</strong>で無効になります。<br />
                心当たりがない場合は無視してください。
              </p>
            </td>
          </tr>
          <tr>
            <td style="background:#f9fafb;border-top:1px solid #f0fdf4;padding:20px 40px;text-align:center;">
              <p style="font-size:11px;color:#9ca3af;margin:0;">© 2026 ジサップ</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/** 英語版のメール */
/** メールの文言（英語・ベトナム語）。ベトナム語は機械翻訳でネイティブ未確認 */
type EmailStrings = Record<"lang" | "title" | "tagline" | "hi" | "received" | "useButton" | "button" | "copyUrl" | "expiresBefore" | "oneHour" | "ignore", string>;

const EMAIL_EN: EmailStrings = {
  lang: "en",
  title: "Reset your Jisapp password",
  tagline: "Turn AI-made code into your own app",
  hi: "Hi",
  received: "We received a request to reset your password.",
  useButton: "Use the button below to set a new one.",
  button: "Reset password",
  copyUrl: "If the button doesn't work, copy this URL:",
  expiresBefore: "This link expires in",
  oneHour: "1 hour",
  ignore: "If you didn't request this, you can ignore this email.",
};

const EMAIL_VI: EmailStrings = {
  lang: "vi",
  title: "Đặt lại mật khẩu Jisapp",
  tagline: "Biến code do AI viết thành app của riêng bạn",
  hi: "Chào",
  received: "Chúng tôi nhận được yêu cầu đặt lại mật khẩu của bạn.",
  useButton: "Nhấn nút bên dưới để đặt mật khẩu mới.",
  button: "Đặt lại mật khẩu",
  copyUrl: "Nếu nút không hoạt động, hãy sao chép link này:",
  expiresBefore: "Link này hết hạn sau",
  oneHour: "1 giờ",
  ignore: "Nếu bạn không yêu cầu, hãy bỏ qua email này.",
};

function buildResetEmailHtmlEn(name: string, resetUrl: string, s: EmailStrings = EMAIL_EN): string {
  return `<!DOCTYPE html>
<html lang="${s.lang}">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>${s.title}</title>
</head>
<body style="margin:0;padding:0;background:#f3f6f4;font-family:'Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr>
      <td align="center" style="padding:40px 16px;">
        <table width="100%" style="max-width:520px;background:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,.08);">
          <tr>
            <td style="background:linear-gradient(135deg,#1a7358,#2b8a6c);padding:32px 40px;text-align:center;">
              <span style="font-size:22px;font-weight:900;color:#ffffff;letter-spacing:-.5px;">Jisapp</span>
              <p style="color:rgba(255,255,255,.8);font-size:13px;margin:8px 0 0;">${s.tagline}</p>
            </td>
          </tr>
          <tr>
            <td style="padding:36px 40px;">
              <p style="font-size:15px;color:#374151;margin:0 0 8px;">${s.hi} <strong>${name}</strong>,</p>
              <p style="font-size:14px;color:#6b7280;margin:0 0 28px;line-height:1.6;">
                ${s.received}<br />
                ${s.useButton}
              </p>
              <div style="text-align:center;margin:0 0 28px;">
                <a href="${resetUrl}" style="display:inline-block;background:linear-gradient(135deg,#1a7358,#2b8a6c);color:#ffffff;font-size:15px;font-weight:700;text-decoration:none;padding:14px 32px;border-radius:12px;">
                  ${s.button}
                </a>
              </div>
              <p style="font-size:12px;color:#9ca3af;margin:0 0 8px;">
                ${s.copyUrl}
              </p>
              <p style="font-size:11px;color:#6b7280;word-break:break-all;margin:0 0 20px;">${resetUrl}</p>
              <p style="font-size:13px;color:#9ca3af;line-height:1.6;margin:0;">
                ${s.expiresBefore} <strong>${s.oneHour}</strong>.<br />
                ${s.ignore}
              </p>
            </td>
          </tr>
          <tr>
            <td style="background:#f9fafb;border-top:1px solid #f0fdf4;padding:20px 40px;text-align:center;">
              <p style="font-size:11px;color:#9ca3af;margin:0;">© 2026 Jisapp</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/**
 * 差出人。日本語以外のメールは、差出人名を「Jisapp」にする（環境変数の名前がカタカナでも）
 */
function fromAddress(foreign: boolean): string {
  const configured = process.env.RESEND_FROM_EMAIL;
  if (!configured) return foreign ? "Jisapp <onboarding@resend.dev>" : "ジサップ <onboarding@resend.dev>";
  if (!foreign) return configured;
  const m = configured.match(/<([^>]+)>/);
  return `Jisapp <${m ? m[1] : configured.trim()}>`;
}

export async function POST(req: NextRequest) {
  try {
    const { email, locale } = await req.json();
    const en = locale === "en" || locale === "vi";
    const vi = locale === "vi";
    if (!email) {
      return NextResponse.json({ error: "メールアドレスを入力してください" }, { status: 400 });
    }

    const user = await findUserByEmail(email);
    // ユーザーが存在しなくても同じレスポンスを返す（メールアドレス列挙攻撃対策）
    if (!user || !user.passwordHash) {
      return NextResponse.json({ ok: true });
    }

    const token = randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1時間
    await storePasswordResetToken(email, token, expiresAt);

    const baseUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000";
    const resetUrl = `${baseUrl}${vi ? "/vi" : en ? "/en" : ""}/reset-password?token=${token}`;
    const fromEmail = fromAddress(en);

    const { error: sendError } = await resend.emails.send({
      from: fromEmail,
      to: [email],
      subject: vi ? EMAIL_VI.title : en ? "Reset your Jisapp password" : "【ジサップ】パスワードリセット",
      html: vi
        ? buildResetEmailHtmlEn(user.name ?? "bạn", resetUrl, EMAIL_VI)
        : en
        ? buildResetEmailHtmlEn(user.name ?? "there", resetUrl)
        : buildResetEmailHtml(user.name ?? "ユーザー", resetUrl),
    });

    if (sendError) {
      console.error("[forgot-password Resend]", sendError);
      return NextResponse.json({ error: "メール送信に失敗しました。再度お試しください。" }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[forgot-password]", err);
    return NextResponse.json({ error: "サーバーエラーが発生しました" }, { status: 500 });
  }
}
