import { CLAUDE_HAIKU_MODEL, callClaude, extractJsonObject } from "@/lib/agent/claude";
import { AGENT_PROMPTS } from "@/lib/agent/prompts";
import { runSafetyCheck } from "@/lib/agent/safety";
import { notifyNewAgentTask } from "@/lib/agent/slack";
import {
  countPendingAgentTasks,
  createAgentTask,
  recentRejectionNotes,
} from "@/lib/agent/tasks";
import { createServerSupabaseClient } from "@/lib/supabase-server";

export type XPostContent = {
  text: string;
  angle?: string;
};

export async function generateXPostDraft(): Promise<{ id: string; title: string }> {
  const supabase = createServerSupabaseClient();
  const { data: apps } = await supabase
    .from("apps")
    .select("id, title, description")
    .eq("status", "active")
    .eq("is_listed", true)
    .order("created_at", { ascending: false })
    .limit(8);

  const rejections = await recentRejectionNotes("x_post");
  const appLines =
    apps && apps.length > 0
      ? apps
          .map((app) => `- ${app.title}: ${(app.description ?? "").slice(0, 80)}`)
          .join("\n")
      : "- （公開アプリはまだ少ない。ジサップ自体の使い方を紹介する）";

  const context = [
    "最近公開されたアプリ:",
    appLines,
    "",
    "必ず含めること: ジサップはAIが書いたコードを貼って公開する場であること。Bubble等のノーコード組み立てとは違う。",
    "URLが自然なら https://jisapp.app または https://jisapp.app/playground を1つ。",
    rejections.length > 0 ? `前回却下された理由（繰り返さない）:\n${rejections.map((r) => `- ${r}`).join("\n")}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  const raw = await callClaude({
    model: CLAUDE_HAIKU_MODEL,
    system: AGENT_PROMPTS.xPostSystem,
    user: AGENT_PROMPTS.xPostUser(context),
    maxTokens: 600,
    temperature: 0.7,
  });

  const parsed = extractJsonObject<XPostContent>(raw);
  const text = (parsed.text ?? "").trim();
  if (!text) {
    throw new Error("投稿文が空です");
  }

  const safety = await runSafetyCheck(text);
  const task = await createAgentTask({
    type: "x_post",
    title: text.slice(0, 40),
    content: { text, angle: parsed.angle ?? "" },
    previewData: { text },
    safetyCheckResult: safety,
  });

  await notifyNewAgentTask({
    typeLabel: "X投稿下書き",
    title: task.title,
    pendingCount: await countPendingAgentTasks(),
  });

  return { id: task.id, title: task.title };
}
