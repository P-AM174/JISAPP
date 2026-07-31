export type EmbeddedSecretFinding = {
  label: string;
};

const PATTERNS: { label: string; regex: RegExp }[] = [
  { label: "OpenAI 形式のキー（sk-...）", regex: /sk-[a-zA-Z0-9_-]{20,}/ },
  { label: "Groq 形式のキー（gsk_...）", regex: /gsk_[a-zA-Z0-9_-]{20,}/ },
  { label: "Google API キー（AIza...）", regex: /AIza[0-9A-Za-z_-]{30,}/ },
  {
    label: "apiKey / API_KEY の直書き",
    regex: /(?:api[_-]?key|API[_-]?KEY)\s*[:=]\s*['"][^'"]{8,}['"]/i,
  },
  {
    label: "Authorization ヘッダーの直書き",
    regex: /Authorization\s*[:=]\s*['"]\s*Bearer\s+[a-zA-Z0-9._-]{20,}/i,
  },
  {
    label: "x-api-key ヘッダーの直書き",
    regex: /x-api-key\s*[:=]\s*['"][^'"]{8,}['"]/i,
  },
];

/** 公開コードに API キー等が埋め込まれていないか簡易検知 */
export function detectEmbeddedSecrets(source: string): EmbeddedSecretFinding[] {
  if (!source.trim()) return [];

  const found: EmbeddedSecretFinding[] = [];
  const seen = new Set<string>();

  for (const { label, regex } of PATTERNS) {
    if (regex.test(source) && !seen.has(label)) {
      seen.add(label);
      found.push({ label });
    }
  }

  return found;
}

export function hasEmbeddedSecrets(source: string): boolean {
  return detectEmbeddedSecrets(source).length > 0;
}
