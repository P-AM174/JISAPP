import { engagement, visitorId } from './engagement';

/**
 * 「ホーム画面に実際に追加した人」を数えるための仕組み。
 *
 * - iPhone は「ホーム画面に追加」が終わったことをページに知らせない。そこで、ホーム画面のアイコンから
 *   初めて起動したとき（standalone で開いたとき）を「追加した」と数える（home_first_launch）。
 * - iPhone では、ホーム画面から開いたアプリの保存領域（localStorage）が Safari と別になる。
 *   そのままだと「案内を見た人（Safari のブラウザID）」と「起動した人（ホーム画面側のブラウザID）」が結び付かない。
 *   そのため、案内を出したときに、ホーム画面に保存される起動 URL（今のページの URL とマニフェストの start_url）へ
 *   Safari 側のブラウザID を ref として載せておき、初めて起動したときにその ref を一緒に記録する。
 * - ref はランダムなブラウザID（engagement の visitor と同じもの）だけで、名前やアカウントは含めない。
 */

const REF_PARAM = 'ref';
const LAUNCH_PARAM = 'launch';
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export type HomePlatform = 'ios' | 'android' | 'other';

export function homePlatform(): HomePlatform {
  if (typeof navigator === 'undefined') return 'other';
  const ua = navigator.userAgent;
  if (/iPhone|iPad|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1)) return 'ios';
  if (/Android/.test(ua)) return 'android';
  return 'other';
}

/** ホーム画面のアイコンから開いているか */
export function launchedFromHome(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia?.('(display-mode: standalone)').matches || (navigator as Navigator & { standalone?: boolean }).standalone === true;
}

/**
 * 「ホーム画面に追加」の案内を出したときに呼ぶ。
 * 今のページの URL と、マニフェストの読み込み先に、案内を見たブラウザの ID を載せる（追加されるとそのまま起動 URL になる）
 */
export function tagHomeLaunchUrl(appId: string): void {
  if (typeof window === 'undefined') return;
  const ref = visitorId();
  if (!ref) return;
  try {
    const u = new URL(window.location.href);
    if (u.searchParams.get(REF_PARAM) !== ref || u.searchParams.get(LAUNCH_PARAM) !== 'home') {
      u.searchParams.set(LAUNCH_PARAM, 'home');
      u.searchParams.set(REF_PARAM, ref);
      window.history.replaceState(window.history.state, '', u.pathname + u.search + u.hash);
    }
    const link = document.querySelector<HTMLLinkElement>('link[rel="manifest"]');
    if (link && link.href.includes(`/api/apps/${appId}/manifest`)) {
      const m = new URL(link.href, window.location.origin);
      if (m.searchParams.get(REF_PARAM) !== ref) {
        m.searchParams.set(REF_PARAM, ref);
        link.href = m.pathname + m.search;
      }
    }
  } catch { /* 記録できなくてもアプリは使える */ }
}

/**
 * アプリを開いたときに呼ぶ。ホーム画面から開いていて、この端末（この保存領域）で初めてなら home_first_launch を送る。
 * iPhone では追加するたびに保存領域が新しくなるので、「追加1回につき1件」になる
 */
export function recordHomeLaunch(appId: string, owner: boolean): void {
  if (!launchedFromHome()) return;
  const params = new URL(window.location.href).searchParams;
  const ref = params.get(REF_PARAM) ?? '';
  const key = `jisapp:home_launched:${appId}`;
  let first = false;
  try {
    first = !localStorage.getItem(key);
    if (first) localStorage.setItem(key, new Date().toISOString());
  } catch { /* 保存できない端末では、初回かどうか分からないので送らない */ }
  if (first) engagement('home_first_launch', appId, { platform: homePlatform(), owner, ...(UUID.test(ref) ? { ref } : {}) });
}
