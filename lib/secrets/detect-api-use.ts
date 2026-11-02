/**
 * アプリのコードが、APIキーを使う外部API（AI・天気・地図など）を呼んでいるかを調べる。
 * 公開設定で「使われるたびに作った人のキーで呼ぶ＝料金がかかることがある」と注意するときや、
 * 登録したキーとコードの secret 名が合っているかを照らし合わせるときに使う
 */

/** キーを付けて呼ぶことの多い AI の送り先 */
export const AI_API_HOSTS = [
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

/** コードに書かれている secret 名（secret: 'GEMINI' の GEMINI） */
export function findSecretNames(code: string): string[] {
  return [...new Set([...code.matchAll(/secret\s*:\s*['"`]([A-Z][A-Z0-9_]{0,31})['"`]/g)].map((m) => m[1]))];
}

/** secret: AI_SECRET のように変数で渡しているときも、キーを使っているとみなす */
function usesSecretOption(code: string): boolean {
  return /(?:Jisapp|Zisup)\.fetch\s*\([^)]*secret\s*:/.test(code);
}

export function detectApiUse(code: string): ApiUse {
  if (!code) return { usesApi: false, secretNames: [] };
  const secretNames = findSecretNames(code);
  const usesSecret = secretNames.length > 0 || usesSecretOption(code);
  const lower = code.toLowerCase();
  const callsAi = AI_API_HOSTS.some((host) => lower.includes(host));
  return { usesApi: usesSecret || callsAi, secretNames };
}

export type ApiSetupCheck = {
  /** コードが使っているのに、まだ登録されていない secret 名 */
  missing: string[];
  /** 登録してあるのに、コードが使っていない secret 名 */
  unused: string[];
  /** AI の送り先を呼んでいるのに、secret を使っていない */
  aiWithoutSecret: boolean;
  /** URL に ?key= などを付けて、ジサップの仕組みを通さずに外部へ送っていそう */
  directKeyParam: boolean;
};

/** 登録したキーと、コードの secret 名・外部APIの呼び方を照らし合わせる */
export function checkApiSetup(code: string, registeredNames: string[]): ApiSetupCheck {
  const used = findSecretNames(code);
  const usesSecret = used.length > 0 || usesSecretOption(code);
  const lower = code.toLowerCase();
  return {
    missing: used.filter((n) => !registeredNames.includes(n)),
    // 変数で secret を渡しているときは、どの名前を使っているか分からないので「使っていない」とは言わない
    unused: used.length === 0 && usesSecret ? [] : registeredNames.filter((n) => !used.includes(n)),
    aiWithoutSecret: !usesSecret && AI_API_HOSTS.some((host) => lower.includes(host)),
    directKeyParam: /https:\/\/[^\s'"`]*[?&](?:key|appid|api_?key|apikey|access_key)=/i.test(code),
  };
}

export function hasApiSetupIssue(check: ApiSetupCheck): boolean {
  return check.missing.length > 0 || check.unused.length > 0 || check.aiWithoutSecret || check.directKeyParam;
}

/** コードの中の https の URL（文字列として書かれたもの） */
function findUrls(code: string): { url: string; index: number }[] {
  const out: { url: string; index: number }[] = [];
  for (const m of code.matchAll(/https:\/\/[^\s'"`<>()\\]+/g)) {
    // テンプレート文字列の ${...} から先は、実行するまで分からないので切る
    const url = m[0].split("${")[0];
    out.push({ url, index: m.index ?? 0 });
  }
  return out;
}

/** API 以外でよく出てくる送り先（フォント・画像・説明のリンクなど） */
const NON_API_HOSTS = [
  "fonts.googleapis.com",
  "fonts.gstatic.com",
  "www.w3.org",
  "aistudio.google.com",
  "platform.openai.com",
  "console.groq.com",
];

/**
 * secret 名に対応する送り先を、コードから探す。
 * secret: 'NAME' のすぐ前に書かれている URL を優先し、なければ API らしい URL が1つだけのときにそれを使う
 */
export function findSecretTargetUrl(code: string, name: string): string | null {
  const urls = findUrls(code).filter(({ url }) => {
    try {
      return !NON_API_HOSTS.includes(new URL(url).hostname.toLowerCase());
    } catch {
      return false;
    }
  });
  if (urls.length === 0) return null;

  const secretRe = new RegExp(`secret\\s*:\\s*['"\`]${name}['"\`]`, "g");
  for (const m of code.matchAll(secretRe)) {
    const before = urls.filter((u) => u.index < (m.index ?? 0));
    const nearest = before[before.length - 1];
    if (nearest && (m.index ?? 0) - nearest.index < 3000) return nearest.url;
  }

  const hosts = [...new Set(urls.map(({ url }) => new URL(url).hostname.toLowerCase()))];
  if (hosts.length === 1) return urls[0].url;
  const ai = urls.find(({ url }) => AI_API_HOSTS.includes(new URL(url).hostname.toLowerCase()));
  return ai?.url ?? null;
}
