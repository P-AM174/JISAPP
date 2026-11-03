"use client";

import { useEffect } from "react";
import { trackEvent } from "@/lib/analytics/client";

/**
 * コラムの記事で、どこまで読まれたか・何を押したかを記録する（運営画面の計測「コラム」）。
 * - column_read：本文（#column-article）の 25・50・75・100% を越えたときと、ページを離れる・隠れるときに、
 *   それまでに読んだ一番下の位置（depth）と表示していた秒数（sec）を送る。集計では訪問ごとの一番大きい値を使う
 * - column_click：記事の中のアプリ・開発スタジオ・次の記事・X でシェア・リンクのコピーなどを押したとき
 */
export function ColumnTracker({ slug }: { slug: string }) {
  useEffect(() => {
    const start = Date.now();
    let visibleMs = 0;
    let shownAt: number | null = document.visibilityState === "visible" ? start : null;
    let maxDepth = 0;
    let sentDepth = 0;
    let lastSent = "";

    const seconds = () => Math.round((visibleMs + (shownAt ? Date.now() - shownAt : 0)) / 1000);
    const send = () => {
      const key = `${maxDepth}:${seconds()}`;
      if (key === lastSent) return;
      lastSent = key;
      trackEvent("column_read", { slug, depth: maxDepth, sec: seconds() });
    };
    const measure = () => {
      const el = document.getElementById("column-article");
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const seen = window.innerHeight - rect.top;
      const pct = rect.height > 0 ? Math.max(0, Math.min(100, Math.round((seen / rect.height) * 100))) : 100;
      if (pct > maxDepth) maxDepth = pct;
      const step = [100, 75, 50, 25].find((s) => maxDepth >= s) ?? 0;
      if (step > sentDepth) {
        sentDepth = step;
        send();
      }
    };
    const onVisibility = () => {
      if (document.visibilityState === "hidden") {
        if (shownAt) visibleMs += Date.now() - shownAt;
        shownAt = null;
        send();
      } else {
        shownAt = Date.now();
      }
    };
    const onClick = (e: MouseEvent) => {
      const target = e.target as Element | null;
      const marked = target?.closest<HTMLElement>("[data-column-click]");
      const a = target?.closest<HTMLAnchorElement>("a[href]");
      let kind = marked?.dataset.columnClick ?? "";
      if (!kind && a) {
        const href = a.getAttribute("href") ?? "";
        const inArticle = !!a.closest("#column-article");
        if (href.startsWith("#")) return;
        if (/\/apps\//.test(href)) kind = inArticle ? "app" : "popular_app";
        else if (/\/playground/.test(href)) kind = "studio";
        else if (/\/column\/./.test(href)) kind = "next_column";
        else if (/\/column\/?$/.test(href)) kind = "column_list";
        else if (/x\.com\/intent/.test(href)) kind = "share_x";
        else kind = /^https?:/i.test(href) && !href.includes(window.location.host) ? "outbound" : "link";
      }
      if (kind) trackEvent("column_click", { slug, target: kind });
    };

    measure();
    window.addEventListener("scroll", measure, { passive: true });
    window.addEventListener("pagehide", send);
    document.addEventListener("visibilitychange", onVisibility);
    document.addEventListener("click", onClick, true);
    return () => {
      window.removeEventListener("scroll", measure);
      window.removeEventListener("pagehide", send);
      document.removeEventListener("visibilitychange", onVisibility);
      document.removeEventListener("click", onClick, true);
      // サイトの中で別のページへ移るとき
      send();
    };
  }, [slug]);
  return null;
}
