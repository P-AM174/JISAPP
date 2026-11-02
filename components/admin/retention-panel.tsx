"use client";

import { useState } from 'react';
import type { Ratio, Segment, summarizeGoal } from '@/lib/analytics/retention';

type Goal = ReturnType<typeof summarizeGoal>;
type Data = Goal[Segment];

const SEGMENT_LABEL: Record<Segment, string> = { all: '全体', ja: '日本語版', en: '英語版' };
const rate = (r: Ratio) => (r.denominator ? `${((100 * r.numerator) / r.denominator).toFixed(1)}%` : '—');
const detail = (r: Ratio) => (r.denominator ? `${r.numerator} / ${r.denominator}` : 'まだ数えられません');
const signed = (v: number | null) => (v === null ? '—' : `${v > 0 ? '+' : ''}${(v * 100).toFixed(0)}%`);
const tone = (v: number | null) => (v === null ? 'text-gray-400' : v > 0 ? 'text-emerald-700' : v < 0 ? 'text-rose-600' : 'text-gray-700');

function Kpi({ label, value, sub, className = '' }: { label: string; value: string; sub: string; className?: string }) {
  return (
    <div className="rounded-xl bg-gray-50 p-3 ring-1 ring-gray-100">
      <p className="text-[11px] font-semibold text-gray-500">{label}</p>
      <p className={`mt-1 text-2xl font-black ${className || 'text-gray-900'}`}>{value}</p>
      <p className="mt-0.5 text-[11px] text-gray-500">{sub}</p>
    </div>
  );
}

