#!/usr/bin/env node
/**
 * ベトナム語の辞書（lib/i18n/dictionaries/vi.json）の洗い出し。
 *
 * コードの t("日本語", "English") などを読み取り、辞書にない文・使われなくなった文・未確認の訳を一覧にする。
 *
 *   node scripts/i18n-extract.mjs                 … 件数の報告
 *   node scripts/i18n-extract.mjs --missing out.json   … 辞書にない文を書き出す（翻訳の作業用）
 *   node scripts/i18n-extract.mjs --merge in.json      … 訳を辞書に取り込む（{ "日本語": "ベトナム語" } の形。未確認として入る）
 *   node scripts/i18n-extract.mjs --unreviewed         … ネイティブ未確認の訳を一覧にする
 *   node scripts/i18n-extract.mjs --dynamic            … 変数入り・JSX入りで辞書を引けない t() の場所を一覧にする
 *   node scripts/i18n-extract.mjs --prune              … 使われなくなった文を辞書から消す
 *   node scripts/i18n-extract.mjs --check              … 辞書にない文があれば終了コード 1
 *
 * 読み取るもの
 *   - t("日本語", "English") / tx(...) / pick(locale, "日本語", "English")
 *   - 同じオブジェクトに X と XEn が並んだもの（{ label: "保存", labelEn: "Save" }）
 *   - サーバーのメッセージ（lib/i18n/api-messages.ts の apiMessagePairs()）
 * 運営画面（admin）・夏休み自由研究ガイドは日本語だけなので対象外。
 */
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const ts = require("typescript");

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DICT_PATH = path.join(ROOT, "lib/i18n/dictionaries/vi.json");
const SCAN_DIRS = ["app", "components", "lib"];
const SKIP = [
  /[\\/]admin[\\/]/,
  /[\\/]api[\\/]admin[\\/]/,
  /[\\/]guide[\\/]summer-research[\\/]/,
  /[\\/]lib[\\/]agent[\\/]/,
  // AI への指示文（ベトナム語でも英語の指示文を使う）
  /[\\/]lib[\\/]playground[\\/](prompt-template|code-cleanup)\.ts[\\/]$/,
  /[\\/]node_modules[\\/]/,
];
const CALLEES = new Set(["t", "tx", "tr"]);

function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (SKIP.some((re) => re.test(full + path.sep))) continue;
    if (entry.isDirectory()) walk(full, out);
    else if (/\.(ts|tsx)$/.test(entry.name) && !entry.name.endsWith(".d.ts")) out.push(full);
  }
  return out;
}

function literal(node) {
  if (!node) return null;
  if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) return node.text;
  if (ts.isParenthesizedExpression(node)) return literal(node.expression);
  // plural(locale, n, "{n} reply", "{n} replies") … 英語の参考には複数形を使う
  if (ts.isCallExpression(node) && ts.isIdentifier(node.expression) && node.expression.text === "plural") {
    return literal(node.arguments[3]);
  }
  return null;
}

function kindOf(node) {
  if (!node) return "none";
  if (ts.isTemplateExpression(node)) return "template";
  if (ts.isJsxElement(node) || ts.isJsxFragment(node) || ts.isJsxSelfClosingElement(node)) return "jsx";
  if (ts.isParenthesizedExpression(node)) return kindOf(node.expression);
  return "expr";
}

/** ja → { en, files:Set } */
const pairs = new Map();
const dynamic = [];

function add(ja, en, where) {
  if (!ja || ja === en) return;
  // 日本語を含まない文（記号・英語だけ）は訳す必要がない
  if (!/[぀-ヿ㐀-鿿！-｠]/.test(ja)) return;
  const cur = pairs.get(ja);
  if (cur) cur.files.add(where);
  else pairs.set(ja, { en, files: new Set([where]) });
}

