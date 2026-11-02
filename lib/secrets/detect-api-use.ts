/**
 * アプリのコードが、APIキーを使う外部API（AI・天気・地図など）を呼んでいるかを調べる。
 * 公開設定で「使われるたびに作った人のキーで呼ぶ＝料金がかかることがある」と注意するために使う
 */

/** キーを付けて呼ぶことの多い AI の送り先 */
const AI_API_HOSTS = [
  "api.openai.com",
  "generativelanguage.googleapis.com",
  "api.groq.com",
  "api.anthropic.com",
  "api.mistral.ai",
  "openrouter.ai",
];

export type ApiUse = {
  /** APIキーを使う外部APIを呼んでいそうか */
  usesApi: boolean;
  /** コードに書かれている secret 名（例: GEMINI） */
  secretNames: string[];
};

export function detectApiUse(code: string): ApiUse {
  if (!code) return { usesApi: false, secretNames: [] };
  const secretNames = [
    ...new Set([...code.matchAll(/secret\s*:\s*['"`]([A-Z][A-Z0-9_]{0,31})['"`]/g)].map((m) => m[1])),
  ];
  // secret: AI_SECRET のように変数で渡しているときも、キーを使っているとみなす
  const usesSecret = secretNames.length > 0 || /(?:Jisapp|Zisup)\.fetch\s*\([^)]*secret\s*:/.test(code);
  const lower = code.toLowerCase();
  const callsAi = AI_API_HOSTS.some((host) => lower.includes(host));
  return { usesApi: usesSecret || callsAi, secretNames };
}
