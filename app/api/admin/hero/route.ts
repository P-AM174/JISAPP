import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin-auth";
import {
  createHeroSlide,
  getAllHeroSlidesAdmin,
  saveAllHeroSlides,
} from "@/lib/hero/service";
import { validateHeroSlide, validateHeroSlides } from "@/lib/hero/validate";
import type { HeroSlideInput } from "@/lib/hero/types";
import { createServerSupabaseClient } from "@/lib/supabase-server";

function revalidateHero() {
  revalidatePath("/");
}

export async function GET() {
  const admin = await requireAdmin();
  if (!admin.ok) {
    return NextResponse.json({ error: "管理者権限が必要です" }, { status: 401 });
  }

  const slides = await getAllHeroSlidesAdmin();
  return NextResponse.json({ slides });
}

export async function PUT(req: Request) {
  const admin = await requireAdmin();
  if (!admin.ok) {
    return NextResponse.json({ error: "管理者権限が必要です" }, { status: 401 });
  }

  let body: { slides?: HeroSlideInput[] };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "不正なリクエストです" }, { status: 400 });
  }

  const slides = body.slides;
  if (!Array.isArray(slides)) {
    return NextResponse.json({ error: "slides 配列が必要です" }, { status: 400 });
  }

  const errors = validateHeroSlides(slides);
  if (errors.length > 0) {
    return NextResponse.json({ error: errors.join("\n") }, { status: 400 });
  }

  const result = await saveAllHeroSlides(slides);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }

  revalidateHero();
  const updated = await getAllHeroSlidesAdmin();
  return NextResponse.json({ success: true, slides: updated });
}

export async function POST(req: Request) {
  const admin = await requireAdmin();
  if (!admin.ok) {
    return NextResponse.json({ error: "管理者権限が必要です" }, { status: 401 });
  }

  let body: HeroSlideInput;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "不正なリクエストです" }, { status: 400 });
  }

  const errors = validateHeroSlide(body);
  if (errors.length > 0) {
    return NextResponse.json({ error: errors.join("\n") }, { status: 400 });
  }

  const result = await createHeroSlide(body);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }

  revalidateHero();
  return NextResponse.json({ success: true, id: result.id });
}

/** アプリ検索（カード型ピッカー用） */
export async function PATCH(req: Request) {
  const admin = await requireAdmin();
  if (!admin.ok) {
    return NextResponse.json({ error: "管理者権限が必要です" }, { status: 401 });
  }

  let body: { q?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "不正なリクエストです" }, { status: 400 });
  }

  const q = (body.q ?? "").trim();
  if (!q) return NextResponse.json({ apps: [] });

  const supabase = createServerSupabaseClient();
  const { data } = await supabase
    .from("apps")
    .select("id, title, category")
    .eq("status", "active")
    .ilike("title", `%${q}%`)
    .limit(10);

  return NextResponse.json({ apps: data ?? [] });
}
