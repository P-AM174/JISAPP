// 動画5 押してはいけないボタン（17秒）。最後の画面は最初と同じ（ループ）
const ev = (t, fn) => ({ t, do: fn });
const cap = (t, text, y) => ev(t, p => p.evaluate(([a, b]) => window.__cap(a, b), [text, !!y]));
const center = '(() => { const r = document.getElementById("red").getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2]; })()';
module.exports = {
  url: 'file:///home/user/JISAPP/docs/sns/2026-11-videos/dont-press.html',
  duration: 17,
  // 字幕はボタンの板に重ならないよう、下のほうに出す
  prep: p => p.evaluate(() => { window.__cap(''); document.getElementById('__cap').style.bottom = '9%'; }),
  events: [
    cap(0, '押さないで', 1),
    // 指がゆっくり近づく
    ev(1.0, p => p.evaluate(() => { const r = document.getElementById('red').getBoundingClientRect(); window.__finger(r.left + r.width / 2 + 40, window.innerHeight + 40); })),
    ev(1.1, p => p.evaluate(() => { const r = document.getElementById('red').getBoundingClientRect(); window.__finger(r.left + r.width / 2 - 20, r.top + r.height / 2 + 10); })),
    cap(1.0, '警告しました'),
    ev(3.0, p => p.evaluate(() => window.__tap())),
    ev(3.0, p => p.dispatchEvent('#red', 'pointerdown')),
    cap(3.0, '押しましたね', 1),
    ev(4.6, p => p.evaluate(() => window.__tap())),
    ev(5.0, p => p.evaluate(() => window.__tap())),
    ev(5.0, p => p.dispatchEvent('#red', 'pointerdown')),
    ev(5.1, p => p.evaluate(() => window.__finger(0, 0, false))),
    cap(5.1, '捕まえて'),
    // 逃げるボタンを追いかけて、捕まえる
    ev(7.3, p => p.evaluate(() => { const r = document.querySelector('.runner').getBoundingClientRect(); window.__finger(r.left + r.width / 2 - 20, r.top + r.height / 2 + 10); })),
    ev(7.6, p => p.evaluate(() => { window.__tap(); clearInterval(moveT); })),
    ev(7.65, p => p.dispatchEvent('.runner', 'pointerdown')),
    ev(7.9, p => p.evaluate(() => window.__finger(0, 0, false))),
    cap(7.7, '3　2　1', 1),
    cap(10.3, '何も起きません'),
    cap(12.95, '押す？　押さない？', 1),
    cap(16.4, '押さないで', 1),
  ],
  vo: [
    { t: 0.05, text: 'このボタン、絶対に押さないで。', speed: 1.3 },
    { t: 1.6, text: '本当に、押さないで。', speed: 1.2 },
    { t: 3.1, text: '押した。', speed: 1.1 },
    { t: 5.2, text: 'もう一回押すと、逃げます。', speed: 1.3 },
    { t: 7.7, text: '捕まえると……3、2、1。', speed: 1.1 },
    { t: 10.4, text: '何も起きません。', speed: 1.1 },
    { t: 13.1, text: 'あなたは、何回押す？', speed: 1.15 },
  ],
  sfx: [
    { t: 3.0, name: 'click' }, { t: 3.05, name: 'warn', vol: .7 }, { t: 5.0, name: 'click' },
    ...[5.15, 5.8, 6.45, 7.1].map(t => ({ t, name: 'boop' })), { t: 7.65, name: 'click' },
    { t: 7.7, name: 'beep' }, { t: 8.6, name: 'beep' }, { t: 9.5, name: 'beep' }, { t: 10.4, name: 'tada' },
  ],
};
