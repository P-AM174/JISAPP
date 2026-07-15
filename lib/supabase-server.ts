import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";

/**
 * サービスロールキーを使うサーバー専用クライアント。
 * RLS をバイパスするため API Routes (server-side) からのみ使用すること。
 * クライアントコンポーネントからは絶対にインポートしないこと。
 */
export function createServerSupabaseClient() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
  if (!serviceRoleKey) {
    console.warn("[supabase-server] SUPABASE_SERVICE_ROLE_KEY が設定されていません。anon キーにフォールバックします。");
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
    return createClient(supabaseUrl, anonKey);
  }
  return createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  });
}
