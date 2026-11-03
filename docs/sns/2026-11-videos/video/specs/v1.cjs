// 動画1 電車でどこに座る 空気読みゲーム（19秒）
const { img, chat } = require('./common.cjs');
const ev = (t, fn) => ({ t, do: fn });
const cap = (t, text, y) => ev(t, p => p.evaluate(([a, b]) => window.__cap(a, b), [text, !!y]));
const over = (t, html) => ev(t, p => p.evaluate(h => window.__over(h), html));
const zoom = (t, L, s, ms) => ev(t, p => p.evaluate(([a, b, c]) => window.__zoomOpt(a, b, c), [L, s, ms]));
module.exports = {
  url: 'file:///home/user/JISAPP/docs/sns/2026-11-videos/kuuki-game-before-classroom.html?video=1',
  duration: 19,
  events: [
    ev(0, p => p.evaluate(() => { state.i = 0; state.score = 0; state.answers = []; question(); })),
    cap(0, '3秒で選んで'),
    zoom(0.05, 'B', 1.18, 900),
    cap(0.9, 'A　B　C', 1),
    ev(2.9, p => p.dispatchEvent('.opt[data-opt="B"]', 'pointerdown')),
    cap(3.1, 'B を選択'),
    zoom(3.1, 'B', 1.9, 1600),
    cap(5.1, '会話に挟まれる'),
    zoom(8.4, 'A', 1.25, 700),
    cap(8.6, '一番平和 A', 1),
    ev(11.0, p => p.evaluate(() => { window.__cap(''); document.getElementById('next').click(); })),
    zoom(11.05, 'B', 1.12, 300),
    ev(11.6, p => p.evaluate(() => cover())),
    cap(11.6, '全20問', 1),
    over(14.0, chat('電車やエレベーターで、どこに座るか3秒で選ぶゲームを作って', 'できました。index.html です。')),
    cap(14.0, 'AI → 貼る → 公開', 1),
    over(14.8, img('game-editor.png', 'ジサップに貼る')),
    over(15.6, img('game-preview.png', '動いた')),
    over(16.4, img('game-done.png', '公開')),
    ev(17.2, p => p.evaluate(() => { window.__over(''); state.i = 1; question(); })),
    zoom(17.25, 'B', 1.12, 400),
    cap(17.2, 'ABCでコメント', 1),
  ],
  vo: [
    { t: 0.05, text: '3秒で選んで。', speed: 1.25 },
    { t: 1.2, text: 'A、B、Cのどこ？', speed: 1.25 },
    { t: 3.15, text: 'Bを選ぶと……' },
    { t: 5.3, text: '知らない2人の会話に、挟まれます。', speed: 1.3 },
    { t: 8.7, text: '一番平和なのは、A。' },
    { t: 11.7, text: 'こんな問題が、20問。' },
    { t: 14.05, text: 'AIのコードを、ジサップに貼って公開。', speed: 1.35 },
    { t: 17.35, text: '次は、どこに立つ？', speed: 1.3 },
  ],
  sfx: [
    { t: 0, name: 'tick' }, { t: 1, name: 'tick' }, { t: 2, name: 'tick' },
    { t: 2.9, name: 'tap' }, ...[3.1, 3.4, 3.7, 4.0, 4.3, 4.6, 4.9].map(t => ({ t, name: 'step', vol: .6 })),
    { t: 5.05, name: 'bad' }, { t: 8.6, name: 'pop' }, { t: 11.0, name: 'tap' }, { t: 11.6, name: 'whoosh' },
    { t: 14.0, name: 'whoosh' }, { t: 14.8, name: 'pop' }, { t: 15.6, name: 'pop' }, { t: 16.4, name: 'good' },
    { t: 17.2, name: 'tick' }, { t: 18.2, name: 'tick' },
  ],
};
