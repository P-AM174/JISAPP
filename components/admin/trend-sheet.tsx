"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { X } from "lucide-react";

/** API（/api/admin/analytics）の trends。項目ごとの「日（直近24時間は時間）→ 数」 */
export type Trends = {
  hourly: boolean;
  /** 横軸のすべての日（時間）。記録がない日も 0 として並べる */
  buckets: string[];
  /** キーは「種類:名前」（overview:visits・source:ChatGPT など） */
  counts: Record<string, Record<string, number>>;
};

export type TrendTarget = {
  /** trends.counts のキー */
  key: string;
  /** シートの題名（例：ChatGPT からの訪問） */
  title: string;
  /** 数の単位（訪問・回・件・人） */
  unit: string;
  /** 補足（数え方の違いなど） */
  note?: string;
};

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

/** 目盛りの上限を、きりのいい数にする（例：37 → 40） */
function niceMax(v: number): number {
  if (v <= 4) return 4;
  const p = 10 ** Math.floor(Math.log10(v));
  for (const m of [1, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10]) if (m * p >= v) return m * p;
  return 10 * p;
}

/**
 * 計測の項目をタップしたときに、下から出す折れ線グラフ。
 * 1本だけの線なので凡例は出さず、題名で何の数かを示す。指でなぞる（マウスを乗せる）と、その日の数が出る
 */
export function TrendSheet({ trends, target, onClose }: { trends: Trends; target: TrendTarget; onClose: () => void }) {
  const { hourly, buckets } = trends;
  const values = useMemo(() => buckets.map((b) => trends.counts[target.key]?.[b] ?? 0), [buckets, trends, target.key]);
  const total = values.reduce((a, b) => a + b, 0);
  const peakIndex = values.reduce((best, v, i) => (v > values[best] ? i : best), 0);
  const per = hourly ? "1時間" : "1日";

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
  const pad = { top: 12, right: 12, bottom: 24, left: 34 };
  const plotW = Math.max(width - pad.left - pad.right, 10);
  const plotH = height - pad.top - pad.bottom;
  const max = niceMax(Math.max(...values, 0));
  const x = (i: number) => pad.left + (values.length <= 1 ? plotW / 2 : (i / (values.length - 1)) * plotW);
  const y = (v: number) => pad.top + plotH - (v / max) * plotH;
  const path = values.map((v, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(" ");
  const area = `${path} L${x(values.length - 1).toFixed(1)},${(pad.top + plotH).toFixed(1)} L${x(0).toFixed(1)},${(pad.top + plotH).toFixed(1)} Z`;
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
  const shown = active ?? null;

  return (
    <div className="fixed inset-0 z-[200] flex items-end justify-center bg-black/40 sm:items-center sm:p-4" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={target.title}
        className="max-h-[90dvh] w-full max-w-xl overflow-y-auto rounded-t-3xl bg-white p-5 shadow-2xl sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-3">
          <div className="min-w-0 flex-1">
            <h2 className="text-base font-black text-gray-900">{target.title}</h2>
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
          {([
            ["合計", total.toLocaleString(), target.unit],
            [`${per}の平均`, buckets.length ? (total / buckets.length).toFixed(total / buckets.length < 10 ? 1 : 0) : "0", target.unit],
            [`いちばん多い${hourly ? "時間" : "日"}`, total ? values[peakIndex].toLocaleString() : "-", total ? label(buckets[peakIndex], hourly) : ""],
          ] as const).map(([k, v, u]) => (
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
              {longLabel(buckets[shown], hourly)}　<span className="font-black tabular-nums text-gray-900">{values[shown].toLocaleString()}</span>
              <span className="ml-0.5 text-xs text-gray-500">{target.unit}</span>
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
          <svg width={width} height={height} role="img" aria-label={`${target.title}の推移。合計${total}${target.unit}`}>
            {ticks.map((t) => (
              <g key={t}>
                <line x1={pad.left} x2={pad.left + plotW} y1={y(t)} y2={y(t)} stroke="#e5e7eb" strokeWidth={1} />
                <text x={pad.left - 6} y={y(t) + 4} textAnchor="end" fontSize={11} fill="#6b7280" className="tabular-nums">
                  {Number.isInteger(t) ? t : t.toFixed(1)}
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
            <path d={area} fill={LINE} opacity={0.08} />
            <path d={path} fill="none" stroke={LINE} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
            {shown !== null && (
              <g>
                <line x1={x(shown)} x2={x(shown)} y1={pad.top} y2={pad.top + plotH} stroke="#9ca3af" strokeWidth={1} strokeDasharray="3 3" />
                <circle cx={x(shown)} cy={y(values[shown])} r={5} fill={LINE} stroke="#fff" strokeWidth={2} />
              </g>
            )}
          </svg>
        </div>

        {target.note && <p className="mt-2 text-[11px] leading-relaxed text-gray-500">{target.note}</p>}

        {/* 表でも見られるように（色や線を見分けにくい人・数を正確に見たいとき） */}
        <details className="mt-3 rounded-xl bg-gray-50 px-3 py-2">
          <summary className="cursor-pointer text-xs font-semibold text-gray-600">表で見る</summary>
          <table className="mt-2 w-full text-sm">
            <tbody>
              {buckets
                .map((b, i) => ({ b, v: values[i] }))
                .reverse()
                .map(({ b, v }) => (
                  <tr key={b} className="border-t border-gray-100">
                    <td className="py-1 text-gray-600">{longLabel(b, hourly)}</td>
                    <td className="text-right font-semibold tabular-nums text-gray-900">{v.toLocaleString()}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </details>
      </div>
    </div>
  );
}
