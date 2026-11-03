// 動画3 旅行代の精算。型「場面 → 数字の得」v1。声（Gemini TTS）を先に作り、1文ずつの長さで画面の時間割を決める
// 真ん中のスマホ（travel-split.html を iframe で表示）は最後まで同じ位置。上にラベルと字幕、右上に「精算済み 0→3人」
const app = p => p.frames().find(f => f.url().includes('travel-split'));

// 声（＝字幕）。cap は字幕の見た目（数字を黄色に）
const LINES = [
  { text: '旅行の精算アプリ、自分で作れる。', cap: '旅行の精算アプリ、<br><b>自分で作れる</b>。', min: 1.8 },
  { text: '全部まとめて、送金は2回だけ。', cap: '全部まとめて、<br>送金は<b>2回</b>だけ。' },
  { text: '「あとで計算するね」、もう言わない。', cap: '「あとで計算するね」、<br>もう言わない。' },
  { text: '払った人と金額を入れる。', cap: '払った人と金額を入れる。', min: 1.6 },
  { text: '誰で割るか、タップで選ぶ。', cap: '誰で割るか、タップで選ぶ。', min: 1.5 },
  { text: '誰が誰に払うか、すぐ出る。', cap: '誰が誰に払うか、すぐ出る。', min: 1.4 },
  { text: '入れた立て替えは、みんなのスマホで共有。', cap: '入れた立て替えは、<br>みんなのスマホで<b>共有</b>。' },
  { text: '8回の支払いが、送金2回に。', cap: '<b>8回</b>の支払いが、<br>送金<b>2回</b>に。' },
  { text: '「こんなアプリ作りたい！」って自分のAIに送って、出てきたコードをジサップに貼るだけ。', cap: '<small>「こんなアプリ作りたい！」って自分のAIに送って、<br>出てきたコードを<b>ジサップ</b>に貼るだけ。</small>', min: 3 },
  { text: '帰りの電車で、精算おわり。', cap: '帰りの電車で、精算おわり。', min: 2.1 },
  { text: 'まずは「ジサップ」で検索。', cap: 'まずは「<b>ジサップ</b>」で検索。', tail: .6 },
];

// 14〜17秒：スマホの中で、AI に一文を送る → ジサップに貼る → アプリ
const chat = `<div style="position:absolute;inset:0;background:#f4f4f2;display:flex;flex-direction:column;padding:56px 16px 20px;gap:12px;font-family:'M PLUS Rounded 1c',sans-serif">
  <div style="font-weight:900;font-size:15px;color:#555;text-align:center">あなたのAI</div>
  <div style="align-self:flex-end;max-width:88%;background:#2f7f7a;color:#fff;border-radius:20px 20px 4px 20px;padding:14px 16px;font-size:16px;font-weight:800;line-height:1.55">旅行で誰かが立て替えたものを入れると、全部相殺して、誰が誰にいくら払えば終わるかを出すアプリを作って。グループのみんなで共有したい</div>
  <div style="align-self:flex-start;max-width:92%;background:#fff;border-radius:20px 20px 20px 4px;padding:12px 14px;font-size:14px;font-weight:800;color:#222;box-shadow:0 2px 6px rgba(0,0,0,.08)">できました。index.html です。
    <pre style="margin:8px 0 0;background:#1e2430;color:#cfe3ff;border-radius:10px;padding:10px;font-size:11px;line-height:1.5;white-space:pre-wrap">&lt;!DOCTYPE html&gt;
&lt;title&gt;旅の精算ノート&lt;/title&gt;
function settle(members) { ... }</pre></div></div>`;
const editor = `<div style="position:absolute;inset:0;background:#fff url(studio/travel-editor.png) center top/cover no-repeat"></div>`;

// 動きの部品（at = その文の始まりからの秒）
const stage = (fn, arg) => p => p.evaluate(fn, arg);
const inApp = (fn, arg) => p => app(p).evaluate(fn, arg);
const big = html => stage(h => window.big(h), html);
const scroll = (sel, off = 80, smooth = true) => inApp(([s, o, sm]) => { const el = document.querySelector(s); if (el) window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - o, behavior: sm ? 'smooth' : 'instant' }); }, [sel, off, smooth]);
// 指を動かして（0.36秒）、iframe の中で本当に押す
const tap = sel => async p => {
  const f = app(p), r = await f.evaluate(s => { const el = document.querySelector(s); if (!el) return null; const b = el.getBoundingClientRect(); return [b.left + b.width / 2, b.top + b.height / 2]; }, sel);
  if (!r) throw new Error('not found ' + sel);
  await p.evaluate(([x, y]) => window.tapAt(x, y), r);
  setTimeout(() => f.evaluate(s => document.querySelector(s).click(), sel).catch(e => console.error('tap', sel, e.message)), 360);
};
const countUp = inApp(() => {
  const el = document.querySelector('.receipt'); window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 80, behavior: 'instant' });
  document.querySelectorAll('.arrow b[data-count]').forEach((b, k) => { const to = +b.dataset.count, t0 = performance.now() + k * 300; b.textContent = '¥0'; const step = t => { const r = Math.max(0, Math.min(1, (t - t0) / 700)); b.textContent = '¥' + Math.round(to * (1 - Math.pow(1 - r, 3))).toLocaleString('ja-JP'); if (r < 1) requestAnimationFrame(step); }; requestAnimationFrame(step); });
});

