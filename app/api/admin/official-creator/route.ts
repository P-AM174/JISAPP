import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { requireAdmin } from "@/lib/admin-auth";
import { OFFICIAL_CREATOR_NAME, getOfficialCreator } from "@/lib/agent/official-creator";
import { findUserByEmail } from "@/lib/services/store";
import { prisma } from "@/lib/db";

export async function POST(request: Request) {
  const admin = await requireAdmin();
  if (!admin.ok) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const existing = await getOfficialCreator();
  if (existing) {
    return NextResponse.json({ error: "運営アカウントは既にあります", creator: existing }, { status: 409 });
  }

  let body: { email?: string; password?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "不正なリクエストです" }, { status: 400 });
  }

  const email = (body.email ?? "").trim().toLowerCase();
  const password = body.password ?? "";
  if (!email || !email.includes("@")) {
    return NextResponse.json({ error: "メールアドレスを入力してください" }, { status: 400 });
  }
  if (password.length < 8) {
    return NextResponse.json({ error: "パスワードは8文字以上にしてください" }, { status: 400 });
  }

  const duplicated = await findUserByEmail(email);
  if (duplicated) {
    const creator = await prisma.user.update({
      where: { id: duplicated.id },
      data: { isOfficial: true, name: duplicated.name || OFFICIAL_CREATOR_NAME },
      select: { id: true, email: true, name: true },
    });
    return NextResponse.json({ creator, reused: true });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const creator = await prisma.user.create({
    data: {
      email,
      name: OFFICIAL_CREATOR_NAME,
      passwordHash,
      isOfficial: true,
      role: "USER",
    },
    select: { id: true, email: true, name: true },
  });

  return NextResponse.json({ creator, reused: false }, { status: 201 });
}
