import { createServerSupabaseClient } from "@/lib/supabase-server";
import { decryptSecret, encryptSecret } from "@/lib/secrets/crypto";
import type { AttachType, SecretMeta } from "@/lib/secrets/constants";
import type { SecretConfig } from "@/lib/secrets/apply-secret";

type AppSecretRow = {
  name: string;
  value_encrypted: string;
  header_name: string;
  prefix: string;
  attach_type: AttachType;
  param_name: string | null;
  updated_at: string;
};

function toMeta(row: AppSecretRow): SecretMeta {
  return {
    name: row.name,
    header_name: row.header_name,
    prefix: row.prefix,
    attach_type: row.attach_type,
    param_name: row.param_name,
    has_value: true,
    updated_at: row.updated_at,
  };
}

export async function listAppSecrets(appId: string): Promise<SecretMeta[]> {
  const supabase = createServerSupabaseClient();
  const { data } = await supabase
    .from("app_secrets")
    .select("name, header_name, prefix, attach_type, param_name, updated_at")
    .eq("app_id", appId)
    .order("updated_at", { ascending: false });

  return (data ?? []).map((row) => toMeta(row as AppSecretRow));
}

export async function getAppSecretConfig(
  appId: string,
  name: string
): Promise<SecretConfig | null> {
  const supabase = createServerSupabaseClient();
  const { data } = await supabase
    .from("app_secrets")
    .select("value_encrypted, header_name, prefix, attach_type, param_name")
    .eq("app_id", appId)
    .eq("name", name)
    .maybeSingle();

  if (!data) return null;

  return {
    value: decryptSecret(data.value_encrypted),
    header_name: data.header_name,
    prefix: data.prefix,
    attach_type: data.attach_type as AttachType,
    param_name: data.param_name,
  };
}

export async function upsertAppSecret(params: {
  userId: string;
  appId: string;
  name: string;
  value: string;
  header_name?: string;
  prefix?: string;
  attach_type?: AttachType;
  param_name?: string | null;
}): Promise<void> {
  const supabase = createServerSupabaseClient();
  await supabase.from("app_secrets").upsert(
    {
      app_id: params.appId,
      user_id: params.userId,
      name: params.name,
      value_encrypted: encryptSecret(params.value),
      header_name: params.header_name ?? "Authorization",
      prefix: params.prefix ?? "Bearer ",
      attach_type: params.attach_type ?? "header",
      param_name: params.param_name ?? null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "app_id,name" }
  );
}

export async function deleteAppSecret(appId: string, name: string): Promise<void> {
  const supabase = createServerSupabaseClient();
  await supabase.from("app_secrets").delete().eq("app_id", appId).eq("name", name);
}

export async function appExistsForSecrets(appId: string): Promise<boolean> {
  const supabase = createServerSupabaseClient();
  const { data } = await supabase
    .from("apps")
    .select("id, admin_deleted")
    .eq("id", appId)
    .maybeSingle();
  return !!data && !data.admin_deleted;
}
