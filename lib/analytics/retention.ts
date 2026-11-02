/**
 * 今月の目標「アプリを続けて使ってもらう」のための集計（運営画面用）。
 * どれも日本時間の日付で数える。
 */

const DAY = 86400000;
export const jstDay = (at: string | number | Date) => new Date(new Date(at).getTime() + 9 * 3600000).toISOString().slice(0, 10);
const addDays = (day: string, n: number) => new Date(new Date(`${day}T00:00:00Z`).getTime() + n * DAY).toISOString().slice(0, 10);
const diffDays = (a: string, b: string) => Math.round((new Date(`${b}T00:00:00Z`).getTime() - new Date(`${a}T00:00:00Z`).getTime()) / DAY);

export type Ratio = { numerator: number; denominator: number };
/** 増減率（前の数が0のときは出せないので null） */
const change = (now: number, before: number) => (before ? (now - before) / before : null);

// ─── アプリの作成数 ───

export type CreatedApp = { created_at: string; creator_id: string | null };

/**
 * アプリ作成数と、前日・1週間前との増減。
 * 今日はまだ途中なので、比べるのは「昨日」と「その前日」「先週の同じ曜日」（どれも1日まるごと）
 */
export function summarizeCreation(apps: CreatedApp[], now: Date = new Date()) {
  const byDay = new Map<string, number>();
  for (const a of apps) byDay.set(jstDay(a.created_at), (byDay.get(jstDay(a.created_at)) ?? 0) + 1);
  const today = jstDay(now);
  const yesterday = addDays(today, -1);
  const count = (d: string) => byDay.get(d) ?? 0;
  const sum = (from: number, to: number) => Array.from({ length: to - from + 1 }, (_, i) => count(addDays(today, -(from + i)))).reduce((a, b) => a + b, 0);
  const last7 = sum(1, 7), prev7 = sum(8, 14);
  return {
    today: count(today),
    yesterday: count(yesterday),
    dayBefore: count(addDays(today, -2)),
    sameDayLastWeek: count(addDays(today, -8)),
    /** 昨日 ÷ その前日 − 1 */
    dayOverDay: change(count(yesterday), count(addDays(today, -2))),
    /** 昨日 ÷ 先週の同じ曜日 − 1 */
    weekOverWeek: change(count(yesterday), count(addDays(today, -8))),
    last7,
    prev7,
    /** 直近7日（昨日まで）÷ その前の7日 − 1 */
    last7Change: change(last7, prev7),
    /** 直近14日の日ごとの数（新しい順。今日を含む） */
    daily: Array.from({ length: 14 }, (_, i) => ({ day: addDays(today, -i), count: count(addDays(today, -i)) })),
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
  let creators = 0, twoOrMore = 0, cohort = 0, within7 = 0, daysSum = 0, secondCount = 0;
  const start = now.getTime() - periodDays * DAY, ready = now.getTime() - 7 * DAY;
  for (const times of byCreator.values()) {
    times.sort((a, b) => a - b);
    creators++;
    if (times.length >= 2) {
      twoOrMore++;
      daysSum += (times[1] - times[0]) / DAY;
      secondCount++;
    }
    if (times[0] >= start && times[0] <= ready) {
      cohort++;
      if (times.length >= 2 && times[1] - times[0] <= 7 * DAY) within7++;
    }
  }
  return {
    overall: { numerator: twoOrMore, denominator: creators } as Ratio,
    within7Days: { numerator: within7, denominator: cohort } as Ratio,
    /** 1つ目から2つ目までの平均日数 */
    avgDaysToSecond: secondCount ? daysSum / secondCount : null,
  };
}

// ─── 継続利用率 ───

type Event = { created_at: string; session_id: string | null; props: Record<string, unknown> | null };

/**
 * アプリの継続利用率（アプリ×ブラウザ単位）。
 * 期間内に初めて開き、そこから7日たったものを分母にして、
 * 翌日にも開いた割合（D1）と、7日以内に別の日にも開いた割合を出す。作者本人と作者以外に分ける。
 * iPhone のホーム画面から開いたものは保存領域が別でブラウザIDが変わるので、
 * home_first_launch の ref（案内を見た Safari 側の ID）で同じブラウザとして数える
 */
export function summarizeRetention(events: Event[], now: Date = new Date()) {
  const alias = new Map<string, string>();
  for (const e of events) {
    const p = e.props ?? {};
    if (p.action === 'home_first_launch' && typeof p.ref === 'string' && p.ref) alias.set(`${p.appId}:${p.visitor}`, `${p.appId}:${p.ref}`);
  }
  const opens = new Map<string, { days: Set<string>; owner: boolean; app: string }>();
  for (const e of events) {
    const p = e.props ?? {};
    if (p.action !== 'app_open' && p.action !== 'standalone_open') continue;
    const app = String(p.appId ?? ''), visitor = String(p.visitor || e.session_id || '');
    if (!app || !visitor) continue;
    const raw = `${app}:${visitor}`, key = alias.get(raw) ?? raw;
    const row = opens.get(key) ?? { days: new Set<string>(), owner: false, app };
    row.days.add(jstDay(e.created_at));
    if (p.owner === true) row.owner = true;
    opens.set(key, row);
  }
  const lastReady = addDays(jstDay(now), -7);
  const group = () => ({ d1: { numerator: 0, denominator: 0 } as Ratio, d7: { numerator: 0, denominator: 0 } as Ratio });
  const others = group(), owners = group();
  const apps = new Map<string, { cohort: number; returned: number }>();
  for (const row of opens.values()) {
    const days = [...row.days].sort();
    const first = days[0];
    if (first > lastReady) continue; // まだ7日たっていない
    const g = row.owner ? owners : others;
    const d1 = days.includes(addDays(first, 1));
    const d7 = days.some((d) => d !== first && diffDays(first, d) <= 7);
    g.d1.denominator++; g.d7.denominator++;
    if (d1) g.d1.numerator++;
    if (d7) g.d7.numerator++;
    const a = apps.get(row.app) ?? { cohort: 0, returned: 0 };
    a.cohort++; if (d7) a.returned++;
    apps.set(row.app, a);
  }
  return {
    others,
    owners,
    /** 7日以内にまた開いた人が多いアプリ（分母3以上） */
    topApps: [...apps].filter(([, a]) => a.cohort >= 3).map(([appId, a]) => ({ appId, ...a })).sort((x, y) => y.returned / y.cohort - x.returned / x.cohort).slice(0, 10),
  };
}
