"use client";

import { useEffect, useRef, useState } from "react";
import { MiniPreview } from "@/components/app-catalog/mini-preview";

/** localStorage に残っている「前回の開発スタジオ」のプロジェクトID */
const LOCAL_PROJECT_ID = "saved_playground";

/**
 * マイプロジェクトのサムネイル。トップページのカードと同じくアプリ画面を縮小表示する。
 * 公開済みはアプリのプレビューを、下書きは保存されたコードをそのまま表示する。
 */
export function ProjectThumb({
  projectId,
  appId,
  fallbackGradient,
  categoryId,
  height = 150,
}: {
  projectId: string;
  appId?: string;
  fallbackGradient: string;
  categoryId?: string | null;
  height?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  const [html, setHtml] = useState<string | null>(null);

  useEffect(() => {
    if (appId) return;
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { rootMargin: "200px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [appId]);

  // 下書きは、画面に入ったときにだけコードを読み込む
  useEffect(() => {
    if (appId || !inView) return;
    if (projectId === LOCAL_PROJECT_ID) {
      try {
        setHtml(localStorage.getItem("jisapp_playground_code") ?? "");
      } catch {
        setHtml("");
      }
      return;
    }
    let cancelled = false;
    fetch(`/api/my-projects/${projectId}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!cancelled) setHtml((d?.project?.html_code as string | undefined) ?? "");
      })
      .catch(() => {
        if (!cancelled) setHtml("");
      });
    return () => {
      cancelled = true;
    };
  }, [appId, inView, projectId]);

  if (appId) {
    return (
      <MiniPreview
        id={appId}
        fallbackGradient={fallbackGradient}
        fallbackCategoryId={categoryId}
        height={height}
        live="always"
      />
    );
  }

  return (
    <div ref={ref}>
      <MiniPreview
        id={projectId}
        fallbackGradient={fallbackGradient}
        fallbackCategoryId={categoryId}
        height={height}
        live="always"
        html={html ?? ""}
        // コードがまだ読めていない間・空のときは、カテゴリ色の表示のまま
        enabled={!!html?.trim()}
      />
    </div>
  );
}
