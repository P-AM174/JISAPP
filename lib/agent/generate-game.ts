import {
  CLAUDE_SONNET_MODEL,
  callClaude,
  extractHtmlDocument,
  extractJsonObject,
} from "@/lib/agent/claude";
import { AGENT_PROMPTS, GAME_THEMES } from "@/lib/agent/prompts";
import { runSafetyCheck } from "@/lib/agent/safety";
import { notifyNewAgentTask } from "@/lib/agent/slack";
import {
  countPendingAgentTasks,
  createAgentTask,
  recentRejectionNotes,
} from "@/lib/agent/tasks";
import { CATEGORIES } from "@/lib/categories";
import { createServerSupabaseClient } from "@/lib/supabase-server";

export type GameContent = {
  title: string;
  description: string;
  category: string;
  html: string;
};

function pickTheme(): string {
  const day = Math.floor(Date.now() / 86_400_000);
  return GAME_THEMES[day % GAME_THEMES.length];
}

export async function generateOfficialGameDraft(): Promise<{ id: string; title: string }> {
  const supabase = createServerSupabaseClient();
  const { data: apps } = await supabase
    .from("apps")
    .select("title")
    .eq("status", "active")
    .eq("is_listed", true)
    .order("created_at", { ascending: false })
    .limit(20);

  const recentTitles = (apps ?? []).map((app: { title?: string | null }) => app.title).filter(Boolean) as string[];
  const rejections = await recentRejectionNotes("game_generation");
  const theme = pickTheme();

  const raw = await callClaude({
    model: CLAUDE_SONNET_MODEL,
    system: AGENT_PROMPTS.gameSystem,
    user: [
      AGENT_PROMPTS.gameUser(theme, recentTitles),
      rejections.length > 0
        ? `\n前回却下の理由（反映すること）:\n${rejections.map((r) => `- ${r}`).join("\n")}`
        : "",
    ].join(""),
    maxTokens: 8000,
    temperature: 0.6,
  });

  const html = extractHtmlDocument(raw);
  const afterHtml = raw.slice(raw.toLowerCase().lastIndexOf("</html>"));
  const metaSource = afterHtml.includes("{") ? afterHtml : raw;
  const meta = extractJsonObject<{
    title?: string;
    description?: string;
    category?: string;
  }>(metaSource);

  const title = (meta.title ?? "無題のアプリ").trim().slice(0, 40);
  const description = (meta.description ?? "").trim().slice(0, 200);
  const rawCategory = (meta.category ?? "games").trim();
  const categoryId =
    CATEGORIES.find((c) => c.id === rawCategory || c.name === rawCategory)?.id ?? "games";

  const safety = await runSafetyCheck(`${title}\n${description}\n${html}`);
  const task = await createAgentTask({
    type: "game_generation",
    title,
    content: { title, description, category: categoryId, html },
    previewData: { title, description, category: categoryId },
    safetyCheckResult: safety,
  });

  await notifyNewAgentTask({
    typeLabel: "運営アプリ（プレイ確認）",
    title,
    pendingCount: await countPendingAgentTasks(),
  });

  return { id: task.id, title };
}
