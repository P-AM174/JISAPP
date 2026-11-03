// 動画3 旅行代の精算（20秒）。冒頭と最後は同じ精算のレシート（ループ）
const { img, chat, card } = require('./common.cjs');
const ev = (t, fn) => ({ t, do: fn });
const cap = (t, text, y) => ev(t, p => p.evaluate(([a, b]) => window.__cap(a, b), [text, !!y]));
const over = (t, html) => ev(t, p => p.evaluate(h => window.__over(h), html));
// ページ内の要素が画面の上から off px の位置に来るようにスクロール
const scrollTo = (t, sel, off = 70, smooth = true) => ev(t, p => p.evaluate(([s, o, sm]) => { const el = document.querySelector(s); if (el) window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - o, behavior: sm ? 'smooth' : 'instant' }); }, [sel, off, smooth]));

// 相殺する前の8回の支払い → まとめると2回
const A = ['あ', '#2f7f7a'], Y = ['ゆ', '#c0627d'], Sa = ['さ', '#d08a2e'];
const raw = [[Y, A, '5,000', 'ホテル'], [Sa, A, '5,000', 'ホテル'], [A, Y, '1,000', '入場料'], [Sa, Y, '1,000', '入場料'], [A, Sa, '3,000', 'ごはん'], [Y, Sa, '3,000', 'ごはん'], [A, Y, '1,400', 'ロープウェイ'], [Sa, Y, '1,400', 'ロープウェイ']];
const av = ([c, col]) => `<span style="width:34px;height:34px;border-radius:50%;background:${col};color:#fff;display:inline-flex;align-items:center;justify-content:center;font-weight:900;font-size:16px;font-family:'Zen Maru Gothic'">${c}</span>`;
const offset = card(`
  <style>@keyframes gone{to{opacity:0;transform:translateX(40px) scaleY(.2);height:0;margin:0;padding:0}}@keyframes come{from{opacity:0;transform:scale(.5)}to{opacity:1;transform:none}}</style>
  <div style="font-family:'Zen Maru Gothic';font-weight:900;font-size:26px;color:#fff">相殺する前の支払い <span style="color:#f2b33d;font-family:Outfit;font-size:40px">8</span> 回</div>
  <div style="width:100%;display:flex;flex-direction:column;gap:6px">
  ${raw.map(([f, to, yen, what], i) => `<div style="display:flex;align-items:center;gap:10px;background:#fff;border-radius:14px;padding:6px 12px;color:#17302e;font-weight:800;animation:gone .35s ${1.0 + i * .12}s ease-in forwards">${av(f)}<span style="flex:1;border-top:3px solid #2f7f7a;position:relative"></span>${av(to)}<span style="width:90px;text-align:right;font-family:Outfit;font-size:20px">¥${yen}</span><span style="width:84px;font-size:13px;color:#557370">${what}</span></div>`).join('')}
  </div>
  <div style="font-family:'Zen Maru Gothic';font-weight:900;font-size:44px;color:#fff;animation:come .3s 2.2s both">送金 <span style="color:#f2b33d;font-family:Outfit;font-size:64px">2</span> 回に</div>`);
const share = card(`
  <div style="font-family:'Zen Maru Gothic';font-weight:900;font-size:24px;color:#9aa3b2">トークに貼るだけ</div>
  <div style="align-self:flex-end;max-width:88%;background:#06c755;color:#fff;border-radius:20px 20px 4px 20px;padding:16px 18px;font-size:19px;font-weight:700;line-height:1.6;white-space:pre-line">【箱根 一泊二日の精算】立て替え合計 ¥31,200
▼ 送金はこれだけ
ゆうと → あおい　¥3,200
さき → あおい　¥1,400</div>
  <div style="align-self:flex-start;background:#fff;color:#111;border-radius:20px 20px 20px 4px;padding:12px 16px;font-size:19px;font-weight:700">了解！今送る</div>`);

