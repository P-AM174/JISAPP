"use client";

import { useMemo, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw, Cloud, LogIn } from "lucide-react";
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
  /** ログイン後の戻り先（省略時は現在のパス） */
  loginCallbackUrl?: string;
  /** マイライブラリ登録済み（true のときのみクラウド同期） */
  inLibrary?: boolean;
};

/** 未ログイン時: ヘッダー等に配置するログイン誘導ボタン */
export function SyncLoginButton({
  callbackUrl,
  className,
}: {
  callbackUrl: string;
  className?: string;
}) {
  const router = useRouter();
  return (
    <button
      type="button"
      onClick={() => router.push(`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`)}
      className={cn(
        "flex items-center gap-1.5 rounded-full bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white shadow-md transition-all hover:bg-emerald-700 active:scale-95",
        className
      )}
      title="ログインしてデータをクラウドに保存する"
    >
      <Cloud className="h-3.5 w-3.5" />
      <LogIn className="h-3 w-3" />
      <span>ログインして同期</span>
    </button>
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
  loginCallbackUrl,
  inLibrary = false,
}: AppRunnerProps) {
  const { data: session, status } = useSession();
  const userId = (session?.user as { id?: string })?.id ?? null;
  const isLoggedIn = status === "authenticated" && !!userId;
  const enableCloud = isLoggedIn && inLibrary;

  const [iframeKey, setIframeKey] = useState(0);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const documentHtml = useMemo(() => {
    if (srcDoc?.trim()) return injectZisupShim(srcDoc);
    return buildSrcDoc(html ?? "", css, js);
  }, [srcDoc, html, css, js]);

  useZisupBridge(iframeRef, appId, enableCloud ? userId : null);

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
          <div className="flex items-center gap-2">
            {status !== "loading" && !isLoggedIn && loginCallbackUrl && (
              <SyncLoginButton callbackUrl={loginCallbackUrl} />
            )}
            <button
              type="button"
              onClick={() => setIframeKey((k) => k + 1)}
              className="rounded-md p-1.5 text-gray-400 transition-colors hover:bg-gray-200 hover:text-emerald-600"
              title="再読み込み"
            >
              <RefreshCw className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}
      <iframe
        ref={iframeRef}
        key={iframeKey}
        srcDoc={documentHtml}
        sandbox="allow-scripts allow-forms allow-modals"
        className="min-h-0 flex-1 w-full border-0 bg-white"
        title={title}
      />
    </div>
  );
}
