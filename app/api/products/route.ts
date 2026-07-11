import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/api-auth";
import {
  listActiveProducts,
  createProduct,
  getProductById,
  hasPurchased,
} from "@/lib/services/store";
import { canAccessProductCode, toPublicProduct } from "@/lib/product-access";
import type { ProductType } from "@/lib/products/types";

export async function GET(request: Request) {
  // DATABASE_URL 未設定時は Prisma を呼ばず即リターン
  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ products: [] });
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  const userId = await getSessionUserId();

  if (id) {
    try {
      const product = await getProductById(id);
      if (!product) {
        return NextResponse.json({ error: "商品が見つかりません" }, { status: 404 });
      }
      const purchased = userId ? await hasPurchased(userId, id) : false;
      const includeCode = canAccessProductCode(product, userId, purchased);
      return NextResponse.json({
        product: {
          ...toPublicProduct(product, includeCode),
          creator: product.creator,
        },
        access: {
          isOwner: userId === product.creatorId,
          isPurchased: purchased,
          canAccessCode: includeCode,
        },
      });
    } catch {
      return NextResponse.json({ error: "商品が見つかりません" }, { status: 404 });
    }
  }

  try {
    const products = await listActiveProducts();
    const catalog = await Promise.all(
      products.map(async (p) => {
        const purchased = userId ? await hasPurchased(userId, p.id) : false;
        return {
          ...toPublicProduct(p, canAccessProductCode(p, userId, purchased)),
          creator: p.creator,
        };
      })
    );
    return NextResponse.json({ products: catalog });
  } catch {
    return NextResponse.json({ products: [] });
  }
}

export async function POST(request: Request) {
  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ error: "データベースが設定されていません" }, { status: 503 });
  }
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "ログインが必要です" }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "不正なリクエストです" }, { status: 400 });
  }

  const title = String(body.title ?? body.name ?? "").trim();
  if (!title) {
    return NextResponse.json({ error: "タイトルは必須です" }, { status: 400 });
  }

  const product = await createProduct({
    title,
    description: typeof body.description === "string" ? body.description : "",
    price: typeof body.price === "number" ? body.price : 0,
    sourceUrl: typeof body.source_url === "string" ? body.source_url : null,
    productType: (body.product_type as ProductType) ?? "generic",
    listingType: (body.listing_type as string) ?? "file",
    category: typeof body.category === "string" ? body.category : "その他",
    status: "pending",
    htmlCode: typeof body.html_code === "string" ? body.html_code : null,
    cssCode: typeof body.css_code === "string" ? body.css_code : null,
    jsCode: typeof body.js_code === "string" ? body.js_code : null,
    isPlaygroundApp: Boolean(body.is_playground_app),
    gradient: typeof body.gradient === "string" ? body.gradient : undefined,
    tagColor: typeof body.tagColor === "string" ? body.tagColor : undefined,
    iconName: typeof body.iconName === "string" ? body.iconName : undefined,
    previewFiles: body.previewFiles,
    productFiles: body.productFiles,
    creatorId: userId,
  });

  return NextResponse.json(
    { product: toPublicProduct(product, true) },
    { status: 201 }
  );
}
