import { CLAUDE_HAIKU_MODEL, callClaude, extractJsonObject } from "@/lib/agent/claude";
import { analyzeAppCode, type AppAnalysis } from "@/lib/agent/analyze-app";
import { AGENT_PROMPTS } from "@/lib/agent/prompts";
import { runSafetyCheck } from "@/lib/agent/safety";
import { notifyNewAgentTask } from "@/lib/agent/slack";
import {
  findStoredAnalysis,
  listRecentXPosts,
  recentAngles,
  recentPostTypes,
  recentSourceApps,
} from "@/lib/agent/recent-x";
import {
  countPendingAgentTasks,
  createAgentTask,
  recentRejectionNotes,
} from "@/lib/agent/tasks";
import { createServerSupabaseClient } from "@/lib/supabase-server";

export type XPostContent = {
  kind: "app" | "platform";
  text: string;
  post_text: string;
  type_used?: string;
  angle?: string;
  angle_used?: string;
  source_app?: string;
};

type ListedApp = {
  id: string;
  title: string | null;
  html_code?: string | null;
};

function siteUrl(): string {
  return (process.env.NEXT_PUBLIC_SITE_URL ?? "https://jisapp.app").replace(/\/$/, "");
}

async function saveXTask(input: {
  title: string;
  content: XPostContent;
  extra?: string;
}) {
  const safety = await runSafetyCheck(input.content.post_text, input.extra);
  const task = await createAgentTask({
    type: "x_post",
    title: input.title.slice(0, 40),
    content: input.content,
    previewData: { text: input.content.post_text, kind: input.content.kind },
    safetyCheckResult: safety,
  });

  await notifyNewAgentTask({
    typeLabel: input.content.kind === "platform" ? "ジサップ紹介ポスト" : "X投稿下書き",
    title: task.title,
    pendingCount: await countPendingAgentTasks(),
  });

  return { id: task.id, title: task.title };
}

export async function generatePlatformIntroDraft(): Promise<{ id: string; title: string }> {
  const posts = await listRecentXPosts();
  const rejections = await recentRejectionNotes("x_post");
  const site = siteUrl();

  const raw = await callClaude({
    model: CLAUDE_HAIKU_MODEL,
    system: AGENT_PROMPTS.xIntroSystem,
    user: AGENT_PROMPTS.xIntroUser({
      recentAngles: recentAngles(posts),
      rejected: rejections,
      site,
    }),
    maxTokens: 500,
    temperature: 0.7,
  });

  const parsed = extractJsonObject<{ post_text?: string; angle_used?: string }>(raw);
  const post_text = (parsed.post_text ?? "").trim();
  if (!post_text) {
    throw new Error("投稿文が空です");
  }

  return saveXTask({
    title: post_text,
    content: {
      kind: "platform",
      text: post_text,
      post_text,
      angle: parsed.angle_used ?? "",
      angle_used: parsed.angle_used ?? "",
    },
    extra: `種別: ジサップ紹介（①-c）\n直近の視点: ${recentAngles(posts).join("、") || "なし"}`,
  });
}

export async function generateAppFocusDraft(target?: {
  id: string;
  title: string;
  analysis?: AppAnalysis;
}): Promise<{ id: string; title: string }> {
  const supabase = createServerSupabaseClient();
  const site = siteUrl();
  const posts = await listRecentXPosts();
  const usedApps = recentSourceApps(posts);

  let app = target
    ? { id: target.id, title: target.title, html_code: null as string | null }
    : null;

  if (!app) {
    const { data: apps } = await supabase
      .from("apps")
      .select("id, title, html_code")
      .eq("status", "active")
      .eq("is_listed", true)
      .order("created_at", { ascending: false })
      .limit(20);

    const listed = (apps ?? []) as ListedApp[];
    const unused = listed.filter(
      (row) => row.title && !usedApps.includes(row.title)
    );
    const picked = unused[0] ?? listed[0];
    if (!picked?.id || !picked.title) {
      return generatePlatformIntroDraft();
    }
    app = { id: picked.id, title: picked.title, html_code: picked.html_code ?? null };
  }

  let analysis = target?.analysis ?? (await findStoredAnalysis(app.id, app.title));
  if (!analysis) {
    let html = app.html_code ?? "";
    if (!html) {
      const { data } = await supabase
        .from("apps")
        .select("html_code")
        .eq("id", app.id)
        .maybeSingle();
      html = (data?.html_code as string | undefined) ?? "";
    }
    analysis = await analyzeAppCode({ title: app.title, html });
  }

  const rejections = await recentRejectionNotes("x_post");
  const appUrl = `${site}/apps/${app.id}`;

  const raw = await callClaude({
    model: CLAUDE_HAIKU_MODEL,
    system: AGENT_PROMPTS.xAppSystem,
    user: AGENT_PROMPTS.xAppUser({
      name: app.title,
      appUrl,
      featureBullets: analysis.feature_bullets,
      bestHook: analysis.best_hook,
      genreFeel: analysis.genre_feel,
      rejected: rejections,
      recentTypes: recentPostTypes(posts),
    }),
    maxTokens: 500,
    temperature: 0.7,
  });

  const parsed = extractJsonObject<{
    post_text?: string;
    type_used?: string;
    source_app?: string;
  }>(raw);
  const post_text = (parsed.post_text ?? "").trim();
  if (!post_text) {
    throw new Error("投稿文が空です");
  }

  return saveXTask({
    title: post_text,
    content: {
      kind: "app",
      text: post_text,
      post_text,
      type_used: parsed.type_used ?? "",
      source_app: parsed.source_app ?? app.title,
    },
    extra: `種別: アプリ個別紹介（①-b）\napp_url: ${appUrl}\n直近の型: ${recentPostTypes(posts).join("、") || "なし"}`,
  });
}

/** 公開アプリがあれば個別紹介。なければジサップ紹介に切り替える */
export async function generateXPostDraft(target?: {
  id: string;
  title: string;
  analysis?: AppAnalysis;
}): Promise<{ id: string; title: string }> {
  if (target) {
    return generateAppFocusDraft(target);
  }

  const supabase = createServerSupabaseClient();
  const { count } = await supabase
    .from("apps")
    .select("id", { count: "exact", head: true })
    .eq("status", "active")
    .eq("is_listed", true);

  if (!count) {
    return generatePlatformIntroDraft();
  }
  return generateAppFocusDraft();
}
