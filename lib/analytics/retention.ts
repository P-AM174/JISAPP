/**
 * 今月の目標「アプリを続けて使ってもらう」のための集計（運営画面用）。
 * 全体・日本語版・英語版に分けて出す。日付はどれも日本時間。
 */

const DAY = 86400000;
export const jstDay = (at: string | number | Date) => new Date(new Date(at).getTime() + 9 * 3600000).toISOString().slice(0, 10);
const addDays = (day: string, n: number) => new Date(new Date(`${day}T00:00:00Z`).getTime() + n * DAY).toISOString().slice(0, 10);
const diffDays = (a: string, b: string) => Math.round((new Date(`${b}T00:00:00Z`).getTime() - new Date(`${a}T00:00:00Z`).getTime()) / DAY);

export type Ratio = { numerator: number; denominator: number };
const ratio = (): Ratio => ({ numerator: 0, denominator: 0 });
const tally = (r: Ratio, hit: boolean) => { r.denominator++; if (hit) r.numerator++; };
/** 増減率（前の数が0のときは出せないので null） */
const change = (now: number, before: number) => (before ? (now - before) / before : null);

export type GoalEvent = { name: string; created_at: string; session_id: string | null; locale?: string | null; props: Record<string, unknown> | null };
export type CreatedApp = { id?: string; created_at: string; creator_id: string | null };
export type Segment = 'all' | 'ja' | 'en';
export const SEGMENTS: Segment[] = ['all', 'ja', 'en'];

/** 送り先の分類（SNS に投稿・メッセージで送る・それ以外） */
const SNS = new Set(['x', 'facebook']);
const MESSAGE = new Set(['line', 'sms', 'whatsapp', 'telegram', 'messenger', 'zalo', 'mail']);

// ─── アプリの作成数 ───

/**
 * アプリ作成数と、前日・1週間前との増減。
 * 今日はまだ途中なので、比べるのは「昨日」と「その前日」「先週の同じ曜日」（どれも1日まるごと）
 */
export function summarizeCreation(createdAt: string[], now: Date = new Date()) {
  const byDay = new Map<string, number>();
  for (const at of createdAt) byDay.set(jstDay(at), (byDay.get(jstDay(at)) ?? 0) + 1);
  const today = jstDay(now);
  const count = (d: string) => byDay.get(d) ?? 0;
  const ago = (n: number) => count(addDays(today, -n));
  const sum = (from: number, to: number) => Array.from({ length: to - from + 1 }, (_, i) => ago(from + i)).reduce((a, b) => a + b, 0);
  const last7 = sum(1, 7), prev7 = sum(8, 14);
  return {
    today: ago(0),
    yesterday: ago(1),
    dayBefore: ago(2),
    sameDayLastWeek: ago(8),
    /** 昨日 ÷ その前日 − 1 */
    dayOverDay: change(ago(1), ago(2)),
    /** 昨日 ÷ 先週の同じ曜日 − 1 */
    weekOverWeek: change(ago(1), ago(8)),
    last7,
    prev7,
    /** 直近7日（昨日まで）÷ その前の7日 − 1 */
    last7Change: change(last7, prev7),
    /** 直近14日の日ごとの数（新しい順。今日を含む） */
    daily: Array.from({ length: 14 }, (_, i) => ({ day: addDays(today, -i), count: ago(i) })),
  };
}

/**
 * 2つ目のアプリを作った率（ログインして作った人だけ。ゲストは誰が作ったか分からない）。
 * - 全体：アプリを作ったことのある人のうち、2つ以上作った人
 * - 7日以内：期間内に最初のアプリを作り、そこから7日たった人のうち、7日以内に2つ目を作った人
 */
export function summarizeSecondApp(apps: CreatedApp[], periodDays: number, now: Date = new Date()) {
  const byCreator = new Map<string, number[]>();
  for (const a of apps) {
    if (!a.creator_id) continue;
    const list = byCreator.get(a.creator_id) ?? [];
    list.push(new Date(a.created_at).getTime());
    byCreator.set(a.creator_id, list);
  }
  const overall = ratio(), within7Days = ratio();
  let daysSum = 0, seconds = 0;
  const start = now.getTime() - periodDays * DAY, ready = now.getTime() - 7 * DAY;
  for (const times of byCreator.values()) {
    times.sort((a, b) => a - b);
    tally(overall, times.length >= 2);
    if (times.length >= 2) { daysSum += (times[1] - times[0]) / DAY; seconds++; }
    if (times[0] >= start && times[0] <= ready) tally(within7Days, times.length >= 2 && times[1] - times[0] <= 7 * DAY);
  }
  return { overall, within7Days, avgDaysToSecond: seconds ? daysSum / seconds : null };
}

