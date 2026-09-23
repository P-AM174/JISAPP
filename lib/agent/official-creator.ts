import { prisma } from "@/lib/db";

export const OFFICIAL_CREATOR_NAME = "ジサップ公式";

export async function getOfficialCreator() {
  return prisma.user.findFirst({
    where: { isOfficial: true },
    select: { id: true, email: true, name: true },
  });
}
