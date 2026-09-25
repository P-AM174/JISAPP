import { CLAUDE_SONNET_MODEL, callClaude, extractJsonObject } from "@/lib/agent/claude";
import { AGENT_PROMPTS } from "@/lib/agent/prompts";

export type AppAnalysis = {
  feature_bullets: string[];
  best_hook: string;
  genre_feel: string;
};

const MAX_HTML_CHARS = 24000;

export async function analyzeAppCode(input: {
  title: string;
  html: string;
}): Promise<AppAnalysis> {
  const html = input.html.trim().slice(0, MAX_HTML_CHARS);
  if (!html) {
    throw new Error("解析するコードが空です");
  }

  const raw = await callClaude({
    model: CLAUDE_SONNET_MODEL,
    system: AGENT_PROMPTS.analyzeSystem,
    user: `アプリ名: ${input.title}\n\nソースコード:\n${html}`,
    maxTokens: 800,
    temperature: 0.2,
  });

  const parsed = extractJsonObject<Partial<AppAnalysis>>(raw);
  const bullets = (parsed.feature_bullets ?? []).map((b) => String(b).trim()).filter(Boolean);
  const hook = (parsed.best_hook ?? bullets[0] ?? "").trim();
  if (bullets.length < 1 || !hook) {
    throw new Error("コード解析の結果が不足しています");
  }

  return {
    feature_bullets: bullets.slice(0, 5),
    best_hook: hook,
    genre_feel: (parsed.genre_feel ?? "").trim(),
  };
}
