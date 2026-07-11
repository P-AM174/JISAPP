// カテゴリ定数（Supabase クライアントに依存しないファイル）
// クライアントコンポーネントはこちらからインポートしてください

export type Category = {
  id: string;
  name: string;
  emoji: string;
  gradient: string;
  tagColor: string;
};

export const CATEGORIES: Category[] = [
  { id: "business",      name: "ビジネス", emoji: "💼", gradient: "from-blue-500 to-indigo-600",    tagColor: "bg-blue-100 text-blue-700"       },
  { id: "productivity",  name: "生産性",   emoji: "⚡", gradient: "from-emerald-500 to-teal-600",   tagColor: "bg-emerald-100 text-emerald-700"  },
  { id: "lifestyle",     name: "生活",     emoji: "🏠", gradient: "from-orange-400 to-amber-500",   tagColor: "bg-orange-100 text-orange-700"    },
  { id: "education",     name: "学習",     emoji: "📚", gradient: "from-yellow-500 to-amber-600",   tagColor: "bg-yellow-100 text-yellow-700"    },
  { id: "stats",         name: "統計",     emoji: "📊", gradient: "from-cyan-500 to-blue-600",      tagColor: "bg-cyan-100 text-cyan-700"        },
  { id: "ai_tools",      name: "AIツール", emoji: "🤖", gradient: "from-violet-500 to-purple-600",  tagColor: "bg-violet-100 text-violet-700"    },
  { id: "entertainment", name: "エンタメ", emoji: "🎉", gradient: "from-pink-500 to-rose-500",      tagColor: "bg-pink-100 text-pink-700"        },
  { id: "hobbies",       name: "趣味",     emoji: "🎨", gradient: "from-fuchsia-500 to-pink-600",   tagColor: "bg-fuchsia-100 text-fuchsia-700"  },
  { id: "sports",        name: "スポーツ", emoji: "⚽", gradient: "from-green-500 to-emerald-600",  tagColor: "bg-green-100 text-green-700"      },
  { id: "games",         name: "ゲーム",   emoji: "🎮", gradient: "from-indigo-500 to-violet-600",  tagColor: "bg-indigo-100 text-indigo-700"    },
  { id: "other",         name: "その他",   emoji: "✨", gradient: "from-gray-400 to-slate-500",     tagColor: "bg-gray-100 text-gray-600"        },
];

/** id → Category */
export const CATEGORY_MAP: Record<string, Category> = Object.fromEntries(
  CATEGORIES.map((c) => [c.id, c])
);

/** 後方互換エクスポート */
export const APP_CATEGORIES = CATEGORIES.map((c) => c.name) as readonly string[];
