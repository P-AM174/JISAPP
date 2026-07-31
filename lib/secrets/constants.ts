export const SECRET_NAME_PATTERN = /^[A-Z][A-Z0-9_]{0,31}$/;

export type AttachType = "header" | "query";

export type SecretMeta = {
  name: string;
  header_name: string;
  prefix: string;
  attach_type: AttachType;
  param_name: string | null;
  has_value: boolean;
  updated_at: string;
};

export function validateSecretName(name: string): string | null {
  const trimmed = name.trim();
  if (!SECRET_NAME_PATTERN.test(trimmed)) {
    return "名前は大文字英字で始まり、大文字・数字・アンダースコアのみ（32文字以内）";
  }
  return null;
}
