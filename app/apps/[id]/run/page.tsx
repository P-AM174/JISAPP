"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { BackButton } from "@/components/back-button";
import { JisappLogo } from "@/components/jisapp-logo";
import { AppRunner } from "@/components/app-runner";
import { Loader2, LogIn, AlertCircle } from "lucide-react";

type RuntimeData = {
  id: string;
  title: string;
  is_playground_app?: boolean;
  html_code: string;
  css_code: string;
  js_code: string;
  srcDoc: string;
};

export default function AppRunPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { status } = useSession();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [runtime, setRuntime] = useState<RuntimeData | null>(null);
  const [inLibrary, setInLibrary] = useState(false);

  useEffect(() => {
    if (status === "loading") return;

    if (status === "unauthenticated") {
      setLoading(false);
      setError("login");
      return;
    }

    let cancelled = false;

    async function loadRuntime() {
      setLoading(true);
      setError(null);
      try {
        const [runtimeRes, libraryRes] = await Promise.all([
          fetch(`/api/products/${id}/runtime`),
          fetch(`/api/library/check?appId=${encodeURIComponent(id)}`),
        ]);

        if (!runtimeRes.ok) {
          const data = await runtimeRes.json().catch(() => ({}));
          if (!cancelled) {
            setError(
              typeof data.error === "string"
                ? data.error
                : "アプリの読み込みに失敗しました"
            );
          }
          return;
        }
        const data = (await runtimeRes.json()) as RuntimeData;
        const libData = libraryRes.ok ? await libraryRes.json() : { inLibrary: false };
        if (!cancelled) {
          setRuntime(data);
          setInLibrary(Boolean(libData.inLibrary));
        }
      } catch {
        if (!cancelled) setError("ネットワークエラーが発生しました");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadRuntime();
    return () => {
      cancelled = true;
    };
  }, [id, status]);

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-[#f3f4f2]">
      <header className="shrink-0 border-b border-gray-200 bg-white px-4 py-3">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <BackButton fallbackHref="/mypage" />
            <Link href="/" className="shrink-0">
              <JisappLogo />
            </Link>
            {runtime?.title && (
              <span className="truncate text-sm font-semibold text-gray-700">
                {runtime.title}
              </span>
            )}
          </div>
          <span className="shrink-0 rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold text-emerald-700 ring-1 ring-emerald-200">
            サンドボックス実行
          </span>
        </div>
      </header>

      <main className="min-h-0 flex-1">
        {loading && (
          <div className="flex h-full items-center justify-center gap-2 text-sm text-gray-500">
            <Loader2 className="h-5 w-5 animate-spin text-emerald-500" />
            アプリを読み込み中…
          </div>
        )}

        {!loading && error === "login" && (
          <div className="flex h-full flex-col items-center justify-center gap-4 px-4 text-center">
            <LogIn className="h-10 w-10 text-gray-300" />
            <p className="text-sm text-gray-600">アプリを実行するにはログインが必要です</p>
            <button
              type="button"
              onClick={() => router.push(`/login?callbackUrl=/apps/${id}/run`)}
              className="rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-emerald-700 transition-colors"
            >
              ログインする
            </button>
          </div>
        )}

        {!loading && error && error !== "login" && (
          <div className="flex h-full flex-col items-center justify-center gap-3 px-4 text-center">
            <AlertCircle className="h-10 w-10 text-rose-300" />
            <p className="text-sm text-gray-600">{error}</p>
            <Link
              href={`/apps/${id}`}
              className="text-xs font-semibold text-emerald-600 hover:underline"
            >
              アプリ詳細に戻る
            </Link>
          </div>
        )}

        {!loading && !error && runtime && (
          <AppRunner
            srcDoc={runtime.srcDoc}
            html={runtime.html_code}
            css={runtime.css_code}
            js={runtime.js_code}
            title={runtime.title}
            className="h-full"
            showToolbar
            appId={id}
            inLibrary={inLibrary}
            loginCallbackUrl={`/apps/${id}/run`}
          />
        )}
      </main>
    </div>
  );
}
