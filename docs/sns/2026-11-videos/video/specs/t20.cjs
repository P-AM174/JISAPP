// 動画3 旅行代の精算（20秒）。型「場面 → 数字の得」v1 に合わせた版
// 真ん中のスマホ（travel-split.html を iframe で表示）は最後まで同じ位置。上にラベルと字幕、右上に「精算済み 0→3人」
// 声は Gemini TTS（Vindemiatrix）。GEMINI_API_KEY がないときは、字幕と効果音だけで書き出す
const ev = (t, fn) => ({ t, do: fn });
const app = p => p.frames().find(f => f.url().includes('travel-split'));
const inApp = (t, fn, arg) => ev(t, p => app(p).evaluate(fn, arg));
const stage = (t, fn, arg) => ev(t, p => p.evaluate(fn, arg));
const big = (t, html) => stage(t, h => window.big(h), html);
// 指を動かして（0.36秒）、iframe の中で本当に押す
const tap = (t, sel) => ev(t, async p => {
  const f = app(p), r = await f.evaluate(s => { const el = document.querySelector(s); if (!el) return null; const b = el.getBoundingClientRect(); return [b.left + b.width / 2, b.top + b.height / 2]; }, sel);
  if (!r) throw new Error('not found ' + sel);
  await p.evaluate(([x, y]) => window.tapAt(x, y), r);
  setTimeout(() => f.evaluate(s => document.querySelector(s).click(), sel).catch(e => console.error('tap', sel, e.message)), 360);
});
// アプリの中で、要素が上から off px に来るようにスクロール
const scroll = (t, sel, off = 60, smooth = true) => inApp(t, ([s, o, sm]) => { const el = document.querySelector(s); if (el) window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - o, behavior: sm ? 'smooth' : 'instant' }); }, [sel, off, smooth]);

// 声と字幕（同じ文）。t は始まり、max はその画面の長さ（入りきらないときは少し速くする）
// 画面の区切り：台本の秒（左）→ 実際の声の長さに合わせた秒（右）。ほかの動き・効果音の時間もこれで合わせる
const FROM = [0, 2, 4, 6, 8, 10, 12, 14, 17, 19, 20.3];
const TO = [0, 2.6, 4.5, 6.3, 8.0, 9.8, 11.75, 13.75, 17.85, 19.85, 21.6];
const R = t => { let k = 0; while (k < FROM.length - 2 && t >= FROM[k + 1]) k++; return +(TO[k] + (t - FROM[k]) * (TO[k + 1] - TO[k]) / (FROM[k + 1] - FROM[k])).toFixed(3); };
const VO = [
  [0.05, 2.55, '3人で箱根、立て替えが4件。誰がいくら？', '<b>3人</b>で箱根、立て替えが<b>4件</b>。<br>誰がいくら？'],
  [2.0, 1.9, '全部まとめて、送金は2回だけ。', '全部まとめて、<br>送金は<b>2回</b>だけ。'],
  [4.0, 1.75, '「あとで計算するね」、もう言わない。', '「あとで計算するね」、<br>もう言わない。'],
  [6.0, 1.65, '払った人と金額を入れる。', '払った人と金額を入れる。'],
  [8.0, 1.75, '誰で割るか、タップで選ぶ。', '誰で割るか、タップで選ぶ。'],
  [10.0, 1.9, '誰が誰に払うか、すぐ出る。', '誰が誰に払うか、すぐ出る。'],
  [12.0, 1.95, '8回の支払いが、送金2回に。', '<b>8回</b>の支払いが、<br>送金<b>2回</b>に。'],
  [14.0, 4.05, '「こんなアプリ作りたい！」って自分のAIに送って、出てきたコードをジサップに貼るだけ。', '<small>「こんなアプリ作りたい！」って自分のAIに送って、<br>出てきたコードを<b>ジサップ</b>に貼るだけ。</small>'],
  [17.0, 1.95, '帰りの電車で、精算おわり。', '帰りの電車で、精算おわり。'],
  [19.0, 1.45, 'まずは「ジサップ」で検索。', 'まずは「<b>ジサップ</b>」で検索。'],
];

// 14〜17秒：スマホの中で、AI に一文を送る → ジサップに貼る → アプリ
const chat = `<div style="position:absolute;inset:0;background:#f4f4f2;display:flex;flex-direction:column;padding:56px 16px 20px;gap:12px;font-family:'M PLUS Rounded 1c',sans-serif">
  <div style="font-weight:900;font-size:15px;color:#555;text-align:center">あなたのAI</div>
  <div style="align-self:flex-end;max-width:88%;background:#2f7f7a;color:#fff;border-radius:20px 20px 4px 20px;padding:14px 16px;font-size:16px;font-weight:800;line-height:1.55">旅行で誰かが立て替えたものを入れると、全部相殺して、誰が誰にいくら払えば終わるかを出すアプリを作って</div>
  <div style="align-self:flex-start;max-width:92%;background:#fff;border-radius:20px 20px 20px 4px;padding:12px 14px;font-size:14px;font-weight:800;color:#222;box-shadow:0 2px 6px rgba(0,0,0,.08)">できました。index.html です。
    <pre style="margin:8px 0 0;background:#1e2430;color:#cfe3ff;border-radius:10px;padding:10px;font-size:11px;line-height:1.5;white-space:pre-wrap">&lt;!DOCTYPE html&gt;
&lt;title&gt;旅の精算ノート&lt;/title&gt;
function settle(members) { ... }</pre></div></div>`;
const editor = `<div style="position:absolute;inset:0;background:#fff url(studio/travel-editor.png) center top/cover no-repeat"></div>`;

