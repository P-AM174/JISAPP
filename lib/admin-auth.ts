import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

const ADMIN_COOKIE = "jisapp_admin_session";

/** 管理者の入場券の有効時間（盗まれても、この時間がたてば使えない） */
const ADMIN_TOKEN_TTL_MS = 8 * 60 * 60 * 1000;

function signAdminToken(expiresAt: number): string {
  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret) throw new Error("NEXTAUTH_SECRET is not set");
  return createHmac("sha256", secret).update(`jisapp-admin:${expiresAt}`).digest("hex");
}

/** 「期限.署名」の形。毎回ちがう値になり、期限を過ぎると使えない */
export function createAdminSessionCookie(): string {
  const expiresAt = Date.now() + ADMIN_TOKEN_TTL_MS;
  return `${expiresAt}.${signAdminToken(expiresAt)}`;
}

export function verifyAdminToken(token: string): boolean {
  try {
    const [exp, sig] = token.split(".");
    const expiresAt = Number(exp);
    if (!sig || !Number.isFinite(expiresAt) || expiresAt < Date.now() || expiresAt > Date.now() + ADMIN_TOKEN_TTL_MS) return false;
    const a = Buffer.from(sig);
    const b = Buffer.from(signAdminToken(expiresAt));
    if (a.length !== b.length) return false;
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

export async function isAdminUser(userId: string | null): Promise<boolean> {
  if (!userId) return false;
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });
  return user?.role === "ADMIN";
}

export async function requireAdmin(): Promise<
  { ok: true; userId: string | null; via: "session" | "cookie" } | { ok: false }
> {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string } | undefined)?.id ?? null;

  if (await isAdminUser(userId)) {
    return { ok: true, userId, via: "session" };
  }

  const cookieStore = await cookies();
  const adminCookie = cookieStore.get(ADMIN_COOKIE)?.value;
  if (adminCookie && verifyAdminToken(adminCookie)) {
    return { ok: true, userId, via: "cookie" };
  }

  return { ok: false };
}

export function verifyAdminPassword(password: string): boolean {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected || !password) return false;
  try {
    const a = Buffer.from(password);
    const b = Buffer.from(expected);
    if (a.length !== b.length) return false;
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

export { ADMIN_COOKIE };