// ─── 継続利用（アプリ×ブラウザ） ───

type Row = { app: string; days: Set<string>; saveDays: Set<string>; owner: boolean; kind: string; installed: boolean };

/**
 * 公開後の行動から、継続利用と、ホーム画面・共有の率を出す（1つの言語、または全体）。
 * - 分母は「期間内に初めて開き、そこから7日（D30 は30日）たったアプリ×ブラウザ」
 * - iPhone のホーム画面から開いたものはブラウザIDが別になるので、home_first_launch の ref で Safari 側と同じとみなす
 */
export function summarizeUsage(events: GoalEvent[], now: Date = new Date()) {
  const eng = events.filter((e) => e.name === 'engagement');
  const alias = new Map<string, string>();
  for (const e of eng) {
    const p = e.props ?? {};
    if (p.action === 'home_first_launch' && typeof p.ref === 'string' && p.ref) alias.set(`${p.appId}:${p.visitor}`, `${p.appId}:${p.ref}`);
  }
  const keyOf = (p: Record<string, unknown>, e: GoalEvent) => {
    const app = String(p.appId ?? ''), visitor = String(p.visitor || e.session_id || '');
    if (!app || !visitor) return null;
    const raw = `${app}:${visitor}`;
    return { app, key: alias.get(raw) ?? raw };
  };

  const rows = new Map<string, Row>();
  const row = (app: string, key: string) => {
    let r = rows.get(key);
    if (!r) { r = { app, days: new Set(), saveDays: new Set(), owner: false, kind: 'unknown', installed: false }; rows.set(key, r); }
    return r;
  };
  const sentApps = new Set<string>();
  const publishers = new Set<string>(), shownHome = new Set<string>();
  const sharedBy = { sns: new Set<string>(), message: new Set<string>(), other: new Set<string>() };
  let groupsCreated = 0, groupsJoined = 0;

  for (const e of eng) {
    const p = e.props ?? {};
    const k = keyOf(p, e);
    if (!k) continue;
    const day = jstDay(e.created_at);
    switch (p.action) {
      case 'app_open':
      case 'standalone_open': {
        const r = row(k.app, k.key);
        r.days.add(day);
        if (p.owner === true) r.owner = true;
        if (typeof p.kind === 'string') r.kind = p.kind;
        break;
      }
      case 'home_first_launch': row(k.app, k.key).installed = true; break;
      case 'data_saved': row(k.app, k.key).saveDays.add(day); break;
      case 'publish_shown': publishers.add(k.key); break;
      case 'home_shown': shownHome.add(k.key); break;
      case 'share_clicked': {
        sentApps.add(k.app);
        const c = String(p.channel ?? '');
        (SNS.has(c) ? sharedBy.sns : MESSAGE.has(c) ? sharedBy.message : sharedBy.other).add(k.key);
        break;
      }
      case 'group_created': groupsCreated++; break;
      case 'group_joined': groupsJoined++; break;
    }
  }

  const today = jstDay(now);
  const group = () => ({ d1: ratio(), d7: ratio(), d30: ratio() });
  const others = group(), owners = group();
  const byKind: Record<string, Ratio> = { saves: ratio(), shared: ratio(), plain: ratio(), unknown: ratio() };
  const byHome = { installed: ratio(), notInstalled: ratio() };
  const bySent = { sent: ratio(), notSent: ratio() };
  const dataSaved = { any: ratio(), twoDays: ratio() };
  const homeAdded = ratio(), homeAddedAfterGuide = ratio();
  const topApps = new Map<string, Ratio>();

  for (const [key, r] of rows) {
    if (!r.days.size) continue;
    const days = [...r.days].sort();
    const first = days[0];
    tally(homeAdded, r.installed);
    if (shownHome.has(key)) tally(homeAddedAfterGuide, r.installed);
    if (diffDays(first, today) < 7) continue; // まだ7日たっていない
    const g = r.owner ? owners : others;
    const d7 = days.some((d) => d !== first && diffDays(first, d) <= 7);
    tally(g.d1, days.includes(addDays(first, 1)));
    tally(g.d7, d7);
    if (diffDays(first, today) >= 30) tally(g.d30, days.some((d) => diffDays(first, d) >= 30));
    // 比べる数（作者本人も含めた全員の「7日以内にまた開いた」）
    tally(byKind[r.kind] ?? byKind.unknown, d7);
    tally(r.installed ? byHome.installed : byHome.notInstalled, d7);
    tally(sentApps.has(r.app) ? bySent.sent : bySent.notSent, d7);
    tally(dataSaved.any, r.saveDays.size >= 1);
    tally(dataSaved.twoDays, r.saveDays.size >= 2);
    const a = topApps.get(r.app) ?? ratio();
    tally(a, d7);
    topApps.set(r.app, a);
  }

  const shareRate = (set: Set<string>): Ratio => ({ numerator: [...publishers].filter((k) => set.has(k)).length, denominator: publishers.size });
  return {
    retention: { others, owners },
    byKind,
    byHome,
    bySent,
    dataSaved,
    groups: { created: groupsCreated, joined: groupsJoined },
    rates: {
      /** アプリを開いたうち、ホーム画面に追加した（ホーム画面から初めて起動した） */
      homeAdded,
      /** ホーム画面に追加の案内を見たうち、追加した */
      homeAddedAfterGuide,
      /** 公開完了の画面を見たうち、SNS（X・Facebook）に送るボタンを押した */
      sns: shareRate(sharedBy.sns),
      /** 公開完了の画面を見たうち、メッセージ（LINE・メッセージ・WhatsApp など）で送るボタンを押した */
      message: shareRate(sharedBy.message),
      /** 公開完了の画面を見たうち、どれかで送った（ほかのアプリ・リンクのコピーを含む） */
      any: shareRate(new Set([...sharedBy.sns, ...sharedBy.message, ...sharedBy.other])),
    },
    /** 7日以内にまた開いた人が多いアプリ（分母3以上） */
    topApps: [...topApps].filter(([, a]) => a.denominator >= 3).map(([appId, a]) => ({ appId, cohort: a.denominator, returned: a.numerator })).sort((x, y) => y.returned / y.cohort - x.returned / x.cohort).slice(0, 10),
  };
}

