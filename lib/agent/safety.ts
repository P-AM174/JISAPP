import { detectEmbeddedSecrets } from "@/lib/playground/detect-embedded-secrets";
import {
  CLAUDE_HAIKU_MODEL,
  callClaude,
  extractJsonObject,
} from "@/lib/agent/claude";
import { AGENT_PROMPTS } from "@/lib/agent/prompts";

export type SafetyCheckResult = {
  ok: boolean;
  reasons: string[];
};

const BANNED = [
  /ポケモン|ピカチュウ|マリオ|ディズニー|ドラえもん|鬼滅|ワンピース/i,
  /ノーコード/,
  /kill yourself|自殺/,
];

export async function runSafetyCheck(text: string): Promise<SafetyCheckResult> {
  const reasons: string[] = [];

  for (const re of BANNED) {
    if (re.test(text)) {
      reasons.push(`禁止パターンに一致: ${re.source}`);
    }
  }

  const secrets = detectEmbeddedSecrets(text);
  for (const s of secrets) {
    reasons.push(s.label);
  }

  if (Buffer.byteLength(text, "utf8") > 512 * 1024) {
    reasons.push("サイズが512KBを超えています");
  }

  try {
    const raw = await callClaude({
      model: CLAUDE_HAIKU_MODEL,
      system: AGENT_PROMPTS.safetySystem,
      user: text.slice(0, 12000),
      maxTokens: 400,
      temperature: 0,
    });
    const parsed = extractJsonObject<{ unsafe?: boolean; reasons?: string[] }>(raw);
    if (parsed.unsafe) {
      reasons.push(...(parsed.reasons ?? ["モデル判定で公開不可"]));
    }
  } catch (error) {
    reasons.push(
      `自動判定に失敗したため人手確認が必要: ${error instanceof Error ? error.message : "unknown"}`
    );
  }

  const unique = [...new Set(reasons.filter(Boolean))];
  return { ok: unique.length === 0, reasons: unique };
}
