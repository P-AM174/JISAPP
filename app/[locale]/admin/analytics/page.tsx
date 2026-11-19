"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { JisappLogo } from "@/components/jisapp-logo";
import { AdminMenu } from "@/components/admin/admin-menu";
import { EngagementPanel } from '@/components/admin/engagement-panel';
import type { summarizeEngagement } from '@/lib/analytics/engagement-summary';
import type { summarizeGoal } from '@/lib/analytics/retention';
import { CreationPanel, RetentionPanel } from '@/components/admin/retention-panel';
import { ColumnPanel } from '@/components/admin/column-panel';
import type { summarizeColumns } from '@/lib/analytics/columns-summary';
import type { Segment } from '@/lib/analytics/retention';
import { TrendSheet, countSeries, dailySeries, rateSeries, type TrendSeries, type Trends } from '@/components/admin/trend-sheet';
import type { TrendOpeners } from '@/components/admin/trend-openers';

/**
 * 運営画面：計測。「基本」（期間のまとめ・作成数・利用の流れ・流入・国・貼り付け）、「継続利用」（今月の目標・公開後の行動）、
 * 「コラム」（記事の訪問・読まれ方・流入元・そのあと）の3つに分け、言語（全体・日本語・英語）と期間で絞る。運営画面なので日本語だけ。
 * 数字は scripts/add-analytics-events.sql の表から集計する
 */
type Row = { name: string; locale: string; utm_source: string; events: number; sessions: number };
type SourceRow = { name: string; kind: string; visits: number; paste: number; publish: number; signup: number };

const KIND_LABEL: Record<string, string> = { ai: "AI", search: "検索", sns: "SNS・動画", share: "共有ボタン", direct: "直接・不明", other: "そのほかのサイト" };
const KIND_COLOR: Record<string, string> = {
  ai: "bg-violet-100 text-violet-800",
  search: "bg-sky-100 text-sky-800",
  sns: "bg-rose-100 text-rose-800",
  share: "bg-emerald-100 text-emerald-800",
  direct: "bg-gray-100 text-gray-600",
  other: "bg-amber-100 text-amber-800",
};
const pct = (n: number, d: number) => (d ? `${Math.round((n / d) * 100)}%` : "-");
/** 訪問（セッション）の数のグラフにつける補足 */
const SESSION_NOTE = "訪問の数は日（時間）ごとに数えるので、日をまたいだ訪問は両方の日に入ります。そのため、グラフの合計は表の数より少し多くなることがあります。";
/** タップできる行・数字の見た目 */
const TAP = "cursor-pointer rounded-md transition-colors hover:bg-emerald-50 active:bg-emerald-100";

const FUNNEL: { name: string; label: string }[] = [
  { name: "page_view", label: "ページ表示" },
  { name: "prompt_copy", label: "指示文をコピー" },
  { name: "studio_paste", label: "スタジオに貼り付け" },
  { name: "preview", label: "プレビュー表示" },
  { name: "publish", label: "公開" },
  { name: "audience", label: "誰と使うかを選んだ" },
  { name: "share", label: "共有" },
  { name: "signup", label: "新規登録" },
];
type Tab = "basic" | "retention" | "column";
const TABS: { id: Tab; label: string }[] = [
  { id: "basic", label: "基本" },
  { id: "retention", label: "継続利用" },
  { id: "column", label: "コラム" },
];
const SEGMENTS: { id: Segment; label: string }[] = [
  { id: "all", label: "全体" },
  { id: "ja", label: "日本語" },
  { id: "en", label: "英語" },
];
type Overview = { visits: number; pageViews: number; appsCreated: number; publishes: number; signups: number };


