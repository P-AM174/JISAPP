import { NextResponse, type NextRequest } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { isLocale } from "@/lib/i18n/config";

/**
 * 計測イベントを受け取って記録する（scripts/add-analytics-events.sql の表）。
 * 表がまだない・書き込みに失敗したときも 204 を返し、画面には影響させない
 */
const NAMES = new Set(["page_view", "prompt_copy", "studio_paste", "preview", "publish", "share", "signup"]);

const str = (v: unknown, max: number) => (typeof v === "string" && v ? v.slice(0, max) : null);

export async function POST(req: NextRequest) {
  try {
    const data = (await req.json().catch(() => null)) as Record<string, unknown> | null;
    const name = str(data?.name, 32);
    if (!data || !name || !NAMES.has(name)) return new NextResponse(null, { status: 204 });

    // クローラーは数えない
    const ua = req.headers.get("user-agent") ?? "";
    if (/bot|crawler|spider|preview|facebookexternalhit|zalo/i.test(ua)) return new NextResponse(null, { status: 204 });

    const locale = isLocale(data.locale) ? data.locale : null;
    const country = str(req.headers.get("x-vercel-ip-country"), 2);

    // ページ表示は、英語・ベトナム語ページか、ベトナムからのアクセスだけ記録する（日本語版の表示は数えない）
    if (name === "page_view" && locale === "ja" && country !== "VN") return new NextResponse(null, { status: 204 });

    let props: Record<string, unknown> | null = null;
    if (data.props && typeof data.props === "object" && !Array.isArray(data.props)) {
      props = {};
      for (const [k, v] of Object.entries(data.props as Record<string, unknown>).slice(0, 8)) {
        if (["string", "number", "boolean"].includes(typeof v)) props[k.slice(0, 32)] = typeof v === "string" ? v.slice(0, 64) : v;
      }
    }

    const supabase = createServerSupabaseClient();
    await supabase.from("analytics_events").insert({
      name,
      locale,
      country,
      path: str(data.path, 200),
      session_id: str(data.session_id, 64),
      utm_source: str(data.utm_source, 64),
      utm_medium: str(data.utm_medium, 64),
      utm_campaign: str(data.utm_campaign, 64),
      props,
    });
  } catch {
    // 計測の失敗は無視する
  }
  return new NextResponse(null, { status: 204 });
}
