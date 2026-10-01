import type { Translate } from "@/lib/i18n/config";
import { format } from "@/lib/i18n/config";

/** GET /api/library が返すライブラリの1件 */
export type LibraryEntry = {
  appId: string;
  addedAt: string;
  name?: string;
  category?: string;
  gradient?: string;
  openCount?: number;
  lastOpenedAt?: string | null;
  pinnedAt?: string | null;
};

export type LibrarySortMode = "recent" | "frequent" | "added_new" | "added_old";

export const LIBRARY_SORT_MODES: LibrarySortMode[] = ["recent", "frequent", "added_new", "added_old"];

export function librarySortLabel(mode: LibrarySortMode, t: Translate): string {
  switch (mode) {
    case "recent":
      return t("最近開いた順", "Recently opened");
    case "frequent":
      return t("よく開く順", "Most opened");
    case "added_new":
      return t("追加が新しい順", "Newest added");
    case "added_old":
      return t("追加が古い順", "Oldest added");
  }
}

const time = (iso: string | null | undefined) => (iso ? new Date(iso).getTime() || 0 : 0);

/**
 * ピン留めを一番上に（新しくピン留めしたものが先）、残りを選んだ順に並べる。
 * まだ開いていないアプリは「最近開いた順」「よく開く順」で後ろに回し、その中は追加が新しい順
 */
export function sortLibrary(entries: LibraryEntry[], mode: LibrarySortMode): LibraryEntry[] {
  const byMode = (a: LibraryEntry, b: LibraryEntry): number => {
    switch (mode) {
      case "recent":
        return time(b.lastOpenedAt) - time(a.lastOpenedAt) || time(b.addedAt) - time(a.addedAt);
      case "frequent":
        return (
          (b.openCount ?? 0) - (a.openCount ?? 0) ||
          time(b.lastOpenedAt) - time(a.lastOpenedAt) ||
          time(b.addedAt) - time(a.addedAt)
        );
      case "added_new":
        return time(b.addedAt) - time(a.addedAt);
      case "added_old":
        return time(a.addedAt) - time(b.addedAt);
    }
  };
  return [...entries].sort((a, b) => {
    const pa = time(a.pinnedAt);
    const pb = time(b.pinnedAt);
    if (pa || pb) {
      if (!pa) return 1;
      if (!pb) return -1;
      return pb - pa;
    }
    return byMode(a, b);
  });
}

/** 「きのう開いた」「3日前に開いた」のような表示 */
export function lastOpenedLabel(entry: LibraryEntry, t: Translate, intlLocale: string): string {
  if (!entry.lastOpenedAt) return t("まだ開いていません", "Not opened yet");
  const opened = new Date(entry.lastOpenedAt);
  const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const days = Math.round((startOfDay(new Date()) - startOfDay(opened)) / 86_400_000);
  if (days <= 0) return t("今日開いた", "Opened today");
  if (days === 1) return t("きのう開いた", "Opened yesterday");
  if (days < 7) return format(t("{days}日前に開いた", "Opened {days} days ago"), { days });
  return format(t("{opened}に開いた", "Opened {opened}"), { opened: opened.toLocaleDateString(intlLocale) });
}
