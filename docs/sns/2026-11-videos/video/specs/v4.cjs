// 動画4 コメントの教室編をアプリへ追加（21秒）
const { img, chat, codeCopy, card } = require('./common.cjs');
const ev = (t, fn) => ({ t, do: fn });
const cap = (t, text, y) => ev(t, p => p.evaluate(([a, b]) => window.__cap(a, b), [text, !!y]));
const over = (t, html) => ev(t, p => p.evaluate(h => window.__over(h), html));
const zoom = (t, L, s, ms) => ev(t, p => p.evaluate(([a, b, c]) => window.__zoomOpt(a, b, c), [L, s, ms]));
// 視聴者の声（名前やアイコンは出さない。投票の結果として見せる）
const vote = card(`<div style="font-size:22px;font-weight:900;color:#9aa3b2">みんなの投票で一番多かった案</div>
  <div style="background:#fff;color:#111;border-radius:22px;padding:22px 26px;font-size:38px;font-weight:900;box-shadow:6px 6px 0 #ffd23f;transform:rotate(-2deg)">教室編が見たい！</div>
  <div style="display:flex;gap:10px;font-size:20px;font-weight:800;color:#d7dbe3"><span style="background:#22c55e;color:#fff;border-radius:999px;padding:6px 14px">教室 62%</span><span style="background:#232833;border-radius:999px;padding:6px 14px">カフェ 21%</span><span style="background:#232833;border-radius:999px;padding:6px 14px">映画館 17%</span></div>`);
const nextVote = card(`<div style="font-family:'Dela Gothic One';font-size:40px;color:#ffd23f;text-shadow:3px 3px 0 #ff3d7f,5px 5px 0 #000;transform:rotate(-3deg)">次はどっち？</div>
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;width:100%">
  ${[['A', 'カフェ編'], ['B', '映画館編']].map(([l, t]) => `<div style="background:#161a22;border:3px solid #2a303c;border-radius:22px;padding:22px 10px;text-align:center"><div style="width:64px;height:64px;margin:0 auto 10px;border-radius:50%;background:#ffd23f;color:#111;border:4px solid #000;font-family:Rubik;font-weight:900;font-size:34px;display:flex;align-items:center;justify-content:center">${l}</div><div style="font-size:28px;font-weight:900">${t}</div></div>`).join('')}</div>
  <div style="font-size:20px;font-weight:800;color:#9aa3b2">コメントで A か B</div>`);
const code = codeCopy([
  'const CLASSROOM = [',
  "  { place: '教室', q: '遅刻した教室 どこ？',",
  "    cols: 5, map: 'pppppppAp.pBp.CDD...',",
  "    best: 'A',",
  "    why: { A: '後ろの空席。授業をじゃましない',",
  "           B: '真ん中を横切ることになる',",
  "           C: '一番前の席で目立つ' } },",
  '];',
], [1, 2, 3, 4, 5, 6]);
module.exports = {
  url: 'file:///home/user/JISAPP/docs/sns/2026-11-videos/kuuki-game.html?video=1',
  duration: 21,
  events: [
    over(0, vote),
    cap(0, '教室編を追加して', 1),
    ev(1.5, p => p.evaluate(() => { window.__over(''); state.i = 3; state.score = 2; state.answers = [true, false, true]; question(); clearAll(); })),
    cap(1.5, '追加します'),
    over(4.0, chat('空気読みゲームに「教室編」を追加して。遅刻して教室に入ったとき、A・B・Cのどこに座るか。正解は後ろの空席', '教室編を追加しました。')),
    cap(4.0, '場面　選択肢　結果', 1),
    over(7.0, code),
    cap(7.0, 'コードをコピー'),
    over(9.5, img('game-editor.png', 'ジサップに貼る')),
    cap(9.5, '貼る → 更新', 1),
    over(10.8, img('game-preview.png', '更新')),
    ev(12.0, p => p.evaluate(() => { window.__over(''); question(); })),
    cap(12.0, 'コメントがアプリに', 1),
    ev(12.9, p => p.dispatchEvent('.opt[data-opt="A"]', 'pointerdown')),
    zoom(13.0, 'A', 1.25, 1400),
    over(16.0, nextVote),
    cap(16.0, 'A カフェ　B 映画館', 1),
  ],
  vo: [
    { t: 0.05, text: '教室編が見たい、という案。', speed: 1.3 },
    { t: 1.6, text: '本当に、ゲームへ追加します。', speed: 1.25 },
    { t: 4.1, text: '場面と選択肢を、AIへ伝えて……', speed: 1.25 },
    { t: 7.1, text: '追加されたコードを、コピー。', speed: 1.25 },
    { t: 9.6, text: 'ジサップに貼って、更新。', speed: 1.2 },
    { t: 12.1, text: 'コメントが、遊べる問題になりました。', speed: 1.25 },
    { t: 16.2, text: '次は、カフェと映画館、どっち？', speed: 1.2 },
  ],
  sfx: [
    { t: 0, name: 'pop' }, { t: 1.5, name: 'whoosh' }, { t: 4.0, name: 'whoosh' }, { t: 7.0, name: 'pop' }, { t: 7.6, name: 'tap' },
    { t: 9.5, name: 'pop' }, { t: 10.8, name: 'good' }, { t: 12.0, name: 'tick' }, { t: 12.9, name: 'tap' },
    ...[13.1, 13.4, 13.7, 14.0, 14.3, 14.6, 14.9].map(t => ({ t, name: 'step', vol: .6 })), { t: 15.05, name: 'good' },
    { t: 16.0, name: 'whoosh' },
  ],
};
