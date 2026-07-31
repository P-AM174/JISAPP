import { createServerSupabaseClient } from "@/lib/supabase-server";
import { decryptSecret, encryptSecret } from "@/lib/secrets/crypto";
import type { AttachType, SecretMeta } from "@/lib/secrets/constants";
import { USER_AI_SECRET_NAME } from "@/lib/secrets/constants";

type Supabase = ReturnType<typeof createServerSupabaseClient>;

type UserSecretRow = {
  name: string;
  value_encrypted: string;
  purpose: string;
  header_name: string;
  prefix: string;
  attach_type: AttachType;
  param_name: string | null;
  updated_at: string;
};

function toMeta(row: {
  name: string;
  header_name: string;
  prefix: string;
  attach_type: AttachType;
  param_name: string | null;
  updated_at: string;
}): SecretMeta {
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

export async function listUserSecrets(userId: string): Promise<SecretMeta[]> {
  const supabase = createServerSupabaseClient();
  const { data } = await supabase
    .from("user_secrets")
    .select("name, header_name, prefix, attach_type, param_name, updated_at")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false });

  return (data ?? []).map((row) =>
    toMeta({
      name: row.name,
      header_name: row.header_name,
      prefix: row.prefix,
      attach_type: row.attach_type as AttachType,
      param_name: row.param_name,
      updated_at: row.updated_at,
    })
  );
}

export async function getUserSecretValue(
  userId: string,
  name: string
): Promise<string | null> {
  const supabase = createServerSupabaseClient();
  const { data } = await supabase
    .from("user_secrets")
    .select("value_encrypted")
    .eq("user_id", userId)
    .eq("name", name)
    .maybeSingle();

  if (!data?.value_encrypted) return null;
  return decryptSecret(data.value_encrypted);
}

export async function upsertUserSecret(params: {
  userId: string;
  name: string;
  value: string;
  purpose?: string;
  header_name?: string;
  prefix?: string;
  attach_type?: AttachType;
  param_name?: string | null;
}): Promise<void> {
  const supabase = createServerSupabaseClient();
  await supabase.from("user_secrets").upsert(
    {
      user_id: params.userId,
      name: params.name,
      value_encrypted: encryptSecret(params.value),
      purpose: params.purpose ?? "general",
      header_name: params.header_name ?? "Authorization",
      prefix: params.prefix ?? "Bearer ",
      attach_type: params.attach_type ?? "header",
      param_name: params.param_name ?? null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id,name" }
  );
}

export async function deleteUserSecret(userId: string, name: string): Promise<void> {
  const supabase = createServerSupabaseClient();
  await supabase.from("user_secrets").delete().eq("user_id", userId).eq("name", name);
}

export async function hasUserAiSecret(userId: string): Promise<boolean> {
  const value = await getUserSecretValue(userId, USER_AI_SECRET_NAME);
  return !!value?.trim();
}

export async function getUserAiSecret(userId: string): Promise<string | null> {
  return getUserSecretValue(userId, USER_AI_SECRET_NAME);
}

export async function saveUserAiSecret(userId: string, apiKey: string): Promise<void> {
  await upsertUserSecret({
    userId,
    name: USER_AI_SECRET_NAME,
    value: apiKey.trim(),
    purpose: "ai",
    header_name: "Authorization",
    prefix: "Bearer ",
    attach_type: "header",
  });
}

export async function deleteUserAiSecret(userId: string): Promise<void> {
  await deleteUserSecret(userId, USER_AI_SECRET_NAME);
}

export async function userHasAiSecret(userId: string): Promise<boolean> {
  const supabase = createServerSupabaseClient();
  const { data } = await supabase
    .from("user_secrets")
    .select("name")
    .eq("user_id", userId)
    .eq("name", USER_AI_SECRET_NAME)
    .maybeSingle();
  return !!data;
}
