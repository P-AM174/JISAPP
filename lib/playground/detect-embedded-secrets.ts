export type EmbeddedSecretFinding = {
  label: string;
  /** 英語表示用 */
  labelEn: string;
};

const PATTERNS: { label: string; labelEn: string; regex: RegExp }[] = [
  { label: "OpenAI 形式のキー（sk-...）", labelEn: "OpenAI-style key (sk-...)", regex: /sk-[a-zA-Z0-9_-]{20,}/ },
  { label: "Groq 形式のキー（gsk_...）", labelEn: "Groq-style key (gsk_...)", regex: /gsk_[a-zA-Z0-9_-]{20,}/ },
  { label: "Google API キー（AIza...）", labelEn: "Google API key (AIza...)", regex: /AIza[0-9A-Za-z_-]{30,}/ },
  {
    label: "apiKey / API_KEY の直書き",
    labelEn: "apiKey / API_KEY written in the code",
    regex: /(?:api[_-]?key|API[_-]?KEY)\s*[:=]\s*['"][^'"]{8,}['"]/i,
  },
  {
    label: "Authorization ヘッダーの直書き",
    labelEn: "Authorization header written in the code",
    regex: /Authorization\s*[:=]\s*['"]\s*Bearer\s+[a-zA-Z0-9._-]{20,}/i,
  },
  {
    label: "x-api-key ヘッダーの直書き",
    labelEn: "x-api-key header written in the code",
    regex: /x-api-key\s*[:=]\s*['"][^'"]{8,}['"]/i,
  },
];

/** 公開コードに API キー等が埋め込まれていないか簡易検知 */
export function detectEmbeddedSecrets(source: string): EmbeddedSecretFinding[] {
  if (!source.trim()) return [];

  const found: EmbeddedSecretFinding[] = [];
  const seen = new Set<string>();

  for (const { label, labelEn, regex } of PATTERNS) {
    if (regex.test(source) && !seen.has(label)) {
      seen.add(label);
      found.push({ label, labelEn });
    }
  }

  return found;
}

export function hasEmbeddedSecrets(source: string): boolean {
  return detectEmbeddedSecrets(source).length > 0;
}