// 各文の画面の動き：[文の番号, 始まりからの秒（負なら終わりからの秒）, 動き]
const MOVES = [
  [1, .05, big('送金は<em>2</em>回だけ')], [1, .1, scroll('.receipt')], [1, -.12, big('')],
  [2, 0, inApp(() => window.scrollTo({ top: 0, behavior: 'smooth' }))],
  [2, -.3, scroll('.card[data-exp]', 220, false)],
  [3, 0, tap('.card[data-exp]')],
  [3, .6, inApp(() => { const a = document.querySelector('#eAmt'); a.value = ''; a.dispatchEvent(new Event('input')); document.querySelector('.sheet').scrollTop = 120; })],
  [3, .65, async p => app(p).type('#eAmt', '15000', { delay: 60 })],
  [3, -.4, tap('.sheet [name=payer] + .p')],
  [4, 0, inApp(() => { const s = document.querySelector('.sheet'); s.scrollTo({ top: s.scrollHeight, behavior: 'smooth' }); })],
  [4, .1, tap('.sheet label:has([name=ps]):nth-of-type(3) .p')],
  [4, .8, tap('.sheet label:has([name=ps]):nth-of-type(3) .p')],
  [5, 0, tap('#eOk')], [5, .45, countUp], [5, .45, stage(() => window.hideFinger())],
  [6, 0, inApp(() => { const t = document.getElementById('toast'); t.style.display = ''; toast('ほかのメンバーが更新しました'); })],
  [6, .1, stage(() => window.share(true))], [6, -.1, stage(() => window.share(false))],
  [7, .05, big('支払い <em>8</em>回<br>→ 送金 <em>2</em>回')], [7, -.12, big('')],
  [8, 0, stage(h => window.inner(h), chat)], ['8%', .42, stage(h => window.inner(h), editor)], ['8%', .8, stage(() => window.inner(''))],
  [9, 0, tap('[data-done="0"]')], [9, .4, stage(() => window.count(1))],
  [9, .6, tap('[data-done="1"]')], [9, 1.0, stage(() => window.count(2))],
  [9, 1.1, inApp(() => { const el = document.querySelector('.alldone'); if (el) window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 300, behavior: 'smooth' }); })],
  [9, 1.2, stage(() => { window.count(3); window.hideFinger(); })],
  [10, 0, stage(() => window.endScreen())],
];
const SFX = [[1, .05, 'pop', .8], [2, 0, 'whoosh', .5], [3, .36, 'tap', .6], [3, -.04, 'tap', .6], [4, .46, 'tap', .6], [4, 1.16, 'tap', .6], [5, .36, 'good', .6],
  [6, .1, 'pop', .7], [7, .05, 'pop', .8], [8, 0, 'whoosh', .5], ['8%', .42, 'click', .6], [9, .4, 'tick', .7], [9, 1.0, 'tick', .7], [9, 1.2, 'tada', .7], [10, 0, 'whoosh', .5]];

module.exports = {
  url: 'file:///home/user/JISAPP/docs/sns/2026-11-videos/video/travel-stage.html',
  voice: 'gemini', voiceName: 'Vindemiatrix', voVol: 1.3,
  tempo: 1.2, // 声を速くする（全部の文で同じ倍率。早口の指示は声がくずれるので、あとから速める）
  lines: LINES,
  // 声の長さ（秒）から、各文の始まりと動画の長さを決める
  build: durs => {
    const GAP = .08; let t = .05; const start = [], len = [];
    LINES.forEach((l, i) => { start.push(t); len.push(Math.max(l.min || 0, durs[i] + GAP)); t += len[i]; });
    const duration = +(t + (LINES.at(-1).tail || 0)).toFixed(2);
    const at = (k, o) => { const pct = typeof k === 'string'; const i = pct ? +k.slice(0, -1) : k; return +(start[i] + (pct ? o * len[i] : o < 0 ? len[i] + o : o)).toFixed(3); };
    return {
      duration,
      events: [...LINES.map((l, i) => ({ t: start[i], do: stage(h => window.cap(h), l.cap) })), ...MOVES.map(([k, o, fn]) => ({ t: at(k, o), do: fn }))],
      vo: LINES.map((l, i) => ({ t: start[i], text: l.text })),
      sfx: SFX.map(([k, o, name, vol]) => ({ t: at(k, o), name, vol })),
    };
  },
  prep: async p => {
    await p.evaluate(() => Promise.all([document.fonts.load('40px "Dela Gothic One"'), document.fonts.load('900 27px "M PLUS Rounded 1c"'), document.fonts.ready]));
    let f; for (let k = 0; k < 50 && !(f = app(p)); k++) await p.waitForTimeout(100);
    await f.waitForSelector('#sample');
    await f.evaluate(() => document.fonts.ready);
    await f.click('#sample'); await p.waitForTimeout(2400);
    await f.evaluate(() => {
      document.getElementById('addExp').style.display = 'none';
      document.getElementById('toast').style.display = 'none';
      const s = document.createElement('style'); s.textContent = 'header{padding-top:36px}.hint{background:#fff3c4;border-radius:10px;padding:8px 10px;font-weight:800;color:#17302e;font-size:15px}'; document.head.appendChild(s);
      const h = [...document.querySelectorAll('.sec')][1]; window.scrollTo({ top: h.getBoundingClientRect().top + window.scrollY - 92, behavior: 'instant' });
    });
  },
};