/**
 * 運営画面の「今月の目標」をまとめて出す。全体・日本語版・英語版に分ける。
 * - 継続利用・率：その言語のページで起きた行動だけで数える（全体はすべて。ベトナム語も含む）
 * - 作成数：全体は apps 表、言語別は「公開」の記録（上書きを除く）のページの言語
 * - 2つ目のアプリ：全体は apps 表。言語別は、そのアプリを公開したページの言語が分かるもの（公開の記録に appId を入れ始めてから）
 */
export function summarizeGoal({ events, apps, periodDays, now = new Date() }: { events: GoalEvent[]; apps: CreatedApp[]; periodDays: number; now?: Date }) {
  const since = now.getTime() - periodDays * DAY;
  const inPeriod = events.filter((e) => new Date(e.created_at).getTime() >= since);
  const appLocale = new Map<string, string>();
  for (const e of events) {
    const p = e.props ?? {};
    if (e.name === 'publish' && p.overwrite !== true && typeof p.appId === 'string' && e.locale) appLocale.set(p.appId, e.locale);
  }
  const result = {} as Record<Segment, ReturnType<typeof summarizeUsage> & { creation: ReturnType<typeof summarizeCreation>; secondApp: ReturnType<typeof summarizeSecondApp> }>;
  for (const seg of SEGMENTS) {
    const pick = (e: GoalEvent) => seg === 'all' || e.locale === seg;
    const createdAt = seg === 'all'
      ? apps.map((a) => a.created_at)
      : events.filter((e) => e.name === 'publish' && e.props?.overwrite !== true && e.locale === seg).map((e) => e.created_at);
    const segApps = seg === 'all' ? apps : apps.filter((a) => a.id && appLocale.get(a.id) === seg);
    result[seg] = { ...summarizeUsage(inPeriod.filter(pick), now), creation: summarizeCreation(createdAt, now), secondApp: summarizeSecondApp(segApps, periodDays, now) };
  }
  return result;
}
