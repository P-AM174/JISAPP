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
  note?: string;
  safety_flags: string[];
  quality_flags: string[];
};

const BANNED = [
  /ポケモン|ピカチュウ|マリオ|ディズニー|ドラえもん|鬼滅|ワンピース/i,
  /ノーコード/,
  /kill yourself|自殺/,
];

export async function runSafetyCheck(
  text: string,
  extra?: string
): Promise<SafetyCheckResult> {
  const safety_flags: string[] = [];
  const quality_flags: string[] = [];

  for (const re of BANNED) {
    if (re.test(text)) {
      safety_flags.push(`禁止パターンに一致: ${re.source}`);
    }
  }

  const secrets = detectEmbeddedSecrets(text);
  for (const s of secrets) {
    safety_flags.push(s.label);
  }

  if (Buffer.byteLength(text, "utf8") > 512 * 1024) {
    quality_flags.push("サイズが512KBを超えています");
  }

  let note = "特に問題なし";
  try {
    const raw = await callClaude({
      model: CLAUDE_HAIKU_MODEL,
      system: AGENT_PROMPTS.safetySystem,
      user: `${extra ? `${extra}\n\n` : ""}${text.slice(0, 12000)}`,
      maxTokens: 500,
      temperature: 0,
    });
    const parsed = extractJsonObject<{
      safety_flags?: string[];
      quality_flags?: string[];
      note?: string;
      unsafe?: boolean;
      reasons?: string[];
    }>(raw);
    if (parsed.safety_flags) safety_flags.push(...parsed.safety_flags);
    if (parsed.quality_flags) quality_flags.push(...parsed.quality_flags);
    if (parsed.unsafe && parsed.reasons) safety_flags.push(...parsed.reasons);
    if (parsed.note?.trim()) note = parsed.note.trim();
  } catch (error) {
    quality_flags.push(
      `自動判定に失敗したため人手確認が必要: ${error instanceof Error ? error.message : "unknown"}`
    );
  }

  const uniqueSafety = [...new Set(safety_flags.filter(Boolean))];
  const uniqueQuality = [...new Set(quality_flags.filter(Boolean))];
  const reasons = [...uniqueSafety, ...uniqueQuality];
  return {
    ok: reasons.length === 0,
    reasons,
    note,
    safety_flags: uniqueSafety,
    quality_flags: uniqueQuality,
  };
}
