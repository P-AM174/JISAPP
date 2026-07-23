import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

if (!supabaseUrl || !supabaseAnonKey) {
  // サーバー起動時にのみ警告（モジュールレベルの throw は避ける）
  if (typeof window === "undefined") {
    console.warn(
      "[supabase] NEXT_PUBLIC_SUPABASE_URL と NEXT_PUBLIC_SUPABASE_ANON_KEY を .env.local に設定してください"
    );
  }
}

export const supabase = createClient(
  supabaseUrl || "https://placeholder.supabase.co",
  supabaseAnonKey || "placeholder-anon-key"
);

// ─── apps テーブルの型定義 ───────────────────────────────
export type AppRow = {
  id: string;
  title: string;
  description: string | null;
  html_code: string | null;
  css_code: string | null;
  js_code: string | null;
  is_playground_app: boolean;
  creator_name: string | null;
  creator_id?: string | null;
  category: string | null;
  /** true = トップ一覧に掲載、false = URLのみ（非公開） */
  is_listed: boolean;
  /** true = マイライブラリ登録者のみソースコード閲覧可 */
  code_public: boolean;
  status: string;
  created_at: string;
};

// カテゴリ定数は lib/categories.ts に分離済み。後方互換のため re-export する
export type { Category } from "@/lib/categories";
export { CATEGORIES, CATEGORY_MAP, APP_CATEGORIES } from "@/lib/categories";
