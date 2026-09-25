/** 開発スタジオの「サンプルを動かす」で読み込む、AIが作ったような1ファイルアプリ */
export const SAMPLE_APP_TITLE = "反射神経タップ";

export const SAMPLE_APP_IDEA = "緑に変わった瞬間にタップして、反応速度を測るゲーム";

export const SAMPLE_APP_HTML = `<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>反射神経タップ</title>
<style>
  :root {
    --ink: #0f172a;
    --sub: #64748b;
    --wait: #f1f5f9;
    --ready: #059669;
    --early: #f43f5e;
  }
  * { box-sizing: border-box; margin: 0; }
  body {
    font-family: -apple-system, BlinkMacSystemFont, "Helvetica Neue", "Hiragino Sans", sans-serif;
    color: var(--ink);
    background: #fff;
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    -webkit-font-smoothing: antialiased;
  }
  header { padding: 20px 20px 8px; text-align: center; }
  h1 { font-size: 18px; font-weight: 800; letter-spacing: 0.02em; }
  .best { margin-top: 4px; font-size: 13px; color: var(--sub); }
  #pad {
    flex: 1;
    margin: 12px 16px 16px;
    border-radius: 24px;
    background: var(--wait);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 8px;
    cursor: pointer;
    user-select: none;
    -webkit-tap-highlight-color: transparent;
    transition: background 0.15s;
    min-height: 320px;
  }
  #pad.waiting { background: #e2e8f0; }
  #pad.ready { background: var(--ready); color: #fff; }
  #pad.early { background: var(--early); color: #fff; }
  #pad.result { background: #ecfdf5; }
  .big { font-size: 44px; font-weight: 800; font-variant-numeric: tabular-nums; }
  .msg { font-size: 15px; font-weight: 600; }
  .hint { font-size: 12px; opacity: 0.7; }
  .new { display: none; font-size: 12px; font-weight: 700; color: #fff; background: var(--ready); padding: 4px 10px; border-radius: 999px; }
  .new.show { display: inline-block; animation: pop 0.4s ease; }
  @keyframes pop { from { transform: scale(0.6); } to { transform: scale(1); } }
</style>
</head>
<body>
<header>
  <h1>反射神経タップ</h1>
  <p class="best">自己ベスト <span id="best">--</span></p>
</header>
<div id="pad" role="button" tabindex="0">
  <span class="new" id="new">自己ベスト更新</span>
  <span class="big" id="big">スタート</span>
  <span class="msg" id="msg">タップして始める</span>
  <span class="hint" id="hint">緑になった瞬間にタップ</span>
</div>
<script>
  const pad = document.getElementById("pad");
  const big = document.getElementById("big");
  const msg = document.getElementById("msg");
  const hint = document.getElementById("hint");
  const bestEl = document.getElementById("best");
  const newBadge = document.getElementById("new");
  let state = "idle";
  let timer = null;
  let shownAt = 0;
  let best = null;

  async function loadBest() {
    try {
      if (window.Zisup) best = await window.Zisup.loadData("best_ms");
    } catch (e) { best = null; }
    bestEl.textContent = best ? best + " ms" : "--";
  }

  async function saveBest(ms) {
    best = ms;
    bestEl.textContent = ms + " ms";
    try { if (window.Zisup) await window.Zisup.saveData("best_ms", ms); } catch (e) {}
  }

  function set(cls, b, m, h) {
    pad.className = cls;
    big.textContent = b;
    msg.textContent = m;
    hint.textContent = h;
  }

  function start() {
    newBadge.classList.remove("show");
    state = "waiting";
    set("waiting", "…", "まだ押さない", "緑になるまで待つ");
    timer = setTimeout(() => {
      state = "ready";
      shownAt = performance.now();
      set("ready", "今！", "タップ！", "");
    }, 1200 + Math.random() * 2300);
  }

  async function tap() {
    if (state === "idle" || state === "result" || state === "early") return start();
    if (state === "waiting") {
      clearTimeout(timer);
      state = "early";
      return set("early", "フライング", "早すぎました", "タップしてやり直す");
    }
    if (state === "ready") {
      const ms = Math.round(performance.now() - shownAt);
      state = "result";
      set("result", ms + " ms", ms < 250 ? "すごい反応速度" : ms < 350 ? "なかなか速い" : "もう一回いける", "タップしてもう一回");
      if (!best || ms < best) {
        newBadge.classList.add("show");
        await saveBest(ms);
      }
    }
  }

  pad.addEventListener("pointerdown", tap);
  pad.addEventListener("keydown", (e) => { if (e.key === " " || e.key === "Enter") { e.preventDefault(); tap(); } });
  loadBest();
</script>
</body>
</html>`;
