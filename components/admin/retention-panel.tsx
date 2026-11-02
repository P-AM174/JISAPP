import type { summarizeCreation, summarizeRetention, summarizeSecondApp, Ratio } from '@/lib/analytics/retention';

type Props = {
  retention: ReturnType<typeof summarizeRetention> | null;
  creation: ReturnType<typeof summarizeCreation> | null;
  secondApp: ReturnType<typeof summarizeSecondApp> | null;
};

const rate = (r: Ratio) => (r.denominator ? `${((100 * r.numerator) / r.denominator).toFixed(1)}%` : '—');
const detail = (r: Ratio) => (r.denominator ? `${r.numerator} / ${r.denominator}` : 'まだ数えられません');
const signed = (v: number | null) => (v === null ? '—（比べる日が0件）' : `${v > 0 ? '+' : ''}${(v * 100).toFixed(0)}%`);
const tone = (v: number | null) => (v === null ? 'text-gray-500' : v > 0 ? 'text-emerald-700' : v < 0 ? 'text-rose-600' : 'text-gray-700');

function Kpi({ label, value, sub, className = '' }: { label: string; value: string; sub: string; className?: string }) {
  return (
    <div className="rounded-xl bg-gray-50 p-3 ring-1 ring-gray-100">
      <p className="text-[11px] font-semibold text-gray-500">{label}</p>
      <p className={`mt-1 text-2xl font-black ${className || 'text-gray-900'}`}>{value}</p>
      <p className="mt-0.5 text-[11px] text-gray-500">{sub}</p>
    </div>
  );
}

/** 運営画面のいちばん上：今月の目標「アプリを続けて使ってもらう」の数字 */
export function RetentionPanel({ retention, creation, secondApp }: Props) {
  return (
    <section className="rounded-2xl bg-white p-5 ring-1 ring-gray-200">
      <h2 className="font-bold text-gray-900">今月の目標：アプリを続けて使ってもらう</h2>

      {retention && (
        <>
          <h3 className="mt-4 text-sm font-bold text-gray-800">アプリの継続利用率</h3>
          <div className="mt-2 grid gap-3 sm:grid-cols-4">
            <Kpi label="作者以外：7日以内にまた開いた" value={rate(retention.others.d7)} sub={detail(retention.others.d7)} className="text-emerald-700" />
            <Kpi label="作者以外：翌日も開いた" value={rate(retention.others.d1)} sub={detail(retention.others.d1)} />
            <Kpi label="作者本人：7日以内にまた開いた" value={rate(retention.owners.d7)} sub={detail(retention.owners.d7)} />
            <Kpi label="作者本人：翌日も開いた" value={rate(retention.owners.d1)} sub={detail(retention.owners.d1)} />
          </div>
          <p className="mt-2 text-[11px] leading-relaxed text-gray-500">
            アプリ×ブラウザ単位。選んだ期間の中で初めて開き、そこから7日たったものが分母です（期間より前から使っている人も「初めて」に入ることがあります）。iPhoneのホーム画面から開いた分は、案内を見たSafariと同じブラウザとして数えます。
          </p>
          {retention.topApps.length > 0 && (
            <details className="mt-2">
              <summary className="cursor-pointer text-xs font-bold text-gray-700">続けて使われているアプリ（7日以内にまた開いた割合が高い順・3件以上）</summary>
              <table className="mt-2 w-full text-left text-xs">
                <thead><tr className="text-gray-500"><th className="py-1">アプリ</th><th>また開いた</th><th>割合</th></tr></thead>
                <tbody>
                  {retention.topApps.map((a) => (
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
      )}

      {secondApp && (
        <>
          <h3 className="mt-5 text-sm font-bold text-gray-800">2つ目のアプリを作った率</h3>
          <div className="mt-2 grid gap-3 sm:grid-cols-3">
            <Kpi label="これまで全体" value={rate(secondApp.overall)} sub={detail(secondApp.overall)} className="text-emerald-700" />
            <Kpi label="最初のアプリから7日以内" value={rate(secondApp.within7Days)} sub={`${detail(secondApp.within7Days)}（期間内に最初を作り7日たった人）`} />
            <Kpi label="1つ目から2つ目までの平均" value={secondApp.avgDaysToSecond === null ? '—' : `${secondApp.avgDaysToSecond.toFixed(1)}日`} sub="2つ以上作った人" />
          </div>
          <p className="mt-2 text-[11px] text-gray-500">ログインして作った人だけ（ゲストは誰が作ったか分からないため）。公式のアプリと、消されたアプリは数えません。</p>
        </>
      )}

      {creation && (
        <>
          <h3 className="mt-5 text-sm font-bold text-gray-800">アプリ作成数</h3>
          <div className="mt-2 grid gap-3 sm:grid-cols-4">
            <Kpi label="昨日" value={`${creation.yesterday}件`} sub={`今日はここまで ${creation.today}件`} />
            <Kpi label="前日からの増減" value={signed(creation.dayOverDay)} sub={`昨日 ${creation.yesterday} ／ その前日 ${creation.dayBefore}`} className={tone(creation.dayOverDay)} />
            <Kpi label="1週間前からの増減" value={signed(creation.weekOverWeek)} sub={`昨日 ${creation.yesterday} ／ 先週の同じ曜日 ${creation.sameDayLastWeek}`} className={tone(creation.weekOverWeek)} />
            <Kpi label="直近7日の増減" value={signed(creation.last7Change)} sub={`直近7日 ${creation.last7} ／ その前の7日 ${creation.prev7}`} className={tone(creation.last7Change)} />
          </div>
          <div className="mt-3 flex items-end gap-1" aria-label="直近14日のアプリ作成数">
            {[...creation.daily].reverse().map((d) => {
              const max = Math.max(1, ...creation.daily.map((x) => x.count));
              return (
                <div key={d.day} className="flex flex-1 flex-col items-center gap-1">
                  <span className="text-[10px] text-gray-500">{d.count}</span>
                  <div className="w-full rounded-t bg-emerald-500" style={{ height: `${Math.max(2, (d.count / max) * 64)}px` }} />
                  <span className="text-[9px] text-gray-400">{d.day.slice(5).replace('-', '/')}</span>
                </div>
              );
            })}
          </div>
          <p className="mt-2 text-[11px] text-gray-500">日本時間の日付。今日はまだ途中なので、増減は「昨日」で比べます。公式のアプリは除きます。</p>
        </>
      )}
    </section>
  );
}
