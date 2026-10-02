"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "@/lib/i18n/navigation";
import { JisappLogo } from "@/components/jisapp-logo";

/**
 * 運営画面：計測（多言語版の流入と利用の流れ、ベトナムからの月間訪問数）。運営画面なので日本語だけ。
 * 数字は scripts/add-analytics-events.sql の表から集計する
 */
type Row = { name: string; locale: string; utm_source: string; events: number; sessions: number };
type VnRow = { month: string; visits: number; page_views: number };

const FUNNEL: { name: string; label: string }[] = [
  { name: "page_view", label: "ページ表示" },
  { name: "prompt_copy", label: "指示文をコピー" },
  { name: "studio_paste", label: "スタジオに貼り付け" },
  { name: "preview", label: "プレビュー表示" },
  { name: "publish", label: "公開" },
  { name: "share", label: "共有" },
  { name: "signup", label: "新規登録" },
];
const LOCALES = ["ja", "en", "vi"];

/** 政令147号の対象になる目安（ベトナムからの月間訪問数） */
const VN_THRESHOLD = 100_000;

export default function AdminAnalyticsPage() {
  const [days, setDays] = useState(30);
  const [rows, setRows] = useState<Row[]>([]);
  const [vn, setVn] = useState<VnRow[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/admin/analytics?days=${days}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "読み込めませんでした");
      setRows(json.summary);
      setVn(json.vnMonthly);
    } catch (e) {
      setError(e instanceof Error ? e.message : "読み込めませんでした");
    } finally {
      setLoading(false);
    }
  }, [days]);

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

  /** 流入元ごと（ベトナム語ページ） */
  const viSources = useMemo(() => {
    const map = new Map<string, Map<string, number>>();
    for (const r of rows.filter((x) => x.locale === "vi")) {
      const m = map.get(r.utm_source) ?? new Map<string, number>();
      m.set(r.name, (m.get(r.name) ?? 0) + Number(r.sessions));
      map.set(r.utm_source, m);
    }
    return [...map.entries()].sort((a, b) => (b[1].get("page_view") ?? 0) - (a[1].get("page_view") ?? 0));
  }, [rows]);

  const thisMonth = vn[0];
  const ratio = thisMonth ? Number(thisMonth.visits) / VN_THRESHOLD : 0;

  return (
    <div className="min-h-screen bg-[#f3f4f2]">
      <header className="border-b border-gray-200 bg-white px-4 py-3">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <JisappLogo href="/" />
          <Link href="/admin/review" className="text-sm font-semibold text-emerald-700 hover:underline">
            運営画面へ戻る
          </Link>
        </div>
      </header>
      <main className="mx-auto max-w-5xl space-y-6 px-4 py-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-xl font-black text-gray-900">計測（多言語版）</h1>
          <div className="flex items-center gap-2 text-sm">
            {[7, 30, 90].map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => setDays(d)}
                className={`rounded-full px-3 py-1 font-semibold ${days === d ? "bg-emerald-600 text-white" : "bg-white text-gray-600 ring-1 ring-gray-200"}`}
              >
                直近{d}日
              </button>
            ))}
          </div>
        </div>

        {error && <p className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-900 ring-1 ring-amber-200">{error}</p>}
        {loading && <p className="text-sm text-gray-500">読み込み中…</p>}

        {!loading && !error && (
          <>
            <section className="rounded-2xl bg-white p-5 ring-1 ring-gray-200">
              <h2 className="font-bold text-gray-900">ベトナムからの月間訪問数</h2>
              <p className="mt-1 text-xs text-gray-500">
                政令147号の対象の目安は月間{VN_THRESHOLD.toLocaleString()}訪問。訪問 = ブラウザのタブごとの訪問（同じ人が別の日に来ると別に数える）
              </p>
              {thisMonth ? (
                <>
                  <p className="mt-3 text-3xl font-black text-gray-900">
                    {Number(thisMonth.visits).toLocaleString()}
                    <span className="ml-1 text-sm font-semibold text-gray-500">訪問（{thisMonth.month}）</span>
                  </p>
                  <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-gray-100">
                    <div
                      className={`h-full ${ratio >= 0.8 ? "bg-rose-500" : ratio >= 0.5 ? "bg-amber-500" : "bg-emerald-500"}`}
                      style={{ width: `${Math.min(100, ratio * 100)}%` }}
                    />
                  </div>
                  {ratio >= 0.5 && (
                    <p className="mt-2 text-sm font-bold text-rose-600">目安の{Math.round(ratio * 100)}%に達しています。弁護士に相談してください</p>
                  )}
                  <table className="mt-4 w-full text-sm">
                    <thead className="text-left text-xs text-gray-500">
                      <tr><th className="py-1">月</th><th>訪問</th><th>ページ表示</th></tr>
                    </thead>
                    <tbody>
                      {vn.map((r) => (
                        <tr key={r.month} className="border-t border-gray-100">
                          <td className="py-1.5">{r.month}</td>
                          <td>{Number(r.visits).toLocaleString()}</td>
                          <td>{Number(r.page_views).toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </>
              ) : (
                <p className="mt-3 text-sm text-gray-500">まだ記録がありません</p>
              )}
            </section>

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
                          <td key={l}>{(funnel.get(`${f.name}:${l}`) ?? 0).toLocaleString()}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="mt-2 text-xs text-gray-400">日本語ページの「ページ表示」は、ベトナムからのアクセスだけ数えています</p>
            </section>

            <section className="rounded-2xl bg-white p-5 ring-1 ring-gray-200">
              <h2 className="font-bold text-gray-900">ベトナム語ページの流入元（utm_source）</h2>
              <div className="mt-3 overflow-x-auto">
                <table className="w-full min-w-[560px] text-sm">
                  <thead className="text-left text-xs text-gray-500">
                    <tr>
                      <th className="py-1">流入元</th>
                      {FUNNEL.map((f) => <th key={f.name}>{f.label}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {viSources.map(([source, m]) => (
                      <tr key={source} className="border-t border-gray-100">
                        <td className="py-1.5">{source === "-" ? "（直接・不明）" : source}</td>
                        {FUNNEL.map((f) => <td key={f.name}>{(m.get(f.name) ?? 0).toLocaleString()}</td>)}
                      </tr>
                    ))}
                  </tbody>
                </table>
                {viSources.length === 0 && <p className="mt-2 text-sm text-gray-500">まだ記録がありません</p>}
              </div>
            </section>
          </>
        )}
      </main>
    </div>
  );
}