export default function AdminAnalyticsPage() {
  const [engagement,setEngagement]=useState<ReturnType<typeof summarizeEngagement>|null>(null);
  const [excludedAccounts, setExcludedAccounts] = useState<number | null>(null);
  const [goal, setGoal] = useState<ReturnType<typeof summarizeGoal> | null>(null);
  const [days, setDays] = useState(30);
  const [tab, setTab] = useState<Tab>("basic");
  const [segment, setSegment] = useState<Segment>("all");
  const [overview, setOverview] = useState<Overview | null>(null);
  const [columns, setColumns] = useState<ReturnType<typeof summarizeColumns> | null>(null);
  const [rows, setRows] = useState<Row[]>([]);
  const [pastes, setPastes] = useState<Record<string, number>>({});
  const [countries, setCountries] = useState<{ country: string; views: number; visits: number }[]>([]);
  const [sources, setSources] = useState<SourceRow[]>([]);
  const [aiByDay, setAiByDay] = useState<{ day: string; counts: Record<string, number> }[]>([]);
  /** 項目をタップしたときに出す折れ線グラフの数 */
  const [trends, setTrends] = useState<Trends | null>(null);
  const [trendSeries, setTrendSeries] = useState<TrendSeries | null>(null);
  /** 件数の項目をタップした（key は trends.counts のキー） */
  const openTrend = ({ key, ...meta }: { key: string; title: string; unit: string; note?: string }) => { if (trends) setTrendSeries(countSeries(trends, key, meta)); };
  /** 継続利用・コラムのパネルに渡す（パネルの中の項目をタップしたとき） */
  const openers: TrendOpeners | null = trends && goal ? {
    count: (key, meta) => setTrendSeries(countSeries(trends, key, meta)),
    rate: (key, meta) => setTrendSeries(rateSeries(trends, key, meta)),
    daily: (seg, key, meta, kind) => setTrendSeries(dailySeries(trends, goal[seg].daily, key, meta, kind)),
  } : null;
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/admin/analytics?days=${days}${segment === "all" ? "" : `&locale=${segment}`}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "読み込めませんでした");
      setRows(json.summary);
      setOverview(json.overview ?? null);
      setColumns(json.columns ?? null);
      setEngagement(json.engagement??null);
      setGoal(json.goal ?? null);
      setExcludedAccounts(typeof json.excludedAccounts === 'number' ? json.excludedAccounts : null);
      setPastes(json.pasteBreakdown ?? {});
      setCountries(json.countries ?? []);
      setSources(json.sources ?? []);
      setAiByDay(json.aiByDay ?? []);
      setTrends(json.trends ?? null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "読み込めませんでした");
    } finally {
      setLoading(false);
    }
  }, [days, segment]);

  useEffect(() => {
    void load();
  }, [load]);

  /** イベント × 言語 の訪問数（セッション数） */
  const funnel = useMemo(() => {
    const map = new Map<string, number>();
    for (const r of rows) {
      const key = `${r.name}:${r.locale}`;
      map.set(key, (map.get(key) ?? 0) + Number(r.sessions));
    }
    return map;
  }, [rows]);
  const LOCALES = segment === "all" ? ["ja", "en"] : [segment];



  return (
    <div className="min-h-screen bg-[#f3f4f2]">
      <header className="border-b border-gray-200 bg-white px-4 py-3">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <JisappLogo href="/" />
          <AdminMenu />
        </div>
      </header>
      <main className="mx-auto max-w-5xl space-y-6 px-4 py-8">
        <div>
          <h1 className="text-xl font-black text-gray-900">計測</h1>
          <p className="mt-0.5 text-[11px] text-gray-500">運営・本人（P-AM のアカウントと管理者）の操作と、そのアカウントで作ったアプリは、どの数にも入れていません{excludedAccounts !== null && `（見つかったアカウント：${excludedAccounts}件）`}</p>
        </div>

        {/* 見る内容（カード）・言語・期間 */}
        <div className="sticky top-0 z-30 -mx-4 space-y-2 bg-[#f3f4f2]/95 px-4 py-2 backdrop-blur">
          <div className="grid grid-cols-3 gap-1 rounded-2xl bg-white p-1 ring-1 ring-gray-200">
            {TABS.map((t) => (
              <button key={t.id} type="button" onClick={() => setTab(t.id)}
                className={`rounded-xl py-2 text-sm font-bold transition-colors ${tab === t.id ? "bg-emerald-600 text-white shadow-sm" : "text-gray-600 hover:bg-gray-50"}`}>
                {t.label}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
            <div className="flex items-center gap-1.5">
              {SEGMENTS.map((g) => (
                <button key={g.id} type="button" onClick={() => setSegment(g.id)}
                  className={`rounded-full px-3 py-1 font-semibold ${segment === g.id ? "bg-gray-900 text-white" : "bg-white text-gray-600 ring-1 ring-gray-200"}`}>
                  {g.label}
                </button>
              ))}
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              {/* 1日 = いまから24時間前まで */}
              {[1, 7, 30, 90].map((d) => (
                <button key={d} type="button" onClick={() => setDays(d)}
                  className={`rounded-full px-3 py-1 font-semibold ${days === d ? "bg-emerald-600 text-white" : "bg-white text-gray-600 ring-1 ring-gray-200"}`}>
                  {d === 1 ? "直近24時間" : `直近${d}日`}
                </button>
              ))}
            </div>
          </div>
        </div>

        {!loading && !error && (
          <p className="text-xs font-semibold text-emerald-700">
            {tab === "retention"
              ? "数字をタップすると、日ごとの推移のグラフが出ます（割合は、初めて開いた日・案内を見た日ごと）"
              : `数字や行をタップすると、${days === 1 ? "1時間" : "1日"}ごとの推移のグラフが出ます`}
          </p>
        )}
        {error && <p className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-900 ring-1 ring-amber-200">{error}</p>}
        {loading && <p className="text-sm text-gray-500">読み込み中…</p>}

        {!loading && !error && (
          <>
            {tab === "retention" && (
              <>
                <RetentionPanel goal={goal} segment={segment} open={openers} />
                <EngagementPanel data={engagement} open={openers}/>
              </>
            )}

            {tab === "column" && <ColumnPanel data={columns} open={openers} />}

            {tab === "basic" && (
            <>
            {overview && (
              <section className="grid grid-cols-2 gap-3 sm:grid-cols-5">
                {([
                  ["訪問数", overview.visits, "訪問", "visits"],
                  ["ページ表示", overview.pageViews, "回", "pageViews"],
                  ["アプリの作成数", overview.appsCreated, "件", "appsCreated"],
                  ["公開（上書きを含む）", overview.publishes, "回", "publishes"],
                  ["新規登録", overview.signups, "人", "signups"],
                ] as const).map(([label, value, unit, key]) => (
                  <button
                    key={label}
                    type="button"
                    onClick={() => openTrend({ key: `overview:${key}`, title: label, unit, note: key === "visits" ? SESSION_NOTE : undefined })}
                    className="rounded-2xl bg-white p-4 text-left ring-1 ring-gray-200 transition-colors hover:bg-emerald-50/60 hover:ring-emerald-200"
                  >
                    <p className="text-2xl font-black tracking-tight text-gray-900">{value.toLocaleString()}<span className="ml-0.5 text-xs font-bold text-gray-500">{unit}</span></p>
                    <p className="mt-0.5 text-xs font-semibold text-gray-500">{label}</p>
                  </button>
                ))}
              </section>
            )}
            <CreationPanel goal={goal} segment={segment} />

            <section className="rounded-2xl bg-white p-5 ring-1 ring-gray-200">
              <h2 className="font-bold text-gray-900">利用の流れ（言語別・訪問数）</h2>
              <div className="mt-3 overflow-x-auto">
                <table className="w-full min-w-[480px] text-sm">
                  <thead className="text-left text-xs text-gray-500">
                    <tr>
                      <th className="py-1">ステップ</th>
                      {LOCALES.map((l) => <th key={l}>{l}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {FUNNEL.map((f) => (
                      <tr key={f.name} className="border-t border-gray-100">
                        <td className="py-1.5">{f.label}</td>
                        {LOCALES.map((l) => (
                          <td key={l}>
                            <button
                              type="button"
                              onClick={() => openTrend({ key: `funnel:${f.name}:${l}`, title: `${f.label}（${l}）`, unit: "訪問", note: SESSION_NOTE })}
                              className={`px-1.5 py-0.5 tabular-nums underline decoration-gray-300 decoration-dotted underline-offset-4 ${TAP}`}
                            >
                              {(funnel.get(`${f.name}:${l}`) ?? 0).toLocaleString()}
                            </button>
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="mt-2 text-xs text-gray-400">日本語ページの「ページ表示」は、2026-10-10 から数えています（それより前はベトナムからのアクセスだけ）</p>
            </section>

            <section className="rounded-2xl bg-white p-5 ring-1 ring-gray-200">
              <h2 className="font-bold text-gray-900">開発スタジオの貼り付けの内訳</h2>
              {(() => {
                const LABEL: Record<string, string> = {
                  none: "動いた",
                  own_prompt: "さっきのプロンプトを貼った（AIが書き終わる前にコピー）",
                  prompt: "AIに送る文章（プロンプト）を貼った",
                  not_html: "コードではない文章を貼った",
                  truncated: "コードが途中で切れていた",
                  unknown: "動かなかった（内訳を数え始める前）",
                };
                const total = Object.values(pastes).reduce((a, b) => a + b, 0);
                const list = Object.entries(pastes).sort((a, b) => b[1] - a[1]);
                return total === 0 ? (
                  <p className="mt-2 text-sm text-gray-500">まだ記録がありません</p>
                ) : (
                  <ul className="mt-3 space-y-1.5 text-sm">
                    {list.map(([k, n]) => (
                      <li key={k}>
                        <button
                          type="button"
                          onClick={() => openTrend({ key: `paste:${k}`, title: `貼り付け：${LABEL[k] ?? k}`, unit: "回" })}
                          className={`flex w-full items-center gap-3 py-0.5 text-left ${TAP}`}
                        >
                          <span className="w-14 shrink-0 text-right font-bold tabular-nums">{n.toLocaleString()}</span>
                          <span className="w-12 shrink-0 text-right text-xs text-gray-400 tabular-nums">{Math.round((n / total) * 100)}%</span>
                          <span className={k === "none" ? "text-emerald-700" : "text-gray-700"}>{LABEL[k] ?? k}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                );
              })()}
            </section>

            <section className="rounded-2xl bg-white p-5 ring-1 ring-gray-200">
              <h2 className="font-bold text-gray-900">どこから来たか（訪問ごと）</h2>
              <p className="mt-1 text-xs text-gray-500">
                訪問の最初に記録した utm_source と、参照元のドメインで分けています。参照元は 2026-10-15 から記録しているので、それより前の訪問の多くは「直接・不明」になります。
                動画の説明欄のURLには ?utm_source=tiktok / youtube をつけてください。
              </p>
              <div className="mt-3 overflow-x-auto">
                <table className="w-full min-w-[560px] text-sm">
                  <thead className="text-left text-xs text-gray-500">
                    <tr><th className="py-1">流入元</th><th>種類</th><th>訪問</th><th>貼り付け</th><th>公開</th><th>登録</th></tr>
                  </thead>
                  <tbody>
                    {sources.map((r) => (
                      <tr
                        key={r.name}
                        onClick={() => openTrend({ key: `source:${r.name}`, title: `${r.name} からの訪問`, unit: "訪問", note: "訪問の最初の記録の日（時間）に数えています。表の「訪問」と同じ数です。" })}
                        className={`border-t border-gray-100 ${TAP}`}
                      >
                        <td className="py-1.5 font-semibold">{r.name}</td>
                        <td><span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${KIND_COLOR[r.kind] ?? KIND_COLOR.other}`}>{KIND_LABEL[r.kind] ?? r.kind}</span></td>
                        <td className="tabular-nums">{r.visits.toLocaleString()}</td>
                        <td className="tabular-nums">{r.paste} <span className="text-xs text-gray-400">{pct(r.paste, r.visits)}</span></td>
                        <td className="tabular-nums">{r.publish} <span className="text-xs text-gray-400">{pct(r.publish, r.visits)}</span></td>
                        <td className="tabular-nums">{r.signup} <span className="text-xs text-gray-400">{pct(r.signup, r.visits)}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {sources.length === 0 && <p className="mt-2 text-sm text-gray-500">まだ記録がありません</p>}
              </div>

              <h3 className="mt-5 text-sm font-bold text-gray-900">AIからの流入（日ごとの訪問）</h3>
              {aiByDay.length === 0 ? (
                <p className="mt-2 text-sm text-gray-500">まだ記録がありません</p>
              ) : (
                <div className="mt-2 overflow-x-auto">
                  {(() => {
                    const names = [...new Set(aiByDay.flatMap((d) => Object.keys(d.counts)))].sort();
                    return (
                      <table className="w-full min-w-[360px] text-sm">
                        <thead className="text-left text-xs text-gray-500">
                          <tr><th className="py-1">日付</th>{names.map((n) => <th key={n}>{n}</th>)}<th>合計</th></tr>
                        </thead>
                        <tbody>
                          {aiByDay.map((d) => (
                            <tr key={d.day} className="border-t border-gray-100">
                              <td className="py-1.5 tabular-nums">{d.day}</td>
                              {names.map((n) => <td key={n} className="tabular-nums">{d.counts[n] ?? 0}</td>)}
                              <td className="font-bold tabular-nums">{Object.values(d.counts).reduce((a, b) => a + b, 0)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    );
                  })()}
                </div>
              )}
            </section>

            <section className="rounded-2xl bg-white p-5 ring-1 ring-gray-200">
              <h2 className="font-bold text-gray-900">国別の訪問（ページ表示）</h2>
              <div className="mt-3 overflow-x-auto">
                <table className="w-full min-w-[320px] text-sm">
                  <thead className="text-left text-xs text-gray-500">
                    <tr><th className="py-1">国</th><th>訪問数</th><th>ページ表示</th></tr>
                  </thead>
                  <tbody>
                    {countries.map((c) => (
                      <tr
                        key={c.country}
                        onClick={() => openTrend({ key: `country:${c.country}`, title: `${c.country} からの訪問`, unit: "訪問", note: SESSION_NOTE })}
                        className={`border-t border-gray-100 ${TAP}`}
                      >
                        <td className="py-1.5">{c.country}</td>
                        <td>{c.visits.toLocaleString()}</td>
                        <td>{c.views.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {countries.length === 0 && <p className="mt-2 text-sm text-gray-500">まだ記録がありません</p>}
              </div>
              <p className="mt-2 text-xs text-gray-400">国は Vercel が判定した2文字の国コード（JP=日本、IN=インド、GB=イギリス、IR=イラン など）</p>
            </section>
            </>
            )}

          </>
        )}
      </main>
      {trendSeries && <TrendSheet series={trendSeries} onClose={() => setTrendSeries(null)} />}
    </div>
  );
}
