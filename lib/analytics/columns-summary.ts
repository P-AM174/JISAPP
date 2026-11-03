import { classifySource } from "@/lib/analytics/sources";

/**
 * 運営画面の計測「コラム」：コラム一覧・記事ごとの訪問、どこまで読まれたか、どこから来たか、
 * 記事の中で何を押したか、そのあと同じ訪問でアプリ作りまで進んだか。
 * - 記事は path（/column/{slug}、英語は /en/column/{slug}）で見分ける
 * - どこから来たか：その記事が訪問の最初のページなら、訪問の流入元（utm・参照元）。
 *   サイトの中から来たときは、ひとつ前のページ（page_view の props.from。2026-11-04 から記録）で分ける
 * - 読まれた位置・押したもの（column_read・column_click）は 2026-11-04 から記録
 */
export type ColumnEvent = {
  name: string;
  path: string | null;
  created_at: string;
  session_id: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  props: Record<string, unknown> | null;
};

const COLUMN_PATH = /^\/(?:(?:en|vi|ja)\/)?column(?:\/([^/?#]+))?\/?$/;

/** path がコラムなら、一覧は ""、記事は slug。コラムでなければ null */
export function columnSlugOf(path: string | null | undefined): string | null {
  if (!path) return null;
  const m = COLUMN_PATH.exec(path);
  if (!m) return null;
  try {
    return m[1] ? decodeURIComponent(m[1]) : "";
  } catch {
    return m[1] ?? "";
  }
}

/** サイトの中のひとつ前のページを、分かりやすい名前に */
function internalFrom(from: unknown): string {
  if (typeof from !== "string" || !from) return "サイト内（前のページ不明）";
  const slug = columnSlugOf(from);
  if (slug === "") return "サイト内：コラム一覧";
  if (slug) return "サイト内：ほかの記事";
  if (/^\/((en|vi|ja)\/?)?$/.test(from)) return "サイト内：トップ";
  if (/\/apps\//.test(from)) return "サイト内：アプリのページ";
  if (/\/playground/.test(from)) return "サイト内：開発スタジオ";
  return "サイト内：そのほか";
}

export const CLICK_LABEL: Record<string, string> = {
  app: "記事の中のアプリ",
  studio: "開発スタジオへ",
  next_column: "次の記事",
  column_list: "コラム一覧へ",
  popular_app: "人気のアプリ",
  share_x: "X でシェア",
  copy: "リンクをコピー",
  link: "本文のリンク（サイト内）",
  outbound: "本文のリンク（外のサイト）",
};

type Counter = Map<string, Set<string>>;
const add = (m: Counter, key: string, session: string) => {
  const s = m.get(key) ?? new Set<string>();
  s.add(session);
  m.set(key, s);
};
const sizes = (m: Counter) =>
  [...m.entries()].map(([name, s]) => ({ name, visits: s.size })).sort((a, b) => b.visits - a.visits);

export function summarizeColumns(events: ColumnEvent[], titles: Map<string, string>) {
  const sorted = [...events].sort((a, b) => a.created_at.localeCompare(b.created_at));

  // 訪問ごとの流入元（最初のイベント）と、最初のページ表示
  const firstEvent = new Map<string, ColumnEvent>();
  const firstView = new Map<string, ColumnEvent>();
  for (const e of sorted) {
    if (!e.session_id) continue;
    if (!firstEvent.has(e.session_id)) firstEvent.set(e.session_id, e);
    if (e.name === "page_view" && !firstView.has(e.session_id)) firstView.set(e.session_id, e);
  }
  const sourceOf = (session: string) => {
    const f = firstEvent.get(session);
    const ref = firstView.get(session)?.props?.ref;
    return classifySource({ utmSource: f?.utm_source, utmMedium: f?.utm_medium, ref: typeof ref === "string" ? ref : null }).name;
  };

  const list = { views: 0, sessions: new Set<string>() };
  type Article = {
    views: number;
    /** 記事の言語（英語の記事は /en/column/…） */
    en: boolean;
    sessions: Set<string>;
    sources: Counter;
    clicks: Counter;
    firstSeen: Map<string, string>;
    read: Map<string, { depth: number; sec: number }>;
  };
  const articles = new Map<string, Article>();
  const article = (slug: string) => {
    let a = articles.get(slug);
    if (!a) {
      a = { views: 0, en: false, sessions: new Set(), sources: new Map(), clicks: new Map(), firstSeen: new Map(), read: new Map() };
      articles.set(slug, a);
    }
    return a;
  };
  // 記事を読んだ訪問（最初に記事を開いた時刻）
  const readerSince = new Map<string, string>();

  for (const e of sorted) {
    const slug = columnSlugOf(e.path);
    if (slug === null) continue;
    const s = e.session_id;
    if (e.name === "page_view") {
      if (slug === "") {
        list.views++;
        if (s) list.sessions.add(s);
        continue;
      }
      const a = article(slug);
      a.views++;
      if ((e.path ?? "").startsWith("/en/")) a.en = true;
      if (!s) continue;
      if (!a.sessions.has(s)) {
        a.sessions.add(s);
        a.firstSeen.set(s, e.created_at);
        const entry = firstView.get(s) === e;
        add(a.sources, entry ? sourceOf(s) : internalFrom(e.props?.from), s);
      }
      if (!readerSince.has(s)) readerSince.set(s, e.created_at);
    } else if (slug && s && e.name === "column_read") {
      const a = article(slug);
      const depth = Number(e.props?.depth) || 0;
      const sec = Number(e.props?.sec) || 0;
      const r = a.read.get(s) ?? { depth: 0, sec: 0 };
      a.read.set(s, { depth: Math.max(r.depth, depth), sec: Math.max(r.sec, sec) });
    } else if (slug && s && e.name === "column_click") {
      const target = typeof e.props?.target === "string" ? e.props.target : "link";
      add(article(slug).clicks, target, s);
    }
  }

  // 記事を読んだあと、同じ訪問で進んだこと（記事を開いた時刻より後の記録だけ）
  const STEPS = ["prompt_copy", "studio_paste", "publish", "signup"] as const;
  type Step = (typeof STEPS)[number];
  const steps = new Map<string, { name: Step; at: string }[]>();
  for (const e of sorted) {
    if (!e.session_id || !(STEPS as readonly string[]).includes(e.name)) continue;
    const list = steps.get(e.session_id) ?? [];
    list.push({ name: e.name as Step, at: e.created_at });
    steps.set(e.session_id, list);
  }
  const progress = (since: Map<string, string>) => {
    const out: Record<Step, number> = { prompt_copy: 0, studio_paste: 0, publish: 0, signup: 0 };
    for (const [s, at] of since) {
      const done = new Set((steps.get(s) ?? []).filter((x) => x.at >= at).map((x) => x.name));
      for (const step of done) out[step]++;
    }
    return out;
  };

  const rows = [...articles.entries()]
    .filter(([, a]) => a.sessions.size > 0)
    .map(([slug, a]) => {
      const reads = [...a.read.values()];
      const secs = reads.map((r) => r.sec).filter((x) => x > 0).sort((x, y) => x - y);
      return {
        slug,
        title: titles.get(slug) ?? slug,
        href: `${a.en ? "/en" : ""}/column/${slug}`,
        visits: a.sessions.size,
        views: a.views,
        /** どこまで読まれたかが分かる訪問の数（2026-11-04 から） */
        readers: reads.length,
        half: reads.filter((r) => r.depth >= 50).length,
        finished: reads.filter((r) => r.depth >= 100).length,
        avgDepth: reads.length ? Math.round(reads.reduce((x, r) => x + r.depth, 0) / reads.length) : null,
        medianSec: secs.length ? secs[Math.floor(secs.length / 2)] : null,
        sources: sizes(a.sources),
        clicks: sizes(a.clicks),
        progress: progress(a.firstSeen),
      };
    })
    .sort((x, y) => y.visits - x.visits);

  const allSources: Counter = new Map();
  for (const a of articles.values()) for (const [name, s] of a.sources) for (const id of s) add(allSources, name, id);

  return {
    list: { views: list.views, visits: list.sessions.size },
    articles: {
      views: rows.reduce((x, r) => x + r.views, 0),
      visits: readerSince.size,
      progress: progress(readerSince),
      sources: sizes(allSources),
    },
    rows,
  };
}
