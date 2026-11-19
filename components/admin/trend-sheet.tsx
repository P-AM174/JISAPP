"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { X } from "lucide-react";

type Cell = { n: number; d: number };

/** API（/api/admin/analytics）の trends */
export type Trends = {
  hourly: boolean;
  /** 横軸のすべての日（直近24時間は時間）。記録がない日も 0 として並べる */
  buckets: string[];
  /** 日ごとの横軸（継続利用の割合は、直近24時間のときも日ごと） */
  dayBuckets: string[];
  /** 件数。キーは「種類:名前」（overview:visits・source:ChatGPT・column:articles.visits など） */
  counts: Record<string, Record<string, number>>;
  /** 割合（分子 n・分母 d）。キーは eng:shareRate など */
  ratios: Record<string, Record<string, Cell>>;
};

/** シートに出す1本の線 */
export type TrendSeries = {
  /** シートの題名（例：ChatGPT からの訪問） */
  title: string;
  /** 数の単位（訪問・回・件・人）。割合のときは分母の単位 */
  unit: string;
  /** 補足（数え方の違いなど） */
  note?: string;
  hourly: boolean;
  buckets: string[];
  /** 件数のとき */
  values?: number[];
  /** 割合のとき（日ごとの分子・分母） */
  rate?: Cell[];
};

type Meta = { title: string; unit: string; note?: string };

/** 件数の線を作る */
export function countSeries(trends: Trends, key: string, meta: Meta): TrendSeries {
  return { ...meta, hourly: trends.hourly, buckets: trends.buckets, values: trends.buckets.map((b) => trends.counts[key]?.[b] ?? 0) };
}
/** API の割合（eng:shareRate など）の線を作る */
export function rateSeries(trends: Trends, key: string, meta: Meta): TrendSeries {
  return { ...meta, hourly: trends.hourly, buckets: trends.buckets, rate: trends.buckets.map((b) => trends.ratios[key]?.[b] ?? { n: 0, d: 0 }) };
}
/** 継続利用（summarizeGoal の daily）の線を作る。いつも日ごと */
export function dailySeries(
  trends: Trends,
  daily: { ratios: Record<string, Record<string, { numerator: number; denominator: number }>>; counts: Record<string, Record<string, number>> },
  key: string,
  meta: Meta,
  kind: "rate" | "count"
): TrendSeries {
  const buckets = trends.dayBuckets;
  if (kind === "count") return { ...meta, hourly: false, buckets, values: buckets.map((b) => daily.counts[key]?.[b] ?? 0) };
  return {
    ...meta,
    hourly: false,
    buckets,
    rate: buckets.map((b) => {
      const r = daily.ratios[key]?.[b];
      return { n: r?.numerator ?? 0, d: r?.denominator ?? 0 };
    }),
  };
}

const LINE = "#059669"; // emerald-600（白地とのコントラストは 3:1 以上）

/** 「2026-11-18」→「11/18」、「2026-11-18T09」→「9時」 */
function label(bucket: string, hourly: boolean): string {
  if (hourly) return `${Number(bucket.slice(11, 13))}時`;
  return `${Number(bucket.slice(5, 7))}/${Number(bucket.slice(8, 10))}`;
}
function longLabel(bucket: string, hourly: boolean): string {
  if (hourly) return `${Number(bucket.slice(5, 7))}/${Number(bucket.slice(8, 10))} ${Number(bucket.slice(11, 13))}時台`;
  // 日本時間のその日の曜日
  const w = "日月火水木金土"[new Date(`${bucket}T00:00:00Z`).getUTCDay()];
  return `${Number(bucket.slice(5, 7))}/${Number(bucket.slice(8, 10))}（${w}）`;
}
const pctText = (v: number) => `${v < 10 ? v.toFixed(1) : Math.round(v)}%`;

/** 目盛りの上限を、きりのいい数にする（例：37 → 40） */
function niceMax(v: number): number {
  if (v <= 4) return 4;
  const p = 10 ** Math.floor(Math.log10(v));
  for (const m of [1, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10]) if (m * p >= v) return m * p;
  return 10 * p;
}

/**
 * 計測の項目をタップしたときに、下から出す折れ線グラフ。
 * 1本だけの線なので凡例は出さず、題名で何の数かを示す。指でなぞる（マウスを乗せる）と、その日の数が出る。
 * 割合のときは、分母が0の日は線を切る（その日は数えられない）
 */