/** 2つ以上の条件の「7日以内にまた開いた割合」を横棒で比べる */
function Compare({ title, note, items }: { title: string; note: string; items: { label: string; value: Ratio }[] }) {
  return (
    <div className="rounded-xl bg-gray-50 p-3 ring-1 ring-gray-100">
      <p className="text-xs font-bold text-gray-800">{title}</p>
      <p className="mb-2 text-[10px] text-gray-500">{note}</p>
      <div className="space-y-1.5">
        {items.map((it) => {
          const v = it.value.denominator ? it.value.numerator / it.value.denominator : 0;
          return (
            <div key={it.label} className="flex items-center gap-2 text-xs">
              <span className="w-32 shrink-0 text-gray-700">{it.label}</span>
              <span className="relative h-4 flex-1 overflow-hidden rounded bg-white ring-1 ring-gray-200">
                <span className="absolute inset-y-0 left-0 bg-emerald-500" style={{ width: `${v * 100}%` }} />
              </span>
              <span className="w-24 shrink-0 text-right font-bold text-gray-900">{rate(it.value)} <span className="font-normal text-gray-400">({it.value.denominator})</span></span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/** 全体・日本語版・英語版を並べて比べる表（主な数字だけ） */
function SegmentTable({ goal }: { goal: Goal }) {
  const rows: { label: string; get: (d: Data) => string; className?: (d: Data) => string }[] = [
    { label: '作者以外：7日以内にまた開いた', get: (d) => rate(d.retention.others.d7) },
    { label: '作者以外：翌日も開いた', get: (d) => rate(d.retention.others.d1) },
    { label: '作者以外：30日後も開いた', get: (d) => rate(d.retention.others.d30) },
    { label: '作者本人：7日以内にまた開いた', get: (d) => rate(d.retention.owners.d7) },
    { label: 'データを2日以上保存した', get: (d) => rate(d.dataSaved.twoDays) },
    { label: 'ホーム画面に追加した率', get: (d) => rate(d.rates.homeAdded) },
    { label: 'SNSへシェアした率', get: (d) => rate(d.rates.sns) },
    { label: 'メッセージで送った率', get: (d) => rate(d.rates.message) },
    { label: '2つ目のアプリを作った率', get: (d) => rate(d.secondApp.overall) },
    { label: 'アプリ作成数（昨日）', get: (d) => `${d.creation.yesterday}件` },
    { label: '前日からの増減', get: (d) => signed(d.creation.dayOverDay), className: (d) => tone(d.creation.dayOverDay) },
    { label: '1週間前からの増減', get: (d) => signed(d.creation.weekOverWeek), className: (d) => tone(d.creation.weekOverWeek) },
  ];
  return (
    <table className="mt-3 w-full text-left text-xs">
      <thead>
        <tr className="text-gray-500"><th className="py-1.5">主な数字</th>{(['all', 'ja', 'en'] as Segment[]).map((s) => <th key={s} className="text-right">{SEGMENT_LABEL[s]}</th>)}</tr>
      </thead>
      <tbody>
        {rows.map((r) => (
          <tr key={r.label} className="border-t border-gray-100">
            <td className="py-1.5 text-gray-700">{r.label}</td>
            {(['all', 'ja', 'en'] as Segment[]).map((s) => <td key={s} className={`text-right font-bold ${r.className?.(goal[s]) ?? 'text-gray-900'}`}>{r.get(goal[s])}</td>)}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function SegmentDetail({ d }: { d: Data }) {
  return (
    <>
      <h3 className="mt-5 text-sm font-bold text-gray-800">アプリの継続利用率</h3>
      <div className="mt-2 grid gap-3 sm:grid-cols-3">
        <Kpi label="作者以外：7日以内にまた開いた" value={rate(d.retention.others.d7)} sub={detail(d.retention.others.d7)} className="text-emerald-700" />
        <Kpi label="作者以外：翌日も開いた" value={rate(d.retention.others.d1)} sub={detail(d.retention.others.d1)} />
        <Kpi label="作者以外：30日後も開いた" value={rate(d.retention.others.d30)} sub={d.retention.others.d30.denominator ? detail(d.retention.others.d30) : '「直近90日」を選ぶと出ます'} />
        <Kpi label="作者本人：7日以内にまた開いた" value={rate(d.retention.owners.d7)} sub={detail(d.retention.owners.d7)} />
        <Kpi label="作者本人：翌日も開いた" value={rate(d.retention.owners.d1)} sub={detail(d.retention.owners.d1)} />
        <Kpi label="作者本人：30日後も開いた" value={rate(d.retention.owners.d30)} sub={d.retention.owners.d30.denominator ? detail(d.retention.owners.d30) : '「直近90日」を選ぶと出ます'} />
      </div>
      <p className="mt-2 text-[11px] leading-relaxed text-gray-500">
        アプリ×ブラウザ単位。選んだ期間の中で初めて開き、そこから7日（30日後は30日）たったものが分母です。期間より前から使っている人も「初めて」に入ることがあります。iPhoneのホーム画面から開いた分は、案内を見たSafariと同じブラウザとして数えます。
      </p>

      <h3 className="mt-5 text-sm font-bold text-gray-800">何があると続くか（7日以内にまた開いた割合・作者本人も含む）</h3>
      <div className="mt-2 grid gap-3 lg:grid-cols-2">
        <Compare title="アプリの種類" note="開いたときに記録した種類。種類を記録し始める前の分は「不明」" items={[
          { label: 'データを保存する', value: d.byKind.saves }, { label: 'グループで使う', value: d.byKind.shared },
          { label: '保存しない', value: d.byKind.plain }, { label: '不明', value: d.byKind.unknown },
        ]} />
        <Compare title="ホーム画面に追加したか" note="ホーム画面から初めて起動したものを「追加した」と数える" items={[
          { label: '追加した', value: d.byHome.installed }, { label: '追加していない', value: d.byHome.notInstalled },
        ]} />
        <Compare title="作者が人に送ったアプリか" note="期間内にそのアプリの送るボタンが押されたか" items={[
          { label: '送ったアプリ', value: d.bySent.sent }, { label: '送っていないアプリ', value: d.bySent.notSent },
        ]} />
        <div className="rounded-xl bg-gray-50 p-3 ring-1 ring-gray-100">
          <p className="text-xs font-bold text-gray-800">データを保存した日・グループ</p>
          <p className="mb-2 text-[10px] text-gray-500">データの保存は、アプリ×ブラウザごとに1日1回だけ記録（記録し始めた日から）</p>
          <dl className="grid grid-cols-2 gap-2 text-xs">
            <div><dt className="text-gray-500">1日以上保存した</dt><dd className="font-bold">{rate(d.dataSaved.any)} <span className="font-normal text-gray-400">({detail(d.dataSaved.any)})</span></dd></div>
            <div><dt className="text-gray-500">2日以上保存した</dt><dd className="font-bold">{rate(d.dataSaved.twoDays)} <span className="font-normal text-gray-400">({detail(d.dataSaved.twoDays)})</span></dd></div>
            <div><dt className="text-gray-500">作られたグループ</dt><dd className="font-bold">{d.groups.created}件</dd></div>
            <div><dt className="text-gray-500">招待から参加した人</dt><dd className="font-bold">{d.groups.joined}件</dd></div>
          </dl>
        </div>
      </div>

      <h3 className="mt-5 text-sm font-bold text-gray-800">ホーム画面への追加・シェア</h3>
      <div className="mt-2 grid gap-3 sm:grid-cols-4">
        <Kpi label="ホーム画面に追加した率" value={rate(d.rates.homeAdded)} sub={`アプリを開いたうち ${detail(d.rates.homeAdded)}`} className="text-emerald-700" />
        <Kpi label="案内を見て追加した率" value={rate(d.rates.homeAddedAfterGuide)} sub={`案内を見たうち ${detail(d.rates.homeAddedAfterGuide)}`} />
        <Kpi label="SNSへシェアした率" value={rate(d.rates.sns)} sub={`X・Facebook ${detail(d.rates.sns)}`} />
        <Kpi label="メッセージで送った率" value={rate(d.rates.message)} sub={`LINE・メッセージなど ${detail(d.rates.message)}`} />
      </div>
      <p className="mt-2 text-[11px] text-gray-500">
        シェア・送った率の分母は公開完了の画面を見た数（アプリ×ブラウザ）。どれかで送った率（ほかのアプリ・リンクのコピーを含む）は {rate(d.rates.any)}（{detail(d.rates.any)}）。ボタンを押した数で、実際に送り終えたかは分かりません。
      </p>

      <h3 className="mt-5 text-sm font-bold text-gray-800">2つ目のアプリを作った率</h3>
      <div className="mt-2 grid gap-3 sm:grid-cols-3">
        <Kpi label="これまで全体" value={rate(d.secondApp.overall)} sub={detail(d.secondApp.overall)} className="text-emerald-700" />
        <Kpi label="最初のアプリから7日以内" value={rate(d.secondApp.within7Days)} sub={`${detail(d.secondApp.within7Days)}（期間内に最初を作り7日たった人）`} />
        <Kpi label="1つ目から2つ目までの平均" value={d.secondApp.avgDaysToSecond === null ? '—' : `${d.secondApp.avgDaysToSecond.toFixed(1)}日`} sub="2つ以上作った人" />
      </div>

      <h3 className="mt-5 text-sm font-bold text-gray-800">アプリ作成数</h3>
      <div className="mt-2 grid gap-3 sm:grid-cols-4">
        <Kpi label="昨日" value={`${d.creation.yesterday}件`} sub={`今日はここまで ${d.creation.today}件`} />
        <Kpi label="前日からの増減" value={signed(d.creation.dayOverDay)} sub={`昨日 ${d.creation.yesterday} ／ その前日 ${d.creation.dayBefore}`} className={tone(d.creation.dayOverDay)} />
        <Kpi label="1週間前からの増減" value={signed(d.creation.weekOverWeek)} sub={`昨日 ${d.creation.yesterday} ／ 先週の同じ曜日 ${d.creation.sameDayLastWeek}`} className={tone(d.creation.weekOverWeek)} />
        <Kpi label="直近7日の増減" value={signed(d.creation.last7Change)} sub={`直近7日 ${d.creation.last7} ／ その前の7日 ${d.creation.prev7}`} className={tone(d.creation.last7Change)} />
      </div>
      <div className="mt-3 flex items-end gap-1" aria-label="直近14日のアプリ作成数">
        {[...d.creation.daily].reverse().map((x) => {
          const max = Math.max(1, ...d.creation.daily.map((y) => y.count));
          return (
            <div key={x.day} className="flex flex-1 flex-col items-center gap-1">
              <span className="text-[10px] text-gray-500">{x.count}</span>
              <div className="w-full rounded-t bg-emerald-500" style={{ height: `${Math.max(2, (x.count / max) * 64)}px` }} />
              <span className="text-[9px] text-gray-400">{x.day.slice(5).replace('-', '/')}</span>
            </div>
          );
        })}
      </div>

      {d.topApps.length > 0 && (
        <details className="mt-4">
          <summary className="cursor-pointer text-xs font-bold text-gray-700">続けて使われているアプリ（7日以内にまた開いた割合が高い順・3件以上）</summary>
          <table className="mt-2 w-full text-left text-xs">
            <thead><tr className="text-gray-500"><th className="py-1">アプリ</th><th>また開いた</th><th>割合</th></tr></thead>
            <tbody>
              {d.topApps.map((a) => (
                <tr key={a.appId} className="border-t border-gray-100">
                  <td className="py-1.5"><a href={`/apps/${encodeURIComponent(a.appId)}`} target="_blank" rel="noreferrer" className="text-emerald-700 underline">{a.appId.slice(0, 8)}…</a></td>
                  <td>{a.returned} / {a.cohort}</td>
                  <td>{rate({ numerator: a.returned, denominator: a.cohort })}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </details>
      )}
    </>
  );
}

/** 運営画面のいちばん上：今月の目標「アプリを続けて使ってもらう」の数字（全体・日本語版・英語版） */
export function RetentionPanel({ goal }: { goal: Goal | null }) {
  const [segment, setSegment] = useState<Segment>('all');
  if (!goal) return null;
  return (
    <section className="rounded-2xl bg-white p-5 ring-1 ring-gray-200">
      <h2 className="font-bold text-gray-900">今月の目標：アプリを続けて使ってもらう</h2>
      <p className="mt-1 text-[11px] text-gray-500">
        日本語版・英語版は、その言語のページで起きたことで分けます（全体はベトナム語も含む）。作成数の言語別は「公開」の記録のページの言語、2つ目のアプリの言語別は公開の記録にアプリIDを入れ始めた日からの分です。
      </p>
      <SegmentTable goal={goal} />
      <div className="mt-5 flex gap-2 border-b border-gray-100 pb-2">
        {(['all', 'ja', 'en'] as Segment[]).map((s) => (
          <button key={s} type="button" onClick={() => setSegment(s)} className={`rounded-full px-3 py-1 text-xs font-bold ${segment === s ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
            {SEGMENT_LABEL[s]}の詳しい数字
          </button>
        ))}
      </div>
      <SegmentDetail d={goal[segment]} />
    </section>
  );
}
