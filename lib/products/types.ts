/**
 * Products（出品物）テーブル — DB スキーマ定義
 *
 * ```sql
 * CREATE TABLE products (
 *   id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 *   title         VARCHAR(255) NOT NULL,
 *   description   TEXT,
 *   price         INTEGER NOT NULL DEFAULT 0,
 *   source_url    TEXT,
 *   product_type  VARCHAR(20) NOT NULL DEFAULT 'generic'
 *                 CHECK (product_type IN ('google', 'notion', 'replit', 'generic')),
 *   -- 既存フィールド（ファイル出品・マーケット表示用）
 *   listing_type  VARCHAR(10) DEFAULT 'file',  -- 'file' | 'url'
 *   category      VARCHAR(100),
 *   creator_id    UUID REFERENCES users(id),
 *   status        VARCHAR(20) DEFAULT 'active',
 *   -- プレイグラウンド発アプリ（パターンA）
 *   html_code     TEXT,
 *   css_code      TEXT,
 *   js_code       TEXT,
 *   is_playground_app BOOLEAN DEFAULT FALSE,
 *   created_at    TIMESTAMPTZ DEFAULT NOW()
 * );
 * ```
 */

export type ProductType = "google" | "notion" | "replit" | "generic";

export type Product = {
  id: number | string;
  /** アプリ名 */
  title: string;
  description?: string;
  /** 販売価格（円）。0 = 無料 */
  price: number;
  /** 出品者が提出する共有用 URL（Google は /copy 変換済み） */
  source_url: string | null;
  /** 判別されたツール種別 */
  product_type: ProductType;
  /** 出品形式: コードファイル or 外部 URL */
  listing_type?: "file" | "url";
  /** 後方互換 */
  name?: string;
  url?: string | null;
  priceNum?: number;
  type?: "file" | "url";
  category?: string;
  creator?: string;
  gradient?: string;
  tagColor?: string;
  iconName?: string;
  status?: string;
  /** プレイグラウンドで作成した HTML */
  html_code?: string | null;
  /** プレイグラウンドで作成した CSS */
  css_code?: string | null;
  /** プレイグラウンドで作成した JavaScript */
  js_code?: string | null;
  /** プレイグラウンド発アプリかどうか */
  is_playground_app?: boolean;
  previewFiles?: Array<{ name: string; content: string }>;
  productFiles?: Array<{ name: string; content: string }>;
};

export const PRODUCT_TYPE_LABELS: Record<ProductType, string> = {
  google: "Google（スプレッドシート / GAS / ドキュメント）",
  notion: "Notion テンプレート",
  replit: "Replit プロジェクト",
  generic: "その他のリンク",
};
