import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { listAgentTasks } from "@/lib/agent/tasks";
import { getOfficialCreator } from "@/lib/agent/official-creator";
import type { AgentTaskStatus } from "@prisma/client";

export async function GET(request: Request) {
  const admin = await requireAdmin();
  if (!admin.ok) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const status = new URL(request.url).searchParams.get("status") as AgentTaskStatus | null;
  const [tasks, official] = await Promise.all([
    listAgentTasks(status || undefined),
    getOfficialCreator(),
  ]);

  return NextResponse.json({
    officialCreator: official,
    tasks: tasks.map((task) => ({
      id: task.id,
      type: task.type,
      status: task.status,
      title: task.title,
      content: task.content,
      previewData: task.previewData,
      safetyCheckResult: task.safetyCheckResult,
      rejectionReason: task.rejectionReason,
      createdAt: task.createdAt,
      updatedAt: task.updatedAt,
      executedAt: task.executedAt,
    })),
  });
}
