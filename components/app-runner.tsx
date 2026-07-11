"use client";

import { useMemo, useState, useRef } from "react";
import { RefreshCw, Cloud, LogIn } from "lucide-react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { buildSrcDoc, injectZisupShim } from "@/lib/products/build-srcdoc";
import { useZisupBridge } from "@/lib/hooks/use-zisup-bridge";
import { cn } from "@/lib/utils";

type AppRunnerProps = {
  html?: string | null;
  css?: string | null;
  js?: string | null;
  /** 結合済みドキュメントを直接渡す場合 */
  srcDoc?: string | null;
  title?: string;
  className?: string;
  showToolbar?: boolean;
  /** Zisup データ保存のアプリ識別子（省略時は "playground"） */
  appId?: string;
};

/** 対策B: ログアウト状態の時だけ表示するクラウド同期ボタン */
function SyncButton({ show }: { show: boolean }) {
  if (!show) return null;
  return (
    <Link
      href="/login"
      className="absolute bottom-3 left-3 z-50 flex items-center gap-1.5 rounded-full bg-white/90 px-3 py-1.5 text-xs font-bold text-emerald-700 shadow-lg ring-1 ring-emerald-200 backdrop-blur-sm transition-all hover:bg-emerald-50 hover:shadow-emerald-200/60 active:scale-95"
      title="ログインしてデータをクラウドに保存する"
    >
      <Cloud className="h-3.5 w-3.5" />
      <LogIn className="h-3 w-3" />
      <span>ログインして同期</span>
    </Link>
  );
}

export function AppRunner({
  html,
  css,
  js,
  srcDoc,
  title = "アプリプレビュー",
  className,
  showToolbar = false,
  appId = "playground",
}: AppRunnerProps) {
  const { data: session, status } = useSession();
  const userId = (session?.user as { id?: string })?.id ?? null;
  const isLoggedIn = status === "authenticated" && !!userId;

  const [iframeKey, setIframeKey] = useState(0);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const documentHtml = useMemo(() => {
    // srcDoc が直接渡された場合でもシムを注入する
    if (srcDoc?.trim()) return injectZisupShim(srcDoc);
    return buildSrcDoc(html ?? "", css, js);
  }, [srcDoc, html, css, js]);

  // Zisup postMessage ブリッジ（ログイン状態に応じてクラウド/localStorage を自動選択）
  useZisupBridge(iframeRef, appId, isLoggedIn ? userId : null);

  if (!documentHtml.trim()) {
    return (
      <div
        className={cn(
          "flex h-full items-center justify-center bg-gray-50 text-sm text-gray-400",
          className
        )}
      >
        実行するコードがありません
      </div>
    );
  }

  return (
    <div className={cn("relative flex h-full min-h-0 flex-col", className)}>
      {showToolbar && (
        <div className="flex shrink-0 items-center justify-between border-b border-gray-200 bg-gray-100 px-4 py-2">
          <span className="truncate text-xs text-gray-500">{title}</span>
          <button
            type="button"
            onClick={() => setIframeKey((k) => k + 1)}
            className="rounded-md p-1.5 text-gray-400 transition-colors hover:bg-gray-200 hover:text-emerald-600"
            title="再読み込み"
          >
            <RefreshCw className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
      <iframe
        ref={iframeRef}
        key={iframeKey}
        srcDoc={documentHtml}
        sandbox="allow-scripts"
        className="min-h-0 flex-1 w-full border-0 bg-white"
        title={title}
      />
      {/* 対策B: ログアウト中のみ表示する同期ボタン */}
      <SyncButton show={status !== "loading" && !isLoggedIn} />
    </div>
  );
}
