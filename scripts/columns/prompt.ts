// 記事に入れる「ジサップのオリジナルプロンプト」を作る。開発スタジオと同じ組み立て方（デザイン付き・グループ共有・保存は既定の「この端末だけ」）
// 使い方: node --experimental-strip-types scripts/columns/prompt.ts <アプリ名> <機能の箇条書きのファイル> <書き出し先> [ja|en]
// prompt-template.ts は @/ の読み込みがあるので、一時フォルダに写して読み込みを差しかえてから使う
import { readFileSync, writeFileSync, mkdtempSync, copyFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const [name, detailsPath, outPath, locale = "ja"] = process.argv.slice(2);
if (!name || !detailsPath || !outPath) {
  console.error("使い方: prompt.ts <アプリ名> <機能の箇条書きのファイル> <書き出し先> [ja|en]");
  process.exit(1);
}
const root = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const tmp = mkdtempSync(join(tmpdir(), "jisapp-prompt-"));
const src = readFileSync(join(root, "lib/playground/prompt-template.ts"), "utf8")
  .replace(/^import \{ pick, type Locale \} from "@\/lib\/i18n\/config";/m, 'const pick = (l: string, ja: any, en: any) => (l === "ja" ? ja : en); type Locale = "ja" | "en" | "vi";')
  .replace(/from "\.\/studio-guides"/g, 'from "./studio-guides.ts"');
writeFileSync(join(tmp, "prompt-template.ts"), src);
copyFileSync(join(root, "lib/playground/studio-guides.ts"), join(tmp, "studio-guides.ts"));
const { buildPromptFromTemplate } = await import(pathToFileURL(join(tmp, "prompt-template.ts")).href);

const details = readFileSync(detailsPath, "utf8").trim();
const prompt: string = buildPromptFromTemplate(name, details, { useJisappDesign: true, storage: "local", shared: true, locale });
// 記事の折りたたみ（:::prompt 〜 :::）が途中で閉じないように
if (/^:::/m.test(prompt)) throw new Error("プロンプトの中に ::: で始まる行があります");
writeFileSync(outPath, prompt);
console.log(`${prompt.length}字 → ${outPath}`);
