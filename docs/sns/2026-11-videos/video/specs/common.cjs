// 動画どうしで使う差し込み画面（AIへの一文・ジサップに貼る・公開・コメント・コードのコピー）
const V = require('path').resolve(__dirname, '..');
const img = (file, label) => `<div style="position:absolute;inset:0;background:#0b0d12;display:flex;align-items:center;justify-content:center">
  <img src="file://${V}/studio/${file}" style="width:100%;height:100%;object-fit:cover">
  ${label ? `<div style="position:absolute;top:28px;left:50%;transform:translateX(-50%) rotate(-3deg);background:#ffd23f;color:#111;font-family:'Dela Gothic One';font-size:30px;padding:6px 18px;border-radius:12px;box-shadow:4px 4px 0 #000">${label}</div>` : ''}</div>`;

const chat = (prompt, reply) => `<div style="position:absolute;inset:0;background:#0f1117;font-family:'M PLUS Rounded 1c',sans-serif;color:#eef0f4;padding:70px 22px 22px">
  <div style="position:absolute;top:28px;left:50%;transform:translateX(-50%) rotate(-3deg);background:#ffd23f;color:#111;font-family:'Dela Gothic One';font-size:30px;padding:6px 18px;border-radius:12px;box-shadow:4px 4px 0 #000">AI に一文</div>
  <div style="margin-top:40px;display:flex;justify-content:flex-end"><div style="max-width:84%;background:#2f6feb;color:#fff;border-radius:20px 20px 4px 20px;padding:16px 18px;font-size:22px;font-weight:800;line-height:1.5">${prompt}</div></div>
  <div style="margin-top:22px;display:flex;gap:10px"><div style="width:42px;height:42px;border-radius:50%;background:#2a2f3a;display:flex;align-items:center;justify-content:center;font-weight:900">AI</div>
  <div style="flex:1;background:#1b1f28;border-radius:20px 20px 20px 4px;padding:16px;font-size:19px;line-height:1.5">${reply}
  <pre style="margin:12px 0 0;background:#0b0d12;border-radius:12px;padding:12px;font-size:13px;line-height:1.55;color:#a5d6ff;white-space:pre-wrap">&lt;!DOCTYPE html&gt;
&lt;html lang="ja"&gt;
&lt;head&gt;&lt;title&gt;空気読み戦線&lt;/title&gt;
&lt;style&gt; :root { --yellow: #ffd23f; ...
&lt;script&gt; const QUESTIONS = [ ...</pre></div></div></div>`;

const codeCopy = (lines, hi) => `<div style="position:absolute;inset:0;background:#0f1117;padding:90px 18px 20px;font-family:'M PLUS Rounded 1c',sans-serif">
  <div style="position:absolute;top:28px;left:50%;transform:translateX(-50%) rotate(-3deg);background:#ffd23f;color:#111;font-family:'Dela Gothic One';font-size:30px;padding:6px 18px;border-radius:12px;box-shadow:4px 4px 0 #000">コードをコピー</div>
  <div style="background:#0b0d12;border:2px solid #2a303c;border-radius:16px;overflow:hidden">
    <div style="display:flex;align-items:center;padding:10px 14px;background:#161a22;color:#9aa3b2;font-size:15px;font-weight:800">index.html<span style="margin-left:auto;background:#22c55e;color:#fff;border-radius:8px;padding:6px 12px">コピーしました</span></div>
    <pre style="margin:0;padding:14px;font-size:15px;line-height:1.7;color:#d7dbe3;white-space:pre-wrap;font-family:ui-monospace,Menlo,monospace">${lines.map((l, i) => `<span style="display:block;${hi.includes(i) ? 'background:rgba(255,210,63,.18);border-left:4px solid #ffd23f;padding-left:8px;color:#fff' : 'padding-left:12px'}">${l}</span>`).join('')}</pre>
  </div></div>`;

const card = (inner) => `<div style="position:absolute;inset:0;background:rgba(11,13,18,.92);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:18px;font-family:'M PLUS Rounded 1c',sans-serif;color:#fff;padding:24px">${inner}</div>`;

module.exports = { img, chat, codeCopy, card, V };
