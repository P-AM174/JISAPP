import { prisma } from "@/lib/db";
import type { ProductType } from "@/lib/products/types";

export async function findUserByEmail(email: string) {
  return prisma.user.findUnique({ where: { email: email.toLowerCase() } });
}

export async function upsertOAuthUser(input: {
  email: string;
  name?: string | null;
  image?: string | null;
}) {
  return prisma.user.upsert({
    where: { email: input.email.toLowerCase() },
    create: {
      email: input.email.toLowerCase(),
      name: input.name ?? null,
      image: input.image ?? null,
    },
    update: {
      name: input.name ?? undefined,
      image: input.image ?? undefined,
    },
  });
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
