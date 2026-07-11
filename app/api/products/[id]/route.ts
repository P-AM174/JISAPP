import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/api-auth";
import { getProductById, hasPurchased } from "@/lib/services/store";
import { canAccessProductCode, toPublicProduct } from "@/lib/product-access";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const { id } = await context.params;
  const product = await getProductById(id);
  if (!product) {
    return NextResponse.json({ error: "商品が見つかりません" }, { status: 404 });
  }

  const userId = await getSessionUserId();
  const isPurchased = userId ? await hasPurchased(userId, id) : false;
  const includeCode = canAccessProductCode(product, userId, isPurchased);

  return NextResponse.json({
    product: {
      ...toPublicProduct(product, includeCode),
      creator: product.creator,
    },
    access: {
      isOwner: userId === product.creatorId,
      isPurchased,
      canAccessCode: includeCode,
    },
  });
}
