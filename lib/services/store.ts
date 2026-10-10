import { prisma } from "@/lib/db";
import { isReservedOfficialName } from "@/lib/official-name";
import type { ProductType } from "@/lib/products/types";

export async function findUserByEmail(email: string) {
  return prisma.user.findUnique({ where: { email: email.toLowerCase() } });
}

/**
 * Google でログインした人を登録・更新する。
 * プライバシーのため Google の名前（本名のことが多い）は使わない。
 * 表示する名前は、本人がジサップ用に決める（usernameSet が false の間は名前を決める画面が出る）
 */
export async function upsertOAuthUser(input: {
  email: string;
  name?: string | null;
  image?: string | null;
}) {
  const existed = await findUserByEmail(input.email);
  const user = await prisma.user.upsert({
    where: { email: input.email.toLowerCase() },
    create: {
      email: input.email.toLowerCase(),
      name: null,
      image: input.image ?? null,
    },
    update: {
      image: input.image ?? undefined,
    },
  });
  // Google での新規登録を計測に残す（メールでの登録は画面側で数えている）
  if (!existed) {
    try {
      const { createServerSupabaseClient } = await import("@/lib/supabase-server");
      await createServerSupabaseClient().from("analytics_events").insert({ name: "signup", props: { method: "google" } });
    } catch {
      /* 計測の失敗は無視する */
    }
  }
  return user;
}

export const USERNAME_MAX = 20;

/** ジサップで表示する名前として使えるか。使えないときは理由（日本語）を返す */
export async function validateUsername(name: string, userId: string): Promise<string | null> {
  const n = name.normalize("NFKC").trim();
  if (!n) return "名前を入力してください";
  if (n.length > USERNAME_MAX) return `名前は${USERNAME_MAX}文字以内にしてください`;
  if (isReservedOfficialName(n)) return "「ジサップ公式」など、運営とまぎらわしい名前は使えません";
  if (/[（(]s*(ゲスト|guest|khách)s*[)）]s*$/i.test(n) || /^(ゲスト|guest|匿名|ユーザー)$/i.test(n)) return "この名前は使えません";
  // 作者のページは名前でつながっているため、ほかの人と同じ名前は使えない
  const same = await prisma.user.findFirst({
    where: { id: { not: userId }, name: { equals: n, mode: "insensitive" } },
    select: { id: true },
  });
  if (same) return "この名前はほかの人が使っています。別の名前にしてください";
  return null;
}

export async function createCredentialUser(input: {
  name: string;
  email: string;
  passwordHash: string;
}) {
  return prisma.user.create({
    data: {
      email: input.email.toLowerCase(),
      name: input.name,
      passwordHash: input.passwordHash,
      // 登録のときにニックネームを決めている
      usernameSet: true,
    },
  });
}

export async function listProductsByCreator(creatorId: string) {
  return prisma.product.findMany({
    where: { creatorId },
    orderBy: { createdAt: "desc" },
  });
}

export async function listActiveProducts() {
  return prisma.product.findMany({
    where: { status: "active", isDemo: false },
    orderBy: { createdAt: "desc" },
    include: {
      creator: { select: { id: true, name: true, image: true } },
    },
  });
}

export async function listProductsForAdmin() {
  return prisma.product.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      creator: { select: { id: true, name: true, email: true } },
    },
  });
}

export async function getProductById(id: string) {
  return prisma.product.findUnique({
    where: { id },
    include: {
      creator: { select: { id: true, name: true, image: true, email: true } },
    },
  });
}

export async function createProduct(input: {
  title: string;
  description?: string;
  price?: number;
  sourceUrl?: string | null;
  productType?: ProductType;
  listingType?: string;
  category?: string;
  status?: string;
  htmlCode?: string | null;
  cssCode?: string | null;
  jsCode?: string | null;
  isPlaygroundApp?: boolean;
  gradient?: string;
  tagColor?: string;
  iconName?: string;
  previewFiles?: unknown;
  productFiles?: unknown;
  creatorId: string;
}) {
  return prisma.product.create({
    data: {
      title: input.title,
      description: input.description ?? "",
      price: input.price ?? 0,
      sourceUrl: input.sourceUrl ?? null,
      productType: input.productType ?? "generic",
      listingType: input.listingType ?? "file",
      category: input.category ?? "その他",
      status: input.status ?? "pending",
      htmlCode: input.htmlCode ?? null,
      cssCode: input.cssCode ?? null,
      jsCode: input.jsCode ?? null,
      isPlaygroundApp: input.isPlaygroundApp ?? false,
      gradient: input.gradient ?? null,
      tagColor: input.tagColor ?? null,
      iconName: input.iconName ?? null,
      previewFiles: input.previewFiles ?? undefined,
      productFiles: input.productFiles ?? undefined,
      creatorId: input.creatorId,
    },
  });
}

