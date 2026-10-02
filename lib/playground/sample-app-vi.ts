/**
 * ベトナム語版の開発スタジオで「サンプルを動かす」と読み込むアプリ。
 * ベトナム語ページではゲームを前面に出さない（lib/features.ts）ため、反射神経ゲームの代わりに割り勘の計算ツールにする。
 * 画面の文言はベトナム語（機械翻訳・ネイティブ未確認）。数字は vi-VN の書式（1.000 のようにピリオド区切り）
 * フォントに system-ui を使わない（日本語版 Windows では日本語フォントになり、声調記号がばらけて表示される）
 */
export const SAMPLE_APP_HTML_VI = `<!DOCTYPE html>
<html lang="vi">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Chia tiền nhóm</title>
<style>
  * { box-sizing: border-box; margin: 0; }
  input, button { font: inherit; }
  body {
    /* Fonts with Vietnamese glyphs first (system-ui can be a CJK font on some Windows setups) */
    font-family: -apple-system, "Segoe UI", Roboto, "Noto Sans", "Helvetica Neue", Arial, sans-serif;
    line-height: 1.5;
    color: #0f172a;
    background: #f8fafc;
    min-height: 100vh;
    display: flex;
    justify-content: center;
    padding: 24px 16px;
  }
  .card {
    width: 100%;
    max-width: 380px;
    background: #fff;
    border-radius: 20px;
    padding: 24px 20px;
    box-shadow: 0 10px 30px rgba(15, 23, 42, 0.08);
  }
  h1 { font-size: 22px; font-weight: 800; }
  .sub { color: #64748b; font-size: 14px; margin-top: 4px; }
  label { display: block; font-size: 14px; font-weight: 700; margin-top: 18px; }
  input {
    width: 100%;
    margin-top: 6px;
    padding: 12px 14px;
    font-size: 18px;
    border: 1px solid #e2e8f0;
    border-radius: 12px;
    outline: none;
  }
  input:focus { border-color: #059669; box-shadow: 0 0 0 3px rgba(5, 150, 105, 0.15); }
  .row { display: flex; gap: 8px; margin-top: 6px; }
  .row button {
    flex: 1;
    padding: 10px 0;
    font-size: 15px;
    font-weight: 700;
    border: 1px solid #e2e8f0;
    border-radius: 12px;
    background: #fff;
    cursor: pointer;
  }
  .row button.on { background: #059669; border-color: #059669; color: #fff; }
  .result {
    margin-top: 22px;
    padding: 18px;
    border-radius: 16px;
    background: #ecfdf5;
    text-align: center;
  }
  .result .label { font-size: 14px; color: #047857; font-weight: 700; }
  .result .amount { font-size: 34px; font-weight: 800; color: #065f46; margin-top: 4px; }
  .result .note { font-size: 13px; color: #64748b; margin-top: 6px; }
</style>
</head>
<body>
<main class="card">
  <h1>Chia tiền nhóm</h1>
  <p class="sub">Nhập tổng tiền và số người, app tính giúp mỗi người trả bao nhiêu.</p>

  <label for="total">Tổng tiền (₫)</label>
  <input id="total" type="text" inputmode="numeric" placeholder="Ví dụ: 450.000" autocomplete="off">

  <label for="people">Số người</label>
  <input id="people" type="number" inputmode="numeric" min="1" value="3">

  <label>Tiền tip</label>
  <div class="row" id="tips">
    <button type="button" data-tip="0" class="on">0%</button>
    <button type="button" data-tip="5">5%</button>
    <button type="button" data-tip="10">10%</button>
  </div>

  <section class="result" aria-live="polite">
    <div class="label">Mỗi người trả</div>
    <div class="amount" id="each">0 ₫</div>
    <div class="note" id="note">Làm tròn lên đến 1.000 ₫</div>
  </section>
</main>

<script>
  const money = new Intl.NumberFormat("vi-VN");
  const totalInput = document.getElementById("total");
  const peopleInput = document.getElementById("people");
  const each = document.getElementById("each");
  const note = document.getElementById("note");
  let tip = 0;

  function readTotal() {
    return Number(totalInput.value.replace(/[^0-9]/g, "")) || 0;
  }

  function update() {
    const total = readTotal();
    const people = Math.max(1, Math.floor(Number(peopleInput.value) || 1));
    // integer math so 450.000 + 10% split by 3 is exactly 165.000 (no floating-point rounding up)
    const withTip = Math.round((total * (100 + tip)) / 100);
    const share = Math.ceil(withTip / people / 1000) * 1000;
    each.textContent = money.format(share) + " ₫";
    note.textContent = total
      ? "Tổng cộng " + money.format(withTip) + " ₫ · làm tròn lên đến 1.000 ₫"
      : "Làm tròn lên đến 1.000 ₫";
  }

  totalInput.addEventListener("input", () => {
    const n = readTotal();
    totalInput.value = n ? money.format(n) : "";
    update();
  });
  peopleInput.addEventListener("input", update);
  document.getElementById("tips").addEventListener("click", (e) => {
    const btn = e.target.closest("button");
    if (!btn) return;
    tip = Number(btn.dataset.tip);
    document.querySelectorAll("#tips button").forEach((b) => b.classList.toggle("on", b === btn));
    update();
  });
  update();
</script>
</body>
</html>
`;
