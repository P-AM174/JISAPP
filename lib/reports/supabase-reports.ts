import { createServerSupabaseClient } from "@/lib/supabase-server";

export type SupabaseReportRow = {
  id: string;
  app_id: string;
  reporter_id: string | null;
  reason: string;
  detail: string;
  status: string;
  created_at: string;
};

export async function createSupabaseAppReport(input: {
  appId: string;
  reporterId?: string;
  reason: string;
  detail: string;
}) {
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from("app_reports")
    .insert({
      app_id: input.appId,
      reporter_id: input.reporterId ?? null,
      reason: input.reason,
      detail: input.detail,
      status: "pending",
    })
    .select("id")
    .single();

  if (error) throw error;
  return data;
}

export async function listSupabaseReportsForAdmin() {
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from("app_reports")
    .select("id, app_id, reporter_id, reason, detail, status, created_at")
    .order("created_at", { ascending: false })
    .limit(200);

  if (error || !data?.length) return [];

  const appIds = [...new Set(data.map((r) => r.app_id as string))];
  const { data: apps } = await supabase
    .from("apps")
    .select("id, title, status, app_number")
    .in("id", appIds);

  const appMap = new Map(
    (apps ?? []).map((a) => [
      a.id as string,
      {
        id: a.id as string,
        title: a.title as string,
        status: a.status as string,
        appNumber: (a.app_number as number | null) ?? 0,
      },
    ])
  );

  return data.map((r) => {
    const app = appMap.get(r.app_id as string);
    return {
      id: r.id as string,
      productId: r.app_id as string,
      reporterId: (r.reporter_id as string | null) ?? null,
      reason: r.reason as string,
      detail: r.detail as string,
      status: r.status as string,
      createdAt: (r.created_at as string).slice(0, 10),
      source: "supabase" as const,
      product: {
        id: r.app_id as string,
        appNumber: app?.appNumber ?? 0,
        title: app?.title ?? "（削除済みアプリ）",
        status: app?.status ?? "unknown",
      },
    };
  });
}

export async function countPendingSupabaseReports() {
  const supabase = createServerSupabaseClient();
  const { count, error } = await supabase
    .from("app_reports")
    .select("id", { count: "exact", head: true })
    .eq("status", "pending");

  if (error) return 0;
  return count ?? 0;
}

export async function updateSupabaseReportStatus(id: string, status: string) {
  const supabase = createServerSupabaseClient();
  const { error } = await supabase.from("app_reports").update({ status }).eq("id", id);
  if (error) throw error;
}

function isUUID(id: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
}

export function isSupabaseReportId(id: string) {
  return isUUID(id);
}
