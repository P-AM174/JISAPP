import type { AgentTask } from "@prisma/client";
import { getOfficialCreator } from "@/lib/agent/official-creator";
import { generateXPostDraft } from "@/lib/agent/generate-x-post";
import { notifySlack } from "@/lib/agent/slack";
import { markAgentTaskExecuted } from "@/lib/agent/tasks";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import {
  snapshotFromAppRow,
  upsertLibrarySnapshot,
} from "@/lib/library/snapshots";

type GameContent = {
  title?: string;
  description?: string;
  category?: string;
  html?: string;
  feature_bullets?: string[];
  best_hook?: string;
};

const LIBRARY_KEY = "__in_library__";

/**
 * 承認済みタスクだけを実行する。
 * X投稿は人が公式アカウントから貼るため、ここでは状態を変えない。
 */
export async function executeApprovedTask(task: AgentTask): Promise<AgentTask> {
  if (task.status !== "approved") {
    throw new Error("未承認のタスクは実行できません");
  }

  if (task.type === "x_post") {
    return task;
  }

  if (task.type === "game_generation") {
    return publishOfficialGame(task);
  }

  throw new Error("未対応のタスクです");
}

async function publishOfficialGame(task: AgentTask): Promise<AgentTask> {
  const creator = await getOfficialCreator();
  if (!creator) {
    throw new Error("運営出品用アカウントがまだありません。先に作成してください");
  }

  const content = (task.content ?? {}) as GameContent;
  const html = (content.html ?? "").trim();
  const title = (content.title ?? task.title).trim();
  if (!html || !title) {
    throw new Error("アプリのコードまたはタイトルが空です");
  }

  const supabase = createServerSupabaseClient();
  const now = new Date().toISOString();
  const description = (content.description ?? "").trim() || null;
  const category = content.category || "games";

  const { data, error } = await supabase
    .from("apps")
    .insert({
      title,
      description,
      html_code: html,
      css_code: null,
      js_code: null,
      category,
      is_listed: true,
      code_public: true,
      status: "active",
      last_accessed_at: now,
      creator_name: creator.name ?? "ジサップ公式",
      creator_id: creator.id,
      is_playground_app: true,
    })
    .select("id")
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "出品に失敗しました");
  }

  await supabase.from("user_projects").insert({
    user_id: creator.id,
    title,
    description,
    html_code: html,
    css_code: null,
    js_code: null,
    app_id: data.id,
    status: "listed",
    is_listed: true,
    category,
    updated_at: now,
  });

  await supabase.from("app_user_data").upsert(
    {
      user_id: creator.id,
      app_id: data.id,
      data_key: LIBRARY_KEY,
      data_value: JSON.stringify({
        name: title,
        category,
        addedAt: now,
      }),
      updated_at: now,
    },
    { onConflict: "user_id,app_id,data_key" }
  );

  await upsertLibrarySnapshot(
    supabase,
    creator.id,
    data.id,
    snapshotFromAppRow({
      title,
      description,
      html_code: html,
      category,
      code_version: 1,
    })
  );

  const updated = await markAgentTaskExecuted(task.id, {
    title,
    description: description ?? "",
    category,
    publishedAppId: data.id,
  });

  const site = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://jisapp.app").replace(/\/$/, "");
  try {
    const bullets = (content.feature_bullets ?? []).filter(Boolean);
    await generateXPostDraft({
      id: data.id,
      title,
      analysis:
        bullets.length > 0
          ? {
              feature_bullets: bullets,
              best_hook: content.best_hook || bullets[0],
              genre_feel: "",
            }
          : undefined,
    });
  } catch (genError) {
    await notifySlack(
      `アプリは公開しましたが、紹介ポスト下書きの生成に失敗しました: ${
        genError instanceof Error ? genError.message : "unknown"
      }\n${site}/apps/${data.id}`
    );
  }

  return updated;
}
