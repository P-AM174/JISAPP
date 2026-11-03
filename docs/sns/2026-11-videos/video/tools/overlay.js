// 撮影用の重ね部品（字幕・全面の差し込み・指）。アプリのコードには入れず、撮影のときだけ足す
(() => {
  const css = `
  #__cap { position: fixed; left: 50%; bottom: 23%; transform: translateX(-50%); z-index: 2147483000; pointer-events: none; text-align: center; width: 94%; }
  #__cap span { display: inline-block; font-family: "Dela Gothic One", "M PLUS Rounded 1c", sans-serif; font-size: 40px; line-height: 1.15; color: #fff; -webkit-text-stroke: 9px #000; paint-order: stroke fill; letter-spacing: .02em; animation: __pop .18s ease-out; }
  #__cap span.y { color: #ffd23f; }
  #__over { position: fixed; inset: 0; z-index: 2147482000; display: none; }
  #__over.on { display: block; animation: __in .15s ease-out; }
  #__finger { position: fixed; z-index: 2147483500; width: 96px; height: 96px; pointer-events: none; transition: left .6s ease, top .6s ease, transform .12s; display: none; filter: drop-shadow(0 6px 8px rgba(0,0,0,.4)); }
  #__finger.tap { transform: scale(.85); }
  @keyframes __pop { from { transform: scale(.6); opacity: 0; } to { transform: scale(1); opacity: 1; } }
  @keyframes __in { from { opacity: 0; transform: scale(1.03); } to { opacity: 1; transform: none; } }`;
  const ready = () => {
    if (document.getElementById('__cap')) return;
    const st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);
    const c = document.createElement('div'); c.id = '__cap'; document.body.appendChild(c);
    const o = document.createElement('div'); o.id = '__over'; document.body.appendChild(o);
    const f = document.createElement('div'); f.id = '__finger';
    f.innerHTML = '<svg viewBox="0 0 64 64"><path d="M26 6c3 0 5 2 5 5v18l3-1c3-1 5 1 6 3l1 1 2-1c3-1 5 1 6 3l2-1c3 0 5 2 5 5v9c0 8-6 15-15 15h-4c-6 0-10-3-13-8l-9-14c-2-3 0-6 3-6 2 0 3 1 5 3l3 4V11c0-3 2-5 5-5z" fill="#fff" stroke="#111" stroke-width="3" stroke-linejoin="round"/></svg>';
    document.body.appendChild(f);
  };
  document.addEventListener('DOMContentLoaded', ready);
  window.__cap = (t, yellow) => { ready(); const c = document.getElementById('__cap'); c.innerHTML = t ? `<span class="${yellow ? 'y' : ''}">${t}</span>` : ''; };
  window.__over = (html) => { ready(); const o = document.getElementById('__over'); o.innerHTML = html; o.className = html ? 'on' : ''; };
  window.__finger = (x, y, show = true) => { ready(); const f = document.getElementById('__finger'); f.style.display = show ? 'block' : 'none'; f.style.left = x + 'px'; f.style.top = y + 'px'; };
  window.__tap = () => { const f = document.getElementById('__finger'); f.classList.add('tap'); setTimeout(() => f.classList.remove('tap'), 140); };
  // カメラのズーム：#stage の中の、ページ上の位置 (x, y) を中心に scale 倍
  window.__zoom = (scale, x, y, ms = 600) => { const st = document.getElementById('stage'); if (!st) return; const r = st.getBoundingClientRect(); st.style.overflow = 'hidden'; const svg = st.querySelector('svg'); svg.style.transition = 'transform ' + ms + 'ms cubic-bezier(.3,.8,.3,1)'; svg.style.transformOrigin = (x - r.left) + 'px ' + (y - r.top) + 'px'; svg.style.transform = 'scale(' + scale + ')'; };
  window.__zoomOpt = (L, scale, ms) => { const el = document.querySelector('.opt[data-opt="' + L + '"] .glowc'); if (!el) return; const r = el.getBoundingClientRect(); window.__zoom(scale, r.left + r.width / 2, r.top + r.height / 2 - 30, ms); };
  window.__nudge = () => { ready(); const c = document.getElementById('__cap'); c.style.opacity = '.99'; requestAnimationFrame(() => c.style.opacity = ''); };
})();
