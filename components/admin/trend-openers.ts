import type { Segment } from "@/lib/analytics/retention";

type Meta = { title: string; unit: string; note?: string };

/**
 * 計測の各パネルから、項目をタップしたときにグラフのシートを出すための関数（計測ページが渡す）。
 * - count：API の trends.counts のキー（eng:homeInstalls・column:articles.visits など）
 * - rate：API の trends.ratios のキー（eng:shareRate など）
 * - daily：継続利用（summarizeGoal の daily）のキー。言語ごと・日ごと
 */
export type TrendOpeners = {
  count: (key: string, meta: Meta) => void;
  rate: (key: string, meta: Meta) => void;
  daily: (segment: Segment, key: string, meta: Meta, kind: "rate" | "count") => void;
};

/** タップできる数字・行の見た目 */
export const TAP_CLASS = "cursor-pointer rounded-md transition-colors hover:bg-emerald-50 active:bg-emerald-100";