module.exports = {
  url: 'file:///home/user/JISAPP/docs/sns/2026-11-videos/video/travel-stage.html',
  duration: 21.6,
  voice: 'gemini', voiceName: 'Vindemiatrix', voVol: 1.3,
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
  events: ([
    ...VO.map(([t, , , c]) => stage(t, h => window.cap(h), c)),
    // 2〜4 数字の得
    big(2.05, '送金は<em>2</em>回だけ'),
    scroll(2.1, '.receipt', 80),
    big(3.9, ''),
    // 4〜6 共感：チケット（2回の送金で終わり）
    inApp(4.0, () => window.scrollTo({ top: 0, behavior: 'smooth' })),
    // 6〜8 払った人と金額
    scroll(5.6, '.card[data-exp]', 220, false),
    tap(6.0, '.card[data-exp]'),
    inApp(6.75, () => { const a = document.querySelector('#eAmt'); a.value = ''; a.dispatchEvent(new Event('input')); document.querySelector('.sheet').scrollTop = 120; }),
    ev(6.8, p => app(p).type('#eAmt', '15000', { delay: 90 })),
    tap(7.45, '.sheet [name=payer] + .p'),
    // 8〜10 誰で割るか（さきを外す → 戻す）
    inApp(8.0, () => { const s = document.querySelector('.sheet'); s.scrollTo({ top: s.scrollHeight, behavior: 'smooth' }); }),
    tap(8.2, '.sheet label:has([name=ps]):nth-of-type(3) .p'),
    tap(9.0, '.sheet label:has([name=ps]):nth-of-type(3) .p'),
    // 10〜12 送金がすぐ出る
    tap(10.0, '#eOk'),
    ev(10.5, p => app(p).evaluate(() => {
      const el = document.querySelector('.receipt'); window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 80, behavior: 'instant' });
      document.querySelectorAll('.arrow b[data-count]').forEach((b, k) => { const to = +b.dataset.count, t0 = performance.now() + k * 350; b.textContent = '¥0'; const step = t => { const r = Math.max(0, Math.min(1, (t - t0) / 800)); b.textContent = '¥' + Math.round(to * (1 - Math.pow(1 - r, 3))).toLocaleString('ja-JP'); if (r < 1) requestAnimationFrame(step); }; requestAnimationFrame(step); });
    })),
    stage(10.5, () => window.hideFinger()),
    // 12〜14 得のくり返し
    big(12.05, '支払い <em>8</em>回<br>→ 送金 <em>2</em>回'),
    big(13.9, ''),
    // 14〜17 作り方
    stage(14.0, h => window.inner(h), chat),
    stage(15.3, h => window.inner(h), editor),
    stage(16.4, () => window.inner('')),
    // 17〜19 結び：払ったらチェック → 精算済み 3/3人
    tap(17.0, '[data-done="0"]'),
    stage(17.4, () => window.count(1)),
    tap(17.7, '[data-done="1"]'),
    stage(18.1, () => window.count(2)),
    ev(18.3, p => app(p).evaluate(() => { const el = document.querySelector('.alldone'); if (el) window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 300, behavior: 'smooth' }); })),
    stage(18.4, () => { window.count(3); window.hideFinger(); }),
    // 19〜20 終わりの画面
    stage(19.0, () => window.endScreen()),
  ]).map(e => ({ ...e, t: R(e.t) })),
  // 5つ目があれば、読み上げにはそちらを使う（字幕は同じ文のまま。区切りを入れて固有名詞をはっきり読ませる）
  vo: VO.map(([t, max, text, , say]) => ({ t: t ? R(t) : t, max, text, say })),
  sfx: [
    { t: 2.05, name: 'pop', vol: .8 }, { t: 4.0, name: 'whoosh', vol: .5 },
    { t: 6.35, name: 'tap', vol: .6 }, { t: 7.8, name: 'tap', vol: .6 }, { t: 8.55, name: 'tap', vol: .6 }, { t: 9.35, name: 'tap', vol: .6 },
    { t: 10.35, name: 'good', vol: .6 }, { t: 12.05, name: 'pop', vol: .8 }, { t: 14.0, name: 'whoosh', vol: .5 }, { t: 15.3, name: 'click', vol: .6 },
    { t: 17.4, name: 'tick', vol: .7 }, { t: 18.1, name: 'tick', vol: .7 }, { t: 18.4, name: 'tada', vol: .7 }, { t: 19.0, name: 'whoosh', vol: .5 },
  ].map(x => ({ ...x, t: R(x.t) })),
};
