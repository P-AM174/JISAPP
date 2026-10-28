import { NextResponse } from "next/server";
import {
  verifyAdminPassword,
  createAdminSessionCookie,
  ADMIN_COOKIE,
} from "@/lib/admin-auth";
import { clearHits, clientIp, countHit, isLimited, TOO_MANY_ATTEMPTS } from "@/lib/security/rate-limit";

export async function POST(request: Request) {
  let body: { password?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "不正なリクエストです" }, { status: 400 });
  }

  if (!process.env.ADMIN_PASSWORD) {
    return NextResponse.json(
      { error: "管理者認証が設定されていません" },
      { status: 503 }
    );
  }

  // 総当たり対策：同じ送り元で5回、全体で20回まちがえたら、しばらく試せない
  const ipKey = `admin:ip:${clientIp(request.headers)}`;
  const allKey = "admin:all";
  if ((await isLimited(ipKey, 5)).limited || (await isLimited(allKey, 20)).limited) {
    return NextResponse.json({ error: TOO_MANY_ATTEMPTS }, { status: 429 });
  }

  if (!verifyAdminPassword(body.password ?? "")) {
    await countHit(ipKey, 30 * 60);
    await countHit(allKey, 60 * 60);
    return NextResponse.json({ error: "パスワードが正しくありません" }, { status: 401 });
  }
  await clearHits(ipKey);

  const token = createAdminSessionCookie();
  const response = NextResponse.json({ ok: true });
  response.cookies.set(ADMIN_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: 60 * 60 * 8,
  });
  return response;
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set(ADMIN_COOKIE, "", { httpOnly: true, path: "/", maxAge: 0 });
  return response;
}
