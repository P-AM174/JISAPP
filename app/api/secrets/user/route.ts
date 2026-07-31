import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import {
  deleteUserAiSecret,
  listUserSecrets,
  saveUserAiSecret,
  userHasAiSecret,
} from "@/lib/secrets/user-secrets";
import { detectAiProvider, USER_AI_SECRET_NAME } from "@/lib/secrets/constants";

/** GET /api/secrets/user — 登録済みシークレット一覧（値は返さない） */
export async function GET() {
  const userId = await requireAuth();
  if (userId instanceof NextResponse) return userId;

  const secrets = await listUserSecrets(userId);
  const hasAiKey = await userHasAiSecret(userId);

  return NextResponse.json({
    secrets,
    ai: { name: USER_AI_SECRET_NAME, configured: hasAiKey },
  });
}

/** POST /api/secrets/user — AI APIキー保存 { value: string } */
export async function POST(req: Request) {
  const userId = await requireAuth();
  if (userId instanceof NextResponse) return userId;

  let body: { value?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "不正なリクエストです" }, { status: 400 });
  }

  const value = (body.value ?? "").trim();
  if (!value || value.length > 500) {
    return NextResponse.json({ error: "APIキーを入力してください" }, { status: 400 });
  }

  const provider = detectAiProvider(value);
  if (!provider) {
    return NextResponse.json(
      { error: "OpenAI（sk-...）または Groq（gsk_...）のキーを入力してください" },
      { status: 400 }
    );
  }

  await saveUserAiSecret(userId, value);
  return NextResponse.json({ ok: true, provider });
}

/** DELETE /api/secrets/user — AI APIキー削除 */
export async function DELETE() {
  const userId = await requireAuth();
  if (userId instanceof NextResponse) return userId;

  await deleteUserAiSecret(userId);
  return NextResponse.json({ ok: true });
}
