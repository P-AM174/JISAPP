import type { HeroBgPattern, HeroTheme } from "./types";

export const HERO_THEME_STYLES: Record<
  HeroTheme,
  { gradient: string; badgeDot: string; accent: string; label: string }
> = {
  studio: {
    gradient: "from-emerald-600 via-teal-600 to-cyan-700",
    badgeDot: "bg-emerald-300",
    accent: "text-emerald-700",
    label: "スタジオ緑",
  },
  violet: {
    gradient: "from-violet-600 via-purple-600 to-indigo-700",
    badgeDot: "bg-violet-300",
    accent: "text-violet-700",
    label: "スタジオ紫",
  },
  summer: {
    gradient: "from-orange-500 via-amber-500 to-yellow-600",
    badgeDot: "bg-yellow-200",
    accent: "text-amber-800",
    label: "夏オレンジ",
  },
  amber: {
    gradient: "from-amber-500 via-orange-600 to-rose-600",
    badgeDot: "bg-amber-200",
    accent: "text-amber-900",
    label: "琥珀",
  },
  cyan: {
    gradient: "from-cyan-600 via-teal-500 to-emerald-600",
    badgeDot: "bg-cyan-200",
    accent: "text-cyan-800",
    label: "シアン",
  },
};

export const HERO_BG_PATTERN_CLASS: Record<HeroBgPattern, string> = {
  grid: "hero-pattern-grid",
  dots: "hero-pattern-dots",
  none: "",
};

export const HERO_LAYOUT_LABELS = {
  two_column: "2カラム",
  card: "カード型",
  theme: "テーマ型",
} as const;

export const HERO_VISUAL_LABELS = {
  studio: "開発スタジオ",
  summer: "夏休み",
  requests: "掲示板",
  phone: "スマホ",
  none: "なし",
} as const;
