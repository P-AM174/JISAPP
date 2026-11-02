import type { Locale } from "@/lib/i18n/config";
import { getPromptRulesShort } from "@/lib/playground/prompt-template";
import type { ApiSetupCheck } from "@/lib/secrets/detect-api-use";

/**
 * 外部APIがジサップの仕組み（window.Jisapp.fetch の secret）につながっていないとき、
 * AI に貼ってコードを直してもらう文。今のコードを末尾に付ける
 */
export function buildApiFixMessage(code: string, check: ApiSetupCheck, registeredNames: string[], locale: Locale = "ja"): string {
  const names = registeredNames.length > 0 ? registeredNames : check.missing;
  const current = code.trim();

  if (locale === "ja") {
    const lines = [
      "次のジサップのアプリで、外部APIがつながっていません。今の機能と見た目はそのままで直して、完成した index.html を最初から最後まで省略せずに出してください。",
      "",
      "【直してほしいこと】",
      "・APIキーが必要な外部APIは、必ず window.Jisapp.fetch(url, { method, headers, body, secret: '名前' }) で呼んでください（戻り値は { ok, status, body }）。",
      "・APIキーの値はコードに書かないでください。URL に ?key= などでキーを付けないでください（ジサップが secret の名前で登録されたキーを付けます）。",
    ];
    if (names.length > 0) {
      lines.push(`・APIキーは、ジサップに「${names.join("」「")}」という名前で登録してあります。secret にはこの名前をそのまま使ってください。`);
    }
    lines.push(
      "・送り先の URL は、コードの中にそのまま文字で書いてください。",
      "・つながらないときは、黙って止まらず、理由と直し方を画面に出してください。決まった返事を本物の答えのように見せないでください。",
      "",
      getPromptRulesShort("ja"),
      "",
      "【今のコード】",
      current || "（ここに今のコードを貼り付けてください）"
    );
    return lines.join("\n");
  }

  const lines = [
    "In the Jisapp app below, the external API isn't connected. Keep the current features and look, fix it, and output the complete index.html from start to finish without leaving anything out.",
    "",
    "[What to fix]",
    "- Always call external APIs that need a key with window.Jisapp.fetch(url, { method, headers, body, secret: 'NAME' }) (it returns { ok, status, body }).",
    "- Don't write the API key's value in the code. Don't add the key to the URL with ?key= etc. (Jisapp attaches the key registered under the secret name).",
  ];
  if (names.length > 0) {
    lines.push(`- The API key is registered on Jisapp under the name ${names.map((n) => `"${n}"`).join(", ")}. Use exactly this name for secret.`);
  }
  lines.push(
    "- Write the destination URL as plain text in the code.",
    "- When it can't connect, don't fail silently: show the reason and how to fix it on screen. Don't show fixed replies as if they were real answers.",
    "",
    getPromptRulesShort(locale),
    "",
    "[Current code]",
    current || "(Paste your app's current code here)"
  );
  return lines.join("\n");
}
