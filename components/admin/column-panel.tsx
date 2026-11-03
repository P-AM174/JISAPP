"use client";

import { CLICK_LABEL, type summarizeColumns } from "@/lib/analytics/columns-summary";

type Data = ReturnType<typeof summarizeColumns>;
type Progress = Data["articles"]["progress"];

const pct = (n: number, d: number) => (d ? `${Math.round((n / d) * 100)}%` : "—");
const secLabel = (s: number | null) => (s === null ? "—" : s < 60 ? `${s}秒` : `${Math.floor(s / 60)}分${s % 60 ? `${s % 60}秒` : ""}`);

function Tile({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-xl bg-amber-50/60 p-3 ring-1 ring-amber-100">
      <p className="text-[11px] font-semibold text-gray-500">{label}</p>
      <p className="mt-1 text-2xl font-black text-gray-900">{value}</p>
      {sub && <p className="mt-0.5 text-[11px] text-gray-500">{sub}</p>}
    </div>
  );
}

function ProgressLine({ p, base }: { p: Progress; base: number }) {
  const items: [string, number][] = [["指示文コピー", p.prompt_copy], ["貼り付け", p.studio_paste], ["公開", p.publish], ["新規登録", p.signup]];
  return (
    <span className="flex flex-wrap gap-x-3 gap-y-0.5">
      {items.map(([label, n]) => (
        <span key={label} className="whitespace-nowrap">
          {label} <b className="text-gray-900">{n}</b> <span className="text-gray-400">{pct(n, base)}</span>
        </span>
      ))}
    </span>
  );
}

/** 計測の「コラム」：コラムの訪問、記事ごとの読まれ方・流入元・押されたもの・そのあとアプリ作りまで進んだか */
export function ColumnPanel({ data }: { data: Data | null }) {
  if (!data) return null;
  const { list, articles, rows } = data;
  return (
    <>
      <section className="rounded-2xl bg-white p-5 ring-1 ring-gray-200">
        <h2 className="font-bold text-gray-900">コラム全体</h2>
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Tile label="記事の訪問" value={articles.visits.toLocaleString()} sub={`${articles.views.toLocaleString()} ページ表示`} />
          <Tile label="一覧ページの訪問" value={list.visits.toLocaleString()} sub={`${list.views.toLocaleString()} ページ表示`} />
          <Tile label="読んだあと貼り付けまで" value={articles.progress.studio_paste.toLocaleString()} sub={`記事の訪問の ${pct(articles.progress.studio_paste, articles.visits)}`} />
          <Tile label="読んだあと公開まで" value={articles.progress.publish.toLocaleString()} sub={`記事の訪問の ${pct(articles.progress.publish, articles.visits)}`} />
        </div>
        <p className="mt-3 text-xs text-gray-600">
          記事を読んだあと、同じ訪問で：<ProgressLine p={articles.progress} base={articles.visits} />
        </p>

        <h3 className="mt-5 text-sm font-bold text-gray-900">記事にどこから来たか（訪問）</h3>
        {articles.sources.length === 0 ? (
          <p className="mt-2 text-sm text-gray-500">まだ記録がありません</p>
        ) : (
          <ul className="mt-2 space-y-1 text-sm">
            {articles.sources.slice(0, 12).map((s) => (
              <li key={s.name} className="flex items-center gap-2">
                <span className="relative h-4 w-32 shrink-0 overflow-hidden rounded bg-gray-50 ring-1 ring-gray-200 sm:w-48">
                  <span className="absolute inset-y-0 left-0 bg-amber-400" style={{ width: `${(s.visits / articles.sources[0].visits) * 100}%` }} />
                </span>
                <b className="w-10 text-right tabular-nums">{s.visits}</b>
                <span className="text-gray-700">{s.name}</span>
              </li>
            ))}
          </ul>
        )}
        <p className="mt-3 text-[11px] leading-relaxed text-gray-500">
          記事が訪問の最初のページなら、その訪問の流入元（検索・X・AI など）。サイトの中から来たときは、ひとつ前のページで「サイト内：〜」に分けます（前のページは 2026-11-04 から記録。それより前は「前のページ不明」）。
        </p>
      </section>

      <section className="rounded-2xl bg-white p-5 ring-1 ring-gray-200">
        <h2 className="font-bold text-gray-900">記事ごと</h2>
        <p className="mt-1 text-[11px] text-gray-500">
          どこまで読まれたか・押したものは 2026-11-04 から記録しています。「最後まで」は本文の終わりが画面に入ったもの、「読んでいた時間」は画面に出していた時間の真ん中の値です。
        </p>
        {rows.length === 0 ? (
          <p className="mt-3 text-sm text-gray-500">この期間に読まれた記事はありません</p>
        ) : (
          <ul className="mt-3 space-y-3">
            {rows.map((r) => (
              <li key={r.slug} className="rounded-xl bg-gray-50 p-4 ring-1 ring-gray-100">
                <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                  <a href={r.href} target="_blank" rel="noreferrer" className="min-w-0 flex-1 font-bold text-gray-900 hover:text-emerald-700">{r.title}</a>
                  <span className="text-sm"><b className="text-lg tabular-nums">{r.visits}</b> 訪問 <span className="text-xs text-gray-400">（{r.views} 表示）</span></span>
                </div>

                <div className="mt-3 grid gap-3 text-xs sm:grid-cols-3">
                  <div>
                    <p className="font-bold text-gray-600">どこまで読まれたか</p>
                    {r.readers === 0 ? (
                      <p className="mt-1 text-gray-400">まだ記録がありません</p>
                    ) : (
                      <dl className="mt-1 space-y-0.5">
                        <div className="flex gap-2"><dt className="w-20 text-gray-500">半分まで</dt><dd><b>{pct(r.half, r.readers)}</b> <span className="text-gray-400">({r.half}/{r.readers})</span></dd></div>
                        <div className="flex gap-2"><dt className="w-20 text-gray-500">最後まで</dt><dd><b className="text-emerald-700">{pct(r.finished, r.readers)}</b> <span className="text-gray-400">({r.finished}/{r.readers})</span></dd></div>
                        <div className="flex gap-2"><dt className="w-20 text-gray-500">平均の位置</dt><dd><b>{r.avgDepth}%</b></dd></div>
                        <div className="flex gap-2"><dt className="w-20 text-gray-500">読んでいた時間</dt><dd><b>{secLabel(r.medianSec)}</b></dd></div>
                      </dl>
                    )}
                  </div>
                  <div>
                    <p className="font-bold text-gray-600">どこから来たか</p>
                    <ul className="mt-1 space-y-0.5">
                      {r.sources.slice(0, 4).map((s) => <li key={s.name}><b className="tabular-nums">{s.visits}</b> <span className="text-gray-700">{s.name}</span></li>)}
                    </ul>
                  </div>
                  <div>
                    <p className="font-bold text-gray-600">押されたもの（訪問）</p>
                    {r.clicks.length === 0 ? (
                      <p className="mt-1 text-gray-400">まだ記録がありません</p>
                    ) : (
                      <ul className="mt-1 space-y-0.5">
                        {r.clicks.slice(0, 5).map((c) => <li key={c.name}><b className="tabular-nums">{c.visits}</b> <span className="text-gray-700">{CLICK_LABEL[c.name] ?? c.name}</span></li>)}
                      </ul>
                    )}
                  </div>
                </div>

                <p className="mt-3 border-t border-gray-200 pt-2 text-xs text-gray-600">
                  読んだあと：<ProgressLine p={r.progress} base={r.visits} />
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
