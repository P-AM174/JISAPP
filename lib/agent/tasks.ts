import type { AgentTask, AgentTaskStatus, AgentTaskType, Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";

export async function createAgentTask(input: {
  type: AgentTaskType;
  title: string;
  content: Prisma.InputJsonValue;
  previewData?: Prisma.InputJsonValue;
  safetyCheckResult?: Prisma.InputJsonValue;
}): Promise<AgentTask> {
  return prisma.agentTask.create({
    data: {
      type: input.type,
      title: input.title,
      content: input.content,
      previewData: input.previewData,
      safetyCheckResult: input.safetyCheckResult,
      status: "pending",
    },
  });
}

export async function listAgentTasks(status?: AgentTaskStatus) {
  const where =
    !status
      ? undefined
      : status === "pending"
        ? {
            OR: [
              { status: "pending" as const },
              { status: "approved" as const, type: "x_post" as const },
            ],
          }
        : { status };

  return prisma.agentTask.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 80,
  });
}

export async function countPendingAgentTasks(): Promise<number> {
  return prisma.agentTask.count({ where: { status: "pending" } });
}

export async function countPendingAgentTasksByType(type: AgentTaskType): Promise<number> {
  return prisma.agentTask.count({ where: { status: "pending", type } });
}

export async function getAgentTask(id: string) {
  return prisma.agentTask.findUnique({ where: { id } });
}

export async function rejectAgentTask(id: string, reason: string) {
  return prisma.agentTask.update({
    where: { id },
    data: { status: "rejected", rejectionReason: reason.trim() || "理由なし" },
  });
}

export async function markAgentTaskApproved(id: string) {
  return prisma.agentTask.update({
    where: { id },
    data: { status: "approved" },
  });
}

export async function markAgentTaskExecuted(
  id: string,
  previewData?: Prisma.InputJsonValue
) {
  return prisma.agentTask.update({
    where: { id },
    data: {
      status: "executed",
      executedAt: new Date(),
      previewData,
    },
  });
}

export async function recentRejectionNotes(type: AgentTaskType, take = 5): Promise<string[]> {
  const rows = await prisma.agentTask.findMany({
    where: { type, status: "rejected", rejectionReason: { not: null } },
    orderBy: { updatedAt: "desc" },
    take,
    select: { rejectionReason: true },
  });
  return rows
    .map((row) => row.rejectionReason?.trim())
    .filter((value): value is string => Boolean(value));
}
