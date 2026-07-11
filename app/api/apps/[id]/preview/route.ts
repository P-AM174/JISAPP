import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { buildSrcDoc } from "@/lib/products/build-srcdoc";

export async function GET(
  _request: Request,
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
