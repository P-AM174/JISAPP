"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { APP_IFRAME_SANDBOX } from "@/lib/apps/iframe-sandbox";
import { CategoryIcon } from "@/lib/category-icon";
import { buildSrcDoc } from "@/lib/products/build-srcdoc";
import {
  THUMBNAIL_IFRAME_ALLOW,
  buildMediaPosterHtml,
  detectMediaUsage,
} from "@/lib/apps/media-usage";

/** ホバーしてからプレビューを読み込むまでの待ち時間（通り過ぎただけでは読み込まない） */
const HOVER_LOAD_DELAY_MS = 250;

export function MiniPreview({
  id,
  fallbackGradient,
  fallbackCategoryId,
  height = 120,
  live = "always",
  html,
  enabled = true,
}: {
  id: string | number;
  fallbackGradient: string;
  /** 読み込み前に表示するカテゴリアイコン用 */
  fallbackCategoryId?: string | null;
  height?: number;
  /**
   * always: 画面に入ったら実アプリを読み込む（既定。トップページ・一覧のカード）
   * hover: カーソルを載せたときだけ読み込む（タッチ端末では静止表示のまま）
   */
  live?: "hover" | "always";
  /** 未公開の下書きなど、URLがないアプリはコードを直接渡して表示する */
  html?: string | null;
  /** false の間はアプリを読み込まず、カテゴリ色の表示のままにする */
  enabled?: boolean;
}) {
  const [loaded, setLoaded] = useState(false);
  const [inView, setInView] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [errored, setErrored] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const hoverTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (live !== "always") return;
    const el = containerRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { rootMargin: "300px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [live]);

  useEffect(() => {
    return () => {
      if (hoverTimer.current) clearTimeout(hoverTimer.current);
    };
  }, []);

  const startHover = () => {
    if (live !== "hover" || hoverTimer.current) return;
    hoverTimer.current = setTimeout(() => {
      hoverTimer.current = null;
      setHovered(true);
    }, HOVER_LOAD_DELAY_MS);
  };

  const endHover = () => {
    if (hoverTimer.current) {
      clearTimeout(hoverTimer.current);
      hoverTimer.current = null;
    }
    if (live === "hover") {
      setHovered(false);
      setLoaded(false);
    }
  };

  const showFrame = enabled && (live === "always" ? inView : hovered) && !errored;

  // 直接渡したコードも、カメラ・マイクを使うなら動かさず静止画にする
  const srcDoc = useMemo(() => {
    if (html == null) return null;
    const media = detectMediaUsage(html);
    return media ? buildMediaPosterHtml(media) : buildSrcDoc(html, null, null);
  }, [html]);

  return (
    <div
      ref={containerRef}
      className="relative overflow-hidden bg-gray-950"
      style={{ height: `${height}px` }}
      onMouseEnter={startHover}
      onMouseLeave={endHover}
    >
      <div className="absolute top-0 left-0 right-0 z-20 flex items-center gap-1 bg-gray-900 px-2.5 py-1.5">
        <span className="h-2 w-2 rounded-full bg-red-500/70" />
        <span className="h-2 w-2 rounded-full bg-yellow-500/70" />
        <span className="h-2 w-2 rounded-full bg-green-500/70" />
        <div className="mx-2 h-3.5 flex-1 rounded-sm bg-gray-700/60 text-[9px] text-gray-500 flex items-center px-1.5 truncate">
          jisapp.app
        </div>
      </div>

      {(!loaded || errored) && (
        <div
          className={`absolute inset-0 flex items-center justify-center bg-gradient-to-br ${fallbackGradient} opacity-75`}
          style={{ top: "26px" }}
        >
          <CategoryIcon
            categoryId={fallbackCategoryId}
            className="h-8 w-8 text-white drop-shadow"
            strokeWidth={2.25}
          />
        </div>
      )}

      {showFrame && (
        <div
          className="absolute overflow-hidden"
          style={{ top: "26px", left: 0, right: 0, bottom: 0 }}
        >
          <iframe
            {...(srcDoc != null
              ? { srcDoc }
              : { src: `/api/apps/${id}/preview?thumb=1` })}
            // カメラ・マイクなどの許可を求めさせない（見分けに漏れたアプリの保険）
            allow={THUMBNAIL_IFRAME_ALLOW}
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "500%",
              // 上の疑似ブラウザバー（26px）を除いた高さを、縮小率 0.2 で割り戻す
              height: `${Math.max(0, height - 26) / 0.2}px`,
              transform: "scale(0.2)",
              transformOrigin: "top left",
              pointerEvents: "none",
              border: "none",
            }}
            // 直接渡したコードは同一オリジン扱いにしない（サムネ表示に不要な権限を与えない）
            sandbox={html != null ? "allow-scripts" : APP_IFRAME_SANDBOX}
            tabIndex={-1}
            aria-hidden
            onLoad={() => setLoaded(true)}
            onError={() => setErrored(true)}
          />
        </div>
      )}
    </div>
  );
}
