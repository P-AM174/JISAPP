"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { AlertTriangle, X } from "lucide-react";
import { APP_DATA_ERROR_EVENT } from "@/lib/hooks/use-zisup-bridge";

/**
 * アプリの保存が断られたとき（画像・動画・容量オーバーなど）に、ジサップの画面側で知らせる。
 * AIが作ったアプリは保存の失敗を画面に出さないことが多く、利用者が気づかないままデータが残らないのを防ぐため。
 */
export function AppDataNotice() {
  const [notice, setNotice] = useState<{ message: string; warning: boolean } | null>(null);

  useEffect(() => {
    let timer: number | undefined;
    const onError = (e: Event) => {
      const detail = (e as CustomEvent<{ message?: string; level?: string }>).detail;
      if (!detail?.message) return;
      setNotice({ message: detail.message, warning: detail.level === "warning" });
      window.clearTimeout(timer);
      timer = window.setTimeout(() => setNotice(null), 8000);
    };
    window.addEventListener(APP_DATA_ERROR_EVENT, onError);
    return () => {
      window.removeEventListener(APP_DATA_ERROR_EVENT, onError);
      window.clearTimeout(timer);
    };
  }, []);

  if (!notice) return null;
  // アプリの枠の中に置くと、枠の重なり順に閉じ込められて下のボタンに隠れるので、画面全体の一番上に出す。
  // スマホでは画面下の「公開してURLを発行」などのボタンを避けるため、開発スタジオの通知と同じ高さにする
  return createPortal(
    <div role="alert" className="pointer-events-none fixed inset-x-0 bottom-24 z-[600] flex justify-center px-4 md:bottom-6">
      <div className="pointer-events-auto flex max-w-md items-start gap-3 rounded-2xl bg-slate-900/95 px-4 py-3 text-sm text-white shadow-2xl">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-300" />
        <p className="flex-1 leading-relaxed">
          <span className="block font-bold">{notice.warning ? "保存容量のお知らせ" : "保存できませんでした"}</span>
          {notice.message}
        </p>
        <button type="button" onClick={() => setNotice(null)} aria-label="閉じる" className="-mr-1 rounded-full p-1 text-white/60 hover:bg-white/10 hover:text-white">
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>,
    document.body
  );
}
