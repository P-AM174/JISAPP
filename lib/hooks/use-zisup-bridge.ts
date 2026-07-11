"use client";

import { useEffect, useCallback, type RefObject } from "react";

/**
 * Zisup postMessage ブリッジ。
 *
 * iframe 内の window.Zisup.saveData / loadData の呼び出しを受け取り、
 * ログイン状態に応じてクラウド (/api/app-data) または localStorage に
 * データを保存・読み込みする。
 *
 * @param iframeRef - 対象の iframe の ref
 * @param appId     - アプリ識別子（クラウド / localStorage のキー名前空間）
 * @param userId    - ログイン中ユーザーの ID。null なら localStorage フォールバック
 */
export function useZisupBridge(
  iframeRef: RefObject<HTMLIFrameElement | null>,
  appId: string,
  userId: string | null | undefined
) {
  const send = useCallback(
    (id: string, value: string | null, error?: string) => {
      try {
        iframeRef.current?.contentWindow?.postMessage(
          { __zisup_type: "response", __zisup_id: id, value, error: error ?? null },
          "*"
        );
      } catch { /* noop */ }
    },
    [iframeRef]
  );

  useEffect(() => {
    const handleMessage = async (e: MessageEvent) => {
      const d = e.data as {
        __zisup_type?: string;
        __zisup_id?: string;
        key?: string;
        value?: string;
      };
      if (!d || (d.__zisup_type !== "save" && d.__zisup_type !== "load")) return;
      // 自分の iframe からのメッセージのみ処理（セキュリティ）
      if (e.source !== iframeRef.current?.contentWindow) return;

      const { __zisup_id: id, key, value } = d;
      if (!id || !key) return;

      if (d.__zisup_type === "save") {
        if (userId) {
          // ── クラウド保存 ──
          try {
            const res = await fetch("/api/app-data", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ key, value, appId }),
            });
            if (!res.ok) throw new Error("クラウド保存に失敗");
            send(id, value ?? null);
          } catch (err) {
            send(id, null, err instanceof Error ? err.message : "保存エラー");
          }
        } else {
          // ── localStorage フォールバック ──
          try {
            localStorage.setItem(`jisapp:${appId}:${key}`, value ?? "");
            send(id, value ?? null);
          } catch (err) {
            send(id, null, err instanceof Error ? err.message : "保存エラー");
          }
        }
      } else {
        // load
        if (userId) {
          // ── クラウド読み込み ──
          try {
            const res = await fetch(
              `/api/app-data?key=${encodeURIComponent(key)}&appId=${encodeURIComponent(appId)}`
            );
            const json = await res.json() as { value?: string | null };
            send(id, json.value ?? null);
          } catch (err) {
            send(id, null, err instanceof Error ? err.message : "読み込みエラー");
          }
        } else {
          // ── localStorage フォールバック ──
          try {
            const v = localStorage.getItem(`jisapp:${appId}:${key}`) ?? null;
            send(id, v);
          } catch (err) {
            send(id, null, err instanceof Error ? err.message : "読み込みエラー");
          }
        }
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [userId, appId, iframeRef, send]);
}
