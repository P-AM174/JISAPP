import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { buildSrcDoc } from "@/lib/products/build-srcdoc";
import { touchAppLastAccessed } from "@/lib/apps/access";
import { buildMediaPosterHtml, detectMediaUsage } from "@/lib/apps/media-usage";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const { data, error } = await supabase
    .from("apps")
    .select("html_code, css_code, js_code, status")
    .eq("id", id)
    .single();

  if (error || !data || data.status !== "active") {
    return new NextResponse("Not Found", { status: 404 });
  }

  touchAppLastAccessed(id).catch(() => {});

  // 一覧のサムネイル（?thumb=1）では、カメラ・マイクを使うアプリを動かさず静止画を返す
  const isThumbnail = new URL(request.url).searchParams.get("thumb") === "1";
  if (isThumbnail) {
    const media = detectMediaUsage([data.html_code, data.js_code].filter(Boolean).join("\n"));
    if (media) {
      return new NextResponse(buildMediaPosterHtml(media), {
        headers: {
          "Content-Type": "text/html; charset=utf-8",
          "X-Frame-Options": "SAMEORIGIN",
          "Cache-Control": "public, max-age=300, stale-while-revalidate=60",
        },
      });
    }
  }

  const html = buildSrcDoc(
    data.html_code ?? "",
    data.css_code,
    data.js_code
  );

  if (!html.trim()) {
    return new NextResponse("No content", { status: 204 });
  }

  return new NextResponse(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "X-Frame-Options": "SAMEORIGIN",
      "Cache-Control": "public, max-age=300, stale-while-revalidate=60",
    },
  });
}
