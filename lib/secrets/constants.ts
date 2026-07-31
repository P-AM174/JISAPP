/** 開発スタジオ AI 用（ユーザー単位） */
export const USER_AI_SECRET_NAME = "AI_API_KEY";

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

export function detectAiProvider(apiKey: string): "groq" | "openai" | null {
  const key = apiKey.trim();
  if (key.startsWith("gsk_")) return "groq";
  if (key.startsWith("sk-")) return "openai";
  return null;
}