export function TrendSheet({ series, onClose }: { series: TrendSeries; onClose: () => void }) {
  const { hourly, buckets, rate } = series;
  const isRate = !!rate;
  /** グラフに描く値（割合のときは %。分母が0の日は null） */
  const values = useMemo<(number | null)[]>(
    () => (rate ? rate.map((c) => (c.d ? (c.n / c.d) * 100 : null)) : (series.values ?? [])),
    [rate, series.values]
  );
  const per = hourly ? "1時間" : "1日";

  const totalN = rate ? rate.reduce((a, c) => a + c.n, 0) : 0;
  const totalD = rate ? rate.reduce((a, c) => a + c.d, 0) : 0;
  const total = isRate ? totalD : (values as number[]).reduce((a, b) => a + b, 0);
  const peakIndex = values.reduce<number>((best, v, i) => (v !== null && (values[best] === null || v > (values[best] as number)) ? i : best), 0);
  const hasPeak = values[peakIndex] !== null && (isRate || (values[peakIndex] as number) > 0);

  const boxRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(320);
  const [active, setActive] = useState<number | null>(null);

  useLayoutEffect(() => {
    const el = boxRef.current;
    if (!el) return;
    const update = () => setWidth(el.clientWidth);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const height = 200;
  const pad = { top: 12, right: 12, bottom: 24, left: isRate ? 40 : 34 };
  const plotW = Math.max(width - pad.left - pad.right, 10);
  const plotH = height - pad.top - pad.bottom;
  const peak = Math.max(0, ...values.map((v) => v ?? 0));
  const max = isRate ? Math.min(100, niceMax(Math.max(peak, 10))) : niceMax(peak);
  const x = (i: number) => pad.left + (values.length <= 1 ? plotW / 2 : (i / (values.length - 1)) * plotW);
  const y = (v: number) => pad.top + plotH - (v / max) * plotH;
  // 分母が0の日で線を切る
  const segments: number[][] = [];
  values.forEach((v, i) => {
    if (v === null) return;
    const last = segments[segments.length - 1];
    if (last && last[last.length - 1] === i - 1) last.push(i);
    else segments.push([i]);
  });
  const path = segments.map((seg) => seg.map((i, j) => `${j ? "L" : "M"}${x(i).toFixed(1)},${y(values[i] as number).toFixed(1)}`).join(" ")).join(" ");
  const base = (pad.top + plotH).toFixed(1);
  const area = segments
    .filter((seg) => seg.length > 1)
    .map((seg) => `M${x(seg[0]).toFixed(1)},${base} ${seg.map((i) => `L${x(i).toFixed(1)},${y(values[i] as number).toFixed(1)}`).join(" ")} L${x(seg[seg.length - 1]).toFixed(1)},${base} Z`)
    .join(" ");
  const ticks = [0, max / 2, max];
  // 横軸の日付は、はし・まんなかなど4つほどだけ
  const xTicks = values.length <= 1 ? [0] : [...new Set([0, Math.round((values.length - 1) / 3), Math.round(((values.length - 1) * 2) / 3), values.length - 1])];

  const pick = (clientX: number) => {
    const el = boxRef.current;
    if (!el || !values.length) return;
    const rx = clientX - el.getBoundingClientRect().left - pad.left;
    const i = values.length <= 1 ? 0 : Math.round((rx / plotW) * (values.length - 1));
    setActive(Math.min(Math.max(i, 0), values.length - 1));
  };
  const shown = active;
  const valueText = (i: number) => {
    const v = values[i];
    if (isRate) return v === null ? "数えられる人がいません" : `${pctText(v)}（${rate![i].n}/${rate![i].d}）`;
    return `${(v ?? 0).toLocaleString()}`;
  };

  const tiles: [string, string, string][] = isRate
    ? [
        ["期間全体", totalD ? pctText((totalN / totalD) * 100) : "-", ""],
        ["数えた数（分母）", totalD.toLocaleString(), series.unit],
        [`いちばん高い${hourly ? "時間" : "日"}`, hasPeak ? pctText(values[peakIndex] as number) : "-", hasPeak ? label(buckets[peakIndex], hourly) : ""],
      ]
    : [
        ["合計", total.toLocaleString(), series.unit],
        [`${per}の平均`, buckets.length ? (total / buckets.length).toFixed(total / buckets.length < 10 ? 1 : 0) : "0", series.unit],
        [`いちばん多い${hourly ? "時間" : "日"}`, hasPeak ? (values[peakIndex] as number).toLocaleString() : "-", hasPeak ? label(buckets[peakIndex], hourly) : ""],
      ];

  return (
    <div className="fixed inset-0 z-[200] flex items-end justify-center bg-black/40 sm:items-center sm:p-4" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={series.title}
        className="max-h-[90dvh] w-full max-w-xl overflow-y-auto rounded-t-3xl bg-white p-5 shadow-2xl sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-3">
          <div className="min-w-0 flex-1">
            <h2 className="text-base font-black text-gray-900">{series.title}</h2>
            <p className="mt-0.5 text-xs text-gray-500">
              {/* 期間の最初と最後は、その日（時間）の途中からになる */}
              {buckets.length ? `${longLabel(buckets[0], hourly)} 〜 ${longLabel(buckets[buckets.length - 1], hourly)}` : ""}・{hourly ? "1時間ごと" : "1日ごと"}（日本時間）
            </p>
          </div>
          <button type="button" onClick={onClose} aria-label="閉じる" className="rounded-full bg-gray-100 p-1.5 text-gray-500 hover:bg-gray-200">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-2 text-center">
          {tiles.map(([k, v, u]) => (
            <div key={k} className="rounded-xl bg-gray-50 px-2 py-2.5">
              <p className="text-lg font-black tabular-nums text-gray-900">
                {v}
                <span className="ml-0.5 text-[11px] font-bold text-gray-500">{u}</span>
              </p>
              <p className="text-[10px] font-semibold text-gray-500">{k}</p>
            </div>
          ))}
        </div>

        {/* 指でなぞる・マウスを乗せると、その日（時間）の数が出る */}
        <div className="mt-4 h-6 text-center text-sm">
          {shown !== null ? (
            <span className="font-semibold text-gray-700">
              {longLabel(buckets[shown], hourly)}　<span className="font-black tabular-nums text-gray-900">{valueText(shown)}</span>
              {!isRate && <span className="ml-0.5 text-xs text-gray-500">{series.unit}</span>}
            </span>
          ) : (
            <span className="text-xs text-gray-400">グラフをなぞると、{hourly ? "その時間" : "その日"}の数が出ます</span>
          )}
        </div>
        <div
          ref={boxRef}
          className="relative touch-none select-none"
          onPointerMove={(e) => pick(e.clientX)}
          onPointerDown={(e) => pick(e.clientX)}
          onPointerLeave={(e) => {
            if (e.pointerType === "mouse") setActive(null);
          }}
        >
          <svg width={width} height={height} role="img" aria-label={`${series.title}の推移`}>
            {ticks.map((t) => (
              <g key={t}>
                <line x1={pad.left} x2={pad.left + plotW} y1={y(t)} y2={y(t)} stroke="#e5e7eb" strokeWidth={1} />
                <text x={pad.left - 6} y={y(t) + 4} textAnchor="end" fontSize={11} fill="#6b7280" className="tabular-nums">
                  {isRate ? `${Math.round(t)}%` : Number.isInteger(t) ? t : t.toFixed(1)}
                </text>
              </g>
            ))}
            {xTicks.map((i) => (
              <text
                key={i}
                x={x(i)}
                y={height - 6}
                textAnchor={i === 0 ? "start" : i === values.length - 1 ? "end" : "middle"}
                fontSize={11}
                fill="#6b7280"
              >
                {label(buckets[i], hourly)}
              </text>
            ))}
            {area && <path d={area} fill={LINE} opacity={0.08} />}
            <path d={path} fill="none" stroke={LINE} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
            {/* 割合は、前後の日が切れている1日だけの点も見えるように点を打つ */}
            {isRate &&
              segments.filter((seg) => seg.length === 1).map(([i]) => <circle key={i} cx={x(i)} cy={y(values[i] as number)} r={3} fill={LINE} />)}
            {shown !== null && (
              <g>
                <line x1={x(shown)} x2={x(shown)} y1={pad.top} y2={pad.top + plotH} stroke="#9ca3af" strokeWidth={1} strokeDasharray="3 3" />
                {values[shown] !== null && <circle cx={x(shown)} cy={y(values[shown] as number)} r={5} fill={LINE} stroke="#fff" strokeWidth={2} />}
              </g>
            )}
          </svg>
        </div>

        {series.note && <p className="mt-2 text-[11px] leading-relaxed text-gray-500">{series.note}</p>}

        {/* 表でも見られるように（線を見分けにくい人・数を正確に見たいとき） */}
        <details className="mt-3 rounded-xl bg-gray-50 px-3 py-2">
          <summary className="cursor-pointer text-xs font-semibold text-gray-600">表で見る</summary>
          <table className="mt-2 w-full text-sm">
            <tbody>
              {buckets
                .map((b, i) => ({ b, i }))
                .reverse()
                .map(({ b, i }) => (
                  <tr key={b} className="border-t border-gray-100">
                    <td className="py-1 text-gray-600">{longLabel(b, hourly)}</td>
                    <td className="text-right font-semibold tabular-nums text-gray-900">{isRate && values[i] === null ? "-" : valueText(i)}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </details>
      </div>
    </div>
  );
}
