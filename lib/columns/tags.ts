/** コラムのタグ。決まったタグは表紙の色と絵がつく（ほかの言葉もタグにできる） */
export const COLUMN_TAGS: { name: string; en: string; emoji: string; bg: string; ink: string }[] = [
  { name: "旅行", en: "Travel", emoji: "🧳", bg: "#d5f0ea", ink: "#0f766e" },
  { name: "部活", en: "Sports", emoji: "⚽", bg: "#dbeafe", ink: "#1d4ed8" },
  { name: "PTA", en: "PTA", emoji: "📋", bg: "#fef3c7", ink: "#b45309" },
  { name: "学校", en: "School", emoji: "🎒", bg: "#ede9fe", ink: "#6d28d9" },
  { name: "家族", en: "Family", emoji: "🏠", bg: "#fce7f3", ink: "#be185d" },
  { name: "サークル", en: "Clubs", emoji: "🎉", bg: "#ffedd5", ink: "#c2410c" },
  { name: "仕事", en: "Work", emoji: "💼", bg: "#e2e8f0", ink: "#334155" },
  { name: "お金", en: "Money", emoji: "💴", bg: "#fef9c3", ink: "#a16207" },
];

const DEFAULT_STYLE = { emoji: "✨", bg: "#e6f4f1", ink: "#0f766e" };

export function tagStyle(tags: string[]): { emoji: string; bg: string; ink: string } {
  for (const t of tags) {
    const hit = COLUMN_TAGS.find((x) => x.name === t || x.en.toLowerCase() === t.toLowerCase());
    if (hit) return hit;
  }
  return DEFAULT_STYLE;
}

/** 入力されたタグを整える（# をとる・重複なし・5つまで・1つ12文字まで） */
export function normalizeTags(input: unknown): string[] {
  const arr = Array.isArray(input) ? input : typeof input === "string" ? input.split(/[,、\s#＃]+/) : [];
  const out: string[] = [];
  for (const raw of arr) {
    const t = String(raw).replace(/^[#＃]+/, "").trim().slice(0, 12);
    if (t && !out.includes(t)) out.push(t);
    if (out.length >= 5) break;
  }
  return out;
}
