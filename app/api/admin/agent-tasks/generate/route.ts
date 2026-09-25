import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { generateOfficialGameDraft } from "@/lib/agent/generate-game";
import {
  generatePlatformIntroDraft,
  generateXPostDraft,
} from "@/lib/agent/generate-x-post";

export const maxDuration = 60;

export async function POST(request: Request) {
  const admin = await requireAdmin();
  if (!admin.ok) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let body: { type?: "x_post" | "x_intro" | "game_generation" };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "不正なリクエストです" }, { status: 400 });
  }

  try {
    if (body.type === "x_post") {
      const created = await generateXPostDraft();
      return NextResponse.json({ created });
    }
    if (body.type === "x_intro") {
      const created = await generatePlatformIntroDraft();
      return NextResponse.json({ created });
    }
    if (body.type === "game_generation") {
      const created = await generateOfficialGameDraft();
      return NextResponse.json({ created });
    }
    return NextResponse.json({ error: "type が不正です" }, { status: 400 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "生成に失敗しました" },
      { status: 500 }
    );
  }
}
