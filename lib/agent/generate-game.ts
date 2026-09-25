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
  feature_bullets?: string[];
  best_hook?: string;
};

function pickTheme(): string {
  const day = Math.floor(Date.now() / 86_400_000);
  return GAME_THEMES[day % GAME_THEMES.length];
}

function metaSourceFromRaw(raw: string): string {
  const marker = raw.indexOf("---JSON---");
  if (marker >= 0) return raw.slice(marker + "---JSON---".length);
  const lastHtml = raw.toLowerCase().lastIndexOf("</html>");
  if (lastHtml >= 0) return raw.slice(lastHtml);
  return raw;
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

  const recentTitles = (apps ?? [])
    .map((app: { title?: string | null }) => app.title)
    .filter(Boolean) as string[];
  const rejections = await recentRejectionNotes("game_generation");
  const theme = pickTheme();

  const raw = await callClaude({
    model: CLAUDE_SONNET_MODEL,
    system: AGENT_PROMPTS.gameSystem,
    user: AGENT_PROMPTS.gameUser(theme, recentTitles, rejections),
    maxTokens: 8000,
    temperature: 0.6,
  });

  const html = extractHtmlDocument(raw);
  const meta = extractJsonObject<{
    title?: string;
    description?: string;
    category?: string;
    feature_bullets?: string[];
    best_hook?: string;
  }>(metaSourceFromRaw(raw));

  const title = (meta.title ?? "無題のアプリ").trim().slice(0, 40);
  const description = (meta.description ?? "").trim().slice(0, 200);
  const rawCategory = (meta.category ?? "ゲーム").trim();
  const categoryId =
    CATEGORIES.find((c) => c.id === rawCategory || c.name === rawCategory)?.id ?? "games";
  const feature_bullets = (meta.feature_bullets ?? [])
    .map((b) => String(b).trim())
    .filter(Boolean)
    .slice(0, 5);
  const best_hook = (meta.best_hook ?? feature_bullets[0] ?? "").trim();

  const safety = await runSafetyCheck(
    `${title}\n${description}\n${html}`,
    "種別: 運営アプリ（②）"
  );
  const task = await createAgentTask({
    type: "game_generation",
    title,
    content: {
      title,
      description,
      category: categoryId,
      html,
      feature_bullets,
      best_hook,
    },
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
