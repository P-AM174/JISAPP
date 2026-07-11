import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/api-auth";
import { listProductsByCreator } from "@/lib/services/store";
import { toPublicProduct, canAccessProductCode } from "@/lib/product-access";

export async function GET() {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "ログインが必要です" }, { status: 401 });
  }

  const products = await listProductsByCreator(userId);
  return NextResponse.json({
    products: products.map((p) => toPublicProduct(p, canAccessProductCode(p, userId, true))),
  });
}
