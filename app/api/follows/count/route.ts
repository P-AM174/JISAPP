import { NextResponse } from "next/server";
import { countFollowers } from "@/lib/follows/server";

/** 作者のフォロワー数: GET /api/follows/count?name=xxx */
export async function GET(req: Request) {
  const name = new URL(req.url).searchParams.get("name")?.trim();
  if (!name) return NextResponse.json({ error: "name が必要です" }, { status: 400 });
  const count = await countFollowers(name);
  if (count === null) return NextResponse.json({ available: false, count: 0 });
  return NextResponse.json({ available: true, count });
}
