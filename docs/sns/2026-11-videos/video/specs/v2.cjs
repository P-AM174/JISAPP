// 動画2 エレベーターでどこに立つ（18秒）
const ev = (t, fn) => ({ t, do: fn });
const cap = (t, text, y) => ev(t, p => p.evaluate(([a, b]) => window.__cap(a, b), [text, !!y]));
const zoom = (t, L, s, ms) => ev(t, p => p.evaluate(([a, b, c]) => window.__zoomOpt(a, b, c), [L, s, ms]));
module.exports = {
  url: 'file:///home/user/JISAPP/docs/sns/2026-11-videos/kuuki-game-before-classroom.html?video=1',
  duration: 18,
  events: [
    ev(0, p => p.evaluate(() => { state.i = 1; state.score = 3; state.answers = [true]; question(); })),
    cap(0, 'どこに立つ？'),
    cap(0.9, 'A　B　C', 1),
    ev(2.9, p => p.dispatchEvent('.opt[data-opt="C"]', 'pointerdown')),
    cap(3.1, 'C を選択'),
    zoom(3.1, 'C', 1.35, 1500),
    cap(5.1, '出口をブロック'),
    zoom(8.0, 'B', 1.0, 600),
    cap(8.2, '自然なのは B', 1),
    // もう一度、今度は B（正解）を選んで +1 を見せる
    ev(10.0, p => p.evaluate(() => { window.__cap(''); state.answers.pop(); question(); })),
    ev(10.4, p => p.dispatchEvent('.opt[data-opt="B"]', 'pointerdown')),
    cap(12.5, '+1 距離感', 1),
    // 次は教室編（予告）
    ev(14.8, p => p.evaluate(() => { window.__cap(''); ALL.splice(2, 0, CLASSROOM[0]); state.answers.push(true); state.i = 2; question(); })),
    cap(14.8, '次は教室編', 1),
    ev(17.0, p => p.evaluate(() => clearAll())),
  ],
  vo: [
    { t: 0.05, text: '3秒で、立つ場所を選んで。', speed: 1.3 },
    { t: 1.6, text: 'A、B、C。', speed: 1.2 },
    { t: 3.15, text: 'Cを選ぶと……' },
    { t: 5.3, text: '降りる人を、全員ブロック。', speed: 1.25 },
    { t: 8.3, text: '自然なのは、B。' },
    { t: 12.5, text: '空気読みポイント、1点。', speed: 1.25 },
    { t: 14.9, text: '教室なら、どこ？コメントで回答。', speed: 1.3 },
  ],
  sfx: [
    { t: 0, name: 'tick' }, { t: 1, name: 'tick' }, { t: 2, name: 'tick' },
    { t: 2.9, name: 'tap' }, ...[3.1, 3.4, 3.7, 4.0, 4.3, 4.6, 4.9].map(t => ({ t, name: 'step', vol: .6 })),
    { t: 5.05, name: 'bad' }, { t: 8.2, name: 'pop' }, { t: 10.0, name: 'whoosh' }, { t: 10.4, name: 'tap' },
    ...[10.6, 10.9, 11.2, 11.5, 11.8, 12.1].map(t => ({ t, name: 'step', vol: .6 })), { t: 12.45, name: 'good' },
    { t: 14.8, name: 'whoosh' }, { t: 14.85, name: 'tick' }, { t: 15.85, name: 'tick' },
  ],
};
