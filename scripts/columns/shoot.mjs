// アプリの写真を撮る：本物のアプリの HTML に、撮影用の仕組み（harness.js）と架空のデータを入れ、スマホの大きさ（390×760 の2倍）で撮る
// 使い方: node scripts/columns/shoot.mjs <撮影の設定.mjs> <出力フォルダ> [撮る名前,名前]
//
// 撮影の設定.mjs は SHOTS を書き出す：
//   export const SHOTS = [{ name: 'fee-top', html: 'アプリのHTMLのパス', spec: { fix, me, group, items, vals }, act: 'あとでする操作のJS' }]
//   spec.items は { キー: [[書いた人, 値, 何分前, id?]] }（Jisapp.shared.add で足す一覧）、spec.vals は { キー: 値 }（Jisapp.shared.save の値）
// iframe に入れて撮る（ヘッドレスの Chrome は、そのままだと横幅が広く描かれるため）
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import sharp from 'sharp';

const CHROME = process.env.CHROME || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const [specPath, outArg, only] = process.argv.slice(2);
if (!specPath || !outArg) { console.error('使い方: shoot.mjs <撮影の設定.mjs> <出力フォルダ> [名前,名前]'); process.exit(1); }
const out = resolve(outArg);
const { SHOTS } = await import(pathToFileURL(resolve(specPath)).href);
const harness = readFileSync(join(dirname(fileURLToPath(import.meta.url)), 'harness.js'), 'utf8');
mkdirSync(join(out, 'pages'), { recursive: true });

for (const { name, html: htmlPath, spec, act = '' } of SHOTS) {
  if (only && !only.split(',').includes(name)) continue;
  const html = readFileSync(resolve(dirname(resolve(specPath)), htmlPath), 'utf8');
  const pre = `<script>window.__SPEC=${JSON.stringify({ ...spec, act })};</script><script>${harness}</script>`;
  // アプリのどのスクリプトよりも先に入れる（window.Jisapp を先に置きかえる）
  const i = html.search(/<script[\s>]/i);
  const page = i >= 0 ? html.slice(0, i) + pre + html.slice(i) : html.replace('</head>', pre + '</head>');
  writeFileSync(join(out, 'pages', `${name}.html`), page);
  writeFileSync(join(out, 'pages', `frame-${name}.html`), `<!doctype html><html><body style="margin:0;background:#fff"><iframe style="border:0;width:390px;height:760px;display:block" src="${name}.html"></iframe></body></html>`);
  const raw = join(out, 'pages', `${name}-raw.png`);
  try {
    execFileSync(CHROME, ['--headless=new', '--disable-gpu', '--hide-scrollbars', '--allow-file-access-from-files', '--window-size=700,760', '--force-device-scale-factor=2', '--virtual-time-budget=6000', `--user-data-dir=${join(out, 'chrome', name)}`, `--screenshot=${raw}`, pathToFileURL(join(out, 'pages', `frame-${name}.html`)).href], { stdio: 'ignore', timeout: 60000 });
  } catch { /* 撮ったあとに終わりの合図が遅れることがある。写真があれば続ける */ }
  await sharp(raw).extract({ left: 0, top: 0, width: 780, height: 1520 }).toFile(join(out, `${name}.png`));
  console.log('撮りました', join(out, `${name}.png`));
}
