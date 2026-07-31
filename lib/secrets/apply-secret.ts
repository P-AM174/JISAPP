import type { AttachType } from "@/lib/secrets/constants";

export type SecretConfig = {
  value: string;
  header_name: string;
  prefix: string;
  attach_type: AttachType;
  param_name: string | null;
};

export function applySecretToRequest(
  url: string,
  headers: Record<string, string>,
  config: SecretConfig
): { url: string; headers: Record<string, string> } {
  const nextHeaders = { ...headers };

  if (config.attach_type === "query") {
    const param = config.param_name?.trim() || "api_key";
    const parsed = new URL(url);
    parsed.searchParams.set(param, config.value);
    return { url: parsed.toString(), headers: nextHeaders };
  }

  const headerName = config.header_name?.trim() || "Authorization";
  const prefix = config.prefix ?? "";
  nextHeaders[headerName] = `${prefix}${config.value}`;
  return { url, headers: nextHeaders };
}