module.exports = {
  url: 'file:///home/user/JISAPP/docs/sns/2026-11-videos/travel-split.html',
  duration: 20.4,
  prep: async p => {
    // 字幕の書体（Dela Gothic One）を読み込む
    await p.addStyleTag({ url: 'https://fonts.googleapis.com/css2?family=Dela+Gothic+One&display=swap' }); await p.evaluate(() => document.fonts.load('40px "Dela Gothic One"')); 
    await p.click('#sample'); await p.waitForTimeout(2300);
    // 名前と金額は架空（ずっと右下に出す）
    await p.evaluate(() => { const n = document.createElement('div'); n.textContent = '名前と金額は架空です'; n.style.cssText = 'position:fixed;right:10px;bottom:10px;z-index:2147483600;background:rgba(0,0,0,.55);color:#fff;font-size:12px;font-weight:700;border-radius:8px;padding:4px 8px;font-family:sans-serif'; document.body.appendChild(n); document.getElementById('addExp').style.display = 'none'; });
    await p.evaluate(() => { const el = document.querySelector('.receipt'); window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 70, behavior: 'instant' }); });
  },
  events: [
    cap(0, '立て替え精算<br>送金は2回だけ', 1),
    scrollTo(2.0, '.card[data-exp]', 120),
    cap(2.0, '誰が何を立て替えた？'),
    ev(4.0, p => p.evaluate(() => { document.getElementById('addExp').style.display = ''; document.getElementById('addExp').click(); document.getElementById('addExp').style.display = 'none'; })),
    cap(4.0, '立て替えを入力'),
    ev(4.4, p => p.type('#eAmt', '15000', { delay: 70 })),
    ev(6.0, p => p.evaluate(() => { document.querySelector('.back')?.remove(); window.__over(''); })),
    over(6.0, offset),
    cap(6.0, '8回 → ？', 1),
    ev(8.5, p => p.evaluate(() => {
      window.__over('');
      render(); // 送金の一覧を出し直して、順に出る動きを見せる
      const el = document.querySelector('.receipt'); window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 70, behavior: 'instant' });
      document.querySelectorAll('.arrow b[data-count]').forEach((b, k) => { const to = +b.dataset.count, t0 = performance.now() + k * 450; b.textContent = '¥0'; const step = t => { const r = Math.max(0, Math.min(1, (t - t0) / 900)); b.textContent = '¥' + Math.round(to * (1 - Math.pow(1 - r, 3))).toLocaleString('ja-JP'); if (r < 1) requestAnimationFrame(step); }; requestAnimationFrame(step); });
    })),
    cap(8.5, 'ゆうと → あおい ¥3,200', 1),
    cap(10.4, 'さき → あおい ¥1,400', 1),
    scrollTo(12.0, '.ledger', 200),
    cap(12.0, '相殺の内訳'),
    ev(14.0, p => p.click('[data-done="0"]')),
    ev(14.5, p => p.click('[data-done="1"]')),
    ev(14.55, p => p.evaluate(() => { const el = document.querySelector('.alldone'); if (el) window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 360, behavior: 'smooth' }); })),
    cap(14.6, '全員精算済み', 1),
    over(15.5, chat('旅行で誰かが立て替えたものを入れると、全部相殺して、誰が誰にいくら払えば終わるかを出すアプリを作って', 'できました。index.html です。').replace('空気読み戦線', '旅の精算ノート').replace(/QUESTIONS = \[ \.\.\./, 'settle = (members) =&gt; ...')),
    cap(15.5, 'AI → 貼る → 公開', 1),
    over(16.15, img('travel-editor.png', 'ジサップに貼る')),
    over(16.8, img('travel-done.png', '公開')),
    over(17.5, share),
    cap(17.5, '次は何を1ボタン化する？', 1),
    ev(19.2, p => p.evaluate(() => { window.__over(''); const el = document.querySelector('.receipt'); window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 70, behavior: 'instant' }); })),
  ],
  vo: [
    { t: 0.05, text: '誰がいくら立て替えた？を、送金2回で精算。', speed: 1.5 },
    { t: 4.1, text: '誰が払って、誰で割るか入れるだけ。', speed: 1.45 },
    { t: 6.5, text: '相殺する前は、支払いが8回……', speed: 1.35 },
    { t: 9.2, text: '全部まとめると、送金は、2回だけ。', speed: 1.2 },
    { t: 14.1, text: '払ったら、チェック。', speed: 1.3 },
    { t: 15.75, text: 'この一文から、AIのコードを貼って共有。', speed: 1.45 },
    { t: 18.47, text: '次は何を、1ボタンにする？', speed: 1.5 },
  ],
  sfx: [
    { t: 0, name: 'pop' }, { t: 2.0, name: 'whoosh' }, { t: 4.0, name: 'pop' },
    ...[4.4, 4.47, 4.54, 4.61, 4.68].map(t => ({ t, name: 'tick', vol: .5 })),
    { t: 6.0, name: 'whoosh' }, ...[7.0, 7.12, 7.24, 7.36, 7.48, 7.6, 7.72, 7.84].map(t => ({ t, name: 'boop', vol: .45 })), { t: 8.2, name: 'good' },
    { t: 8.5, name: 'pop' }, { t: 8.95, name: 'pop' }, { t: 12.0, name: 'whoosh' },
    { t: 14.0, name: 'tap' }, { t: 14.5, name: 'tap' }, { t: 14.6, name: 'tada' },
    { t: 15.5, name: 'whoosh' }, { t: 16.15, name: 'pop' }, { t: 16.8, name: 'good' }, { t: 17.5, name: 'pop' },
  ],
};
