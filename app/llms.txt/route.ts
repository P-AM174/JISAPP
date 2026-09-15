import { buildLlmsTxt } from "@/lib/seo/llmo";

export const runtime = "nodejs";

/**
 * AIクローラー向けのサイト要約。
 * https://llmstxt.org/ の慣習に合わせ、ルートの /llms.txt で配信する。
 */
export function GET() {
  return new Response(buildLlmsTxt(), {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=86400",
    },
  });
}