for (const file of SCAN_DIRS.flatMap((d) => walk(path.join(ROOT, d)))) {
  const text = fs.readFileSync(file, "utf8");
  if (!/[぀-ヿ㐀-鿿]/.test(text)) continue;
  const rel = path.relative(ROOT, file).replace(/\\/g, "/");
  const sf = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true, file.endsWith(".tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS);
  const lineOf = (node) => sf.getLineAndCharacterOfPosition(node.getStart(sf)).line + 1;

  const visit = (node) => {
    if (ts.isCallExpression(node) && ts.isIdentifier(node.expression)) {
      const name = node.expression.text;
      let args = null;
      if (CALLEES.has(name) && node.arguments.length === 2) args = node.arguments;
      else if (name === "pick" && node.arguments.length >= 3) args = node.arguments.slice(1, 3);
      if (args) {
        const ja = literal(args[0]);
        const en = literal(args[1]);
        if (ja !== null && en !== null) add(ja, en, `${rel}:${lineOf(node)}`);
        else {
          const k = kindOf(args[0]);
          if ((k === "template" || k === "jsx") && /[぀-ヿ㐀-鿿]/.test(args[0].getText(sf))) {
            dynamic.push({ where: `${rel}:${lineOf(node)}`, kind: k, text: args[0].getText(sf).slice(0, 120) });
          }
        }
      }
    }
    if (ts.isObjectLiteralExpression(node)) {
      const props = new Map();
      for (const p of node.properties) {
        if (ts.isPropertyAssignment(p) && (ts.isIdentifier(p.name) || ts.isStringLiteral(p.name))) {
          props.set(p.name.text, p.initializer);
        }
      }
      for (const [key, value] of props) {
        if (!key.endsWith("En")) continue;
        const base = props.get(key.slice(0, -2));
        const ja = literal(base);
        const en = literal(value);
        if (ja !== null && en !== null) add(ja, en, `${rel}:${lineOf(node)}`);
        // 配列（QUESTIONS の選択肢など）
        if (base && value && ts.isArrayLiteralExpression(base) && ts.isArrayLiteralExpression(value)) {
          base.elements.forEach((el, i) => {
            const j = literal(el);
            const e = literal(value.elements[i]);
            if (j !== null && e !== null) add(j, e, `${rel}:${lineOf(el)}`);
          });
        }
      }
    }
    ts.forEachChild(node, visit);
  };
  visit(sf);

  // 同じ形の X と X_EN（または X_JA と X_EN）。同じ位置の文字列を組にする（pickDeep で使う）
  const consts = new Map();
  for (const st of sf.statements) {
    const decls = ts.isVariableStatement(st) ? st.declarationList.declarations : [];
    for (const d of decls) {
      if (!ts.isIdentifier(d.name) || !d.initializer) continue;
      let init = d.initializer;
      while (ts.isAsExpression(init) || ts.isSatisfiesExpression?.(init) || ts.isParenthesizedExpression(init)) init = init.expression;
      consts.set(d.name.text, init);
    }
  }
  const pairDeep = (ja, en) => {
    if (!ja || !en) return;
    const j = literal(ja);
    const e = literal(en);
    if (j !== null && e !== null) return add(j, e, `${rel}:${lineOf(ja)}`);
    if (ts.isArrayLiteralExpression(ja) && ts.isArrayLiteralExpression(en)) {
      ja.elements.forEach((el, i) => pairDeep(el, en.elements[i]));
    } else if (ts.isObjectLiteralExpression(ja) && ts.isObjectLiteralExpression(en)) {
      const jp = new Map();
      for (const p of ja.properties) if (ts.isPropertyAssignment(p) && p.name && "text" in p.name) jp.set(p.name.text, p.initializer);
      for (const p of en.properties) if (ts.isPropertyAssignment(p) && p.name && "text" in p.name) pairDeep(jp.get(p.name.text), p.initializer);
    }
  };
  for (const [name, en] of consts) {
    if (!name.endsWith("_EN")) continue;
    const base = name.slice(0, -3);
    pairDeep(consts.get(base) ?? consts.get(`${base}_JA`), en);
    // { 日本語: "English" } の対応表（CATEGORY_EN など）
    if (ts.isObjectLiteralExpression(en)) {
      for (const p of en.properties) {
        if (ts.isPropertyAssignment(p) && p.name && (ts.isIdentifier(p.name) || ts.isStringLiteral(p.name))) {
          const e = literal(p.initializer);
          if (e !== null) add(p.name.text, e, `${rel}:${lineOf(p)}`);
        }
      }
    }
  }
}

// サーバーのメッセージ（api-messages.ts を一時的に JS にして読み込む）
{
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "jisapp-i18n-"));
  const compile = (from, to, replace = (s) => s) => {
    const src = replace(fs.readFileSync(path.join(ROOT, from), "utf8"));
    const out = ts.transpileModule(src, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText;
    fs.writeFileSync(path.join(tmp, to), out);
  };
  compile("lib/app-data-limits.ts", "app-data-limits.js");
  compile("lib/i18n/api-messages.ts", "api-messages.js", (s) => s.replace('"@/lib/app-data-limits"', '"./app-data-limits.js"'));
  fs.writeFileSync(path.join(tmp, "package.json"), '{"type":"commonjs"}');
  const mod = require(path.join(tmp, "api-messages.js"));
  for (const [ja, en] of mod.apiMessagePairs()) add(ja, en, "lib/i18n/api-messages.ts");
  fs.rmSync(tmp, { recursive: true, force: true });
}

