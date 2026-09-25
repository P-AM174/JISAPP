import { prisma } from "@/lib/db";

type XContent = {
  kind?: string;
  type_used?: string;
  angle_used?: string;
  source_app?: string;
  post_text?: string;
  text?: string;
};

export async function listRecentXPosts(take = 8) {
  const rows = await prisma.agentTask.findMany({
    where: { type: "x_post" },
    orderBy: { createdAt: "desc" },
    take,
    select: { content: true, previewData: true },
  });

  return rows.map((row) => (row.content ?? {}) as XContent);
}

export function recentPostTypes(posts: XContent[]): string[] {
  return posts
    .filter((p) => p.kind !== "platform")
    .map((p) => p.type_used?.trim())
    .filter((value): value is string => Boolean(value))
    .slice(0, 5);
}

export function recentAngles(posts: XContent[]): string[] {
  return posts
    .filter((p) => p.kind === "platform")
    .map((p) => p.angle_used?.trim())
    .filter((value): value is string => Boolean(value))
    .slice(0, 5);
}

export function recentSourceApps(posts: XContent[]): string[] {
  return posts
    .map((p) => p.source_app?.trim())
    .filter((value): value is string => Boolean(value));
}

export async function findStoredAnalysis(appId: string, title: string) {
  const rows = await prisma.agentTask.findMany({
    where: { type: "game_generation" },
    orderBy: { createdAt: "desc" },
    take: 40,
    select: { content: true, previewData: true },
  });

  for (const row of rows) {
    const content = (row.content ?? {}) as {
      title?: string;
      feature_bullets?: string[];
      best_hook?: string;
      genre_feel?: string;
    };
    const preview = (row.previewData ?? {}) as { publishedAppId?: string };
    const match = preview.publishedAppId === appId || content.title === title;
    if (match && content.feature_bullets && content.feature_bullets.length > 0) {
      return {
        feature_bullets: content.feature_bullets,
        best_hook: content.best_hook ?? content.feature_bullets[0],
        genre_feel: content.genre_feel ?? "",
      };
    }
  }

  return null;
}
