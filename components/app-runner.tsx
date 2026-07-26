"use client";

import { useMemo, useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw, Cloud, LogIn } from "lucide-react";
import { buildSrcDoc, injectZisupShim } from "@/lib/products/build-srcdoc";
import { useZisupBridge } from "@/lib/hooks/use-zisup-bridge";
import { useLibrarySync } from "@/lib/hooks/use-library-sync";
import { SyncInfoModal } from "@/components/sync-info-modal";
import { cn } from "@/lib/utils";

type AppRunnerProps = {
  html?: string | null;
  css?: string | null;
  js?: string | null;
  srcDoc?: string | null;
  title?: string;
  className?: string;
  showToolbar?: boolean;
  appId?: string;
  loginCallbackUrl?: string;
  /** true のとき、同期未設定なら案内モーダルを表示 */
  showSyncModal?: boolean;
  appName?: string;
  appCategory?: string;
  appGradient?: string;
};

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
      onClick={() => {
        try {
          sessionStorage.setItem("jisapp_login_return", callbackUrl);
        } catch { /* noop */ }
        router.push(`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`);
      }}
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
  showSyncModal = false,
  appName,
  appCategory,
  appGradient,
}: AppRunnerProps) {
  const {
    userId,
    isLoggedIn,
    inLibrary,
    enableCloud,
    ready,
    setInLibrary,
  } = useLibrarySync(appId);

  const [iframeKey, setIframeKey] = useState(0);
  const [syncModalOpen, setSyncModalOpen] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const syncKey = enableCloud ? `cloud-${userId}` : isLoggedIn ? "local-auth" : "guest";

  const documentHtml = useMemo(() => {
    if (srcDoc?.trim()) return injectZisupShim(srcDoc);
    return buildSrcDoc(html ?? "", css, js);
  }, [srcDoc, html, css, js]);

  useZisupBridge(iframeRef, appId, enableCloud ? userId : null);

  useEffect(() => {
    if (!showSyncModal || !ready || enableCloud) {
      setSyncModalOpen(false);
      return;
    }
    setSyncModalOpen(true);
  }, [showSyncModal, ready, enableCloud, isLoggedIn, inLibrary]);

  useEffect(() => {
    if (enableCloud) {
      setIframeKey((k) => k + 1);
    }
  }, [enableCloud]);

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

  if (!ready) {
    return (
      <div
        className={cn(
          "flex h-full items-center justify-center bg-gray-50 text-sm text-gray-400",
          className
        )}
      >
        読み込み中…
      </div>
    );
  }

  const callbackUrl = loginCallbackUrl ?? (typeof window !== "undefined" ? window.location.pathname : "/");

  return (
    <div className={cn("relative flex h-full min-h-0 flex-col", className)}>
      {showToolbar && (
        <div className="flex shrink-0 items-center justify-between border-b border-gray-200 bg-gray-100 px-4 py-2">
          <span className="truncate text-xs text-gray-500">{title}</span>
          <div className="flex items-center gap-2">
            {!isLoggedIn && loginCallbackUrl && (
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
        key={`${syncKey}-${iframeKey}`}
        srcDoc={documentHtml}
        sandbox="allow-scripts allow-forms allow-modals"
        className="min-h-0 flex-1 w-full border-0 bg-white"
        title={title}
      />

      <SyncInfoModal
        open={syncModalOpen}
        variant={isLoggedIn ? "add_library" : "login"}
        appId={appId}
        appName={appName ?? title}
        appCategory={appCategory}
        appGradient={appGradient}
        loginCallbackUrl={callbackUrl}
        onClose={() => setSyncModalOpen(false)}
        onAddedToLibrary={() => setInLibrary(true)}
      />
    </div>
  );
}
