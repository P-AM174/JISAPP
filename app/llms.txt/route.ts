import { buildLlmsTxt, type LlmsColumn } from "@/lib/seo/llmo";
import { listPublishedColumns } from "@/lib/columns/service";
import type { ColumnLocale } from "@/lib/columns/types";

export const runtime = "nodejs";
// 公開したコラムが載るように、1時間ごとに作り直す
export const revalidate = 3600;

/** 公開中のコラム（読めなかったときは載せないだけにする） */
async function columnsFor(locale: ColumnLocale): Promise<LlmsColumn[]> {
  try {
    return (await listPublishedColumns(locale, 100)).map((c) => ({ slug: c.slug, title: c.title, description: c.description }));
  } catch {
    return [];
  }
}

/**
 * AIクローラー向けのサイト要約。
 * https://llmstxt.org/ の慣習に合わせ、ルートの /llms.txt で配信する。
 */
export async function GET() {
  const [ja, en] = await Promise.all([columnsFor("ja"), columnsFor("en")]);
  return new Response(buildLlmsTxt({ ja, en }), {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=86400",
    },
  });
}
