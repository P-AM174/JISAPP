export async function notifySlack(text: string): Promise<void> {
  const url = process.env.SLACK_AGENT_WEBHOOK_URL ?? process.env.SLACK_WEBHOOK_URL;
  if (!url) {
    console.warn("[agent/slack] webhook URL が未設定のため通知をスキップ");
    return;
  }

  const res = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ text }),
  });

  if (!res.ok) {
    console.error("[agent/slack] 通知に失敗", res.status, await res.text());
  }
}

export async function notifyNewAgentTask(params: {
  typeLabel: string;
  title: string;
  pendingCount: number;
}): Promise<void> {
  const site = process.env.NEXT_PUBLIC_SITE_URL ?? "https://jisapp.app";
  await notifySlack(
    [
      `ジサップの承認待ちが更新されました（${params.typeLabel}）`,
      params.title,
      `未処理: ${params.pendingCount}件`,
      `${site.replace(/\/$/, "")}/admin/approvals`,
    ].join("\n")
  );
}