const dict = fs.existsSync(DICT_PATH) ? JSON.parse(fs.readFileSync(DICT_PATH, "utf8")) : {};
const missing = [...pairs.keys()].filter((ja) => !dict[ja]?.vi);
const unused = Object.keys(dict).filter((ja) => !pairs.has(ja));
const unreviewed = Object.entries(dict).filter(([, e]) => e.vi && !e.reviewed);

function saveDict(next) {
  const sorted = Object.fromEntries(Object.keys(next).sort().map((k) => [k, next[k]]));
  fs.writeFileSync(DICT_PATH, JSON.stringify(sorted, null, 2) + "\n");
}

const args = process.argv.slice(2);
const flag = (name) => args.indexOf(name);

if (flag("--missing") >= 0) {
  const out = args[flag("--missing") + 1];
  const sheet = Object.fromEntries(missing.map((ja) => [ja, { en: pairs.get(ja).en, where: [...pairs.get(ja).files].slice(0, 3) }]));
  fs.writeFileSync(out, JSON.stringify(sheet, null, 2) + "\n");
  console.log(`辞書にない文 ${missing.length} 件を ${out} に書き出しました`);
} else if (flag("--merge") >= 0) {
  const input = JSON.parse(fs.readFileSync(args[flag("--merge") + 1], "utf8"));
  let added = 0;
  let skipped = 0;
  for (const [ja, vi] of Object.entries(input)) {
    if (typeof vi !== "string" || !vi.trim()) continue;
    if (!pairs.has(ja)) { skipped++; continue; }
    const prev = dict[ja];
    // ネイティブ確認済みの訳は上書きしない
    if (prev?.reviewed) continue;
    dict[ja] = { vi: vi.normalize("NFC"), reviewed: false, en: pairs.get(ja).en };
    added++;
  }
  saveDict(dict);
  console.log(`${added} 件を取り込みました（コードにない文 ${skipped} 件は飛ばしました）`);
} else if (flag("--unreviewed") >= 0) {
  for (const [ja, e] of unreviewed) console.log(`${ja}\n  en: ${e.en ?? ""}\n  vi: ${e.vi}\n`);
  console.log(`ネイティブ未確認 ${unreviewed.length} 件`);
} else if (flag("--dynamic") >= 0) {
  for (const d of dynamic) console.log(`${d.where} [${d.kind}] ${d.text}`);
  console.log(`辞書を引けない t() ${dynamic.length} 件（ベトナム語ページでは英語で出る）`);
} else if (flag("--prune") >= 0) {
  for (const ja of unused) delete dict[ja];
  saveDict(dict);
  console.log(`使われなくなった文 ${unused.length} 件を消しました`);
} else {
  console.log(`コードの文: ${pairs.size} 件`);
  console.log(`辞書にない文: ${missing.length} 件`);
  console.log(`使われなくなった文: ${unused.length} 件`);
  console.log(`ネイティブ未確認: ${unreviewed.length} 件 / 確認済み: ${Object.values(dict).filter((e) => e.reviewed).length} 件`);
  console.log(`辞書を引けない t()（変数・JSX入り）: ${dynamic.length} 件`);
  if (flag("--check") >= 0 && missing.length > 0) process.exit(1);
}
