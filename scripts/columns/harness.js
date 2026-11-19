// コラムの写真の撮影用（shoot.mjs がアプリの HTML の先頭に入れる）。時計を固定し、window.Jisapp を localStorage で置きかえ、架空のデータを先に入れる。
// window.__SPEC = {
//   fix: '2026-11-18T19:30:00+09:00',               // 画面の「いま」
//   me: '高橋', group: 'バドミントン部',               // 開いている人とグループの名前
//   items: { key: [[書いた人, 値, 何分前, id?]] },    // Jisapp.shared.add で足す一覧
//   vals: { key: 値 },                                // Jisapp.shared.save の値
//   act: "読み込んだあとにする操作の JS",              // タブを押す・スクロールするなど
// }
// window.__fire(key) で「ほかの人が変えた」知らせを起こせる
(function () {
  const SPEC = window.__SPEC;
  const FIX = new Date(SPEC.fix).getTime();
  const RealDate = Date;
  class FakeDate extends RealDate { constructor(...a) { if (a.length === 0) super(FIX); else super(...a); } static now() { return FIX; } }
  window.Date = FakeDate;
  localStorage.clear();
  let n = 0;
  for (const [k, list] of Object.entries(SPEC.items || {})) {
    localStorage.setItem('sh:' + k, JSON.stringify(list.map(([who, value, ago, id]) => ({ id: id || 'i' + (++n), value, author: { id: 'm-' + who, name: who }, createdAt: new RealDate(FIX - (ago ?? 60) * 60000).toISOString() }))));
  }
  for (const [k, v] of Object.entries(SPEC.vals || {})) localStorage.setItem('sv:' + k, JSON.stringify(v));
  const me = { id: 'm-' + SPEC.me, name: SPEC.me };
  const get = (k) => JSON.parse(localStorage.getItem('sh:' + k) || '[]');
  const set = (k, v) => localStorage.setItem('sh:' + k, JSON.stringify(v));
  const subs = {};
  window.__fire = (k) => (subs[k] || []).forEach((f) => f());
  window.Jisapp = {
    me: async () => me,
    group: async () => ({ id: 'g1', name: SPEC.group || 'テスト' }),
    saveData: async (k, v) => localStorage.setItem('pd:' + k, JSON.stringify(v)),
    loadData: async (k) => JSON.parse(localStorage.getItem('pd:' + k) || 'null'),
    shared: {
      add: async (k, value) => { const a = get(k); const it = { id: 'i' + Math.random().toString(36).slice(2), value, author: me, createdAt: new RealDate(FIX).toISOString() }; a.push(it); set(k, a); return { ...it, mine: true }; },
      list: async (k) => get(k).map((i) => ({ ...i, mine: i.author.id === me.id })),
      remove: async (k, id) => { set(k, get(k).filter((i) => i.id !== id)); return true; },
      save: async (k, v) => { localStorage.setItem('sv:' + k, JSON.stringify(v)); return v; },
      load: async (k) => JSON.parse(localStorage.getItem('sv:' + k) || 'null'),
      onChange: (k, fn) => { (subs[k] = subs[k] || []).push(fn); },
    },
  };
  window.addEventListener('load', () => setTimeout(async () => {
    if (SPEC.act) await (0, eval)('(async () => {' + SPEC.act + '})()');
    setTimeout(() => document.querySelectorAll('*').forEach((e) => { e.style.animation = 'none'; e.style.transition = 'none'; }), SPEC.settle ?? 900);
  }, 700));
})();
