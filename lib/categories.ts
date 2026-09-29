// カテゴリ定数（Supabase クライアントに依存しないファイル）
// クライアントコンポーネントはこちらからインポートしてください

// アイコンは絵文字を使わず lib/category-icon.tsx の CategoryIcon（SVG）で表示する
export type Category = {
  id: string;
  name: string;
  /** 英語表示用の名前 */
  nameEn: string;
  gradient: string;
  tagColor: string;
};

export const CATEGORIES: Category[] = [
  { id: "business",      name: "ビジネス", nameEn: "Business", gradient: "from-blue-500 to-indigo-600",    tagColor: "bg-blue-100 text-blue-700"       },
  { id: "productivity",  name: "生産性", nameEn: "Productivity",   gradient: "from-emerald-500 to-teal-600",   tagColor: "bg-emerald-100 text-emerald-700"  },
  { id: "lifestyle",     name: "生活", nameEn: "Lifestyle",     gradient: "from-orange-400 to-amber-500",   tagColor: "bg-orange-100 text-orange-700"    },
  { id: "education",     name: "学習", nameEn: "Learning",     gradient: "from-yellow-500 to-amber-600",   tagColor: "bg-yellow-100 text-yellow-700"    },
  { id: "stats",         name: "統計", nameEn: "Data & Stats",     gradient: "from-cyan-500 to-blue-600",      tagColor: "bg-cyan-100 text-cyan-700"        },
  { id: "ai_tools",      name: "AIツール", nameEn: "AI Tools", gradient: "from-violet-500 to-purple-600",  tagColor: "bg-violet-100 text-violet-700"    },
  { id: "entertainment", name: "エンタメ", nameEn: "Entertainment", gradient: "from-pink-500 to-rose-500",      tagColor: "bg-pink-100 text-pink-700"        },
  { id: "hobbies",       name: "趣味", nameEn: "Hobbies",     gradient: "from-fuchsia-500 to-pink-600",   tagColor: "bg-fuchsia-100 text-fuchsia-700"  },
  { id: "sports",        name: "スポーツ", nameEn: "Sports", gradient: "from-green-500 to-emerald-600",  tagColor: "bg-green-100 text-green-700"      },
  { id: "games",         name: "ゲーム", nameEn: "Games",   gradient: "from-indigo-500 to-violet-600",  tagColor: "bg-indigo-100 text-indigo-700"    },
  { id: "other",         name: "その他", nameEn: "Other",   gradient: "from-gray-400 to-slate-500",     tagColor: "bg-gray-100 text-gray-600"        },
];

/** id → Category */
export const CATEGORY_MAP: Record<string, Category> = Object.fromEntries(
  CATEGORIES.map((c) => [c.id, c])
);

/** 後方互換エクスポート */
export const APP_CATEGORIES = CATEGORIES.map((c) => c.name) as readonly string[];

/** 表示言語に合わせたカテゴリ名。id が不明ならそのまま返す */
export function categoryName(idOrCategory: string | Category | null | undefined, locale: string): string {
  if (!idOrCategory) return "";
  const cat = typeof idOrCategory === "string" ? CATEGORY_MAP[idOrCategory] : idOrCategory;
  if (!cat) return typeof idOrCategory === "string" ? idOrCategory : "";
  return locale === "en" ? cat.nameEn : cat.name;
}
