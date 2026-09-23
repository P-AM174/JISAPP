export const CLAUDE_HAIKU_MODEL =
  process.env.ANTHROPIC_HAIKU_MODEL ?? "claude-haiku-4-5";
export const CLAUDE_SONNET_MODEL =
  process.env.ANTHROPIC_SONNET_MODEL ?? "claude-sonnet-4-5";

const ANTHROPIC_URL = "https://api.anthropic.com/v1/messages";

export class ClaudeError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ClaudeError";
  }
}

export async function callClaude(options: {
  model: string;
  system: string;
  user: string;
  maxTokens?: number;
  temperature?: number;
}): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new ClaudeError("ANTHROPIC_API_KEY が設定されていません");
  }

  const res = await fetch(ANTHROPIC_URL, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: options.model,
      max_tokens: options.maxTokens ?? 2048,
      temperature: options.temperature ?? 0.4,
      system: options.system,
      messages: [{ role: "user", content: options.user }],
    }),
  });

  const json = (await res.json()) as {
    error?: { message?: string };
    content?: { type: string; text?: string }[];
  };

  if (!res.ok) {
    throw new ClaudeError(json.error?.message ?? `Claude API error (${res.status})`);
  }

  const text = json.content
    ?.filter((block) => block.type === "text")
    .map((block) => block.text ?? "")
    .join("\n")
    .trim();

  if (!text) {
    throw new ClaudeError("Claude から本文が返りませんでした");
  }

  return text;
}

export function extractJsonObject<T>(raw: string): T {
  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = (fenced?.[1] ?? raw).trim();
  const start = candidate.indexOf("{");
  const end = candidate.lastIndexOf("}");
  if (start < 0 || end <= start) {
    throw new ClaudeError("JSON を取り出せませんでした");
  }
  return JSON.parse(candidate.slice(start, end + 1)) as T;
}

export function extractHtmlDocument(raw: string): string {
  const fenced = raw.match(/```(?:html)?\s*([\s\S]*?)```/i);
  const candidate = (fenced?.[1] ?? raw).trim();
  const start = candidate.search(/<!DOCTYPE html>|<html[\s>]/i);
  if (start < 0) {
    throw new ClaudeError("HTML を取り出せませんでした");
  }
  return candidate.slice(start).trim();
}
