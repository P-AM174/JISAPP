/**
 * 計測に入れない人（運営・本人の確認操作）。
 * - ジサップでの名前がこの一覧にあるアカウント（大文字・小文字は区別しない）
 * - 管理者（role が ADMIN）
 * この人がログインしているあいだの記録は、サーバーで捨てる（/api/analytics）。
 * 一度ログインしたブラウザ・運営画面を開いたブラウザは、ログアウトしても記録を送らない（EXCLUDED_BROWSER_KEY）。
 * 運営画面の集計では、この人のアカウントで作ったアプリと、そのアプリを作者として開いたブラウザの記録を、過去の分も除く
 */
export const EXCLUDED_ACCOUNT_NAMES = ["P-AM", "P-AM174"];

/** このブラウザでは計測しない、という印（localStorage） */
export const EXCLUDED_BROWSER_KEY = "jisapp:analytics:excluded";

export function isExcludedAccount(user: { name?: string | null; role?: string | null } | null | undefined): boolean {
  if (!user) return false;
  if (user.role === "ADMIN") return true;
  const name = (user.name ?? "").trim().toLowerCase();
  return !!name && EXCLUDED_ACCOUNT_NAMES.some((n) => n.toLowerCase() === name);
}

type Ev = { name: string; session_id: string | null; props: Record<string, unknown> | null };

/**
 * 運営画面の集計から、運営・本人の記録を除く（過去の分も）。
 * 記録にはアカウントが入っていないので、次の順に見分ける：
 * 1. 運営・本人のアカウントで作ったアプリ（excludedAppIds）を、作者として開いた・公開したブラウザ（visitor）
 * 2. そのブラウザが iPhone のホーム画面から開いたときのブラウザ（home_first_launch の ref）
 * 3. そのブラウザの訪問（session_id）のすべての記録と、そのアプリを公開した記録
 */
export function filterExcludedEvents<T extends Ev>(events: T[], excludedAppIds: Set<string>): T[] {
  if (!excludedAppIds.size) return events;
  const visitors = new Set<string>();
  const sessions = new Set<string>();
  const appOf = (e: Ev) => (typeof e.props?.appId === "string" ? e.props.appId : "");
  for (const e of events) {
    const p = e.props ?? {};
    if (!excludedAppIds.has(appOf(e))) continue;
    if (e.name === "publish") { if (e.session_id) sessions.add(e.session_id); continue; }
    if (e.name === "engagement" && (p.owner === true || p.action === "publish_shown" || p.action === "icon_saved")) {
      if (typeof p.visitor === "string" && p.visitor) visitors.add(p.visitor);
      if (e.session_id) sessions.add(e.session_id);
    }
  }
  for (const e of events) {
    const p = e.props ?? {};
    if (p.action === "home_first_launch" && typeof p.ref === "string" && visitors.has(p.ref) && typeof p.visitor === "string") visitors.add(p.visitor);
  }
  for (const e of events) {
    const v = e.props?.visitor;
    if (typeof v === "string" && visitors.has(v) && e.session_id) sessions.add(e.session_id);
  }
  return events.filter((e) => {
    if (e.session_id && sessions.has(e.session_id)) return false;
    const v = e.props?.visitor;
    if (typeof v === "string" && visitors.has(v)) return false;
    if (e.name === "publish" && excludedAppIds.has(appOf(e))) return false;
    return true;
  });
}
