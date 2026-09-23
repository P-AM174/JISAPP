import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { executeApprovedTask } from "@/lib/agent/execute";
import {
  getAgentTask,
  markAgentTaskApproved,
  markAgentTaskExecuted,
  rejectAgentTask,
} from "@/lib/agent/tasks";
import { notifySlack } from "@/lib/agent/slack";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdmin();
  if (!admin.ok) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  let body: { action?: "approve" | "reject" | "complete"; reason?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "不正なリクエストです" }, { status: 400 });
  }

  const task = await getAgentTask(id);
  if (!task) {
    return NextResponse.json({ error: "タスクがありません" }, { status: 404 });
  }

  if (body.action === "reject") {
    if (task.status !== "pending") {
      return NextResponse.json({ error: "この状態では却下できません" }, { status: 400 });
    }
    const updated = await rejectAgentTask(id, body.reason ?? "");
    return NextResponse.json({ task: updated });
  }

  if (body.action === "complete") {
    if (task.type !== "x_post" || task.status !== "approved") {
      return NextResponse.json({ error: "この状態では完了にできません" }, { status: 400 });
    }
    const updated = await markAgentTaskExecuted(id);
    return NextResponse.json({ task: updated });
  }

  if (body.action === "approve") {
    if (task.status !== "pending" && task.status !== "approved") {
      return NextResponse.json({ error: "この状態では承認できません" }, { status: 400 });
    }

    const approved = task.status === "pending" ? await markAgentTaskApproved(id) : task;

    try {
      const executed = await executeApprovedTask(approved);
      if (approved.type === "x_post") {
        const text =
          typeof approved.content === "object" &&
          approved.content &&
          "text" in approved.content
            ? String((approved.content as { text?: string }).text ?? "")
            : approved.title;
        const site = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://jisapp.app").replace(
          /\/$/,
          ""
        );
        await notifySlack(
          `X下書きを承認しました。公式Xに貼って投稿してください。\n${text}\n${site}/admin/approvals`
        );
      }
      return NextResponse.json({ task: executed });
    } catch (error) {
      return NextResponse.json(
        { error: error instanceof Error ? error.message : "実行に失敗しました" },
        { status: 500 }
      );
    }
  }

  return NextResponse.json({ error: "action が不正です" }, { status: 400 });
}
