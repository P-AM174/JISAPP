import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/api-auth";
import { getProductById, hasPurchased } from "@/lib/services/store";
import { canAccessProductCode } from "@/lib/product-access";
import { buildSrcDoc } from "@/lib/products/build-srcdoc";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const { id } = await context.params;
  const product = await getProductById(id);
  if (!product) {
    return NextResponse.json({ error: "商品が見つかりません" }, { status: 404 });
  }

  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "ログインが必要です" }, { status: 401 });
  }

  const isPurchased = await hasPurchased(userId, id);
  if (!canAccessProductCode(product, userId, isPurchased)) {
    return NextResponse.json(
      { error: "このアプリを実行する権限がありません" },
      { status: 403 }
    );
  }

  const srcDoc = buildSrcDoc(
    product.htmlCode ?? "",
    product.cssCode,
    product.jsCode
  );

  if (!srcDoc.trim()) {
    return NextResponse.json(
      { error: "実行可能なコードが登録されていません" },
      { status: 404 }
    );
  }

  return NextResponse.json({
    id: product.id,
    title: product.title,
    isPlaygroundApp: product.isPlaygroundApp,
    html_code: product.htmlCode,
    css_code: product.cssCode,
    js_code: product.jsCode,
    srcDoc,
  });
}