export async function updateProductStatus(id: string, status: string) {
  return prisma.product.update({ where: { id }, data: { status } });
}

export async function deleteProduct(id: string) {
  return prisma.product.delete({ where: { id } });
}

export async function countUsers() {
  return prisma.user.count();
}

export async function createReport(input: {
  productId: string;
  reporterId?: string;
  reason: string;
  detail?: string;
}) {
  return prisma.report.create({
    data: {
      productId:  input.productId,
      reporterId: input.reporterId ?? null,
      reason:     input.reason,
      detail:     input.detail ?? null,
    },
  });
}

export async function listReportsForAdmin() {
  return prisma.report.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      product: { select: { id: true, appNumber: true, title: true, status: true } },
    },
  });
}

export async function updateReportStatus(id: string, status: string) {
  return prisma.report.update({ where: { id }, data: { status } });
}

export async function countPendingReports() {
  return prisma.report.count({ where: { status: "pending" } });
}

export async function hasPurchased(userId: string, productId: string) {
  const row = await prisma.purchase.findUnique({
    where: { userId_productId: { userId, productId } },
  });
  return Boolean(row);
}

export async function recordPurchase(userId: string, productId: string) {
  return prisma.purchase.upsert({
    where: { userId_productId: { userId, productId } },
    create: { userId, productId },
    update: {},
  });
}

export async function listPurchasesForUser(userId: string) {
  return prisma.purchase.findMany({
    where: { userId },
    include: {
      product: {
        select: {
          id: true,
          title: true,
          category: true,
          isPlaygroundApp: true,
          price: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getPlaygroundDraft(userId: string) {
  return prisma.playgroundDraft.findUnique({ where: { userId } });
}

export async function savePlaygroundDraft(
  userId: string,
  codes: { htmlCode?: string; cssCode?: string; jsCode?: string }
) {
  return prisma.playgroundDraft.upsert({
    where: { userId },
    create: {
      userId,
      htmlCode: codes.htmlCode ?? "",
      cssCode: codes.cssCode ?? "",
      jsCode: codes.jsCode ?? "",
    },
    update: {
      htmlCode: codes.htmlCode,
      cssCode: codes.cssCode,
      jsCode: codes.jsCode,
    },
  });
}

export async function storeVerificationCode(input: {
  email: string;
  name: string;
  passwordHash: string;
  code: string;
  expiresAt: Date;
}) {
  await prisma.verificationCode.deleteMany({
    where: { email: input.email.toLowerCase() },
  });
  return prisma.verificationCode.create({
    data: {
      email: input.email.toLowerCase(),
      name: input.name,
      passwordHash: input.passwordHash,
      code: input.code,
      expiresAt: input.expiresAt,
    },
  });
}

export async function consumeVerificationCode(email: string, code: string) {
  const row = await prisma.verificationCode.findFirst({
    where: { email: email.toLowerCase(), code },
    orderBy: { createdAt: "desc" },
  });
  if (!row || row.expiresAt < new Date()) return null;
  await prisma.verificationCode.delete({ where: { id: row.id } });
  return row;
}

export async function storePasswordResetToken(email: string, token: string, expiresAt: Date) {
  await prisma.passwordResetToken.deleteMany({ where: { email: email.toLowerCase() } });
  return prisma.passwordResetToken.create({
    data: { email: email.toLowerCase(), token, expiresAt },
  });
}

export async function consumePasswordResetToken(token: string) {
  const row = await prisma.passwordResetToken.findUnique({ where: { token } });
  if (!row || row.expiresAt < new Date()) return null;
  await prisma.passwordResetToken.delete({ where: { id: row.id } });
  return row;
}

export async function updateUserPassword(email: string, passwordHash: string) {
  return prisma.user.update({
    where: { email: email.toLowerCase() },
    data: { passwordHash },
  });
}
