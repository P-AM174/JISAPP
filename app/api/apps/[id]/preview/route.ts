import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { buildSrcDoc } from "@/lib/products/build-srcdoc";
import { touchAppLastAccessed } from "@/lib/apps/access";
import { buildMediaPosterHtml, detectMediaUsage } from "@/lib/apps/media-usage";
import { buildStillPreviewHtml, uses3D } from "@/lib/apps/heavy-preview";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const { data, error } = await supabase
    .from("apps")
    .select("title, html_code, css_code, js_code, status")
    .eq("id", id)
    .single();

  if (error || !data || data.status !== "active") {
    return new NextResponse("Not Found", { status: 404 });
  }

  // 一覧のサムネイル（?thumb=1）は「開かれた回数」に数えない（アプリを実際に開いたときだけ数える）
  const isThumbnail = new URL(request.url).searchParams.get("thumb") === "1";
  if (!isThumbnail) touchAppLastAccessed(id).catch(() => {});

  // 一覧のサムネイルでは、カメラ・マイクを使うアプリと 3D のアプリを動かさず静止画を返す
  // （3D をいくつも同時に動かすと、スマホのメモリが足りなくなってページごと落ちるため）
  if (isThumbnail) {
    const code = [data.html_code, data.js_code].filter(Boolean).join("\n");
    const media = detectMediaUsage(code);
    const still = media ? buildMediaPosterHtml(media) : uses3D(code) ? buildStillPreviewHtml(id, data.title ?? "") : null;
    if (still) {
      return new NextResponse(still, {
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
